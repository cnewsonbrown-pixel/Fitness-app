import twilio from 'twilio';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

export interface SendSmsInput {
  to: string;
  body: string;
}

export interface CampaignSmsInput {
  tenantId: string;
  body: string;
  recipientMemberIds: string[];
}

export class SmsService {
  /**
   * Send a single SMS
   */
  async send(input: SendSmsInput): Promise<string> {
    const message = await client.messages.create({
      body: input.body,
      from: config.twilio.fromNumber,
      to: input.to,
    });

    return message.sid;
  }

  /**
   * Send SMS campaign to multiple recipients
   */
  async sendCampaign(input: CampaignSmsInput): Promise<{ sent: number; failed: number }> {
    const { tenantId, body, recipientMemberIds } = input;

    const members = await prisma.member.findMany({
      where: {
        id: { in: recipientMemberIds },
        tenantId,
        smsConsent: true,
        phone: { not: null },
      },
      include: { user: { select: { firstName: true } } },
    });

    let sent = 0;
    let failed = 0;

    for (const member of members) {
      try {
        const personalizedBody = body.replace('{{firstName}}', member.user.firstName);
        await this.send({ to: member.phone!, body: personalizedBody });
        sent++;
      } catch {
        failed++;
      }
    }

    return { sent, failed };
  }

  // ===== NOTIFICATION TEMPLATES =====

  async sendBookingConfirmation(phone: string, className: string, date: string, time: string) {
    await this.send({
      to: phone,
      body: `Booking confirmed: ${className} on ${date} at ${time}. See you there!`,
    });
  }

  async sendClassReminder(phone: string, className: string, time: string) {
    await this.send({
      to: phone,
      body: `Reminder: ${className} tomorrow at ${time}. Don't forget to check in!`,
    });
  }

  async sendWaitlistPromotion(phone: string, className: string, date: string, time: string) {
    await this.send({
      to: phone,
      body: `Spot available! You've been booked into ${className} on ${date} at ${time} from the waitlist.`,
    });
  }

  async sendPaymentFailed(phone: string, memberName: string) {
    await this.send({
      to: phone,
      body: `Hi ${memberName}, your payment failed. Please update your payment method to keep your membership active.`,
    });
  }
}

export const smsService = new SmsService();
