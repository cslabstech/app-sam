import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNotification } from '@/hooks/utils/useNotification';

interface NotifIdContextProps {
  notifId: string | null;
  setNotifId: (id: string | null) => void;
  notificationPermission: 'default' | 'granted' | 'denied' | null;
  setNotificationPermission: (status: 'default' | 'granted' | 'denied' | null) => void;
  notifIdLoading: boolean;
  setNotifIdLoading: (loading: boolean) => void;
}

const NotifIdContext = createContext<NotifIdContextProps | undefined>(undefined);

export const NotifIdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifId, setNotifId] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<'default' | 'granted' | 'denied' | null>(null);
  const [notifIdLoading, setNotifIdLoading] = useState<boolean>(true);
  
  // Use the simplified notification hook
  const { notificationId, permission, loading } = useNotification();
  
  // Update local state when notification hook provides data
  useEffect(() => {
    if (notificationId) {
      setNotifId(notificationId);
    }
    if (permission) {
      setNotificationPermission(permission);
    }
    setNotifIdLoading(loading);
  }, [notificationId, permission, loading]);

  return (
    <NotifIdContext.Provider value={{ 
      notifId, 
      setNotifId, 
      notificationPermission, 
      setNotificationPermission, 
      notifIdLoading, 
      setNotifIdLoading 
    }}>
      {children}
    </NotifIdContext.Provider>
  );
};

export const useNotifId = () => {
  const ctx = useContext(NotifIdContext);
  if (!ctx) throw new Error('useNotifId must be used within NotifIdProvider');
  return ctx;
};
