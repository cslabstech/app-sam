import { AuthGuard } from '@/components/AuthGuard';
import { NetworkBanner } from '@/components/NetworkBanner';
import { AuthProvider } from '@/context/auth-context';
import { NetworkProvider } from '@/context/network-context';
import { NotifIdProvider, useNotifId } from '@/context/notifid-context';
import '@/global.css';
import { generateFallbackNotifId, isOneSignalAvailable, useOneSignal } from '@/hooks/utils/useOneSignal';
import { log } from '@/utils/logger';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;

// Memoized loading screen component
const LoadingScreen = React.memo(function LoadingScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-neutral-50">
      <ActivityIndicator size="large" color="#f97316" />
      <Text 
        className="mt-3 text-base text-neutral-500"
        style={{ fontFamily: 'Inter' }}
      >
        Loading font...
      </Text>
    </View>
  );
});

function NotifIdInitializer({ children }: { children: React.ReactNode }) {
  const { setNotifId, setNotificationPermission, setNotifIdLoading } = useNotifId();
  const OneSignal = useOneSignal();

  useEffect(() => {
    const initializeNotifId = async () => {
      log('[OneSignal] Starting initialization process');
      log('[OneSignal] Environment info:', {
        appOwnership: Constants.appOwnership,
        executionEnvironment: Constants.executionEnvironment,
        isOneSignalAvailable: isOneSignalAvailable(),
        hasOneSignalAppId: !!ONESIGNAL_APP_ID
      });

      // Jika tidak ada OneSignal instance atau APP_ID, gunakan fallback
      if (!OneSignal || !ONESIGNAL_APP_ID) {
        const fallbackId = generateFallbackNotifId();
        log('[OneSignal] Using fallback notif_id:', fallbackId);
        setNotifId(fallbackId);
        setNotificationPermission('default');
        setNotifIdLoading(false);
        return;
      }

      // Jika di Expo Go, gunakan fallback ID yang konsisten
      if (Constants.appOwnership === 'expo') {
        const expoFallbackId = 'expo-go-fallback-id';
        log('[OneSignal] Using Expo Go fallback notif_id:', expoFallbackId);
        setNotifId(expoFallbackId);
        setNotificationPermission('default');
        setNotifIdLoading(false);
        return;
      }

      try {
        log('[OneSignal] Initializing with APP_ID:', ONESIGNAL_APP_ID);
        
        // Set debug level jika tersedia
        if (OneSignal.Debug?.setLogLevel) {
          OneSignal.Debug.setLogLevel(6);
        }
        
        // Initialize OneSignal
        OneSignal.initialize(ONESIGNAL_APP_ID);
        
        // Request permission (false = tidak memaksa popup)
        OneSignal.Notifications.requestPermission(false);
        
        const pushSub = OneSignal.User.pushSubscription;
        setNotifIdLoading(true);

        // Helper function untuk retry mendapatkan notif ID
        const fetchNotifIdWithRetry = async (retries = 5, delay = 1000): Promise<string | null> => {
          let notifId = await pushSub.getIdAsync();
          if (notifId) return notifId;
          
          for (let i = 0; i < retries; i++) {
            log(`[OneSignal] Retry ${i + 1}/${retries} untuk mendapatkan notif_id`);
            await new Promise(res => setTimeout(res, delay));
            notifId = await pushSub.getIdAsync();
            if (notifId) return notifId;
          }
          return null;
        };

        // Coba dapatkan notif ID
        let notifId = await pushSub.getIdAsync();
        log('[OneSignal] Initial notif_id:', notifId);

        if (!notifId) {
          log('[OneSignal] No initial notif_id, requesting permission and retrying');
          try {
            await OneSignal.Notifications.requestPermission(true);
            notifId = await fetchNotifIdWithRetry(5, 1000);
            log('[OneSignal] notif_id after permission request & retry:', notifId);
          } catch (permissionError) {
            log('[OneSignal] Permission request failed:', permissionError);
          }
        }

        // Set hasil final
        if (notifId) {
          setNotifId(notifId);
          log('[OneSignal] Successfully set notif_id:', notifId);
        } else {
          const fallbackId = generateFallbackNotifId();
          log('[OneSignal] Failed to get notif_id, using fallback:', fallbackId);
          setNotifId(fallbackId);
        }

        // Setup listener untuk perubahan notif ID
        if (pushSub.addEventListener) {
          pushSub.addEventListener('change', async (event: any) => {
            const newId = await event?.to?.getIdAsync();
            log('[OneSignal] notif_id changed:', newId);
            setNotifId(newId || generateFallbackNotifId());
          });
        }

      } catch (error) {
        const fallbackId = generateFallbackNotifId();
        log('[OneSignal] Initialization failed, using fallback:', {
          error: error instanceof Error ? error.message : String(error),
          fallbackId
        });
        setNotifId(fallbackId);
      } finally {
        setNotifIdLoading(false);
      }
    };

    initializeNotifId();
  }, [setNotifId, setNotificationPermission, setNotifIdLoading, OneSignal]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <NetworkProvider>
        <NotifIdProvider>
          <NotifIdInitializer>
            <AuthProvider>
              <AuthGuard>
                <NetworkBanner />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
              </AuthGuard>
            </AuthProvider>
          </NotifIdInitializer>
        </NotifIdProvider>
      </NetworkProvider>
    </GestureHandlerRootView>
  );
}
