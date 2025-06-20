import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/auth-context';
import { useNetwork } from '@/context/network-context';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { usePermission } from '@/hooks/utils/usePermission';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserData } from './_layout';

const ICONS = {
  person: 'person.fill',
  lock: 'lock.fill',
  chevronRight: 'chevron.right',
  escape: 'escape',
};

function ProfileHeader({ name, role, image, colors }: { name: string; role: string; image: string; colors: any }) {
  return (
    <View style={styles.profileHeader}>
      <View style={[styles.profileImageContainer, { borderColor: colors.primary }]}>
        <Image source={{ uri: image }} style={styles.profileImage} />
      </View>
      <View style={{ marginLeft: spacing.lg }}>
        <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
        <Text style={[styles.headerRole, { color: colors.textSecondary }]} numberOfLines={1}>{role}</Text>
      </View>
    </View>
  );
}

function MenuItem({ icon, title, subtitle, colors, onPress }: { icon: keyof typeof ICONS; title: string; subtitle?: string; colors: any; onPress?: () => void }) {
  return (
    <View style={styles.menuItemRow}>
      <View style={[styles.menuIconContainer, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
        <IconSymbol name={ICONS[icon] as any} size={16} color={colors.primary} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, { color: colors.text }]} onPress={onPress}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <IconSymbol name={ICONS.chevronRight as any} size={20} color={colors.textSecondary} />
      {onPress && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} pointerEvents="box-none">
          <Text onPress={onPress} style={{ width: '100%', height: '100%', position: 'absolute', opacity: 0 }}> </Text>
        </View>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const user = useUserData();
  const { logout } = useAuth();
  const { isConnected } = useNetwork();

  const [loading, setLoading] = React.useState(false);

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
    setLoading(true);
    try {
      await logout();
      router.replace('/login');
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const canCreateUser = usePermission('create_user');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={isConnected ? ['top','left','right'] : ['left','right']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageContainer}>
          <ProfileHeader name={displayName} role={displayRole} image={profileImage} colors={colors} />

          <View style={styles.sectionSpacing}>
            <Card style={styles.menuCard} variant="outlined" size="md">
              <MenuItem icon="person" title="Personal Information" colors={colors} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <MenuItem icon="lock" title="Password" colors={colors} />
            </Card>
          </View>

          <View style={styles.sectionSpacing}>
            <Card style={styles.menuCard} variant="outlined" size="md">
              {canCreateUser && (
                <>
                  <MenuItem
                    icon="person"
                    title="Tambah User"
                    colors={colors}
                    onPress={() => router.push('/add-user')}
                  />
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                </>
              )}
              <MenuItem
                icon="escape"
                title="Pengaduan Masalah"
                colors={colors}
                onPress={() => Linking.openURL('https://tally.so/r/nGXRvL')}
              />
            </Card>
          </View>

          <View style={styles.sectionSpacing}>
            <Button
              title={loading ? 'Log Out...' : 'Log Out'}
              variant="danger"
              onPress={handleLogout}
              style={{ minHeight: 52, marginTop: spacing.lg, marginBottom: 0 }}
              fullWidth
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  pageContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  profileImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: Colors.light.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  headerName: {
    fontSize: typography.fontSizeXl,
    fontWeight: 'bold',
    fontFamily: typography.fontFamily,
    marginBottom: 2,
  },
  headerRole: {
    fontSize: typography.fontSizeSm,
    fontFamily: typography.fontFamily,
    color: undefined,
  },
  sectionSpacing: {
    marginBottom: spacing.xl,
  },
  menuCard: {
    marginBottom: 0,
    borderRadius: 20,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
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
});