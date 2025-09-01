import { AuthGuard } from '@/components/AuthGuard';
import { NetworkBanner } from '@/components/NetworkBanner';
import { AppProvider } from '@/context/app-provider';
import '@/global.css';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * Simple loading screen component without unnecessary memoization
 */
function LoadingScreen() {
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
}

/**
 * Simplified root layout with clean provider structure
 * and separation of concerns. The complex initialization logic
 * has been moved to dedicated services and hooks.
 */
export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <AppProvider>
        <AuthGuard>
          <NetworkBanner />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </AuthGuard>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
