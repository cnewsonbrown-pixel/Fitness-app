import { prisma } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateLeadFormInput {
  tenantId: string;
  name: string;
  fields: any[]; // e.g., [{ name: 'email', type: 'email', required: true }, ...]
}

export interface SubmitLeadInput {
  leadFormId: string;
  data: Record<string, any>;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  source?: string;
}

export class LeadService {
  // ===== LEAD FORMS =====

  async createForm(input: CreateLeadFormInput) {
    const form = await prisma.leadForm.create({ data: input });

    // Generate embed code
    const embedCode = `<script src="${process.env.FRONTEND_URL || 'https://app.fitstudio.io'}/embed/form/${form.id}.js"></script>`;
    return prisma.leadForm.update({
      where: { id: form.id },
      data: { embedCode },
    });
  }

  async getForm(id: string, tenantId: string) {
    return prisma.leadForm.findFirst({ where: { id, tenantId } });
  }

  async listForms(tenantId: string) {
    return prisma.leadForm.findMany({
      where: { tenantId },
      include: { _count: { select: { submissions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateForm(id: string, tenantId: string, data: Partial<CreateLeadFormInput>) {
    const form = await prisma.leadForm.findFirst({ where: { id, tenantId } });
    if (!form) throw new NotFoundError('Lead form not found');
    return prisma.leadForm.update({ where: { id }, data });
  }

  async deleteForm(id: string, tenantId: string) {
    const form = await prisma.leadForm.findFirst({ where: { id, tenantId } });
    if (!form) throw new NotFoundError('Lead form not found');
    await prisma.leadForm.delete({ where: { id } });
  }

  // ===== LEAD SUBMISSIONS =====

  /**
   * Submit a lead form (public endpoint - no auth required)
   */
  async submit(input: SubmitLeadInput) {
    const form = await prisma.leadForm.findUnique({ where: { id: input.leadFormId } });
    if (!form || !form.isActive) throw new NotFoundError('Form not found or inactive');

    return prisma.leadSubmission.create({
      data: {
        leadFormId: input.leadFormId,
        data: input.data,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        source: input.source,
      },
    });
  }

  async listSubmissions(leadFormId: string, tenantId: string) {
    // Verify form belongs to tenant
    const form = await prisma.leadForm.findFirst({ where: { id: leadFormId, tenantId } });
    if (!form) throw new NotFoundError('Lead form not found');

    return prisma.leadSubmission.findMany({
      where: { leadFormId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Convert a lead submission into a member
   */
  async convertToMember(submissionId: string, tenantId: string) {
    const submission = await prisma.leadSubmission.findUnique({
      where: { id: submissionId },
      include: { leadForm: true },
    });

    if (!submission) throw new NotFoundError('Submission not found');
    if (submission.convertedToMemberId) {
      return { alreadyConverted: true, memberId: submission.convertedToMemberId };
    }

    // Create user + member in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if user with this email already exists
      let user = await tx.user.findUnique({ where: { email: submission.email } });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: submission.email,
            firstName: submission.firstName || 'Unknown',
            lastName: submission.lastName || '',
            tenantId,
          },
        });
      }

      // Check if member already exists
      let member = await tx.member.findUnique({ where: { userId: user.id } });

      if (!member) {
        member = await tx.member.create({
          data: {
            tenantId,
            userId: user.id,
            phone: submission.phone,
            lifecycleStage: 'TRIAL',
          },
        });
      }

      // Mark submission as converted
      await tx.leadSubmission.update({
        where: { id: submissionId },
        data: { convertedToMemberId: member.id, convertedAt: new Date() },
      });

      return member;
    });

    return { alreadyConverted: false, memberId: result.id };
  }
}

export const leadService = new LeadService();
