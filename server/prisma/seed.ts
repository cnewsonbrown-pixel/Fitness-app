/**
 * FitStudio Demo Seed Script
 *
 * Creates a realistic demo dataset for "Iron & Oak Fitness" studio.
 *
 * Run with: npm run db:seed
 *
 * Login credentials printed at the end.
 */

import { PrismaClient, StaffRole, MembershipKind, BillingInterval, MembershipStatus, ClassStatus, BookingStatus, CheckInMethod, LifecycleStage, PointTransactionType, ArticleStatus, BadgeEarnType, PayType, Tier } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo1234!';
const SALT_ROUNDS = 10;

async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Helper: date offset from now (positive = future, negative = past)
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function hoursFromNow(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}

function setTime(date: Date, hour: number, minute = 0): Date {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log('🌱 Seeding FitStudio demo database...\n');

  // ============================================================
  // CLEANUP — remove existing demo data if re-running
  // ============================================================
  const existing = await prisma.tenant.findUnique({ where: { slug: 'iron-oak' } });
  if (existing) {
    await prisma.tenant.delete({ where: { slug: 'iron-oak' } });
    console.log('🗑  Removed existing demo tenant\n');
  }

  // ============================================================
  // TENANT
  // ============================================================
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Iron & Oak Fitness',
      slug: 'iron-oak',
      tier: Tier.MID,
      timezone: 'America/New_York',
      currency: 'USD',
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      accentColor: '#818cf8',
      bookingWindowDays: 14,
      cancellationWindowHours: 12,
      waitlistEnabled: true,
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.slug})`);

  // ============================================================
  // LOCATION
  // ============================================================
  const location = await prisma.location.create({
    data: {
      tenantId: tenant.id,
      name: 'Main Studio',
      address: '142 West 29th Street',
      city: 'New York',
      state: 'NY',
      country: 'United States',
      postalCode: '10001',
      timezone: 'America/New_York',
      phone: '+1 (212) 555-0182',
      email: 'studio@iron-oak.com',
    },
  });
  console.log(`✅ Location: ${location.name}`);

  // ============================================================
  // STAFF USERS
  // ============================================================
  const staffData = [
    { firstName: 'Marcus', lastName: 'Reid', email: 'owner@iron-oak.com', role: StaffRole.OWNER, isInstructor: false, payRate: 0 },
    { firstName: 'Sarah', lastName: 'Chen', email: 'admin@iron-oak.com', role: StaffRole.ADMIN, isInstructor: false, payRate: 0 },
    { firstName: 'Jake', lastName: 'Thompson', email: 'jake@iron-oak.com', role: StaffRole.INSTRUCTOR, isInstructor: true, payRate: 45 },
    { firstName: 'Priya', lastName: 'Sharma', email: 'priya@iron-oak.com', role: StaffRole.INSTRUCTOR, isInstructor: true, payRate: 45 },
    { firstName: 'Tom', lastName: 'Walsh', email: 'tom@iron-oak.com', role: StaffRole.FRONT_DESK, isInstructor: false, payRate: 18 },
  ];

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const staffMembers: { user: { id: string; firstName: string; lastName: string; email: string }; staff: { id: string } }[] = [];

  for (const s of staffData) {
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: s.email,
        passwordHash,
        firstName: s.firstName,
        lastName: s.lastName,
        isEmailVerified: true,
        isActive: true,
      },
    });

    const staff = await prisma.staff.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: s.role,
        displayName: `${s.firstName} ${s.lastName}`,
        isInstructor: s.isInstructor,
        payRate: s.payRate,
        payType: s.role === StaffRole.FRONT_DESK ? PayType.HOURLY : PayType.PER_CLASS,
        isActive: true,
      },
    });

    staffMembers.push({ user, staff });
    console.log(`✅ Staff: ${s.firstName} ${s.lastName} (${s.role})`);
  }

  const instructors = staffMembers.filter((s) => staffData.find((d) => d.email === s.user.email)?.isInstructor);

  // ============================================================
  // MEMBERSHIP TYPES
  // ============================================================
  const membershipTypes = await Promise.all([
    prisma.membershipType.create({
      data: {
        tenantId: tenant.id,
        name: 'Day Pass',
        description: 'Single visit access to all classes.',
        type: MembershipKind.DROP_IN,
        price: 25,
        unlimitedClasses: false,
        classCredits: 1,
        isPublic: true,
      },
    }),
    prisma.membershipType.create({
      data: {
        tenantId: tenant.id,
        name: 'Monthly Unlimited',
        description: 'Unlimited access to all classes for one month.',
        type: MembershipKind.RECURRING,
        price: 89,
        billingInterval: BillingInterval.MONTHLY,
        unlimitedClasses: true,
        isPublic: true,
      },
    }),
    prisma.membershipType.create({
      data: {
        tenantId: tenant.id,
        name: '6-Month Prepaid',
        description: 'Unlimited classes for 6 months — best value.',
        type: MembershipKind.CLASS_PACK,
        price: 449,
        unlimitedClasses: true,
        isPublic: true,
      },
    }),
    prisma.membershipType.create({
      data: {
        tenantId: tenant.id,
        name: 'Annual Elite',
        description: 'Full year of unlimited access at the best rate.',
        type: MembershipKind.CLASS_PACK,
        price: 799,
        unlimitedClasses: true,
        isPublic: true,
      },
    }),
  ]);
  console.log(`✅ Membership types: ${membershipTypes.length} created`);

  // ============================================================
  // CLASS TYPES
  // ============================================================
  const classTypes = await Promise.all([
    prisma.classType.create({
      data: {
        tenantId: tenant.id,
        name: 'HIIT Blast',
        description: 'High-intensity interval training that burns fat and builds endurance.',
        durationMinutes: 45,
        defaultCapacity: 20,
        color: '#ef4444',
        isActive: true,
      },
    }),
    prisma.classType.create({
      data: {
        tenantId: tenant.id,
        name: 'Morning Yoga',
        description: 'Start your day with mindful movement and breathwork.',
        durationMinutes: 60,
        defaultCapacity: 15,
        color: '#10b981',
        isActive: true,
      },
    }),
    prisma.classType.create({
      data: {
        tenantId: tenant.id,
        name: 'Spin Express',
        description: 'Fast-paced cycling class set to high-energy music.',
        durationMinutes: 45,
        defaultCapacity: 18,
        color: '#f59e0b',
        isActive: true,
      },
    }),
    prisma.classType.create({
      data: {
        tenantId: tenant.id,
        name: 'Strength & Conditioning',
        description: 'Build functional strength with barbell and dumbbell work.',
        durationMinutes: 60,
        defaultCapacity: 12,
        color: '#8b5cf6',
        isActive: true,
      },
    }),
    prisma.classType.create({
      data: {
        tenantId: tenant.id,
        name: 'Pilates Flow',
        description: 'Core-focused movement for balance, flexibility, and control.',
        durationMinutes: 50,
        defaultCapacity: 10,
        color: '#06b6d4',
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Class types: ${classTypes.length} created`);

  // ============================================================
  // CLASS SESSIONS — 2 weeks of schedule
  // ============================================================
  const sessionSchedule = [
    // Past sessions (for bookings)
    { daysOffset: -2, hour: 6, classTypeIdx: 0, instructorIdx: 0, status: ClassStatus.COMPLETED },
    { daysOffset: -1, hour: 9, classTypeIdx: 1, instructorIdx: 1, status: ClassStatus.COMPLETED },
    // Upcoming sessions
    { daysOffset: 0, hour: 6, classTypeIdx: 0, instructorIdx: 0, status: ClassStatus.SCHEDULED },
    { daysOffset: 0, hour: 18, classTypeIdx: 2, instructorIdx: 1, status: ClassStatus.SCHEDULED },
    { daysOffset: 1, hour: 7, classTypeIdx: 1, instructorIdx: 1, status: ClassStatus.SCHEDULED },
    { daysOffset: 1, hour: 12, classTypeIdx: 3, instructorIdx: 0, status: ClassStatus.SCHEDULED },
    { daysOffset: 2, hour: 6, classTypeIdx: 2, instructorIdx: 0, status: ClassStatus.SCHEDULED },
    { daysOffset: 2, hour: 17, classTypeIdx: 4, instructorIdx: 1, status: ClassStatus.SCHEDULED },
    { daysOffset: 3, hour: 9, classTypeIdx: 1, instructorIdx: 1, status: ClassStatus.SCHEDULED },
    { daysOffset: 3, hour: 18, classTypeIdx: 0, instructorIdx: 0, status: ClassStatus.SCHEDULED },
    { daysOffset: 4, hour: 6, classTypeIdx: 3, instructorIdx: 0, status: ClassStatus.SCHEDULED },
    { daysOffset: 4, hour: 12, classTypeIdx: 2, instructorIdx: 1, status: ClassStatus.SCHEDULED },
    { daysOffset: 5, hour: 9, classTypeIdx: 4, instructorIdx: 1, status: ClassStatus.SCHEDULED },
    { daysOffset: 5, hour: 17, classTypeIdx: 1, instructorIdx: 1, status: ClassStatus.SCHEDULED },
    { daysOffset: 7, hour: 6, classTypeIdx: 0, instructorIdx: 0, status: ClassStatus.SCHEDULED },
    { daysOffset: 7, hour: 18, classTypeIdx: 3, instructorIdx: 0, status: ClassStatus.SCHEDULED },
    { daysOffset: 8, hour: 7, classTypeIdx: 2, instructorIdx: 1, status: ClassStatus.SCHEDULED },
    { daysOffset: 9, hour: 9, classTypeIdx: 1, instructorIdx: 1, status: ClassStatus.SCHEDULED },
    { daysOffset: 10, hour: 12, classTypeIdx: 4, instructorIdx: 1, status: ClassStatus.SCHEDULED },
    { daysOffset: 11, hour: 6, classTypeIdx: 0, instructorIdx: 0, status: ClassStatus.SCHEDULED },
  ];

  const classSessions = [];
  for (const s of sessionSchedule) {
    const classType = classTypes[s.classTypeIdx];
    const instructor = instructors[s.instructorIdx];
    const startTime = setTime(daysFromNow(s.daysOffset), s.hour);
    const endTime = new Date(startTime.getTime() + classType.durationMinutes * 60 * 1000);

    const session = await prisma.classSession.create({
      data: {
        tenantId: tenant.id,
        locationId: location.id,
        classTypeId: classType.id,
        instructorId: instructor.staff.id,
        startTime,
        endTime,
        capacity: classType.defaultCapacity,
        spotsBooked: 0,
        status: s.status,
      },
    });
    classSessions.push(session);
  }
  console.log(`✅ Class sessions: ${classSessions.length} created`);

  // ============================================================
  // MEMBERS (15 members with varied lifecycle stages)
  // ============================================================
  const membersData = [
    // Active members with Monthly Unlimited
    { firstName: 'Emma', lastName: 'Johnson', email: 'emma@example.com', stage: LifecycleStage.ACTIVE, membershipTypeIdx: 1, tags: ['vip', 'loyal'], points: 485, streak: 12 },
    { firstName: 'Liam', lastName: 'Williams', email: 'liam@example.com', stage: LifecycleStage.ACTIVE, membershipTypeIdx: 1, tags: ['loyal'], points: 320, streak: 8 },
    { firstName: 'Olivia', lastName: 'Brown', email: 'olivia@example.com', stage: LifecycleStage.ACTIVE, membershipTypeIdx: 2, tags: ['vip', 'referral'], points: 750, streak: 21 },
    { firstName: 'Noah', lastName: 'Jones', email: 'noah@example.com', stage: LifecycleStage.ACTIVE, membershipTypeIdx: 1, tags: ['new'], points: 85, streak: 3 },
    { firstName: 'Ava', lastName: 'Garcia', email: 'ava@example.com', stage: LifecycleStage.ACTIVE, membershipTypeIdx: 3, tags: ['vip', 'loyal'], points: 1240, streak: 30 },
    { firstName: 'James', lastName: 'Miller', email: 'james@example.com', stage: LifecycleStage.ACTIVE, membershipTypeIdx: 1, tags: ['online-only'], points: 160, streak: 5 },
    { firstName: 'Sophia', lastName: 'Davis', email: 'sophia@example.com', stage: LifecycleStage.ACTIVE, membershipTypeIdx: 2, tags: ['referral'], points: 410, streak: 14 },
    { firstName: 'Benjamin', lastName: 'Martinez', email: 'ben@example.com', stage: LifecycleStage.ACTIVE, membershipTypeIdx: 1, tags: ['at-risk'], points: 95, streak: 1 },
    // Trial members
    { firstName: 'Charlotte', lastName: 'Wilson', email: 'charlotte@example.com', stage: LifecycleStage.TRIAL, membershipTypeIdx: 0, tags: ['new'], points: 25, streak: 1 },
    { firstName: 'Henry', lastName: 'Anderson', email: 'henry@example.com', stage: LifecycleStage.TRIAL, membershipTypeIdx: 0, tags: ['new'], points: 10, streak: 0 },
    // Leads
    { firstName: 'Amelia', lastName: 'Taylor', email: 'amelia@example.com', stage: LifecycleStage.LEAD, membershipTypeIdx: null, tags: [], points: 0, streak: 0 },
    { firstName: 'Ethan', lastName: 'Thomas', email: 'ethan@example.com', stage: LifecycleStage.LEAD, membershipTypeIdx: null, tags: [], points: 0, streak: 0 },
    { firstName: 'Mia', lastName: 'Moore', email: 'mia@example.com', stage: LifecycleStage.LEAD, membershipTypeIdx: null, tags: ['referral'], points: 0, streak: 0 },
    // Churned
    { firstName: 'Lucas', lastName: 'Jackson', email: 'lucas@example.com', stage: LifecycleStage.CHURNED, membershipTypeIdx: null, tags: ['at-risk'], points: 140, streak: 0 },
    { firstName: 'Isabella', lastName: 'White', email: 'isabella@example.com', stage: LifecycleStage.CHURNED, membershipTypeIdx: null, tags: [], points: 60, streak: 0 },
  ];

  const members = [];
  const memberPasswordHash = await hashPassword(DEMO_PASSWORD);

  for (const m of membersData) {
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: m.email,
        passwordHash: memberPasswordHash,
        firstName: m.firstName,
        lastName: m.lastName,
        isEmailVerified: true,
        isActive: true,
      },
    });

    const member = await prisma.member.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        lifecycleStage: m.stage,
        tags: m.tags,
        totalPoints: m.points,
        currentStreak: m.streak,
        longestStreak: Math.max(m.streak, Math.floor(m.streak * 1.5)),
        marketingConsent: m.stage !== LifecycleStage.CHURNED,
        smsConsent: m.tags.includes('vip'),
        lastActiveAt: daysFromNow(m.stage === LifecycleStage.ACTIVE ? -1 : m.stage === LifecycleStage.CHURNED ? -60 : -7),
      },
    });

    // Create membership for active/trial members
    if (m.membershipTypeIdx !== null) {
      const membershipType = membershipTypes[m.membershipTypeIdx];
      const startDate = daysFromNow(m.stage === LifecycleStage.TRIAL ? -7 : -45);
      const endDate = m.stage === LifecycleStage.TRIAL ? daysFromNow(7) : daysFromNow(15);

      await prisma.memberMembership.create({
        data: {
          memberId: member.id,
          membershipTypeId: membershipType.id,
          status: MembershipStatus.ACTIVE,
          startDate,
          endDate,
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          creditsRemaining: membershipType.type === MembershipKind.DROP_IN ? 1 : null,
        },
      });
    }

    members.push({ user, member });
  }
  console.log(`✅ Members: ${members.length} created`);

  // ============================================================
  // BOOKINGS — 2-3 per active member
  // ============================================================
  const activeMembers = members.filter((_, i) => membersData[i].stage === LifecycleStage.ACTIVE);
  const upcomingSessions = classSessions.filter((s) => s.status === ClassStatus.SCHEDULED);
  const pastSessions = classSessions.filter((s) => s.status === ClassStatus.COMPLETED);

  let totalBookings = 0;

  for (let i = 0; i < activeMembers.length; i++) {
    const { member } = activeMembers[i];

    // 1-2 upcoming bookings
    const sessionPick1 = upcomingSessions[i % upcomingSessions.length];
    const sessionPick2 = upcomingSessions[(i + 3) % upcomingSessions.length];

    for (const session of [sessionPick1, sessionPick2]) {
      const existing = await prisma.booking.findUnique({
        where: { memberId_classSessionId: { memberId: member.id, classSessionId: session.id } },
      });
      if (!existing) {
        await prisma.booking.create({
          data: {
            memberId: member.id,
            classSessionId: session.id,
            status: BookingStatus.BOOKED,
          },
        });
        await prisma.classSession.update({
          where: { id: session.id },
          data: { spotsBooked: { increment: 1 } },
        });
        totalBookings++;
      }
    }

    // 1 past booking (attended)
    if (pastSessions.length > 0) {
      const pastSession = pastSessions[i % pastSessions.length];
      const existing = await prisma.booking.findUnique({
        where: { memberId_classSessionId: { memberId: member.id, classSessionId: pastSession.id } },
      });
      if (!existing) {
        await prisma.booking.create({
          data: {
            memberId: member.id,
            classSessionId: pastSession.id,
            status: BookingStatus.CHECKED_IN,
            checkedInAt: new Date(pastSession.startTime.getTime() + 5 * 60 * 1000),
            checkInMethod: CheckInMethod.QR_SCAN,
          },
        });
        await prisma.classSession.update({
          where: { id: pastSession.id },
          data: { spotsBooked: { increment: 1 } },
        });
        totalBookings++;
      }
    }
  }
  console.log(`✅ Bookings: ${totalBookings} created`);

  // ============================================================
  // GAMIFICATION — Badges & points
  // ============================================================
  const badges = await Promise.all([
    prisma.badge.create({
      data: {
        tenantId: tenant.id,
        name: 'Early Bird',
        description: 'Attended 5 classes before 7am.',
        imageUrl: 'https://cdn.fitstudio.app/badges/early-bird.png',
        earnType: BadgeEarnType.AUTOMATIC,
        automaticCriteria: { type: 'early_checkins', threshold: 5 },
      },
    }),
    prisma.badge.create({
      data: {
        tenantId: tenant.id,
        name: 'Century Club',
        description: 'Attended 100 classes.',
        imageUrl: 'https://cdn.fitstudio.app/badges/century.png',
        earnType: BadgeEarnType.AUTOMATIC,
        automaticCriteria: { type: 'total_checkins', threshold: 100 },
      },
    }),
    prisma.badge.create({
      data: {
        tenantId: tenant.id,
        name: 'Consistency King',
        description: 'Maintained a 30-day attendance streak.',
        imageUrl: 'https://cdn.fitstudio.app/badges/streak.png',
        earnType: BadgeEarnType.AUTOMATIC,
        automaticCriteria: { type: 'streak_days', threshold: 30 },
      },
    }),
  ]);

  // Award "Early Bird" badge to top 5 active members
  const earlyBirdRecipients = activeMembers.slice(0, 5);
  for (const { member } of earlyBirdRecipients) {
    await prisma.memberBadge.create({
      data: { memberId: member.id, badgeId: badges[0].id },
    });
  }

  // Award "Consistency King" to the member with 30-day streak
  const streakKing = activeMembers.find((_, i) => membersData[i].streak >= 30);
  if (streakKing) {
    await prisma.memberBadge.create({
      data: { memberId: streakKing.member.id, badgeId: badges[2].id },
    });
  }

  // Point transactions for active members
  let pointTxCount = 0;
  for (let i = 0; i < Math.min(activeMembers.length, 8); i++) {
    const { member } = activeMembers[i];
    await prisma.pointTransaction.create({
      data: {
        memberId: member.id,
        points: 10,
        type: PointTransactionType.CHECK_IN,
        description: 'Attended HIIT Blast class',
        createdAt: daysFromNow(-2),
      },
    });
    pointTxCount++;
  }
  console.log(`✅ Badges: ${badges.length} types, awarded to ${earlyBirdRecipients.length + (streakKing ? 1 : 0)} members`);
  console.log(`✅ Point transactions: ${pointTxCount} created`);

  // ============================================================
  // ARTICLES (content library)
  // ============================================================
  const adminStaff = staffMembers.find((s) => staffData.find((d) => d.email === s.user.email)?.role === StaffRole.ADMIN);

  await Promise.all([
    prisma.article.create({
      data: {
        tenantId: tenant.id,
        title: '5 Tips for a Stronger Core',
        slug: '5-tips-for-a-stronger-core',
        body: `<h2>Why Core Strength Matters</h2><p>A strong core is the foundation of every movement you make, from lifting a barbell to picking up your kids. Here are five evidence-based tips to build real, functional core strength.</p><h3>1. Go Beyond Crunches</h3><p>Traditional crunches only target your rectus abdominis. Include planks, dead bugs, and pallof presses for full-core development.</p><h3>2. Train Anti-Rotation</h3><p>Your core's primary job is to resist movement, not create it. Exercises like the pallof press and single-arm carries build this critical capacity.</p><h3>3. Brace, Don't Suck In</h3><p>360-degree bracing — breathing out against internal pressure — protects your spine far better than drawing your belly button in.</p><h3>4. Add Loaded Carries</h3><p>Farmer's carries and suitcase carries challenge your core in the way it was designed to work: stabilizing under load while moving.</p><h3>5. Be Consistent</h3><p>Core strength responds to frequency. Three focused sessions per week beats one marathon session every time.</p>`,
        excerpt: 'Build real functional core strength with these five evidence-based tips from our coaching team.',
        category: 'Training',
        tags: ['core', 'strength', 'tips'],
        status: ArticleStatus.PUBLISHED,
        isFeatured: true,
        publishedAt: daysFromNow(-14),
        authorId: adminStaff?.staff.id,
      },
    }),
    prisma.article.create({
      data: {
        tenantId: tenant.id,
        title: 'Nutrition for Recovery: What to Eat After a Hard Session',
        slug: 'nutrition-for-recovery',
        body: `<h2>The Recovery Window</h2><p>The 30–60 minutes after an intense workout are when your muscles are most primed to absorb nutrients. Getting this right can meaningfully speed up your recovery.</p><h3>Prioritise Protein</h3><p>Aim for 20–40g of high-quality protein within an hour of training. Chicken, eggs, Greek yoghurt, or a quality whey shake all work well.</p><h3>Replenish Carbohydrates</h3><p>Don't fear carbs post-workout. Your muscles need glycogen to recover. Rice, sweet potato, or fruit are all great options.</p><h3>Hydrate Properly</h3><p>For every kilogram of body weight lost during training, drink approximately 1.5 litres of fluid to restore hydration.</p><h3>Don't Forget Sleep</h3><p>The most powerful recovery tool isn't a supplement — it's 7–9 hours of quality sleep. Prioritise it like a training session.</p>`,
        excerpt: 'What you eat after training matters. Learn how to fuel recovery with the right nutrition strategies.',
        category: 'Nutrition',
        tags: ['nutrition', 'recovery', 'performance'],
        status: ArticleStatus.PUBLISHED,
        isFeatured: false,
        publishedAt: daysFromNow(-7),
        authorId: adminStaff?.staff.id,
      },
    }),
    prisma.article.create({
      data: {
        tenantId: tenant.id,
        title: 'Beginner\'s Guide to HIIT',
        slug: 'beginners-guide-to-hiit',
        body: `<h2>What is HIIT?</h2><p>High-Intensity Interval Training alternates short bursts of maximum effort with brief recovery periods. A typical session lasts 20–45 minutes but delivers cardiovascular benefits comparable to much longer steady-state exercise.</p><p>If you're new to HIIT, start with a 1:2 work-to-rest ratio — 20 seconds of effort followed by 40 seconds of rest. As your fitness improves, you can move to 1:1 and eventually 2:1.</p>`,
        excerpt: 'Everything you need to know to get started with high-intensity interval training safely and effectively.',
        category: 'Training',
        tags: ['hiit', 'beginners', 'cardio'],
        status: ArticleStatus.DRAFT,
        authorId: adminStaff?.staff.id,
      },
    }),
  ]);
  console.log(`✅ Articles: 3 created (2 published, 1 draft)`);

  // ============================================================
  // DONE
  // ============================================================
  console.log(`
╔══════════════════════════════════════════════════╗
║        ✅ Database seeded successfully!          ║
╠══════════════════════════════════════════════════╣
║  Studio slug:  iron-oak                          ║
║                                                  ║
║  Login credentials (all use Demo1234!):          ║
║                                                  ║
║  Owner:        owner@iron-oak.com                ║
║  Admin:        admin@iron-oak.com                ║
║  Instructor:   jake@iron-oak.com                 ║
║  Front Desk:   tom@iron-oak.com                  ║
║                                                  ║
║  Member login: emma@example.com                  ║
╚══════════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
