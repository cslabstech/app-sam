import { useEffect, useState } from 'react';
import { createNotificationService, NotificationService } from '@/services/notification-service';

export interface UseNotificationResult {
  notificationId: string | null;
  permission: 'granted' | 'denied' | 'default';
  loading: boolean;
  requestPermission: () => Promise<void>;
}

/**
 * Simple notification hook that initializes notification ID and manages permissions.
 * This replaces the complex NotifIdInitializer component with a clean hook interface.
 */
export function useNotification(): UseNotificationResult {
  const [notificationId, setNotificationId] = useState<string | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [loading, setLoading] = useState(true);
  const [service] = useState<NotificationService>(() => createNotificationService());

  useEffect(() => {
    initializeNotification();
  }, []);

  const initializeNotification = async () => {
    setLoading(true);
    try {
      const id = await service.initializeNotificationId();
      setNotificationId(id);
      
      const currentPermission = await service.requestPermission();
      setPermission(currentPermission);
    } catch (error) {
      console.error('[useNotification] Initialization failed:', error);
      // Set fallback values
      setNotificationId('fallback-notification-id');
      setPermission('default');
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async () => {
    try {
      const result = await service.requestPermission();
      setPermission(result);
    } catch (error) {
      console.error('[useNotification] Permission request failed:', error);
      setPermission('denied');
    }
  };

  return {
    notificationId,
    permission,
    loading,
    requestPermission,
  };
}