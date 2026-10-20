import mongoose from 'mongoose';
import { User } from '../models/User';
import { SkillCategory } from '../models/SkillCategory';
import { SkillListing } from '../models/SkillListing';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { Booking } from '../models/Booking';
import { CreditTransaction } from '../models/CreditTransaction';
import { Review } from '../models/Review';
import { Notification } from '../models/Notification';
import { connectDB, closeDB } from '../config/db';

export const seedDatabase = async (): Promise<void> => {
  console.log('[Seed] Clearing existing demo data...');
  await Promise.all([
    User.deleteMany({}),
    SkillCategory.deleteMany({}),
    SkillListing.deleteMany({}),
    AvailabilitySlot.deleteMany({}),
    Booking.deleteMany({}),
    CreditTransaction.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({})
  ]);

  console.log('[Seed] Creating demo users...');
  const commonPassword = 'Password123!';

  // 1. Admin
  const admin = await User.create({
    name: 'Eleanor Vance (Admin)',
    email: 'admin@skillexchange.org',
    password: commonPassword,
    roles: ['admin', 'learner'],
    currentRole: 'admin',
    creditBalance: 500,
    creditsEarned: 0,
    creditsSpent: 0,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    bio: 'Platform Administrator ensuring fair exchange, provider verification, and system integrity.',
    status: 'active'
  });

  // 2. Providers
  const provider1 = await User.create({
    name: 'David Chen',
    email: 'david.provider@example.com',
    password: commonPassword,
    roles: ['provider', 'learner'],
    currentRole: 'provider',
    creditBalance: 240,
    creditsEarned: 180,
    creditsSpent: 40,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Staff Software Engineer with 8+ years building distributed cloud systems and modern web applications in React and Node.',
    interests: ['Distributed Systems', 'Open Source', 'Mentorship'],
    skillsToLearn: ['Digital Illustration', 'Public Speaking'],
    providerProfile: {
      headline: 'Senior Full-Stack Architect & Python Mentor',
      bio: 'I love breaking down complex architectural patterns into actionable code. Taught over 50 engineers.',
      yearsOfExperience: 8,
      rating: 4.9,
      reviewCount: 14,
      isVerified: true,
      verificationStatus: 'verified',
      verifiedAt: new Date()
    },
    status: 'active'
  });

  const provider2 = await User.create({
    name: 'Sarah Jenkins',
    email: 'sarah.provider@example.com',
    password: commonPassword,
    roles: ['provider', 'learner'],
    currentRole: 'provider',
    creditBalance: 195,
    creditsEarned: 135,
    creditsSpent: 40,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    bio: 'Lead Product Designer at a fintech unicorn. Passionate about design systems, accessibility, and user psychology.',
    interests: ['Figma Tokens', 'Micro-interactions', 'Accessibility'],
    skillsToLearn: ['Python Automation', 'Machine Learning'],
    providerProfile: {
      headline: 'Principal UI/UX Designer & Figma Specialist',
      bio: 'Transforming conceptual wireframes into scalable design systems. Portfolio reviewer and mentor.',
      yearsOfExperience: 6,
      rating: 5.0,
      reviewCount: 9,
      isVerified: true,
      verificationStatus: 'verified',
      verifiedAt: new Date()
    },
    status: 'active'
  });

  const provider3 = await User.create({
    name: 'Marcus Brody',
    email: 'marcus.provider@example.com',
    password: commonPassword,
    roles: ['provider', 'learner'],
    currentRole: 'provider',
    creditBalance: 160,
    creditsEarned: 90,
    creditsSpent: 30,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Award-winning filmmaker and commercial video editor. Master of Premiere Pro, DaVinci Resolve, and audio mixing.',
    interests: ['Color Grading', 'Cinematography', 'Sound Design'],
    skillsToLearn: ['React Web Apps', 'SEO Marketing'],
    providerProfile: {
      headline: 'Commercial Video Editor & Colorist',
      bio: 'Hands-on editing workflows, pacing, and color science for YouTube and commercial video.',
      yearsOfExperience: 7,
      rating: 4.8,
      reviewCount: 7,
      isVerified: true,
      verificationStatus: 'verified',
      verifiedAt: new Date()
    },
    status: 'active'
  });

  // 3. Learners
  const learner1 = await User.create({
    name: 'Alex Rivera',
    email: 'alex.learner@example.com',
    password: commonPassword,
    roles: ['learner'],
    currentRole: 'learner',
    creditBalance: 85,
    creditsEarned: 0,
    creditsSpent: 65,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    bio: 'Junior frontend developer looking to level up backend skills and system design.',
    interests: ['React', 'TypeScript', 'Cloud Architecture'],
    skillsToLearn: ['Node.js API Design', 'UI/UX Design Systems'],
    status: 'active'
  });

  const learner2 = await User.create({
    name: 'Maya Patel',
    email: 'maya.learner@example.com',
    password: commonPassword,
    roles: ['learner'],
    currentRole: 'learner',
    creditBalance: 120,
    creditsEarned: 0,
    creditsSpent: 30,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Product manager expanding technical literacy to collaborate better with engineering teams.',
    interests: ['Python Scripting', 'Data Analytics', 'Public Speaking'],
    skillsToLearn: ['Python', 'SQL Querying'],
    status: 'active'
  });

  console.log('[Seed] Creating skill categories...');
  const catProgramming = await SkillCategory.create({
    name: 'Programming & Tech',
    slug: 'programming-tech',
    description: 'Web development, backend architecture, cloud engineering, and programming languages.',
    icon: 'Code',
    isActive: true
  });

  const catDesign = await SkillCategory.create({
    name: 'Design & Creative',
    slug: 'design-creative',
    description: 'UI/UX design, Figma workflows, brand identity, typography, and illustration.',
    icon: 'Palette',
    isActive: true
  });

  const catVideo = await SkillCategory.create({
    name: 'Video & Audio Production',
    slug: 'video-audio',
    description: 'Video editing, color grading, sound design, podcasting, and motion graphics.',
    icon: 'Video',
    isActive: true
  });

  const catDataAI = await SkillCategory.create({
    name: 'Data Science & AI',
    slug: 'data-science-ai',
    description: 'Machine learning, generative AI, Python data analysis, and predictive modeling.',
    icon: 'Brain',
    isActive: true
  });

  const catBusiness = await SkillCategory.create({
    name: 'Languages & Communication',
    slug: 'communication-skills',
    description: 'Executive speaking, technical writing, interview prep, and storytelling.',
    icon: 'MessageSquare',
    isActive: true
  });

  console.log('[Seed] Creating skill listings...');
  const listing1 = await SkillListing.create({
    provider: provider1._id,
    title: 'Modern Full-Stack Web Development with React & TypeScript',
    slug: 'fullstack-react-typescript',
    description: 'Deep dive into clean component architecture, state management, custom hooks, and REST API integration with real-world production practices.',
    category: catProgramming._id,
    proficiencyLevel: 'Intermediate',
    creditCost: 45,
    durationMinutes: 60,
    tags: ['React', 'TypeScript', 'Frontend', 'REST API', 'Architecture'],
    prerequisites: ['Basic JavaScript knowledge', 'HTML/CSS basics'],
    learningOutcomes: [
      'Master custom hooks & performance optimization',
      'Build end-to-end type-safe API consumers',
      'Architect maintainable frontend directories'
    ],
    sessionFormat: '1-on-1 Video',
    isActive: true,
    rating: 4.9,
    reviewCount: 8,
    totalBookings: 12
  });

  const listing2 = await SkillListing.create({
    provider: provider1._id,
    title: 'Python for Automation, Scripting & Backend APIs',
    slug: 'python-automation-scripting',
    description: 'Harness the simplicity of Python to automate repetitive workflows, parse complex data formats, and build robust backend microservices with FastAPI.',
    category: catProgramming._id,
    proficiencyLevel: 'Beginner',
    creditCost: 35,
    durationMinutes: 60,
    tags: ['Python', 'Automation', 'FastAPI', 'Backend', 'Scripting'],
    prerequisites: ['No prior programming experience required'],
    learningOutcomes: [
      'Write standalone automation scripts',
      'Scrape web data and process CSV/JSON spreadsheets',
      'Deploy a lightweight REST microservice'
    ],
    sessionFormat: 'Hands-on Lab',
    isActive: true,
    rating: 5.0,
    reviewCount: 6,
    totalBookings: 9
  });

  const listing3 = await SkillListing.create({
    provider: provider2._id,
    title: 'UI/UX Design Systems & High-Fidelity Figma Prototyping',
    slug: 'ui-ux-design-systems-figma',
    description: 'Learn how industry leaders structure design tokens, component variants, auto-layout constraints, and interactive interactive micro-prototypes in Figma.',
    category: catDesign._id,
    proficiencyLevel: 'Intermediate',
    creditCost: 40,
    durationMinutes: 60,
    tags: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping', 'User Research'],
    prerequisites: ['Basic familiarity with Figma interface'],
    learningOutcomes: [
      'Set up scalable Figma variables and tokens',
      'Create responsive auto-layout components',
      'Deliver developer-ready design documentation'
    ],
    sessionFormat: '1-on-1 Video',
    isActive: true,
    rating: 5.0,
    reviewCount: 9,
    totalBookings: 11
  });

  const listing4 = await SkillListing.create({
    provider: provider3._id,
    title: 'Commercial Video Editing & Color Grading Masterclass',
    slug: 'video-editing-color-grading',
    description: 'Transform raw footage into compelling narrative edits. Hands-on training in clip pacing, sound design layering, and cinematic color correction.',
    category: catVideo._id,
    proficiencyLevel: 'All Levels',
    creditCost: 45,
    durationMinutes: 60,
    tags: ['Video Editing', 'Premiere Pro', 'DaVinci Resolve', 'Color Grading'],
    prerequisites: ['Premiere Pro or DaVinci Resolve installed'],
    learningOutcomes: [
      'Master the 3-point editing timeline workflow',
      'Apply professional LUTs and primary color correction',
      'Clean audio and balance dialogue with soundtrack'
    ],
    sessionFormat: '1-on-1 Video',
    isActive: true,
    rating: 4.8,
    reviewCount: 7,
    totalBookings: 8
  });

  const listing5 = await SkillListing.create({
    provider: provider1._id,
    title: 'Technical Interview Preparation & System Design Mock Sessions',
    slug: 'tech-interview-system-design',
    description: 'Realistic 1-on-1 mock interviews focused on distributed system architectures, scalability, load balancing, caching, and database partitioning.',
    category: catProgramming._id,
    proficiencyLevel: 'Advanced',
    creditCost: 55,
    durationMinutes: 90,
    tags: ['System Design', 'Interview Prep', 'Architecture', 'Scalability'],
    prerequisites: ['1+ year software engineering background'],
    learningOutcomes: [
      'Confidently tackle 45-minute architectural interview questions',
      'Evaluate trade-offs between SQL vs NoSQL, CAP theorem, and CDN strategies',
      'Receive structured rubric feedback'
    ],
    sessionFormat: 'Consultation',
    isActive: true,
    rating: 4.9,
    reviewCount: 5,
    totalBookings: 6
  });

  console.log('[Seed] Creating availability slots...');
  const today = new Date();
  const getFutureDateStr = (daysAhead: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const day1 = getFutureDateStr(1);
  const day2 = getFutureDateStr(2);
  const day3 = getFutureDateStr(3);
  const day4 = getFutureDateStr(5);

  // Slots for Provider 1 (David)
  await AvailabilitySlot.create([
    { provider: provider1._id, date: day1, startTime: '10:00', endTime: '11:00', isBooked: false },
    { provider: provider1._id, date: day1, startTime: '14:00', endTime: '15:00', isBooked: false },
    { provider: provider1._id, date: day2, startTime: '11:00', endTime: '12:00', isBooked: false },
    { provider: provider1._id, date: day3, startTime: '16:00', endTime: '17:00', isBooked: false },
    { provider: provider1._id, date: day4, startTime: '09:00', endTime: '10:00', isBooked: false }
  ]);

  // Slots for Provider 2 (Sarah)
  await AvailabilitySlot.create([
    { provider: provider2._id, date: day1, startTime: '13:00', endTime: '14:00', isBooked: false },
    { provider: provider2._id, date: day2, startTime: '15:00', endTime: '16:00', isBooked: false },
    { provider: provider2._id, date: day3, startTime: '10:00', endTime: '11:00', isBooked: false }
  ]);

  // Slots for Provider 3 (Marcus)
  await AvailabilitySlot.create([
    { provider: provider3._id, date: day1, startTime: '17:00', endTime: '18:00', isBooked: false },
    { provider: provider3._id, date: day2, startTime: '18:00', endTime: '19:00', isBooked: false },
    { provider: provider3._id, date: day4, startTime: '14:00', endTime: '15:00', isBooked: false }
  ]);

  console.log('[Seed] Creating sample bookings...');
  // 1. Confirmed upcoming booking (Learner 1 with Provider 1)
  const bookingConfirmed = await Booking.create({
    bookingReference: 'BK-582914',
    learner: learner1._id,
    provider: provider1._id,
    skillListing: listing1._id,
    date: day2,
    startTime: '14:00',
    endTime: '15:00',
    durationMinutes: 60,
    creditCost: 45,
    status: 'confirmed',
    meetingLink: 'https://meet.skillexchange.org/bk-582914',
    learnerNotes: 'Looking forward to reviewing clean React hook architecture and custom data fetching hooks.',
    creditDeducted: true,
    creditRefunded: false,
    creditRewarded: false,
    confirmedAt: new Date(Date.now() - 3600000 * 5)
  });

  // 2. Completed session (Learner 2 with Provider 2)
  const bookingCompleted = await Booking.create({
    bookingReference: 'BK-918237',
    learner: learner2._id,
    provider: provider2._id,
    skillListing: listing3._id,
    date: getFutureDateStr(-2),
    startTime: '11:00',
    endTime: '12:00',
    durationMinutes: 60,
    creditCost: 40,
    status: 'completed',
    meetingLink: 'https://meet.skillexchange.org/bk-918237',
    creditDeducted: true,
    creditRefunded: false,
    creditRewarded: true,
    hasReview: true,
    confirmedAt: new Date(Date.now() - 3600000 * 52),
    completedAt: new Date(Date.now() - 3600000 * 48)
  });

  // 3. Pending booking request (Learner 1 with Provider 3)
  const bookingPending = await Booking.create({
    bookingReference: 'BK-471039',
    learner: learner1._id,
    provider: provider3._id,
    skillListing: listing4._id,
    date: day3,
    startTime: '15:00',
    endTime: '16:00',
    durationMinutes: 60,
    creditCost: 45,
    status: 'pending',
    meetingLink: 'https://meet.skillexchange.org/bk-471039',
    learnerNotes: 'Want to review color science and LUT grading for my YouTube channel intro.',
    creditDeducted: false,
    creditRefunded: false,
    creditRewarded: false
  });

  console.log('[Seed] Creating credit transactions...');
  await CreditTransaction.create([
    // Welcome grants
    {
      transactionId: 'CTX-1001-INIT',
      user: admin._id,
      type: 'initial_grant',
      amount: 500,
      balanceAfter: 500,
      description: 'Platform Administrator initial credits allotment',
      status: 'completed'
    },
    {
      transactionId: 'CTX-1002-INIT',
      user: provider1._id,
      type: 'initial_grant',
      amount: 100,
      balanceAfter: 100,
      description: 'Welcome bonus: 100 skill credits granted upon registration',
      status: 'completed'
    },
    {
      transactionId: 'CTX-1003-INIT',
      user: provider2._id,
      type: 'initial_grant',
      amount: 100,
      balanceAfter: 100,
      description: 'Welcome bonus: 100 skill credits granted upon registration',
      status: 'completed'
    },
    {
      transactionId: 'CTX-1004-INIT',
      user: learner1._id,
      type: 'initial_grant',
      amount: 100,
      balanceAfter: 100,
      description: 'Welcome bonus: 100 skill credits granted upon registration',
      status: 'completed'
    },
    {
      transactionId: 'CTX-1005-INIT',
      user: learner2._id,
      type: 'initial_grant',
      amount: 100,
      balanceAfter: 100,
      description: 'Welcome bonus: 100 skill credits granted upon registration',
      status: 'completed'
    },
    // Booking 1 deduction
    {
      transactionId: 'CTX-2001-REDM',
      user: learner1._id,
      type: 'session_redemption',
      amount: -45,
      balanceAfter: 85,
      relatedBooking: bookingConfirmed._id,
      relatedListing: listing1._id,
      description: 'Redeemed 45 skill credits for session booking BK-582914',
      status: 'completed'
    },
    // Booking 2 deduction & reward
    {
      transactionId: 'CTX-2002-REDM',
      user: learner2._id,
      type: 'session_redemption',
      amount: -40,
      balanceAfter: 60,
      relatedBooking: bookingCompleted._id,
      relatedListing: listing3._id,
      description: 'Redeemed 40 skill credits for session booking BK-918237',
      status: 'completed'
    },
    {
      transactionId: 'CTX-3001-REWD',
      user: provider2._id,
      type: 'teaching_reward',
      amount: 40,
      balanceAfter: 195,
      relatedBooking: bookingCompleted._id,
      relatedListing: listing3._id,
      description: 'Earned 40 skill credits for successfully teaching session BK-918237',
      status: 'completed'
    }
  ]);

  console.log('[Seed] Creating sample reviews...');
  await Review.create({
    booking: bookingCompleted._id,
    skillListing: listing3._id,
    reviewer: learner2._id,
    provider: provider2._id,
    rating: 5,
    comment: 'Sarah is an outstanding instructor! She walked me through Figma variables and auto-layout with patience and real design examples. Highly recommended!',
    status: 'approved'
  });

  console.log('[Seed] Database seed completed successfully!');
};

export const autoSeedIfEmpty = async (): Promise<void> => {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('[Seed] No existing users found. Auto-populating demonstration data...');
    await seedDatabase();
  } else {
    console.log(`[Seed] Database already contains ${userCount} users. Skipping auto-seed.`);
  }
};

// Direct script execution support
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      console.log('Seeding finished.');
      await closeDB();
      process.exit(0);
    } catch (e) {
      console.error('Seeding failed:', e);
      process.exit(1);
    }
  })();
}