import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

const router = Router();

/**
 * Sandbox Environment Routes
 *
 * Provides a safe testing environment for API integrations.
 * All data is isolated and automatically cleaned up.
 */

// Sandbox API key prefix
const SANDBOX_PREFIX = 'sandbox_';

// Store for sandbox sessions (in production, use Redis)
const sandboxSessions = new Map<string, {
  tenantId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}>();

/**
 * Create a new sandbox session
 * Returns temporary credentials for testing
 */
router.post('/sessions', async (_req: Request, res: Response) => {
  try {
    const sessionId = `${SANDBOX_PREFIX}${uuidv4()}`;
    const email = `sandbox-${Date.now()}@test.fitstudio.io`;
    const password = uuidv4();

    // Create sandbox user
    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Sandbox',
        lastName: 'User',
      },
    });

    // Create sandbox tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: `Sandbox Studio ${Date.now()}`,
        slug: `sandbox-${Date.now()}`,
        timezone: 'UTC',
        ownerId: user.id,
      },
    });

    // Update user with tenant
    await prisma.user.update({
      where: { id: user.id },
      data: { tenantId: tenant.id },
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, tenantId: tenant.id },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, tenantId: tenant.id, type: 'refresh' },
      config.jwt.refreshSecret,
      { expiresIn: '24h' }
    );

    // Store session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    sandboxSessions.set(sessionId, {
      tenantId: tenant.id,
      userId: user.id,
      createdAt: new Date(),
      expiresAt,
    });

    // Create sample data
    await createSampleData(tenant.id, user.id);

    res.status(201).json({
      success: true,
      data: {
        sessionId,
        expiresAt: expiresAt.toISOString(),
        credentials: {
          email,
          password,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        instructions: {
          authentication: 'Use the access token in the Authorization header: Bearer <token>',
          apiBase: '/api/v1',
          documentation: '/api/docs',
          cleanup: `POST /api/v1/sandbox/sessions/${sessionId}/cleanup to delete all sandbox data`,
          expiration: 'Session and all data will be automatically deleted after 24 hours',
        },
      },
    });
  } catch (error) {
    console.error('Failed to create sandbox session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SANDBOX_CREATE_FAILED',
        message: 'Failed to create sandbox session',
      },
    });
  }
});

/**
 * Get sandbox session info
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const session = sandboxSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'SESSION_NOT_FOUND',
        message: 'Sandbox session not found or expired',
      },
    });
  }

  res.json({
    success: true,
    data: {
      sessionId,
      tenantId: session.tenantId,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      remainingTime: Math.max(0, session.expiresAt.getTime() - Date.now()),
    },
  });
});

/**
 * Cleanup sandbox session
 */
router.post('/sessions/:sessionId/cleanup', async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const session = sandboxSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'SESSION_NOT_FOUND',
        message: 'Sandbox session not found or already cleaned up',
      },
    });
  }

  try {
    await cleanupSandboxData(session.tenantId, session.userId);
    sandboxSessions.delete(sessionId);

    res.json({
      success: true,
      data: {
        message: 'Sandbox session and all data cleaned up successfully',
      },
    });
  } catch (error) {
    console.error('Failed to cleanup sandbox:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CLEANUP_FAILED',
        message: 'Failed to cleanup sandbox data',
      },
    });
  }
});

/**
 * Reset sandbox data to initial state
 */
router.post('/sessions/:sessionId/reset', async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const session = sandboxSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'SESSION_NOT_FOUND',
        message: 'Sandbox session not found',
      },
    });
  }

  try {
    // Delete existing data except tenant and user
    await prisma.booking.deleteMany({ where: { member: { tenantId: session.tenantId } } });
    await prisma.classSession.deleteMany({ where: { tenantId: session.tenantId } });
    await prisma.classType.deleteMany({ where: { tenantId: session.tenantId } });
    await prisma.memberMembership.deleteMany({ where: { member: { tenantId: session.tenantId } } });
    await prisma.membershipType.deleteMany({ where: { tenantId: session.tenantId } });
    await prisma.member.deleteMany({ where: { tenantId: session.tenantId } });
    await prisma.staffLocation.deleteMany({ where: { staff: { tenantId: session.tenantId } } });
    await prisma.staff.deleteMany({ where: { tenantId: session.tenantId } });
    await prisma.location.deleteMany({ where: { tenantId: session.tenantId } });

    // Recreate sample data
    await createSampleData(session.tenantId, session.userId);

    res.json({
      success: true,
      data: {
        message: 'Sandbox data reset to initial state',
      },
    });
  } catch (error) {
    console.error('Failed to reset sandbox:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RESET_FAILED',
        message: 'Failed to reset sandbox data',
      },
    });
  }
});

