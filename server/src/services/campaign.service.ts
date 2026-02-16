import { prisma } from '../config/database.js';
import { CampaignChannel, CampaignStatus, CampaignType, Prisma } from '@prisma/client';
import { emailService } from './email.service.js';
import { smsService } from './sms.service.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export interface CreateCampaignInput {
  tenantId: string;
  name: string;
  type: CampaignType;
  channel: CampaignChannel;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  smsContent?: string;
  segmentCriteria?: any;
  scheduledAt?: Date;
}

export class CampaignService {
  async create(input: CreateCampaignInput) {
    return prisma.campaign.create({ data: input });
  }

  async getById(id: string, tenantId: string) {
    return prisma.campaign.findFirst({ where: { id, tenantId } });
  }

  async list(tenantId: string, status?: CampaignStatus) {
    return prisma.campaign.findMany({
      where: { tenantId, ...(status && { status }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, tenantId: string, data: Partial<CreateCampaignInput>) {
    const campaign = await prisma.campaign.findFirst({ where: { id, tenantId } });
    if (!campaign) throw new NotFoundError('Campaign not found');
    if (campaign.status === CampaignStatus.SENT) {
      throw new BadRequestError('Cannot edit a sent campaign');
    }
    return prisma.campaign.update({ where: { id }, data });
  }

  async delete(id: string, tenantId: string) {
    const campaign = await prisma.campaign.findFirst({ where: { id, tenantId } });
    if (!campaign) throw new NotFoundError('Campaign not found');
    if (campaign.status === CampaignStatus.SENDING) {
      throw new BadRequestError('Cannot delete a campaign that is currently sending');
    }
    await prisma.campaign.delete({ where: { id } });
  }

  /**
   * Send a campaign to its target audience
   */
  async send(id: string, tenantId: string) {
    const campaign = await prisma.campaign.findFirst({ where: { id, tenantId } });
    if (!campaign) throw new NotFoundError('Campaign not found');
    if (campaign.status === CampaignStatus.SENT) {
      throw new BadRequestError('Campaign already sent');
    }

    // Build recipient list from segment criteria
    const memberWhere: Prisma.MemberWhereInput = { tenantId };
    if (campaign.segmentCriteria) {
      const criteria = campaign.segmentCriteria as any;
      if (criteria.lifecycleStage) memberWhere.lifecycleStage = criteria.lifecycleStage;
      if (criteria.tags?.length) memberWhere.tags = { hasSome: criteria.tags };
    }

    const members = await prisma.member.findMany({
      where: memberWhere,
      include: { user: { select: { email: true, firstName: true } } },
    });

    await prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.SENDING, recipientCount: members.length },
    });

    let sent = 0;
    let failed = 0;

    const memberIds = members.map((m) => m.id);

    try {
      if (campaign.channel === CampaignChannel.EMAIL || campaign.channel === CampaignChannel.BOTH) {
        if (campaign.htmlContent) {
          const result = await emailService.sendCampaign({
            tenantId,
            subject: campaign.subject || campaign.name,
            html: campaign.htmlContent,
            text: campaign.textContent || undefined,
            recipientMemberIds: memberIds,
          });
          sent += result.sent;
          failed += result.failed;
        }
      }

      if (campaign.channel === CampaignChannel.SMS || campaign.channel === CampaignChannel.BOTH) {
        if (campaign.smsContent) {
          const result = await smsService.sendCampaign({
            tenantId,
            body: campaign.smsContent,
            recipientMemberIds: memberIds,
          });
          sent += result.sent;
          failed += result.failed;
        }
      }

      await prisma.campaign.update({
        where: { id },
        data: {
          status: CampaignStatus.SENT,
          sentCount: sent,
          failedCount: failed,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.campaign.update({
        where: { id },
        data: { status: CampaignStatus.FAILED },
      });
      throw error;
    }

    return { sent, failed, total: members.length };
  }
}

export const campaignService = new CampaignService();
