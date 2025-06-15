import { NetworkBanner } from '@/components/NetworkBanner';
import { AuthProvider } from '@/context/auth-context';
import { NetworkProvider } from '@/context/network-context';
import { NotifIdProvider, useNotifId } from '@/context/notifid-context';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { log } from '../utils/logger';

const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;

function NotifIdInitializer({ children }: { children: React.ReactNode }) {
  const { setNotifId, setNotificationPermission, setNotifIdLoading } = useNotifId();

  useEffect(() => {
    // Jika tidak di-support atau tidak ada APP_ID, set default dan keluar
    if (Constants.appOwnership === 'expo' || !ONESIGNAL_APP_ID) {
      setNotifId('expo-default-notif-id'); // set default notifId jika di Expo
      setNotificationPermission('default');
      setNotifIdLoading(false);
      log('[OneSignal] Skipped initialization: appOwnership=expo or no ONESIGNAL_APP_ID');
      return;
    }

    // Dynamic import agar tidak error di Expo Go
    (async () => {
      const { LogLevel, OneSignal } = await import('react-native-onesignal');
      log('[OneSignal] Initializing with APP_ID:', ONESIGNAL_APP_ID);
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
      OneSignal.initialize(ONESIGNAL_APP_ID);
      OneSignal.Notifications.requestPermission(false);

      const pushSub = OneSignal.User.pushSubscription;
      setNotifIdLoading(true);
      const fetchNotifIdWithRetry = async (retries = 5, delay = 1000) => {
        let notifId = await pushSub.getIdAsync();
        if (notifId) return notifId;
        for (let i = 0; i < retries; i++) {
          await new Promise(res => setTimeout(res, delay));
          notifId = await pushSub.getIdAsync();
          if (notifId) return notifId;
        }
        return null;
      };
      pushSub.getIdAsync().then(async (id: string | null) => {
        log('[OneSignal] notifId fetched:', id);
        if (!id) {
          // Jika notifId null, coba request permission ulang agar subscription dibuat
          try {
            await OneSignal.Notifications.requestPermission(true);
            const newId = await fetchNotifIdWithRetry(5, 1000);
            log('[OneSignal] notifId baru setelah requestPermission & retry:', newId);
            setNotifId(newId || null);
          } catch (e) {
            log('[OneSignal] Gagal mendapatkan notifId:', e);
            setNotifId(null);
          }
        } else {
          setNotifId(id);
        }
        setNotifIdLoading(false);
      });

      // Listener notifId berubah
      pushSub.addEventListener?.('change', async (event: any) => {
        const newId = await event?.to?.getIdAsync();
        log('[OneSignal] notifId changed:', newId);
        setNotifId(newId || null);
        setNotifIdLoading(false);
      });
    })();
  }, [setNotifId, setNotificationPermission, setNotifIdLoading]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12, color: '#888' }}>Loading font...</Text>
      </View>
    );
  }

  return (
    <NetworkProvider>
      <NotifIdProvider>
        <NotifIdInitializer>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </AuthProvider>
        </NotifIdInitializer>
      </NotifIdProvider>
      <NetworkBanner />
    </NetworkProvider>
  );
}
