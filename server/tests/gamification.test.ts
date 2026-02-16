import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { prisma } from '../src/config/database.js';
import { TestContext, generateAccessToken } from './helpers.js';

describe('Gamification API', () => {
  const ctx = new TestContext();
  let adminToken: string;
  let memberToken: string;
  let tenantId: string;
  let memberId: string;
  let badgeId: string;
  let challengeId: string;

  beforeAll(async () => {
    const tenant = await ctx.createTenant({ tier: 'PREMIUM' });
    tenantId = tenant.id;

    const adminUser = await ctx.createUser({ email: `admin-${Date.now()}@test.com` });
    await ctx.createStaff(tenantId, adminUser.id, { role: 'ADMIN' });
    adminToken = generateAccessToken(adminUser.id, tenantId);

    const memberUser = await ctx.createUser({ email: `member-${Date.now()}@test.com` });
    const member = await ctx.createMember(tenantId, memberUser.id, { lifecycleStage: 'ACTIVE' });
    memberId = member.id;
    memberToken = generateAccessToken(memberUser.id, tenantId);
  });

  afterAll(async () => {
    // Clean up gamification data
    await prisma.challengeParticipant.deleteMany({ where: { challenge: { tenantId } } });
    await prisma.challenge.deleteMany({ where: { tenantId } });
    await prisma.memberBadge.deleteMany({ where: { badge: { tenantId } } });
    await prisma.badge.deleteMany({ where: { tenantId } });
    await prisma.pointTransaction.deleteMany({ where: { tenantId } });
    await ctx.cleanup();
  });

  describe('Points System', () => {
    describe('POST /api/v1/gamification/points/award', () => {
      it('should award points to a member', async () => {
        const response = await request(app)
          .post('/api/v1/gamification/points/award')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            memberId,
            points: 100,
            reason: 'First class attended',
            type: 'CLASS_ATTENDED',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.points).toBe(100);
      });
    });

    describe('GET /api/v1/gamification/points/leaderboard', () => {
      it('should return points leaderboard', async () => {
        const response = await request(app)
          .get('/api/v1/gamification/points/leaderboard')
          .set('Authorization', `Bearer ${memberToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('GET /api/v1/gamification/points/history/:memberId', () => {
      it('should return point transaction history', async () => {
        const response = await request(app)
          .get(`/api/v1/gamification/points/history/${memberId}`)
          .set('Authorization', `Bearer ${memberToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Badges', () => {
    describe('POST /api/v1/gamification/badges', () => {
      it('should create a new badge', async () => {
        const response = await request(app)
          .post('/api/v1/gamification/badges')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Early Bird',
            description: 'Attended 5 morning classes',
            icon: '🌅',
            earnType: 'AUTOMATIC',
            criteria: { classesAttended: 5, timeOfDay: 'morning' },
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Early Bird');
        badgeId = response.body.data.id;
      });
    });

    describe('GET /api/v1/gamification/badges', () => {
      it('should list all badges', async () => {
        const response = await request(app)
          .get('/api/v1/gamification/badges')
          .set('Authorization', `Bearer ${memberToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('POST /api/v1/gamification/badges/:id/award', () => {
      it('should manually award badge to member', async () => {
        const response = await request(app)
          .post(`/api/v1/gamification/badges/${badgeId}/award`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ memberId })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/v1/gamification/badges/member/:memberId', () => {
      it('should get member badges', async () => {
        const response = await request(app)
          .get(`/api/v1/gamification/badges/member/${memberId}`)
          .set('Authorization', `Bearer ${memberToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Challenges', () => {
    describe('POST /api/v1/gamification/challenges', () => {
      it('should create a new challenge', async () => {
        const startDate = new Date();
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const response = await request(app)
          .post('/api/v1/gamification/challenges')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: '30-Day Fitness Challenge',
            description: 'Attend 20 classes in 30 days',
            type: 'INDIVIDUAL',
            goal: 20,
            metric: 'classes_attended',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            pointsReward: 500,
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('30-Day Fitness Challenge');
        challengeId = response.body.data.id;
      });
    });

    describe('GET /api/v1/gamification/challenges', () => {
      it('should list all challenges', async () => {
        const response = await request(app)
          .get('/api/v1/gamification/challenges')
          .set('Authorization', `Bearer ${memberToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should filter active challenges', async () => {
        const response = await request(app)
          .get('/api/v1/gamification/challenges?activeOnly=true')
          .set('Authorization', `Bearer ${memberToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/v1/gamification/challenges/:id/join', () => {
      it('should allow member to join challenge', async () => {
        const response = await request(app)
          .post(`/api/v1/gamification/challenges/${challengeId}/join`)
          .set('Authorization', `Bearer ${memberToken}`)
          .send({ memberId })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/v1/gamification/challenges/:id/leaderboard', () => {
      it('should return challenge leaderboard', async () => {
        const response = await request(app)
          .get(`/api/v1/gamification/challenges/${challengeId}/leaderboard`)
          .set('Authorization', `Bearer ${memberToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });
  });

  describe('Streaks', () => {
    describe('POST /api/v1/gamification/streaks/checkin', () => {
      it('should record a streak check-in', async () => {
        const response = await request(app)
          .post('/api/v1/gamification/streaks/checkin')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({ memberId })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('currentStreak');
      });
    });

    describe('GET /api/v1/gamification/streaks/:memberId', () => {
      it('should return member streak data', async () => {
        const response = await request(app)
          .get(`/api/v1/gamification/streaks/${memberId}`)
          .set('Authorization', `Bearer ${memberToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('currentStreak');
        expect(response.body.data).toHaveProperty('longestStreak');
      });
    });
  });
});
