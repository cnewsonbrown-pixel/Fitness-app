import { prisma } from '../config/database.js';
import { emailService } from './email.service.js';
import { smsService } from './sms.service.js';

export class NotificationService {
  /**
   * Send booking confirmation via email (and SMS if opted in)
   */
  async bookingConfirmed(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        member: {
          include: { user: { select: { email: true, firstName: true, lastName: true } } },
        },
        classSession: {
          include: {
            classType: { select: { name: true } },
            location: { select: { name: true } },
          },
        },
      },
    });

    if (!booking) return;

    const date = booking.classSession.startTime.toLocaleDateString();
    const time = booking.classSession.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    await emailService.sendBookingConfirmation({
      email: booking.member.user.email,
      memberName: booking.member.user.firstName,
      className: booking.classSession.classType.name,
      date,
      time,
      location: booking.classSession.location.name,
    });

    if (booking.member.smsConsent && booking.member.phone) {
      await smsService.sendBookingConfirmation(
        booking.member.phone,
        booking.classSession.classType.name,
        date,
        time
      );
    }
  }

  /**
   * Send booking cancellation notification
   */
  async bookingCancelled(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        member: {
          include: { user: { select: { email: true, firstName: true } } },
        },
        classSession: {
          include: { classType: { select: { name: true } } },
        },
      },
    });

    if (!booking) return;

    await emailService.sendCancellationNotification({
      email: booking.member.user.email,
      memberName: booking.member.user.firstName,
      className: booking.classSession.classType.name,
      date: booking.classSession.startTime.toLocaleDateString(),
    });
  }

  /**
   * Send waitlist promotion notification
   */
  async waitlistPromoted(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        member: {
          include: { user: { select: { email: true, firstName: true } } },
        },
        classSession: {
          include: { classType: { select: { name: true } } },
        },
      },
    });

    if (!booking) return;

    const date = booking.classSession.startTime.toLocaleDateString();
    const time = booking.classSession.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    await emailService.sendWaitlistPromotion({
      email: booking.member.user.email,
      memberName: booking.member.user.firstName,
      className: booking.classSession.classType.name,
      date,
      time,
    });

    if (booking.member.smsConsent && booking.member.phone) {
      await smsService.sendWaitlistPromotion(
        booking.member.phone,
        booking.classSession.classType.name,
        date,
        time
      );
    }
  }

  /**
   * Send payment receipt
   */
  async paymentReceived(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        member: {
          include: { user: { select: { email: true, firstName: true } } },
        },
      },
    });

    if (!payment) return;

    await emailService.sendPaymentReceipt({
      email: payment.member.user.email,
      memberName: payment.member.user.firstName,
      amount: `$${Number(payment.amount).toFixed(2)}`,
      description: payment.description || 'Payment',
      date: payment.paidAt?.toLocaleDateString() || new Date().toLocaleDateString(),
    });
  }

  /**
   * Send failed payment alert
   */
  async paymentFailed(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        member: {
          include: { user: { select: { email: true, firstName: true } } },
        },
      },
    });

    if (!payment) return;

    await emailService.sendFailedPaymentAlert({
      email: payment.member.user.email,
      memberName: payment.member.user.firstName,
      amount: `$${Number(payment.amount).toFixed(2)}`,
    });

    if (payment.member.smsConsent && payment.member.phone) {
      await smsService.sendPaymentFailed(payment.member.phone, payment.member.user.firstName);
    }
  }

  /**
   * Send class reminders for tomorrow's classes
   * (Intended to be called by a scheduled job)
   */
  async sendClassReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const bookings = await prisma.booking.findMany({
      where: {
        status: 'BOOKED',
        classSession: {
          startTime: { gte: tomorrow, lt: dayAfter },
          status: 'SCHEDULED',
        },
      },
      include: {
        member: {
          include: { user: { select: { email: true, firstName: true } } },
        },
        classSession: {
          include: {
            classType: { select: { name: true } },
            location: { select: { name: true } },
          },
        },
      },
    });

    for (const booking of bookings) {
      const date = booking.classSession.startTime.toLocaleDateString();
      const time = booking.classSession.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      try {
        await emailService.sendClassReminder({
          email: booking.member.user.email,
          memberName: booking.member.user.firstName,
          className: booking.classSession.classType.name,
          date,
          time,
          location: booking.classSession.location.name,
        });

        if (booking.member.smsConsent && booking.member.phone) {
          await smsService.sendClassReminder(
            booking.member.phone,
            booking.classSession.classType.name,
            time
          );
        }
      } catch {
        // Log but don't fail on individual notification errors
        console.error(`Failed to send reminder for booking ${booking.id}`);
      }
    }

    return { remindersSet: bookings.length };
  }

  /**
   * Send membership expiry warnings (7 days before)
   * (Intended to be called by a scheduled job)
   */
  async sendExpiryWarnings() {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 7);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiring = await prisma.memberMembership.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: { gte: today, lte: warningDate },
        stripeSubscriptionId: null, // Only non-auto-renewing
      },
      include: {
        member: {
          include: { user: { select: { email: true, firstName: true } } },
        },
        membershipType: { select: { name: true } },
      },
    });

    for (const membership of expiring) {
      try {
        await emailService.sendMembershipExpiryWarning({
          email: membership.member.user.email,
          memberName: membership.member.user.firstName,
          membershipName: membership.membershipType.name,
          expiryDate: membership.currentPeriodEnd.toLocaleDateString(),
        });
      } catch {
        console.error(`Failed to send expiry warning for membership ${membership.id}`);
      }
    }

    return { warningsSent: expiring.length };
  }
}

export const notificationService = new NotificationService();
