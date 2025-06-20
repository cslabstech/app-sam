import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useNetwork } from '@/context/network-context';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { usePermission } from '@/hooks/utils/usePermission';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
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
    <View className="flex-row items-center mb-6">
      <View
        className="w-16 h-16 rounded-xl border-2 justify-center items-center overflow-hidden bg-white dark:bg-neutral-950"
        style={{ borderColor: colors.primary }}
      >
        <Image source={{ uri: image }} className="w-full h-full rounded-xl" />
      </View>
      <View className="ml-4 flex-1">
        <Text style={{ fontFamily: 'Inter' }} className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5" numberOfLines={1}>
          {name}
        </Text>
        <Text style={{ fontFamily: 'Inter' }} className="text-xs text-slate-500 dark:text-slate-300" numberOfLines={1}>
          {role}
        </Text>
      </View>
    </View>
  );
}

function MenuItem({ icon, title, subtitle, colors, onPress, badge }: { icon: keyof typeof ICONS; title: string; subtitle?: string; colors: any; onPress?: () => void; badge?: string }) {
  return (
    <Pressable
      className="flex-row items-center py-3 px-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm active:bg-primary-50 dark:active:bg-primary-900"
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{ minHeight: 48 }}
    >
      <View
        className="w-9 h-9 rounded-lg justify-center items-center mr-3 border"
        style={{ backgroundColor: colors.primary + '10', borderColor: colors.primary }}
      >
        <IconSymbol name={ICONS[icon]} size={20} color={colors.primary} />
      </View>
      <View className="flex-1 flex-row items-center">
        <Text style={{ fontFamily: 'Inter' }} className="text-base font-medium text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
          {title}
        </Text>
        {badge && (
          <View className="ml-2 px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900">
            <Text style={{ fontFamily: 'Inter' }} className="text-xs text-primary-700 dark:text-primary-300 font-semibold">{badge}</Text>
          </View>
        )}
      </View>
      <IconSymbol name={ICONS.chevronRight} size={20} color={colors.textSecondary} />
    </Pressable>
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
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900" edges={isConnected ? ['top','left','right'] : ['left','right']}>
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, paddingBottom: 64 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-8 pb-6">
          <ProfileHeader name={displayName} role={displayRole} image={profileImage} colors={colors} />

          <View className="space-y-2 mb-6">
            <MenuItem icon="person" title="Personal Information" colors={colors} />
            <MenuItem icon="lock" title="Password" colors={colors} />
          </View>

          <View className="space-y-2 mb-6">
            {canCreateUser && (
              <MenuItem
                icon="person"
                title="Tambah User"
                colors={colors}
                onPress={() => router.push('/add-user')}
                badge="Admin"
              />
            )}
            <MenuItem
              icon="escape"
              title="Pengaduan Masalah"
              colors={colors}
              onPress={() => Linking.openURL('https://tally.so/r/nGXRvL')}
            />
          </View>

          <View className="mb-6">
            <Pressable
              className="h-12 w-full rounded-md items-center justify-center bg-danger-500 dark:bg-danger-600 active:bg-danger-600 mt-6"
              onPress={handleLogout}
              disabled={loading}
              accessibilityLabel="Log Out"
              accessibilityHint="Keluar dari aplikasi"
            >
              <Text style={{ fontFamily: 'Inter' }} className="text-sm font-medium text-white">
                {loading ? 'Log Out...' : 'Log Out'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}