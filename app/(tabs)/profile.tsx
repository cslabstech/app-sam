import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useNetwork } from '@/context/network-context';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { usePermission } from '@/hooks/utils/usePermission';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserData } from './_layout';

const ICONS = {
  person: 'person.fill',
  lock: 'lock.fill',
  chevronRight: 'chevron.right',
  escape: 'escape',
} as const;

const PROFILE_IMAGE = 'https://i.pravatar.cc/300';

interface User {
  nama_lengkap?: string;
  name?: string;
  username?: string;
  role?: string | { name: string };
  role_id?: string;
}

type IconType = keyof typeof ICONS;

const useProfileData = (user: User | null) => {
  const displayName = user?.nama_lengkap || user?.name || user?.username || '-';
  
  let displayRole = '-';
  if (user?.role) {
    if (typeof user.role === 'string') displayRole = user.role;
    else if (typeof user.role === 'object' && (user.role as any)?.name) displayRole = (user.role as any).name;
    else if (user.role_id) displayRole = `Role ID: ${user.role_id}`;
  } else if (user?.role_id) {
    displayRole = `Role ID: ${user.role_id}`;
  }
  
  return {
    displayName,
    displayRole,
    profileImage: PROFILE_IMAGE,
  };
};

const useProfileActions = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      await logout();
      router.replace('/login');
    } catch (err) {
      // Handle error if needed
    } finally {
      setLoading(false);
    }
  }, [logout, router]);

  const handleAddUser = useCallback(() => {
    router.push('/add-user');
  }, [router]);

  const handleReportIssue = useCallback(() => {
    Linking.openURL('https://tally.so/r/nGXRvL');
  }, []);

  return {
    loading,
    handleLogout,
    handleAddUser,
    handleReportIssue,
  };
};

const ProfileHeader = React.memo(function ProfileHeader({ 
  name, 
  role, 
  image, 
  colors 
}: { 
  name: string; 
  role: string; 
  image: string; 
  colors: any;
}) {
  return (
    <View className="flex-row items-center mb-6">
      <View 
        className="w-16 h-16 rounded-xl border-2 justify-center items-center overflow-hidden"
        style={{ borderColor: colors.primary }}
      >
        <Image source={{ uri: image }} className="w-full h-full rounded-xl" />
      </View>
      <View className="ml-4 flex-1">
        <Text 
          style={{ fontFamily: 'Inter' }}
          className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5" 
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text 
          style={{ fontFamily: 'Inter' }}
          className="text-xs text-neutral-600 dark:text-neutral-400" 
          numberOfLines={1}
        >
          {role}
        </Text>
      </View>
    </View>
  );
});

const MenuItem = React.memo(function MenuItem({ 
  icon, 
  title, 
  subtitle, 
  colors, 
  onPress, 
  badge 
}: { 
  icon: IconType; 
  title: string; 
  subtitle?: string; 
  colors: any; 
  onPress?: () => void; 
  badge?: string;
}) {
  return (
    <Pressable
      className="flex-row items-center py-3 px-3 border border-neutral-200 dark:border-neutral-700 rounded-lg min-h-[48px] bg-white dark:bg-neutral-950"
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      android_ripple={{ color: colors.primary + '20' }}
    >
      <View 
        className="w-9 h-9 rounded-lg justify-center items-center mr-3 border"
        style={{ 
          backgroundColor: colors.primary + '20', 
          borderColor: colors.primary 
        }}
      >
        <IconSymbol name={ICONS[icon]} size={20} color={colors.primary} />
      </View>
      <View className="flex-1 flex-row items-center">
        <Text 
          style={{ fontFamily: 'Inter' }}
          className="text-base font-medium text-neutral-900 dark:text-neutral-100" 
          numberOfLines={1}
        >
          {title}
        </Text>
        {badge && (
          <View 
            className="ml-2 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Text 
              style={{ fontFamily: 'Inter', color: colors.primary }}
              className="text-xs font-semibold"
            >
              {badge}
            </Text>
          </View>
        )}
      </View>
      <IconSymbol name={ICONS.chevronRight} size={20} color={colors.textSecondary} />
    </Pressable>
  );
});

const MenuSection = React.memo(function MenuSection({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <View className={`gap-2 mb-6 ${className || ''}`}>
      {children}
    </View>
  );
});

const LogoutButton = React.memo(function LogoutButton({ 
  onPress, 
  loading, 
  colors 
}: { 
  onPress: () => void; 
  loading: boolean; 
  colors: any;
}) {
  return (
    <View className="mb-6">
      <Pressable
        className="h-12 w-full rounded-lg items-center justify-center mt-6"
        style={{ backgroundColor: colors.danger }}
        onPress={onPress}
        disabled={loading}
        accessibilityLabel="Log Out"
        accessibilityHint="Keluar dari aplikasi"
        android_ripple={{ color: colors.dangerText + '20' }}
      >
        <Text 
          style={{ fontFamily: 'Inter', color: colors.dangerText }}
          className="text-sm font-medium"
        >
          {loading ? 'Log Out...' : 'Log Out'}
        </Text>
      </Pressable>
    </View>
  );
});

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const user = useUserData();
  const { isConnected } = useNetwork();
  const canCreateUser = usePermission('create_user');

  const { displayName, displayRole, profileImage } = useProfileData(user);
  const { loading, handleLogout, handleAddUser, handleReportIssue } = useProfileActions();

  return (
    <SafeAreaView 
      className="flex-1 bg-neutral-50 dark:bg-neutral-900" 
      edges={isConnected ? ['top','left','right'] : ['left','right']}
    >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 64 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-8 pb-6">
          <ProfileHeader 
            name={displayName} 
            role={displayRole} 
            image={profileImage} 
            colors={colors} 
          />

          <MenuSection>
            <MenuItem 
              icon="person" 
              title="Personal Information" 
              colors={colors} 
            />
            <MenuItem 
              icon="lock" 
              title="Password" 
              colors={colors} 
            />
          </MenuSection>

          <MenuSection>
            {canCreateUser && (
              <MenuItem
                icon="person"
                title="Tambah User"
                colors={colors}
                onPress={handleAddUser}
                badge="Admin"
              />
            )}
            <MenuItem
              icon="escape"
              title="Pengaduan Masalah"
              colors={colors}
              onPress={handleReportIssue}
            />
          </MenuSection>

          <LogoutButton 
            onPress={handleLogout} 
            loading={loading} 
            colors={colors} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}