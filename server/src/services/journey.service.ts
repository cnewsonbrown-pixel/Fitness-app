import { prisma } from '../config/database.js';
import { JourneyTrigger, JourneyStepType, JourneyEnrollmentStatus } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { emailService } from './email.service.js';
import { smsService } from './sms.service.js';

export interface CreateJourneyInput {
  tenantId: string;
  name: string;
  description?: string;
  trigger: JourneyTrigger;
  triggerConfig?: any;
}

export interface CreateJourneyStepInput {
  journeyId: string;
  order: number;
  type: JourneyStepType;
  config: any;
  delayDays?: number;
  delayHours?: number;
}

export class JourneyService {
  // ===== JOURNEY CRUD =====

  async create(input: CreateJourneyInput) {
    return prisma.journey.create({ data: input });
  }

  async getById(id: string, tenantId: string) {
    return prisma.journey.findFirst({
      where: { id, tenantId },
      include: {
        steps: { orderBy: { order: 'asc' } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  async list(tenantId: string) {
    return prisma.journey.findMany({
      where: { tenantId },
      include: { _count: { select: { enrollments: true, steps: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, tenantId: string, data: Partial<CreateJourneyInput>) {
    const journey = await prisma.journey.findFirst({ where: { id, tenantId } });
    if (!journey) throw new NotFoundError('Journey not found');
    return prisma.journey.update({ where: { id }, data });
  }

  async activate(id: string, tenantId: string) {
    const journey = await prisma.journey.findFirst({
      where: { id, tenantId },
      include: { steps: true },
    });
    if (!journey) throw new NotFoundError('Journey not found');
    if (journey.steps.length === 0) throw new BadRequestError('Journey must have at least one step');
    return prisma.journey.update({ where: { id }, data: { isActive: true } });
  }

  async deactivate(id: string, tenantId: string) {
    const journey = await prisma.journey.findFirst({ where: { id, tenantId } });
    if (!journey) throw new NotFoundError('Journey not found');
    return prisma.journey.update({ where: { id }, data: { isActive: false } });
  }

  async delete(id: string, tenantId: string) {
    const journey = await prisma.journey.findFirst({ where: { id, tenantId } });
    if (!journey) throw new NotFoundError('Journey not found');
    await prisma.journey.delete({ where: { id } });
  }

  // ===== JOURNEY STEPS =====

  async addStep(input: CreateJourneyStepInput) {
    return prisma.journeyStep.create({ data: input });
  }

  async updateStep(id: string, journeyId: string, data: Partial<CreateJourneyStepInput>) {
    const step = await prisma.journeyStep.findFirst({ where: { id, journeyId } });
    if (!step) throw new NotFoundError('Journey step not found');
    return prisma.journeyStep.update({ where: { id }, data });
  }

  async removeStep(id: string, journeyId: string) {
    const step = await prisma.journeyStep.findFirst({ where: { id, journeyId } });
    if (!step) throw new NotFoundError('Journey step not found');
    await prisma.journeyStep.delete({ where: { id } });
  }

  async reorderSteps(journeyId: string, stepIds: string[]) {
    const updates = stepIds.map((id, index) =>
      prisma.journeyStep.update({ where: { id }, data: { order: index } })
    );
    await prisma.$transaction(updates);
  }

  // ===== ENROLLMENT =====

  async enrollMember(journeyId: string, memberId: string) {
    const journey = await prisma.journey.findUnique({
      where: { id: journeyId },
      include: { steps: { orderBy: { order: 'asc' }, take: 1 } },
    });
    if (!journey || !journey.isActive) throw new BadRequestError('Journey not active');

    const firstStep = journey.steps[0];
    const nextStepAt = new Date();
    if (firstStep) {
      nextStepAt.setDate(nextStepAt.getDate() + firstStep.delayDays);
      nextStepAt.setHours(nextStepAt.getHours() + firstStep.delayHours);
    }

    return prisma.journeyEnrollment.upsert({
      where: { journeyId_memberId: { journeyId, memberId } },
      update: {
        status: JourneyEnrollmentStatus.ACTIVE,
        currentStepOrder: 0,
        nextStepAt,
        completedAt: null,
        exitedAt: null,
      },
      create: {
        journeyId,
        memberId,
        currentStepOrder: 0,
        nextStepAt,
      },
    });
  }

  async exitMember(journeyId: string, memberId: string) {
    await prisma.journeyEnrollment.update({
      where: { journeyId_memberId: { journeyId, memberId } },
      data: {
        status: JourneyEnrollmentStatus.EXITED,
        exitedAt: new Date(),
      },
    });
  }

  /**
   * Process due journey steps (called by scheduled job)
   */
  async processDueSteps() {
    const now = new Date();

    const dueEnrollments = await prisma.journeyEnrollment.findMany({
      where: {
        status: JourneyEnrollmentStatus.ACTIVE,
        nextStepAt: { lte: now },
      },
      include: {
        journey: {
          include: { steps: { orderBy: { order: 'asc' } } },
        },
      },
      take: 100,
    });

    let processed = 0;

    for (const enrollment of dueEnrollments) {
      const currentStep = enrollment.journey.steps.find(
        (s) => s.order === enrollment.currentStepOrder
      );

      if (!currentStep) {
        // Journey complete
        await prisma.journeyEnrollment.update({
          where: { id: enrollment.id },
          data: {
            status: JourneyEnrollmentStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
        continue;
      }

      try {
        await this.executeStep(currentStep, enrollment.memberId);

        // Move to next step
        const nextStep = enrollment.journey.steps.find(
          (s) => s.order > enrollment.currentStepOrder
        );

        if (nextStep) {
          const nextStepAt = new Date();
          nextStepAt.setDate(nextStepAt.getDate() + nextStep.delayDays);
          nextStepAt.setHours(nextStepAt.getHours() + nextStep.delayHours);

          await prisma.journeyEnrollment.update({
            where: { id: enrollment.id },
            data: {
              currentStepOrder: nextStep.order,
              nextStepAt,
            },
          });
        } else {
          await prisma.journeyEnrollment.update({
            where: { id: enrollment.id },
            data: {
              status: JourneyEnrollmentStatus.COMPLETED,
              completedAt: new Date(),
            },
          });
        }

        processed++;
      } catch (error) {
        console.error(`Failed to execute journey step ${currentStep.id}:`, error);
      }
    }

    return { processed };
  }

  /**
   * Execute a single journey step
   */
  private async executeStep(step: any, memberId: string) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { user: { select: { email: true, firstName: true } } },
    });

    if (!member) return;

    const cfg = step.config as any;

    switch (step.type) {
      case JourneyStepType.SEND_EMAIL:
        await emailService.send({
          to: member.user.email,
          subject: cfg.subject || 'Message from your studio',
          html: (cfg.html || '').replace('{{firstName}}', member.user.firstName),
        });
        break;

      case JourneyStepType.SEND_SMS:
        if (member.phone && member.smsConsent) {
          await smsService.send({
            to: member.phone,
            body: (cfg.body || '').replace('{{firstName}}', member.user.firstName),
          });
        }
        break;

      case JourneyStepType.UPDATE_MEMBER:
        const updateData: any = {};
        if (cfg.lifecycleStage) updateData.lifecycleStage = cfg.lifecycleStage;
        if (cfg.addTags) updateData.tags = { push: cfg.addTags };
        if (Object.keys(updateData).length > 0) {
          await prisma.member.update({ where: { id: memberId }, data: updateData });
        }
        break;

      case JourneyStepType.WAIT:
        // Wait steps are handled by the delay mechanism
        break;

      case JourneyStepType.NOTIFY_STAFF:
        // Send notification to staff (simplified - email the tenant admin)
        console.log(`Staff notification for member ${memberId}: ${cfg.message}`);
        break;

      default:
        break;
    }
  }

  /**
   * Handle trigger events to auto-enroll members
   */
  async handleTrigger(tenantId: string, trigger: JourneyTrigger, context: any) {
    const journeys = await prisma.journey.findMany({
      where: { tenantId, trigger, isActive: true },
    });

    for (const journey of journeys) {
      const cfg = journey.triggerConfig as any;

      let memberId: string | null = null;

      switch (trigger) {
        case JourneyTrigger.LIFECYCLE_CHANGE:
          if (cfg?.lifecycleStage === context.lifecycleStage) {
            memberId = context.memberId;
          }
          break;

        case JourneyTrigger.EVENT:
          if (cfg?.event === context.event) {
            memberId = context.memberId;
          }
          break;

        default:
          break;
      }

      if (memberId) {
        try {
          await this.enrollMember(journey.id, memberId);
        } catch {
          // Already enrolled or journey inactive
        }
      }
    }
  }
}

export const journeyService = new JourneyService();
