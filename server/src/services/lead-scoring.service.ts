import { prisma } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateScoringRuleInput {
  tenantId: string;
  name: string;
  event: string;
  points: number;
  isActive?: boolean;
}

export class LeadScoringService {
  // ===== SCORING RULES =====

  async createRule(input: CreateScoringRuleInput) {
    return prisma.leadScoringRule.create({ data: input });
  }

  async listRules(tenantId: string) {
    return prisma.leadScoringRule.findMany({
      where: { tenantId },
      orderBy: { event: 'asc' },
    });
  }

  async updateRule(id: string, tenantId: string, data: Partial<CreateScoringRuleInput>) {
    const rule = await prisma.leadScoringRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundError('Scoring rule not found');
    return prisma.leadScoringRule.update({ where: { id }, data });
  }

  async deleteRule(id: string, tenantId: string) {
    const rule = await prisma.leadScoringRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundError('Scoring rule not found');
    await prisma.leadScoringRule.delete({ where: { id } });
  }

  // ===== SCORING ENGINE =====

  /**
   * Process an event and update the member's lead score
   */
  async processEvent(tenantId: string, memberId: string, event: string) {
    const rules = await prisma.leadScoringRule.findMany({
      where: { tenantId, event, isActive: true },
    });

    if (rules.length === 0) return;

    const totalPoints = rules.reduce((sum, r) => sum + r.points, 0);

    await prisma.member.update({
      where: { id: memberId },
      data: { leadScore: { increment: totalPoints } },
    });

    return { event, pointsAwarded: totalPoints };
  }

  /**
   * Recalculate lead score for a member from scratch
   */
  async recalculateScore(memberId: string, tenantId: string) {
    const member = await prisma.member.findFirst({
      where: { id: memberId, tenantId },
      include: {
        bookings: { select: { status: true } },
        memberships: { select: { status: true } },
      },
    });

    if (!member) throw new NotFoundError('Member not found');

    const rules = await prisma.leadScoringRule.findMany({
      where: { tenantId, isActive: true },
    });

    let score = 0;
    const ruleMap = new Map(rules.map((r) => [r.event, r.points]));

    // Score based on bookings
    const bookingPoints = ruleMap.get('booking_created') || 0;
    score += member.bookings.length * bookingPoints;

    // Score based on check-ins
    const checkInPoints = ruleMap.get('check_in') || 0;
    const checkIns = member.bookings.filter((b) => b.status === 'CHECKED_IN').length;
    score += checkIns * checkInPoints;

    // Score for having active membership
    const membershipPoints = ruleMap.get('membership_active') || 0;
    const activeMemberships = member.memberships.filter((m) => m.status === 'ACTIVE').length;
    if (activeMemberships > 0) score += membershipPoints;

    await prisma.member.update({
      where: { id: memberId },
      data: { leadScore: Math.max(0, score) },
    });

    return { memberId, newScore: Math.max(0, score) };
  }

  /**
   * Get members ranked by lead score
   */
  async getLeaderboard(tenantId: string, limit = 50) {
    return prisma.member.findMany({
      where: { tenantId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
      orderBy: { leadScore: 'desc' },
      take: limit,
    });
  }
}

export const leadScoringService = new LeadScoringService();
