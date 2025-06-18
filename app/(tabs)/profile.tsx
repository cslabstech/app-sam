import { router } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePermission } from '@/hooks/usePermission';
import { shadow } from '@/styles/shadow';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { useUserData } from './_layout';

// Only allow icon names that are mapped in IconSymbol.tsx
const ICONS = {
  person: 'person.fill',
  lock: 'lock.fill',
  bell: 'bell.fill',
  globe: 'globe',
  moon: 'moon.fill',
  question: 'questionmark.circle.fill',
  exclamation: 'exclamationmark.bubble.fill',
  info: 'info.circle.fill',
  pencil: 'pencil',
  chevronRight: 'chevron.right',
  escape: 'escape',
};

interface MenuItemProps {
  icon: keyof typeof ICONS;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
}

function MenuItem({ icon, title, subtitle, rightElement, onPress }: MenuItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        !onPress && { opacity: 0.6 },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.menuIconContainer,
          {
            backgroundColor: colors.primary + '10',
            borderColor: colors.primary,
          },
        ]}
      >
        <IconSymbol name={ICONS[icon] as any} size={22} color={colors.primary} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      {rightElement ?? (
        <IconSymbol name={ICONS.chevronRight as any} size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // Ambil user dari context global, fallback ke useAuth jika context null
  const userCtx = useUserData?.() ?? null;
  const { logout, loading: authLoading } = useAuth();
  const user = userCtx || useAuth().user;

  const displayName = user?.nama_lengkap || user?.name || user?.username || '-';
  let displayRole = '-';
  if (user?.role) {
    if (typeof user.role === 'string') displayRole = user.role;
    else if (typeof user.role === 'object' && (user.role as any)?.name) displayRole = (user.role as any).name;
    else if (user.role_id) displayRole = `Role ID: ${user.role_id}`;
  } else if (user?.role_id) {
    displayRole = `Role ID: ${user.role_id}`;
  }
  const profileImage = 'https://i.pravatar.cc/300';

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (err) {
      // Optionally show error
    }
  };

  const canCreateUser = usePermission('create_user');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <View
            style={[
              styles.profileImageContainer,
              {
                borderColor: colors.primary,
                backgroundColor: colors.primary + '10',
              },
            ]}
          >
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          </View>
          <View style={{ marginLeft: spacing.md }}>
            <Text style={[styles.greeting, { color: colors.text }]} numberOfLines={1}>
              {displayName}!
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]} numberOfLines={1}>
              {displayRole}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Tambah User Button hanya jika punya permission */}
        {canCreateUser && (
          <TouchableOpacity
            style={[
              styles.addUserButton,
              { backgroundColor: colors.primary, marginBottom: spacing.lg },
            ]}
            onPress={() => router.push('/add-user')}
            activeOpacity={0.85}
          >
            <IconSymbol name={ICONS.person as any} size={20} color={'#fff'} />
            <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 }}>Tambah User</Text>
          </TouchableOpacity>
        )}
        <Card style={{ marginBottom: 0, borderRadius: 16, padding: 0 }}>
          <MenuItem icon="person" title="Personal Information" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem icon="lock" title="Security" subtitle="Password, biometrics" />
        </Card>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.danger + '10',
              borderColor: colors.danger,
              opacity: authLoading ? 0.5 : 1,
              shadowColor: colors.danger,
            },
          ]}
          onPress={handleLogout}
          disabled={authLoading}
          activeOpacity={0.85}
        >
          <IconSymbol name={ICONS.escape as any} size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 0,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    backgroundColor: 'transparent',
  },
  greeting: {
    fontSize: typography.fontSizeXl,
    fontWeight: 'bold',
    fontFamily: typography.fontFamily,
    letterSpacing: 0.1,
  },
  date: {
    fontSize: typography.fontSizeSm,
    marginTop: 0,
    color: '#7B8FA1',
    fontFamily: typography.fontFamily,
  },
  profileImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    padding: 2,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF8800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: typography.fontSizeMd,
    fontWeight: '600',
    fontFamily: typography.fontFamily,
    letterSpacing: 0.1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF8800',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.fontSizeMd,
    fontWeight: '500',
    fontFamily: typography.fontFamily,
    letterSpacing: 0.1,
  },
  menuSubtitle: {
    fontSize: typography.fontSizeSm,
    marginTop: 2,
    color: '#7B8FA1',
    fontFamily: typography.fontFamily,
  },
  divider: {
    height: 1,
    marginVertical: 0,
    backgroundColor: '#E5E5E5',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
    marginVertical: 0,
    paddingVertical: spacing.xl,
    borderRadius: 12,
    backgroundColor: 'transparent',
    ...shadow,
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginHorizontal: 0,
  },
  logoutText: {
    fontSize: typography.fontSizeMd,
    fontWeight: '600',
    marginLeft: 0,
    fontFamily: typography.fontFamily,
  },
});