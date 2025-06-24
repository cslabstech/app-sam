import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useNetwork } from '@/context/network-context';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { usePermission } from '@/hooks/utils/usePermission';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

const ProfileHeader = ({ 
  name, 
  role, 
  image, 
  colors 
}: { 
  name: string; 
  role: string; 
  image: string; 
  colors: any;
}) => (
  <View style={styles.profileHeader}>
    <View style={[styles.profileImageContainer, { borderColor: colors.primary }]}>
      <Image source={{ uri: image }} style={styles.profileImage} />
    </View>
    <View style={styles.profileInfo}>
      <Text 
        style={[styles.profileName, { color: colors.text }]} 
        numberOfLines={1}
      >
        {name}
      </Text>
      <Text 
        style={[styles.profileRole, { color: colors.textSecondary }]} 
        numberOfLines={1}
      >
        {role}
      </Text>
    </View>
  </View>
);

const MenuItem = ({ 
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
}) => (
  <Pressable
    style={[
      styles.menuItem,
      { 
        backgroundColor: colors.card, 
        borderColor: colors.border,
      }
    ]}
    onPress={onPress}
    accessibilityRole={onPress ? 'button' : undefined}
    android_ripple={{ color: colors.primary + '20' }}
  >
    <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
      <IconSymbol name={ICONS[icon]} size={20} color={colors.primary} />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuTitle, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      {badge && (
        <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            {badge}
          </Text>
        </View>
      )}
    </View>
    <IconSymbol name={ICONS.chevronRight} size={20} color={colors.textSecondary} />
  </Pressable>
);

const MenuSection = ({ 
  children, 
  style 
}: { 
  children: React.ReactNode; 
  style?: any;
}) => (
  <View style={[styles.menuSection, style]}>
    {children}
  </View>
);

const LogoutButton = ({ 
  onPress, 
  loading, 
  colors 
}: { 
  onPress: () => void; 
  loading: boolean; 
  colors: any;
}) => (
  <View style={styles.logoutContainer}>
    <Pressable
      style={[styles.logoutButton, { backgroundColor: colors.danger }]}
      onPress={onPress}
      disabled={loading}
      accessibilityLabel="Log Out"
      accessibilityHint="Keluar dari aplikasi"
      android_ripple={{ color: colors.dangerText + '20' }}
    >
      <Text style={[styles.logoutText, { color: colors.dangerText }]}>
        {loading ? 'Log Out...' : 'Log Out'}
      </Text>
    </Pressable>
  </View>
);

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
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={isConnected ? ['top','left','right'] : ['left','right']}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 64,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
  },
  menuSection: {
    gap: 8,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  menuContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutContainer: {
    marginBottom: 24,
  },
  logoutButton: {
    height: 48,
    width: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
});