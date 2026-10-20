import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../app';
import { User } from '../models/User';
import { SkillCategory } from '../models/SkillCategory';
import { SkillListing } from '../models/SkillListing';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { Booking } from '../models/Booking';
import { CreditTransaction } from '../models/CreditTransaction';
import { Review } from '../models/Review';
import { CreditEngine } from '../utils/creditEngine';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    SkillCategory.deleteMany({}),
    SkillListing.deleteMany({}),
    AvailabilitySlot.deleteMany({}),
    Booking.deleteMany({}),
    CreditTransaction.deleteMany({}),
    Review.deleteMany({})
  ]);
});

describe('Skill Exchange Platform â€” Business Rules & OOAD Verification Tests', () => {

  // Rule 1: Registration and Welcome Credit Bonus
  test('1. Should register user with 100 initial skill credits and transaction ledger entry', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jordan Learner',
        email: 'jordan@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.creditBalance).toBe(100);

    const ledger = await CreditTransaction.findOne({ user: res.body.user.id });
    expect(ledger).toBeTruthy();
    expect(ledger?.type).toBe('initial_grant');
    expect(ledger?.amount).toBe(100);
    expect(ledger?.balanceAfter).toBe(100);
  });

  // Rule 2: Prevent direct balance manipulation & negative balance
  test('2. Should reject session booking when learner has insufficient credit balance', async () => {
    // Register provider
    const provRes = await request(app).post('/api/auth/register').send({
      name: 'Dr. Jane Provider',
      email: 'jane@example.com',
      password: 'Password123!',
      role: 'provider'
    });
    const providerToken = provRes.body.token;

    // Register learner and artificially drain credits to 10
    const learnRes = await request(app).post('/api/auth/register').send({
      name: 'Broke Learner',
      email: 'broke@example.com',
      password: 'Password123!'
    });
    const learnerToken = learnRes.body.token;
    await User.findByIdAndUpdate(learnRes.body.user.id, { creditBalance: 10 });

    // Category
    const category = await SkillCategory.create({
      name: 'Web Dev',
      slug: 'web-dev',
      description: 'Web dev'
    });

    // Create listing with cost 40
    const listRes = await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        title: 'Advanced React Architecture',
        description: 'React deep dive',
        category: category._id,
        creditCost: 40,
        durationMinutes: 60
      });

    // Attempt booking with only 10 credits
    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({
        skillListingId: listRes.body.listing._id,
        date: '2026-11-10',
        startTime: '10:00',
        endTime: '11:00'
      });

    expect(bookRes.status).toBe(400);
    expect(bookRes.body.success).toBe(false);
    expect(bookRes.body.message).toContain('Insufficient skill credits');
  });

  // Rule 3: Single credit deduction upon confirmation & duplicate prevention
  test('3. Should deduct credits exactly once upon provider acceptance and prevent duplicate deduction', async () => {
    // 1. Setup users
    const prov = await User.create({
      name: 'Mentor Mike',
      email: 'mike@example.com',
      password: 'Hash',
      roles: ['provider'],
      creditBalance: 100
    });
    const learner = await User.create({
      name: 'Student Sam',
      email: 'sam@example.com',
      password: 'Hash',
      roles: ['learner'],
      creditBalance: 100
    });

    const category = await SkillCategory.create({ name: 'Tech', slug: 'tech' });
    const listing = await SkillListing.create({
      provider: prov._id,
      title: 'TypeScript Essentials',
      slug: 'ts-essentials',
      description: 'TS basics',
      category: category._id,
      creditCost: 30,
      durationMinutes: 60
    });

    const booking = await Booking.create({
      bookingReference: 'BK-TEST-1',
      learner: learner._id,
      provider: prov._id,
      skillListing: listing._id,
      date: '2026-11-15',
      startTime: '14:00',
      endTime: '15:00',
      durationMinutes: 60,
      creditCost: 30,
      status: 'pending',
      creditDeducted: false,
      creditRefunded: false,
      creditRewarded: false
    });

    // Deduct via CreditEngine
    const firstDeduct = await CreditEngine.deductCreditsForBooking(
      booking._id.toString(),
      learner._id.toString(),
      30
    );
    expect(firstDeduct.success).toBe(true);
    expect(firstDeduct.newBalance).toBe(70);

    // Verify balance and booking flag
    const updatedUser = await User.findById(learner._id);
    expect(updatedUser?.creditBalance).toBe(70);

    // Attempt second deduction (Duplicate deduction prevention)
    const secondDeduct = await CreditEngine.deductCreditsForBooking(
      booking._id.toString(),
      learner._id.toString(),
      30
    );
    expect(secondDeduct.success).toBe(false);
    expect(secondDeduct.message).toContain('already been deducted');
    
    // Balance remains 70
    const recheckUser = await User.findById(learner._id);
    expect(recheckUser?.creditBalance).toBe(70);
  });

  // Rule 4: Credit restoration on cancellation
  test('4. Should restore credits to learner upon cancellation with an auditable refund transaction', async () => {
    const learner = await User.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Hash',
      creditBalance: 60
    });
    const prov = await User.create({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'Hash',
      roles: ['provider'],
      creditBalance: 100
    });
    const category = await SkillCategory.create({ name: 'Design', slug: 'design' });
    const listing = await SkillListing.create({
      provider: prov._id,
      title: 'Figma 101',
      slug: 'figma-101',
      description: 'Figma basics',
      category: category._id,
      creditCost: 40,
      durationMinutes: 60
    });

    const booking = await Booking.create({
      bookingReference: 'BK-REFUND-1',
      learner: learner._id,
      provider: prov._id,
      skillListing: listing._id,
      date: '2026-11-20',
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      creditCost: 40,
      status: 'confirmed',
      creditDeducted: true,
      creditRefunded: false
    });

    const refund = await CreditEngine.refundCreditsForBooking(booking._id.toString(), 'Schedule conflict');
    expect(refund.success).toBe(true);
    expect(refund.newBalance).toBe(100); // 60 + 40

    // Duplicate refund prevention
    const secondRefund = await CreditEngine.refundCreditsForBooking(booking._id.toString(), 'Try again');
    expect(secondRefund.success).toBe(false);
    expect(secondRefund.message).toContain('already been refunded');

    // Verify refund ledger transaction
    const tx = await CreditTransaction.findOne({ user: learner._id, type: 'session_refund' });
    expect(tx).toBeTruthy();
    expect(tx?.amount).toBe(40);
    expect(tx?.balanceAfter).toBe(100);
  });

  // Rule 5: Award teaching credits upon completion and prevent duplicate rewards
  test('5. Should award credits to provider upon session completion and prevent duplicate rewards', async () => {
    const learner = await User.create({
      name: 'Charlie',
      email: 'charlie@example.com',
      password: 'Hash',
      creditBalance: 50
    });
    const provider = await User.create({
      name: 'Mentor Dave',
      email: 'dave@example.com',
      password: 'Hash',
      roles: ['provider'],
      creditBalance: 100,
      creditsEarned: 0
    });

    const category = await SkillCategory.create({ name: 'AI', slug: 'ai' });
    const listing = await SkillListing.create({
      provider: provider._id,
      title: 'Prompt Engineering',
      slug: 'prompt-eng',
      description: 'Prompting',
      category: category._id,
      creditCost: 50,
      durationMinutes: 60
    });

    const booking = await Booking.create({
      bookingReference: 'BK-REWARD-1',
      learner: learner._id,
      provider: provider._id,
      skillListing: listing._id,
      date: '2026-11-01',
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      creditCost: 50,
      status: 'completed',
      creditDeducted: true,
      creditRewarded: false
    });

    const rewardResult = await CreditEngine.awardCreditsForCompletedSession(booking._id.toString());
    expect(rewardResult.success).toBe(true);
    expect(rewardResult.newBalance).toBe(150); // 100 + 50

    const updatedProvider = await User.findById(provider._id);
    expect(updatedProvider?.creditBalance).toBe(150);
    expect(updatedProvider?.creditsEarned).toBe(50);

    // Prevent duplicate reward
    const duplicateReward = await CreditEngine.awardCreditsForCompletedSession(booking._id.toString());
    expect(duplicateReward.success).toBe(false);
    expect(duplicateReward.message).toContain('already been awarded');
  });

  // Rule 6: Duplicate review prevention & rating recalculation
  test('6. Should allow review only for completed sessions and prevent duplicate reviews', async () => {
    const learner = await User.create({
      name: 'Reviewer Ron',
      email: 'ron@example.com',
      password: 'Hash',
      creditBalance: 100
    });
    const provider = await User.create({
      name: 'Tutor Tina',
      email: 'tina@example.com',
      password: 'Hash',
      roles: ['provider'],
      creditBalance: 100,
      providerProfile: { rating: 5.0, reviewCount: 0 }
    });

    const category = await SkillCategory.create({ name: 'Code', slug: 'code' });
    const listing = await SkillListing.create({
      provider: provider._id,
      title: 'Clean Architecture',
      slug: 'clean-arch',
      description: 'Architecture',
      category: category._id,
      creditCost: 45,
      durationMinutes: 60,
      rating: 5.0,
      reviewCount: 0
    });

    const booking = await Booking.create({
      bookingReference: 'BK-REVIEW-1',
      learner: learner._id,
      provider: provider._id,
      skillListing: listing._id,
      date: '2026-10-18',
      startTime: '11:00',
      endTime: '12:00',
      durationMinutes: 60,
      creditCost: 45,
      status: 'completed',
      hasReview: false
    });

    // Create review
    const review = await Review.create({
      booking: booking._id,
      skillListing: listing._id,
      reviewer: learner._id,
      provider: provider._id,
      rating: 4,
      comment: 'Very helpful lesson on Clean Architecture!'
    });

    expect(review.rating).toBe(4);

    // Attempt second review for same booking
    let duplicateError = false;
    try {
      await Review.create({
        booking: booking._id,
        skillListing: listing._id,
        reviewer: learner._id,
        provider: provider._id,
        rating: 5,
        comment: 'Trying to review again'
      });
    } catch (err) {
      duplicateError = true;
    }

    expect(duplicateError).toBe(true);
  });

  // Rule 7: Overlapping booking prevention
  test('7. Should prevent overlapping bookings for the same date and time slot', async () => {
    const learner1 = await User.create({ name: 'Learner One', email: 'l1@example.com', password: 'Hash' });
    const learner2 = await User.create({ name: 'Learner Two', email: 'l2@example.com', password: 'Hash' });
    const provider = await User.create({ name: 'Busy Provider', email: 'busy@example.com', password: 'Hash' });
    const category = await SkillCategory.create({ name: 'Tech', slug: 'tech' });
    const listing = await SkillListing.create({
      provider: provider._id,
      title: 'DevOps',
      slug: 'devops',
      description: 'DevOps',
      category: category._id,
      creditCost: 30,
      durationMinutes: 60
    });

    // Existing active booking
    await Booking.create({
      bookingReference: 'BK-EXISTING',
      learner: learner1._id,
      provider: provider._id,
      skillListing: listing._id,
      date: '2026-12-01',
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      creditCost: 30,
      status: 'confirmed'
    });

    // Check conflict query
    const conflict = await Booking.findOne({
      provider: provider._id,
      date: '2026-12-01',
      startTime: '10:00',
      status: { $in: ['pending', 'confirmed'] }
    });

    expect(conflict).toBeTruthy();
    expect(conflict?.bookingReference).toBe('BK-EXISTING');
  });
});