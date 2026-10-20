/**
 * Comprehensive End-to-End API Test Suite
 * Validates all business cases, user roles, security invariants, credit operations, and error handling.
 */

const BASE_URL = 'http://localhost:5000';

let passed = 0;
let failed = 0;
const results: { name: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

async function runCase(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`✓ PASS: ${name}`);
  } catch (err: any) {
    failed++;
    results.push({ name, status: 'FAIL', error: err.message || String(err) });
    console.error(`✗ FAIL: ${name} -> ${err.message || String(err)}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

async function request(path: string, options: any = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runAll() {
  console.log('\n======================================================');
  console.log('🧪 Starting End-to-End Live API Test Suite');
  console.log('======================================================\n');

  // 1. Health Check
  await runCase('1. Health check endpoint responds with 200 and healthy status', async () => {
    const res = await request('/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data?.status === 'healthy', 'Expected status to be healthy');
    assert(res.data?.economy === 'credits-only', 'Expected economy to be strictly credits-only');
  });

  // 2. Auth - Invalid Login
  await runCase('2. Login with incorrect password should be rejected with 401/400', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'alex.learner@example.com', password: 'WrongPassword!' }),
    });
    assert(res.status === 400 || res.status === 401, `Expected 400 or 401, got ${res.status}`);
  });

  // 3. Auth - Valid Logins for All 3 Seeded Roles
  let learnerToken = '';
  let learnerId = '';
  await runCase('3. Seeded Learner logs in successfully and receives JWT', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'alex.learner@example.com', password: 'Password123!' }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.data?.message}`);
    assert(!!res.data.token, 'Expected JWT token');
    assert(res.data.user.roles.includes('learner'), 'Expected learner role');
    learnerToken = res.data.token;
    learnerId = res.data.user.id || res.data.user._id;
  });

  let providerToken = '';
  let providerId = '';
  await runCase('4. Seeded Provider logs in successfully', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'david.provider@example.com', password: 'Password123!' }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.data?.message}`);
    assert(!!res.data.token, 'Expected JWT token');
    assert(res.data.user.roles.includes('provider'), 'Expected provider role');
    providerToken = res.data.token;
    providerId = res.data.user.id || res.data.user._id;
  });

  let adminToken = '';
  await runCase('5. Seeded Admin logs in successfully', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@skillexchange.org', password: 'Password123!' }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.data?.message}`);
    assert(!!res.data.token, 'Expected JWT token');
    assert(res.data.user.roles.includes('admin'), 'Expected admin role');
    adminToken = res.data.token;
  });

  // 4. Auth - Fresh User Registration with initial credit balance
  const testEmail = `newlearner_${Date.now()}@example.com`;
  let freshUserToken = '';
  let freshUserId = '';
  await runCase('6. Fresh user registers and receives exactly 100 initial credits', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Test Learner',
        email: testEmail,
        password: 'Password123!',
        bio: 'Testing credits and exchange workflows',
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${res.data?.message}`);
    assert(res.data.user.creditBalance === 100, `Expected 100 credits, got ${res.data?.user?.creditBalance}`);
    freshUserToken = res.data.token;
    freshUserId = res.data.user.id || res.data.user._id;
  });

  // 5. Auth - Duplicate Registration Protection
  await runCase('7. Duplicate user registration is rejected', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Duplicate User',
        email: testEmail,
        password: 'Password123!',
      }),
    });
    assert(res.status === 400, `Expected 400 for duplicate email, got ${res.status}`);
  });

  // 6. Auth - Profile Identity Verification
  await runCase('8. /api/auth/me returns current user identity with valid Bearer token', async () => {
    const res = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.user.email === 'alex.learner@example.com', 'Identity mismatch');
  });

  // 7. Categories & Skills Browse
  let categoryId = '';
  await runCase('9. Public Categories and Skills API returns listings with filters', async () => {
    const catRes = await request('/api/categories');
    assert(catRes.status === 200, `Expected 200, got ${catRes.status}`);
    assert(Array.isArray(catRes.data.categories) && catRes.data.categories.length > 0, 'Expected non-empty categories');
    categoryId = catRes.data.categories[0]._id || catRes.data.categories[0].id;

    const skillsRes = await request('/api/skills');
    assert(skillsRes.status === 200, `Expected 200, got ${skillsRes.status}`);
    assert(Array.isArray(skillsRes.data.listings), 'Expected listings array');
    assert(skillsRes.data.listings.length > 0, 'Expected non-empty listings');

    // Filter test by search query
    const searchRes = await request('/api/skills?search=react');
    assert(searchRes.status === 200, 'Search filter should return 200');
  });

  // 8. Skills - Provider creates a new Skill Listing
  let createdSkillId = '';
  await runCase('10. Provider publishes a skill listing with valid credit cost', async () => {
    const res = await request('/api/skills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({
        title: `Full-Stack Architecture Mastery ${Date.now()}`,
        description: 'Hands-on architectural patterns and clean code.',
        category: categoryId,
        creditCost: 35,
        proficiencyLevel: 'Intermediate',
        durationMinutes: 60,
        tags: ['architecture', 'nodejs', 'typescript'],
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${res.data?.message}`);
    assert(res.data.listing.creditCost === 35, 'Expected creditCost 35');
    createdSkillId = res.data.listing._id || res.data.listing.id;
  });

  // 9. Availability - Provider sets availability slot
  await runCase('11. Provider adds an availability slot', async () => {
    const randomOffset = Math.floor(Math.random() * 20) + 10;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + randomOffset);
    const dateStr = futureDate.toISOString().split('T')[0];
    const hour = String(Math.floor(Math.random() * 8) + 9).padStart(2, '0');

    const res = await request('/api/availability', {
      method: 'POST',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({
        date: dateStr,
        startTime: `${hour}:00`,
        endTime: `${hour}:50`,
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${res.data?.message}`);
    assert(!!res.data.slot, 'Expected created slot');
  });

  // 10. Booking - Insufficient Credit Balance Protection
  await runCase('12. Booking is rejected if skill creditCost exceeds learner balance', async () => {
    // Attempting to book when user doesn't have enough credits:
    // User has 100 credits. We publish a skill costing 150 credits.
    const expensiveSkillRes = await request('/api/skills', {
      method: 'POST',
      headers: { Authorization: `Bearer ${providerToken}` },
      body: JSON.stringify({
        title: `Executive Masterclass ${Date.now()}`,
        description: 'High credit cost session',
        category: categoryId,
        creditCost: 150,
        proficiencyLevel: 'Advanced',
        durationMinutes: 90,
      }),
    });
    assert(expensiveSkillRes.status === 201, 'Expensive skill creation failed');
    const expSkillId = expensiveSkillRes.data.listing._id || expensiveSkillRes.data.listing.id;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 6);
    const dateStr = futureDate.toISOString().split('T')[0];

    // Fresh user has only 100 credits
    const bookRes = await request('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshUserToken}` },
      body: JSON.stringify({
        skillListingId: expSkillId,
        date: dateStr,
        startTime: '14:00',
        endTime: '15:30',
        learnerNotes: 'Want to book this high credit session',
      }),
    });
    assert(bookRes.status === 400, `Expected 400 for insufficient credits, got ${bookRes.status}`);
    assert(bookRes.data.message.toLowerCase().includes('credit'), 'Error message must specify credits');
  });

  // 11. Booking - Valid Request Creation
  let bookingId = '';
  const bookingDayOffset = Math.floor(Math.random() * 50) + 20;
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() + bookingDayOffset);
  const bookingDateStr = bookingDate.toISOString().split('T')[0];

  await runCase('13. Learner books a session within credit limit (pending state)', async () => {
    const res = await request('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshUserToken}` },
      body: JSON.stringify({
        skillListingId: createdSkillId,
        date: bookingDateStr,
        startTime: '10:00',
        endTime: '11:00',
        learnerNotes: 'Excited to learn architecture patterns!',
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${res.data?.message}`);
    assert(res.data.booking.status === 'pending', 'Status should be pending');
    assert(res.data.booking.creditCost === 35, 'Credit cost should be 35');
    bookingId = res.data.booking._id || res.data.booking.id;
  });

  // 12. Booking - Prevent Overlapping Schedule
  await runCase('14. Learner cannot double-book the same date and time slot', async () => {
    const res = await request('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshUserToken}` },
      body: JSON.stringify({
        skillListingId: createdSkillId,
        date: bookingDateStr,
        startTime: '10:00',
        endTime: '11:00',
        learnerNotes: 'Attempting to double-book',
      }),
    });
    assert(res.status === 400, `Expected 400 for conflict, got ${res.status}`);
  });

  // 13. Booking - Provider Accepts Booking and Deducts Credits
  await runCase('15. Provider accepts booking, escrowing 35 credits from learner', async () => {
    const learnerBefore = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${freshUserToken}` },
    });
    const balanceBefore = learnerBefore.data.user.creditBalance;

    const res = await request(`/api/bookings/${bookingId}/accept`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${providerToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.data?.message}`);
    assert(res.data.booking.status === 'confirmed', 'Status must be confirmed');

    const learnerAfter = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${freshUserToken}` },
    });
    assert(
      learnerAfter.data.user.creditBalance === balanceBefore - 35,
      `Credits not deducted properly: before ${balanceBefore}, after ${learnerAfter.data.user.creditBalance}`,
    );
  });

  // 14. Booking - Complete Session and Transfer Credits to Provider
  await runCase('16. Provider marks session completed, awarding credits to provider', async () => {
    const providerBefore = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${providerToken}` },
    });
    const balanceBefore = providerBefore.data.user.creditBalance;

    const res = await request(`/api/bookings/${bookingId}/complete`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${providerToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.data?.message}`);
    assert(res.data.booking.status === 'completed', 'Status must be completed');

    const providerAfter = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${providerToken}` },
    });
    assert(
      providerAfter.data.user.creditBalance === balanceBefore + 35,
      `Provider credits not incremented: before ${balanceBefore}, after ${providerAfter.data.user.creditBalance}`,
    );
  });

  // 15. Reviews - Post Review for Completed Session
  await runCase('17. Learner submits a 5-star review for the completed session', async () => {
    const res = await request('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshUserToken}` },
      body: JSON.stringify({
        bookingId: bookingId,
        rating: 5,
        comment: 'Outstanding session! Clear architectural patterns and clean TypeScript examples.',
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${res.data?.message}`);
    assert(res.data.review.rating === 5, 'Expected rating 5');
  });

  // 16. Reviews - Prevent Duplicate Reviews
  await runCase('18. Duplicate review for the same booking is rejected', async () => {
    const res = await request('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshUserToken}` },
      body: JSON.stringify({
        bookingId: bookingId,
        rating: 4,
        comment: 'Attempting duplicate review',
      }),
    });
    assert(res.status === 400, `Expected 400 for duplicate review, got ${res.status}`);
  });

  // 17. Cancellation & Automatic Credit Refund
  await runCase('19. Cancelling a confirmed booking refunds skill credits back to learner', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 80 + Math.floor(Math.random() * 20));
    const dateStr = futureDate.toISOString().split('T')[0];

    // Book second session
    const bookRes = await request('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshUserToken}` },
      body: JSON.stringify({
        skillListingId: createdSkillId,
        date: dateStr,
        startTime: '16:00',
        endTime: '17:00',
        learnerNotes: 'Session to be cancelled and refunded',
      }),
    });
    assert(bookRes.status === 201, 'Booking failed');
    const cancelBookingId = bookRes.data.booking._id || bookRes.data.booking.id;

    // Provider confirms (deducting 35 credits)
    await request(`/api/bookings/${cancelBookingId}/accept`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${providerToken}` },
    });

    const userBeforeCancel = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${freshUserToken}` },
    });
    const balanceBeforeCancel = userBeforeCancel.data.user.creditBalance;

    // Learner cancels booking
    const cancelRes = await request(`/api/bookings/${cancelBookingId}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${freshUserToken}` },
      body: JSON.stringify({ reason: 'Schedule conflict' }),
    });
    assert(cancelRes.status === 200, `Expected 200, got ${cancelRes.status}: ${cancelRes.data?.message}`);

    // Verify refund
    const userAfterCancel = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${freshUserToken}` },
    });
    assert(
      userAfterCancel.data.user.creditBalance === balanceBeforeCancel + 35,
      `Credits were not refunded: before ${balanceBeforeCancel}, after ${userAfterCancel.data.user.creditBalance}`,
    );
  });

  // 18. Credit History & Auditable Ledger Entries
  await runCase('20. Credit history displays initial_grant, session_redemption, and session_refund transactions', async () => {
    const res = await request('/api/credits/history', {
      headers: { Authorization: `Bearer ${freshUserToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.transactions), 'Expected transactions array');
    assert(res.data.transactions.length >= 3, `Expected at least 3 transactions, got ${res.data.transactions.length}`);

    const types = res.data.transactions.map((t: any) => t.type);
    assert(types.includes('initial_grant'), 'Missing initial_grant');
    assert(types.includes('session_redemption'), 'Missing session_redemption');
    assert(types.includes('session_refund'), 'Missing session_refund');
  });

  // 19. Notifications System
  await runCase('21. Notifications are delivered and can be marked as read', async () => {
    const res = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${freshUserToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.notifications), 'Expected notifications array');
    assert(res.data.notifications.length > 0, 'Expected notifications to be present');

    const notifId = res.data.notifications[0]._id || res.data.notifications[0].id;
    const markRes = await request(`/api/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${freshUserToken}` },
    });
    assert(markRes.status === 200, `Expected 200, got ${markRes.status}`);
  });

  // 20. Admin RBAC Protection
  await runCase('22. Non-admin users are strictly blocked from admin routes', async () => {
    const res = await request('/api/admin/ledger', {
      headers: { Authorization: `Bearer ${freshUserToken}` },
    });
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  // 21. Admin System Auditing
  await runCase('23. Admin accesses system audit ledger and user directory', async () => {
    const ledgerRes = await request('/api/admin/ledger', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(ledgerRes.status === 200, `Expected 200, got ${ledgerRes.status}`);
    assert(Array.isArray(ledgerRes.data.transactions), 'Expected global ledger transactions');

    const usersRes = await request('/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(usersRes.status === 200, `Expected 200, got ${usersRes.status}`);
    assert(Array.isArray(usersRes.data.users), 'Expected users list');
  });

  // 22. Strict Economy Invariant Check
  await runCase('24. System invariant check: No monetary currency symbols or fiat payments exist', async () => {
    const skillsRes = await request('/api/skills');
    const jsonStr = JSON.stringify(skillsRes.data);
    assert(!jsonStr.includes('₹') && !jsonStr.includes('$') && !jsonStr.includes('€'), 'Monetary symbols detected in skills API!');
    assert(!jsonStr.includes('stripe') && !jsonStr.includes('razorpay'), 'Monetary payment gateway detected!');
  });

  console.log('\n======================================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
