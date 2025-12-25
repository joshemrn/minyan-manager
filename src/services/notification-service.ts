import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingInstance } from '@/lib/firebase';
import { userService } from './firebase-services';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  },

  async getToken(userId: string): Promise<string | null> {
    try {
      const messaging = await getMessagingInstance();
      if (!messaging) return null;

      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        // Save token to user profile
        await userService.updateFcmToken(userId, token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  },

  async initializeMessaging(
    userId: string,
    onMessageCallback: (payload: any) => void
  ): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    await this.getToken(userId);

    const messaging = await getMessagingInstance();
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Message received:', payload);
        onMessageCallback(payload);
      });
    }
  },
};

// Server-side notification sending (used in API routes)
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(
  tokens: string[],
  payload: NotificationPayload
): Promise<void> {
  // This would be called from API routes using firebase-admin
  const response = await fetch('/api/notifications/send-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokens, payload }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send push notification');
  }
}

export async function sendWhatsAppNotification(
  phoneNumber: string,
  message: string
): Promise<void> {
  const response = await fetch('/api/notifications/send-whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, message }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send WhatsApp notification');
  }
}
