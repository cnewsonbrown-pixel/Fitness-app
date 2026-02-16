import { prisma } from '../config/database.js';
import { PointTransactionType, BadgeEarnType } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export class GamificationService {
  // ===== POINTS =====

  async awardPoints(input: {
    memberId: string;
    points: number;
    type: PointTransactionType;
    description: string;
    referenceId?: string;
  }) {
    const [transaction] = await prisma.$transaction([
      prisma.pointTransaction.create({ data: input }),
      prisma.member.update({
        where: { id: input.memberId },
        data: { totalPoints: { increment: input.points } },
      }),
    ]);

    // Check for automatic badge awarding
    await this.checkAutomaticBadges(input.memberId);

    return transaction;
  }

  async deductPoints(memberId: string, points: number, description: string) {
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundError('Member not found');
    if (member.totalPoints < points) throw new BadRequestError('Insufficient points');

    return this.awardPoints({
      memberId,
      points: -points,
      type: PointTransactionType.REDEMPTION,
      description,
    });
  }

  async getPointsHistory(memberId: string, limit = 50) {
    return prisma.pointTransaction.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getPointsLeaderboard(tenantId: string, limit = 20) {
    return prisma.member.findMany({
      where: { tenantId },
      select: {
        id: true,
        totalPoints: true,
        currentStreak: true,
        user: { select: { firstName: true, lastName: true, profileImageUrl: true } },
      },
      orderBy: { totalPoints: 'desc' },
      take: limit,
    });
  }

  // ===== BADGES =====

  async createBadge(input: {
    tenantId: string;
    name: string;
    description: string;
    imageUrl: string;
    earnType?: BadgeEarnType;
    automaticCriteria?: any;
  }) {
    return prisma.badge.create({ data: input });
  }

  async listBadges(tenantId: string) {
    return prisma.badge.findMany({
      where: { tenantId },
      include: { _count: { select: { memberBadges: true } } },
    });
  }

  async awardBadge(memberId: string, badgeId: string) {
    return prisma.memberBadge.upsert({
      where: { memberId_badgeId: { memberId, badgeId } },
      update: {},
      create: { memberId, badgeId },
    });
  }

  async getMemberBadges(memberId: string) {
    return prisma.memberBadge.findMany({
      where: { memberId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  private async checkAutomaticBadges(memberId: string) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { badges: { select: { badgeId: true } } },
    });
    if (!member) return;

    const badges = await prisma.badge.findMany({
      where: { tenantId: member.tenantId, earnType: BadgeEarnType.AUTOMATIC },
    });

    const earnedBadgeIds = new Set(member.badges.map((b) => b.badgeId));

    for (const badge of badges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const criteria = badge.automaticCriteria as any;
      if (!criteria) continue;

      let earned = false;

      if (criteria.minPoints && member.totalPoints >= criteria.minPoints) earned = true;
      if (criteria.minStreak && member.currentStreak >= criteria.minStreak) earned = true;
      if (criteria.minCheckIns) {
        const checkIns = await prisma.booking.count({
          where: { memberId, status: 'CHECKED_IN' },
        });
        if (checkIns >= criteria.minCheckIns) earned = true;
      }

      if (earned) {
        await this.awardBadge(memberId, badge.id);
      }
    }
  }

  // ===== CHALLENGES =====

  async createChallenge(input: {
    tenantId: string;
    name: string;
    description?: string;
    type?: 'INDIVIDUAL' | 'TEAM';
    goalType: string;
    goalTarget: number;
    pointsReward?: number;
    badgeId?: string;
    startsAt: Date;
    endsAt: Date;
  }) {
    return prisma.challenge.create({ data: input });
  }

  async listChallenges(tenantId: string, activeOnly = false) {
    const where: any = { tenantId };
    if (activeOnly) {
      const now = new Date();
      where.isActive = true;
      where.startsAt = { lte: now };
      where.endsAt = { gte: now };
    }
    return prisma.challenge.findMany({
      where,
      include: { _count: { select: { participants: true } } },
      orderBy: { startsAt: 'desc' },
    });
  }

  async joinChallenge(challengeId: string, memberId: string) {
    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge || !challenge.isActive) throw new BadRequestError('Challenge not active');
    if (new Date() > challenge.endsAt) throw new BadRequestError('Challenge has ended');

    return prisma.challengeParticipant.upsert({
      where: { challengeId_memberId: { challengeId, memberId } },
      update: {},
      create: { challengeId, memberId },
    });
  }

  async updateProgress(challengeId: string, memberId: string, progress: number) {
    const participant = await prisma.challengeParticipant.findUnique({
      where: { challengeId_memberId: { challengeId, memberId } },
      include: { challenge: true },
    });

    if (!participant) throw new NotFoundError('Not participating in this challenge');
    if (participant.isCompleted) return participant;

    const newProgress = participant.progress + progress;
    const isCompleted = newProgress >= participant.challenge.goalTarget;

    const updated = await prisma.challengeParticipant.update({
      where: { id: participant.id },
      data: {
        progress: newProgress,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // Award rewards on completion
    if (isCompleted) {
      if (participant.challenge.pointsReward > 0) {
        await this.awardPoints({
          memberId,
          points: participant.challenge.pointsReward,
          type: PointTransactionType.CHALLENGE,
          description: `Completed challenge: ${participant.challenge.name}`,
          referenceId: challengeId,
        });
      }
      if (participant.challenge.badgeId) {
        await this.awardBadge(memberId, participant.challenge.badgeId);
      }
    }

    return updated;
  }

  async getChallengeLeaderboard(challengeId: string) {
    return prisma.challengeParticipant.findMany({
      where: { challengeId },
      include: {
        challenge: { select: { name: true, goalTarget: true } },
      },
      orderBy: [{ isCompleted: 'desc' }, { progress: 'desc' }],
    });
  }

  // ===== STREAKS =====

  async updateStreak(memberId: string) {
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) return;

    // Check if member checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckIn = await prisma.booking.count({
      where: { memberId, status: 'CHECKED_IN', checkedInAt: { gte: today, lt: tomorrow } },
    });

    if (todayCheckIn === 0) return;

    // Check if checked in yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayCheckIn = await prisma.booking.count({
      where: { memberId, status: 'CHECKED_IN', checkedInAt: { gte: yesterday, lt: today } },
    });

    let newStreak = member.currentStreak;
    if (yesterdayCheckIn > 0) {
      newStreak = member.currentStreak + 1;
    } else {
      newStreak = 1; // Reset streak
    }

    const longestStreak = Math.max(member.longestStreak, newStreak);

    await prisma.member.update({
      where: { id: memberId },
      data: { currentStreak: newStreak, longestStreak },
    });

    return { currentStreak: newStreak, longestStreak };
  }

  async getStreakLeaderboard(tenantId: string, limit = 20) {
    return prisma.member.findMany({
      where: { tenantId, currentStreak: { gt: 0 } },
      select: {
        id: true,
        currentStreak: true,
        longestStreak: true,
        user: { select: { firstName: true, lastName: true, profileImageUrl: true } },
      },
      orderBy: { currentStreak: 'desc' },
      take: limit,
    });
  }
}

export const gamificationService = new GamificationService();
