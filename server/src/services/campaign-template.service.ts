import { prisma } from '../config/database.js';
import { TemplateCategory, CampaignChannel } from '@prisma/client';
import { NotFoundError } from '../utils/errors.js';

export interface CreateTemplateInput {
  tenantId?: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  channel: CampaignChannel;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  smsContent?: string;
}

export class CampaignTemplateService {
  async create(input: CreateTemplateInput) {
    return prisma.campaignTemplate.create({ data: input });
  }

  async getById(id: string, tenantId: string) {
    return prisma.campaignTemplate.findFirst({
      where: { id, OR: [{ tenantId }, { tenantId: null }] },
    });
  }

  async list(tenantId: string, category?: TemplateCategory) {
    return prisma.campaignTemplate.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: null }],
        ...(category && { category }),
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  async update(id: string, tenantId: string, data: Partial<CreateTemplateInput>) {
    const template = await prisma.campaignTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!template) throw new NotFoundError('Template not found');
    if (template.isSystem) throw new NotFoundError('Cannot edit system templates');
    return prisma.campaignTemplate.update({ where: { id }, data });
  }

  async delete(id: string, tenantId: string) {
    const template = await prisma.campaignTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!template) throw new NotFoundError('Template not found');
    if (template.isSystem) throw new NotFoundError('Cannot delete system templates');
    await prisma.campaignTemplate.delete({ where: { id } });
  }

  /**
   * Seed system templates (called during setup)
   */
  async seedSystemTemplates() {
    const templates: CreateTemplateInput[] = [
      {
        name: 'Welcome Email',
        category: TemplateCategory.ONBOARDING,
        channel: CampaignChannel.EMAIL,
        description: 'Welcome new members to the studio',
        subject: 'Welcome to {{studioName}}!',
        htmlContent: '<h2>Welcome, {{firstName}}!</h2><p>We\'re thrilled to have you join our community.</p>',
      },
      {
        name: 'Class Reminder',
        category: TemplateCategory.REMINDER,
        channel: CampaignChannel.BOTH,
        description: 'Remind members about upcoming classes',
        subject: 'Your class is coming up!',
        htmlContent: '<h2>Don\'t forget!</h2><p>Hi {{firstName}}, your class is tomorrow.</p>',
        smsContent: 'Hi {{firstName}}! Reminder: your class is tomorrow. See you there!',
      },
      {
        name: 'We Miss You',
        category: TemplateCategory.WIN_BACK,
        channel: CampaignChannel.EMAIL,
        description: 'Re-engage inactive members',
        subject: 'We miss you, {{firstName}}!',
        htmlContent: '<h2>We miss you!</h2><p>Hi {{firstName}}, it\'s been a while since your last visit. Come back and try something new!</p>',
      },
      {
        name: 'New Class Announcement',
        category: TemplateCategory.ANNOUNCEMENT,
        channel: CampaignChannel.EMAIL,
        description: 'Announce new class types or schedules',
        subject: 'New classes just dropped!',
        htmlContent: '<h2>Exciting News!</h2><p>We\'ve added new classes to our schedule. Check them out!</p>',
      },
      {
        name: 'Special Offer',
        category: TemplateCategory.PROMOTION,
        channel: CampaignChannel.BOTH,
        description: 'Promote special deals or discounts',
        subject: 'Special offer just for you!',
        htmlContent: '<h2>Limited Time Offer</h2><p>Hi {{firstName}}, we have a special deal waiting for you.</p>',
        smsContent: 'Hi {{firstName}}! We have a special offer for you. Check your email for details!',
      },
    ];

    for (const template of templates) {
      const existing = await prisma.campaignTemplate.findFirst({
        where: { name: template.name, isSystem: true },
      });
      if (!existing) {
        await prisma.campaignTemplate.create({
          data: { ...template, isSystem: true },
        });
      }
    }
  }
}

export const campaignTemplateService = new CampaignTemplateService();
