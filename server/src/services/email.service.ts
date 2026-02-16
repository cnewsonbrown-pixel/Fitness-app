import sgMail from '@sendgrid/mail';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';

sgMail.setApiKey(config.sendgrid.apiKey);

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  dynamicData?: Record<string, any>;
}

export interface CampaignEmailInput {
  tenantId: string;
  subject: string;
  html: string;
  text?: string;
  recipientMemberIds: string[];
}

export class EmailService {
  /**
   * Send a single email
   */
  async send(input: SendEmailInput): Promise<void> {
    const msg: sgMail.MailDataRequired = {
      to: input.to,
      from: {
        email: config.sendgrid.fromEmail,
        name: config.sendgrid.fromName,
      },
      subject: input.subject,
      html: input.html,
      text: input.text,
    };

    if (input.templateId) {
      msg.templateId = input.templateId;
      msg.dynamicTemplateData = input.dynamicData;
    }

    await sgMail.send(msg);
  }

  /**
   * Send a campaign to multiple recipients
   */
  async sendCampaign(input: CampaignEmailInput): Promise<{ sent: number; failed: number }> {
    const { tenantId, subject, html, text, recipientMemberIds } = input;

    const members = await prisma.member.findMany({
      where: {
        id: { in: recipientMemberIds },
        tenantId,
        marketingConsent: true,
      },
      include: { user: { select: { email: true, firstName: true } } },
    });

    let sent = 0;
    let failed = 0;

    // Send in batches of 100
    const batchSize = 100;
    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize);
      const messages = batch.map((member) => ({
        to: member.user.email,
        from: {
          email: config.sendgrid.fromEmail,
          name: config.sendgrid.fromName,
        },
        subject,
        html: html.replace('{{firstName}}', member.user.firstName),
        text: text?.replace('{{firstName}}', member.user.firstName),
      }));

      try {
        await sgMail.send(messages as any);
        sent += batch.length;
      } catch {
        failed += batch.length;
      }
    }

    return { sent, failed };
  }

  // ===== NOTIFICATION TEMPLATES =====

  async sendBookingConfirmation(input: {
    email: string;
    memberName: string;
    className: string;
    date: string;
    time: string;
    location: string;
  }) {
    await this.send({
      to: input.email,
      subject: `Booking Confirmed: ${input.className}`,
      html: `
        <h2>Booking Confirmed!</h2>
        <p>Hi ${input.memberName},</p>
        <p>Your spot in <strong>${input.className}</strong> has been confirmed.</p>
        <ul>
          <li><strong>Date:</strong> ${input.date}</li>
          <li><strong>Time:</strong> ${input.time}</li>
          <li><strong>Location:</strong> ${input.location}</li>
        </ul>
        <p>See you there!</p>
      `,
    });
  }

  async sendCancellationNotification(input: {
    email: string;
    memberName: string;
    className: string;
    date: string;
  }) {
    await this.send({
      to: input.email,
      subject: `Booking Cancelled: ${input.className}`,
      html: `
        <h2>Booking Cancelled</h2>
        <p>Hi ${input.memberName},</p>
        <p>Your booking for <strong>${input.className}</strong> on ${input.date} has been cancelled.</p>
      `,
    });
  }

  async sendClassReminder(input: {
    email: string;
    memberName: string;
    className: string;
    date: string;
    time: string;
    location: string;
  }) {
    await this.send({
      to: input.email,
      subject: `Reminder: ${input.className} tomorrow`,
      html: `
        <h2>Class Reminder</h2>
        <p>Hi ${input.memberName},</p>
        <p>Just a reminder that you have <strong>${input.className}</strong> coming up!</p>
        <ul>
          <li><strong>Date:</strong> ${input.date}</li>
          <li><strong>Time:</strong> ${input.time}</li>
          <li><strong>Location:</strong> ${input.location}</li>
        </ul>
      `,
    });
  }

  async sendPaymentReceipt(input: {
    email: string;
    memberName: string;
    amount: string;
    description: string;
    date: string;
  }) {
    await this.send({
      to: input.email,
      subject: `Payment Receipt - ${input.amount}`,
      html: `
        <h2>Payment Receipt</h2>
        <p>Hi ${input.memberName},</p>
        <p>We've received your payment.</p>
        <ul>
          <li><strong>Amount:</strong> ${input.amount}</li>
          <li><strong>Description:</strong> ${input.description}</li>
          <li><strong>Date:</strong> ${input.date}</li>
        </ul>
      `,
    });
  }

  async sendFailedPaymentAlert(input: {
    email: string;
    memberName: string;
    amount: string;
  }) {
    await this.send({
      to: input.email,
      subject: 'Payment Failed - Action Required',
      html: `
        <h2>Payment Failed</h2>
        <p>Hi ${input.memberName},</p>
        <p>We were unable to process your payment of <strong>${input.amount}</strong>.</p>
        <p>Please update your payment method to avoid any interruption to your membership.</p>
      `,
    });
  }

  async sendMembershipExpiryWarning(input: {
    email: string;
    memberName: string;
    membershipName: string;
    expiryDate: string;
  }) {
    await this.send({
      to: input.email,
      subject: `Your ${input.membershipName} is expiring soon`,
      html: `
        <h2>Membership Expiring Soon</h2>
        <p>Hi ${input.memberName},</p>
        <p>Your <strong>${input.membershipName}</strong> will expire on <strong>${input.expiryDate}</strong>.</p>
        <p>Renew now to keep your access!</p>
      `,
    });
  }

  async sendWaitlistPromotion(input: {
    email: string;
    memberName: string;
    className: string;
    date: string;
    time: string;
  }) {
    await this.send({
      to: input.email,
      subject: `Spot Available: ${input.className}`,
      html: `
        <h2>You're In!</h2>
        <p>Hi ${input.memberName},</p>
        <p>A spot opened up in <strong>${input.className}</strong> on ${input.date} at ${input.time}.</p>
        <p>You've been automatically booked from the waitlist!</p>
      `,
    });
  }
}

export const emailService = new EmailService();
