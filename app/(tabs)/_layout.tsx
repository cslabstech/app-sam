import { Tabs } from 'expo-router';
import React, { createContext, useContext } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useRouter } from 'expo-router';

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
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary, fontSize: 16 }}>Memuat...</Text>
      </View>
    );
  }

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