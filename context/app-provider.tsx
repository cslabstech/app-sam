import React from 'react';
import { AuthProvider } from './auth-context';
import { NetworkProvider } from './network-context';
import { NotifIdProvider } from './notifid-context';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Consolidated app provider that wraps all necessary context providers
 * in a single, clean interface. This simplifies the component tree and
 * makes it easier to understand the app's initialization flow.
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <NetworkProvider>
      <NotifIdProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </NotifIdProvider>
    </NetworkProvider>
  );
}