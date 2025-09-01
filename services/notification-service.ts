import { log } from '@/utils/logger';
import Constants from 'expo-constants';
import { generateFallbackNotifId, isOneSignalAvailable } from '@/hooks/utils/useOneSignal';

const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;

/**
 * Get OneSignal instance safely without using hooks
 */
function getOneSignalInstance() {
  const appOwnership = Constants.appOwnership as string | null;
  const isExpoGo = appOwnership === 'expo';
  
  if (isExpoGo) {
    return null;
  }
  
  try {
    // Try different import methods
    let OneSignal = require('react-native-onesignal')?.OneSignal;
    if (OneSignal) return OneSignal;
    
    OneSignal = require('react-native-onesignal')?.default;
    if (OneSignal) return OneSignal;
    
    const OneSignalModule = require('react-native-onesignal');
    if (OneSignalModule && typeof OneSignalModule === 'object') {
      OneSignal = OneSignalModule.OneSignal || OneSignalModule.default || OneSignalModule;
      if (OneSignal) return OneSignal;
    }
    
    return null;
  } catch (error) {
    log('[OneSignal] Import failed:', error);
    return null;
  }
}

export interface NotificationService {
  initializeNotificationId: () => Promise<string>;
  requestPermission: () => Promise<'granted' | 'denied' | 'default'>;
}

/**
 * Simple notification service that handles OneSignal initialization
 * with clear fallback strategies and minimal complexity.
 */
export class SimpleNotificationService implements NotificationService {
  private oneSignal: any;

  constructor() {
    this.oneSignal = getOneSignalInstance();
  }

  async initializeNotificationId(): Promise<string> {
    log('[Notification] Starting initialization');

    // Early returns for simple cases
    if (!this.oneSignal || !ONESIGNAL_APP_ID) {
      return this.getFallbackId('No OneSignal instance or APP_ID');
    }

    if (Constants.appOwnership === 'expo') {
      return this.getFallbackId('Expo Go environment');
    }

    try {
      return await this.initializeOneSignal();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.getFallbackId(`Initialization failed: ${errorMessage}`);
    }
  }

  private async initializeOneSignal(): Promise<string> {
    log('[Notification] Initializing OneSignal with APP_ID:', ONESIGNAL_APP_ID);

    // Set debug level if available
    if (this.oneSignal.Debug?.setLogLevel) {
      this.oneSignal.Debug.setLogLevel(6);
    }

    // Initialize OneSignal
    this.oneSignal.initialize(ONESIGNAL_APP_ID);

    // Request permission (non-intrusive)
    this.oneSignal.Notifications.requestPermission(false);

    const pushSub = this.oneSignal.User.pushSubscription;
    
    // Try to get notification ID with retry
    let notifId = await this.getNotificationIdWithRetry(pushSub);

    if (!notifId) {
      // Try requesting permission explicitly
      await this.oneSignal.Notifications.requestPermission(true);
      notifId = await this.getNotificationIdWithRetry(pushSub);
    }

    if (notifId) {
      log('[Notification] Successfully obtained notification ID:', notifId);
      return notifId;
    }

    throw new Error('Failed to obtain notification ID after retries');
  }

  private async getNotificationIdWithRetry(
    pushSub: any, 
    maxRetries: number = 5, 
    delay: number = 1000
  ): Promise<string | null> {
    // Try immediate fetch
    let notifId = await pushSub.getIdAsync();
    if (notifId) return notifId;

    // Retry with delay
    for (let i = 0; i < maxRetries; i++) {
      log(`[Notification] Retry ${i + 1}/${maxRetries} for notification ID`);
      await new Promise(resolve => setTimeout(resolve, delay));
      notifId = await pushSub.getIdAsync();
      if (notifId) return notifId;
    }

    return null;
  }

  private getFallbackId(reason: string): string {
    const fallbackId = generateFallbackNotifId();
    log(`[Notification] Using fallback ID: ${fallbackId}. Reason: ${reason}`);
    return fallbackId;
  }

  async requestPermission(): Promise<'granted' | 'denied' | 'default'> {
    if (!this.oneSignal || !ONESIGNAL_APP_ID) {
      return 'default';
    }

    try {
      const result = await this.oneSignal.Notifications.requestPermission(true);
      return result ? 'granted' : 'denied';
    } catch (error) {
      log('[Notification] Permission request failed:', error);
      return 'denied';
    }
  }
}

/**
 * Factory function to create notification service instance
 */
export function createNotificationService(): NotificationService {
  return new SimpleNotificationService();
}