/**
 * List all available sandbox endpoints
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'FitStudio Sandbox Environment',
      description: 'A safe testing environment for API integrations',
      endpoints: {
        createSession: {
          method: 'POST',
          path: '/api/v1/sandbox/sessions',
          description: 'Create a new sandbox session with test credentials',
        },
        getSession: {
          method: 'GET',
          path: '/api/v1/sandbox/sessions/:sessionId',
          description: 'Get information about a sandbox session',
        },
        resetSession: {
          method: 'POST',
          path: '/api/v1/sandbox/sessions/:sessionId/reset',
          description: 'Reset sandbox data to initial state',
        },
        cleanupSession: {
          method: 'POST',
          path: '/api/v1/sandbox/sessions/:sessionId/cleanup',
          description: 'Delete sandbox session and all associated data',
        },
      },
      features: [
        'Isolated test environment',
        'Pre-populated sample data',
        'Automatic cleanup after 24 hours',
        'Full API access',
        'No impact on production data',
      ],
      limitations: [
        'Sessions expire after 24 hours',
        'Stripe webhooks are simulated (no real charges)',
        'Email and SMS notifications are not sent',
        'Limited to test data only',
      ],
    },
  });
});

// Helper function to create sample data
async function createSampleData(tenantId: string, userId: string) {
  // Create location
  const location = await prisma.location.create({
    data: {
      tenantId,
      name: 'Downtown Studio',
      address: '123 Fitness Ave',
      city: 'San Francisco',
      country: 'US',
      timezone: 'America/Los_Angeles',
      isActive: true,
    },
  });

  // Create class types
  const yogaClass = await prisma.classType.create({
    data: {
      tenantId,
      name: 'Yoga Flow',
      description: 'A dynamic yoga practice',
      duration: 60,
      color: '#22c55e',
    },
  });

  const hiitClass = await prisma.classType.create({
    data: {
      tenantId,
      name: 'HIIT Training',
      description: 'High intensity interval training',
      duration: 45,
      color: '#ef4444',
    },
  });

  const spinClass = await prisma.classType.create({
    data: {
      tenantId,
      name: 'Spin Class',
      description: 'Indoor cycling workout',
      duration: 50,
      color: '#6366f1',
    },
  });

  // Create membership types
  await prisma.membershipType.create({
    data: {
      tenantId,
      name: 'Unlimited Monthly',
      type: 'RECURRING',
      price: 9900,
      billingPeriod: 'MONTHLY',
      description: 'Unlimited classes per month',
      isActive: true,
    },
  });

  await prisma.membershipType.create({
    data: {
      tenantId,
      name: '10-Class Pack',
      type: 'CLASS_PACK',
      price: 15000,
      classCredits: 10,
      description: 'Pack of 10 classes',
      isActive: true,
    },
  });

  await prisma.membershipType.create({
    data: {
      tenantId,
      name: 'Drop-In',
      type: 'DROP_IN',
      price: 2500,
      description: 'Single class pass',
      isActive: true,
    },
  });

  // Create staff (instructor)
  const instructorUser = await prisma.user.create({
    data: {
      email: `instructor-${Date.now()}@sandbox.fitstudio.io`,
      passwordHash: await bcrypt.hash('sandbox123', config.bcrypt.saltRounds),
      firstName: 'Sarah',
      lastName: 'Johnson',
      tenantId,
    },
  });

  const instructor = await prisma.staff.create({
    data: {
      tenantId,
      userId: instructorUser.id,
      role: 'INSTRUCTOR',
      isInstructor: true,
      payRate: 50,
      payType: 'PER_CLASS',
    },
  });

  await prisma.staffLocation.create({
    data: {
      staffId: instructor.id,
      locationId: location.id,
    },
  });

  // Create class sessions for the next 7 days
  const now = new Date();
  for (let day = 0; day < 7; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);

    // Morning yoga
    const yogaStart = new Date(date);
    yogaStart.setHours(9, 0, 0, 0);
    const yogaEnd = new Date(yogaStart);
    yogaEnd.setMinutes(yogaEnd.getMinutes() + 60);

    await prisma.classSession.create({
      data: {
        tenantId,
        classTypeId: yogaClass.id,
        locationId: location.id,
        instructorId: instructor.id,
        startTime: yogaStart,
        endTime: yogaEnd,
        capacity: 20,
      },
    });

    // Afternoon HIIT
    const hiitStart = new Date(date);
    hiitStart.setHours(12, 0, 0, 0);
    const hiitEnd = new Date(hiitStart);
    hiitEnd.setMinutes(hiitEnd.getMinutes() + 45);

    await prisma.classSession.create({
      data: {
        tenantId,
        classTypeId: hiitClass.id,
        locationId: location.id,
        instructorId: instructor.id,
        startTime: hiitStart,
        endTime: hiitEnd,
        capacity: 15,
      },
    });

    // Evening spin
    const spinStart = new Date(date);
    spinStart.setHours(18, 0, 0, 0);
    const spinEnd = new Date(spinStart);
    spinEnd.setMinutes(spinEnd.getMinutes() + 50);

    await prisma.classSession.create({
      data: {
        tenantId,
        classTypeId: spinClass.id,
        locationId: location.id,
        instructorId: instructor.id,
        startTime: spinStart,
        endTime: spinEnd,
        capacity: 25,
      },
    });
  }

  // Create sample members
  for (let i = 1; i <= 5; i++) {
    const memberUser = await prisma.user.create({
      data: {
        email: `member${i}-${Date.now()}@sandbox.fitstudio.io`,
        passwordHash: await bcrypt.hash('sandbox123', config.bcrypt.saltRounds),
        firstName: `Member`,
        lastName: `${i}`,
        tenantId,
      },
    });

    await prisma.member.create({
      data: {
        tenantId,
        userId: memberUser.id,
        email: memberUser.email,
        firstName: memberUser.firstName,
        lastName: memberUser.lastName,
        lifecycleStage: 'ACTIVE',
        pointBalance: Math.floor(Math.random() * 500),
        currentStreak: Math.floor(Math.random() * 14),
      },
    });
  }
}

// Helper function to cleanup sandbox data
async function cleanupSandboxData(tenantId: string, userId: string) {
  // Delete in order of dependencies
  await prisma.booking.deleteMany({ where: { member: { tenantId } } });
  await prisma.classSession.deleteMany({ where: { tenantId } });
  await prisma.classType.deleteMany({ where: { tenantId } });
  await prisma.memberMembership.deleteMany({ where: { member: { tenantId } } });
  await prisma.membershipType.deleteMany({ where: { tenantId } });
  await prisma.member.deleteMany({ where: { tenantId } });
  await prisma.staffLocation.deleteMany({ where: { staff: { tenantId } } });
  await prisma.staff.deleteMany({ where: { tenantId } });
  await prisma.location.deleteMany({ where: { tenantId } });
  await prisma.user.deleteMany({ where: { tenantId } });
  await prisma.tenant.delete({ where: { id: tenantId } });
  await prisma.user.delete({ where: { id: userId } });
}

// Cleanup expired sessions periodically
setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of sandboxSessions.entries()) {
    if (session.expiresAt < now) {
      cleanupSandboxData(session.tenantId, session.userId)
        .then(() => sandboxSessions.delete(sessionId))
        .catch((error) => console.error(`Failed to cleanup expired sandbox ${sessionId}:`, error));
    }
  }
}, 60 * 60 * 1000); // Check every hour

export default router;
