import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
}

export const usePushNotifications = () => {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    permission: 'default',
    isSupported: false
  });

  useEffect(() => {
    // Check if notifications are supported
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    setPermissionState({
      permission: isSupported ? Notification.permission : 'denied',
      isSupported
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (!permissionState.isSupported) {
      toast.error('Push notifications not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        toast.success('Notifications enabled! You\'ll receive spiritual reminders.');
        return true;
      } else if (permission === 'denied') {
        toast.error('Notifications blocked. Enable in browser settings.');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications');
      return false;
    }
  }, [permissionState.isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!permissionState.isSupported || permissionState.permission !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [permissionState]);

  const scheduleNotification = useCallback((
    title: string,
    options: NotificationOptions,
    delayMs: number
  ) => {
    if (!permissionState.isSupported || permissionState.permission !== 'granted') {
      return null;
    }

    const timeoutId = setTimeout(() => {
      sendNotification(title, options);
    }, delayMs);

    return timeoutId;
  }, [permissionState, sendNotification]);

  return {
    ...permissionState,
    requestPermission,
    sendNotification,
    scheduleNotification
  };
};

// Notification scheduler service
export class NotificationScheduler {
  private static instance: NotificationScheduler;
  private scheduledNotifications: Map<string, NodeJS.Timeout> = new Map();

  static getInstance() {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  scheduleDaily(id: string, hour: number, minute: number, title: string, body: string) {
    // Cancel existing if any
    this.cancel(id);

    const scheduleNext = () => {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const delay = scheduledTime.getTime() - now.getTime();
      
      const timeoutId = setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: id
          });
        }
        // Schedule next occurrence
        scheduleNext();
      }, delay);

      this.scheduledNotifications.set(id, timeoutId);
    };

    scheduleNext();
  }

  cancel(id: string) {
    const existing = this.scheduledNotifications.get(id);
    if (existing) {
      clearTimeout(existing);
      this.scheduledNotifications.delete(id);
    }
  }

  cancelAll() {
    this.scheduledNotifications.forEach((timeout) => clearTimeout(timeout));
    this.scheduledNotifications.clear();
  }
}

// Pre-defined spiritual notifications
export const SPIRITUAL_NOTIFICATIONS = {
  MORNING_PRAYER: {
    id: 'morning-prayer',
    hour: 6,
    minute: 0,
    title: '🙏 Morning Prayer Time',
    body: 'Start your day with divine blessings. Time for morning prayers.'
  },
  DAILY_SHLOK: {
    id: 'daily-shlok',
    hour: 8,
    minute: 0,
    title: '📿 Daily Shlok Reminder',
    body: 'Your daily wisdom from Bhagavad Gita awaits you.'
  },
  MEDITATION_REMINDER: {
    id: 'meditation',
    hour: 12,
    minute: 0,
    title: '🧘 Meditation Break',
    body: 'Take a peaceful moment to center yourself with meditation.'
  },
  EVENING_REFLECTION: {
    id: 'evening-reflection',
    hour: 19,
    minute: 0,
    title: '✨ Evening Reflection',
    body: 'Reflect on your day and complete your daily quests.'
  },
  STREAK_REMINDER: {
    id: 'streak-reminder',
    hour: 21,
    minute: 0,
    title: '🔥 Don\'t Break Your Streak!',
    body: 'Complete a task to maintain your spiritual streak.'
  }
};