import { useEffect } from 'react';

/**
 * Hook to request notification permissions and schedule a local daily notification.
 * Note: Purely local scheduled notifications while the app is completely closed 
 * are limited in web browsers without a Push Server. 
 * This approach uses a timer while the app is open/backgrounded, and checks upon opening.
 */
export function useDailyNotification() {
  useEffect(() => {
    // Only run if notifications are supported
    if (!('Notification' in window)) {
      return;
    }

    // Ask for permission if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Schedule next notification if permission is granted
    if (Notification.permission === 'granted') {
      scheduleNextNotification();
    }
  }, []);

  const scheduleNextNotification = () => {
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    // Assuming CST is UTC-6 for this approximation 
    // We use standard JS date math to find the next 8:00 AM CST
    
    // Get current time in CST
    const cstFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    
    const parts = cstFormatter.formatToParts(now);
    const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
    
    // Construct local Date object representing the CST time
    const cstNow = new Date(
      getPart('year'),
      getPart('month') - 1,
      getPart('day'),
      getPart('hour'),
      getPart('minute'),
      getPart('second')
    );

    const cstTarget = new Date(cstNow);
    cstTarget.setHours(8, 0, 0, 0);

    // If it's already past 8:00 AM CST today, target tomorrow
    if (cstNow.getTime() >= cstTarget.getTime()) {
      cstTarget.setDate(cstTarget.getDate() + 1);
    }

    const delayMs = cstTarget.getTime() - cstNow.getTime();

    // Schedule notification
    setTimeout(() => {
      new Notification('The Daily Cryptogram', {
        body: 'The new paper has arrived! Uncover today\'s mystery.',
        icon: '/pwa-192x192.png'
      });
      // Reschedule for next day
      scheduleNextNotification();
    }, delayMs);
  };
}
