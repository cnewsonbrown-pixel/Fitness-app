import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { notificationsService } from '../services/notifications.service';
import { useAuthStore } from '../store/auth.store';

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Register for push notifications
    const registerPushNotifications = async () => {
      const token = await notificationsService.registerForPushNotifications();
      if (token) {
        setExpoPushToken(token);

        // Register with backend if authenticated
        if (isAuthenticated) {
          try {
            await notificationsService.registerTokenWithBackend(token);
          } catch (error) {
            console.error('Failed to register push token with backend:', error);
          }
        }
      }
    };

    registerPushNotifications();

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = notificationsService.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for notification interactions
    responseListener.current = notificationsService.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data;
        handleNotificationNavigation(data);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationsService.removeListener(notificationListener.current);
      }
      if (responseListener.current) {
        notificationsService.removeListener(responseListener.current);
      }
    };
  }, [isAuthenticated]);

  const handleNotificationNavigation = (data: Record<string, unknown>) => {
    if (!data) return;

    const { type, id } = data as { type?: string; id?: string };

    switch (type) {
      case 'booking':
      case 'class_reminder':
        if (id) {
          navigation.navigate('ClassDetails' as never, { classId: id } as never);
        }
        break;
      case 'booking_confirmation':
        if (id) {
          navigation.navigate('BookingConfirmation' as never, { bookingId: id } as never);
        }
        break;
      case 'article':
        if (id) {
          navigation.navigate('ArticleDetails' as never, { articleId: id } as never);
        }
        break;
      case 'challenge':
        if (id) {
          navigation.navigate('ChallengeDetails' as never, { challengeId: id } as never);
        }
        break;
      default:
        // Navigate to home for unknown types
        navigation.navigate('Main' as never);
    }
  };

  const scheduleClassReminder = async (
    classId: string,
    className: string,
    startTime: Date,
    minutesBefore: number = 60
  ) => {
    const reminderTime = new Date(startTime.getTime() - minutesBefore * 60 * 1000);

    if (reminderTime <= new Date()) {
      return null; // Don't schedule if reminder time has passed
    }

    return notificationsService.scheduleLocalNotification(
      'Class Reminder',
      `Your ${className} class starts in ${minutesBefore} minutes!`,
      { type: 'class_reminder', id: classId },
      { date: reminderTime }
    );
  };

  return {
    expoPushToken,
    notification,
    scheduleClassReminder,
    clearBadge: notificationsService.clearBadge,
    setBadgeCount: notificationsService.setBadgeCount,
  };
};
