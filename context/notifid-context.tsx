import React, { createContext, useContext, useState } from 'react';

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

  return (
    <NotifIdContext.Provider value={{ notifId, setNotifId, notificationPermission, setNotificationPermission, notifIdLoading, setNotifIdLoading }}>
      {children}
    </NotifIdContext.Provider>
  );
};

export const useNotifId = () => {
  const ctx = useContext(NotifIdContext);
  if (!ctx) throw new Error('useNotifId must be used within NotifIdProvider');
  return ctx;
};
