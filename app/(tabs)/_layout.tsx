import { Tabs } from 'expo-router';
import React, { createContext, useContext } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';

// Tambahkan context untuk user global di layout
export const UserDataContext = createContext<any>(null);
export const useUserData = () => useContext(UserDataContext);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, token, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !token) {
      router.replace('/login');
    }
  }, [token, loading]);

  if (loading) {
    return null;
  }

  // Bungkus semua tab dengan UserDataContext agar user data bisa diakses di semua screen
  return (
    <UserDataContext.Provider value={user}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabIconDefault,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="outlets"
          options={{
            title: 'Outlets',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="building.2.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="visits"
          options={{
            title: 'Visits',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="calendar.badge.clock" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
          }}
        />
      </Tabs>
    </UserDataContext.Provider>
  );
}
