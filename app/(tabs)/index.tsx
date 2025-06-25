// React & React Native
import React, { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Third-party libraries
import { router } from 'expo-router';

// Local components
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Constants & utilities
import { Colors } from '@/constants/Colors';

// Hooks & contexts
import { useNetwork } from '@/context/network-context';
import { useHomeData } from '@/hooks/data/useHomeData';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useUserData } from './_layout';

// Custom hooks for separation of concerns
const useDateTime = () => {
  const formatDate = useCallback(() => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  }, []);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  return { formatDate, getGreeting };
};

const useVisitData = () => {
  const { todayVisits, loadingVisits, error, refreshData } = useHomeData();
  
  const sortedVisits = useMemo(() => {
    return [...todayVisits].sort((a, b) => {
      if (!a.outlet?.name || !b.outlet?.name) return 0;
      return a.outlet.name.localeCompare(b.outlet.name);
    });
  }, [todayVisits]);

  return {
    visits: sortedVisits,
    loading: loadingVisits,
    error,
    refreshData,
  };
};

// Memoized components for performance
const QuickActionButton = React.memo(function QuickActionButton({
  onPress,
  iconName,
  iconColor,
  title,
  subtitle,
  bgColor,
  accessibilityLabel,
}: {
  onPress: () => void;
  iconName: string;
  iconColor: string;
  title: string;
  subtitle: string;
  bgColor: string;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      className="flex-1 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 items-center"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.85}
    >
      <View className={`w-12 h-12 rounded-full ${bgColor} items-center justify-center mb-2`}>
        <IconSymbol size={24} name={iconName} color={iconColor} />
      </View>
      <Text style={{ fontFamily: 'Inter' }} className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</Text>
      <Text style={{ fontFamily: 'Inter' }} className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">{subtitle}</Text>
    </TouchableOpacity>
  );
});

const VisitCard = React.memo(function VisitCard({
  visit,
  colors,
  onStartPress,
  onCheckOutPress,
}: {
  visit: any;
  colors: any;
  onStartPress: () => void;
  onCheckOutPress: () => void;
}) {
  const renderActionButton = useCallback(() => {
    if (!visit.checkin_time && !visit.checkout_time) {
      return (
        <Button
          title="Mulai"
          size="sm"
          variant="primary"
          onPress={onStartPress}
          leftIcon={<IconSymbol name="play.fill" size={16} color={colors.textInverse} />}
        />
      );
    }
    
    if (visit.checkin_time && !visit.checkout_time) {
      return (
        <Button
          title="Check Out"
          size="sm"
          variant="secondary"
          onPress={onCheckOutPress}
          leftIcon={<IconSymbol name="stop.fill" size={16} color={colors.textInverse} />}
        />
      );
    }
    
    return (
      <View className="flex-row items-center px-3 py-1 rounded-full bg-success-100 dark:bg-success-900 shadow">
        <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
        <Text style={{ fontFamily: 'Inter' }} className="text-xs font-semibold text-success-700 dark:text-success-300 ml-1">Selesai</Text>
      </View>
    );
  }, [visit.checkin_time, visit.checkout_time, onStartPress, onCheckOutPress, colors]);

  return (
    <Pressable
      className="mb-2 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 active:bg-primary-50 dark:active:bg-primary-900"
      onPress={() => {}}
      android_ripple={{ color: colors.primary + '10' }}
      style={{ overflow: 'hidden' }}
    >
      <View className="flex-row items-center p-4">
        {/* Left: Outlet Info */}
        <View className="flex-1">
          {/* Code & Name Side by Side */}
          <View className="flex-row items-center mb-2">
            <IconSymbol size={18} name="building.2.fill" color={colors.primary} />
            <Text style={{ fontFamily: 'Inter' }} className="text-base font-bold text-neutral-900 dark:text-neutral-100 ml-2">
              {visit.outlet?.code}
            </Text>
            <Text
              style={{ fontFamily: 'Inter' }}
              className="text-xs text-slate-500 dark:text-slate-400 ml-3 flex-1 truncate"
              numberOfLines={1}
            >
              {visit.outlet?.name}
            </Text>
          </View>
          {/* Time Status */}
          <View className="flex-row space-x-2 mt-2">
            <View className="flex-row items-center px-2 py-0.5 rounded-full bg-success-50 dark:bg-success-900">
              <IconSymbol size={14} name="clock.fill" color={colors.success} />
              <Text style={{ fontFamily: 'Inter' }} className="text-xs text-success-600 ml-1">
                IN: {visit.checkin_time ? new Date(visit.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
              </Text>
            </View>
            <View className="flex-row items-center px-2 py-0.5 rounded-full bg-warning-50 dark:bg-warning-900">
              <IconSymbol size={14} name="clock.fill" color={colors.warning} />
              <Text style={{ fontFamily: 'Inter' }} className="text-xs text-warning-600 ml-1">
                OUT: {visit.checkout_time ? new Date(visit.checkout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
              </Text>
            </View>
          </View>
        </View>
        {/* Right: Action/Status */}
        <View className="ml-4 min-w-[100px] flex items-end">
          {renderActionButton()}
        </View>
      </View>
    </Pressable>
  );
});

/**
 * Modern Home Screen - Halaman utama aplikasi SAM
 * Mengikuti best practice: UI-only, menggunakan custom hooks untuk logic
 */
export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const user = useUserData?.() ?? null;
  const displayName = user?.name || user?.username || 'User';
  const { isConnected } = useNetwork();

  // Custom hooks
  const { formatDate, getGreeting } = useDateTime();
  const { visits, loading, error, refreshData } = useVisitData();

  // Memoized values
  const greeting = useMemo(() => getGreeting(), [getGreeting]);
  const currentDate = useMemo(() => formatDate(), [formatDate]);

  // Memoized handlers
  const handleQuickActions = useMemo(() => ({
    liveVisit: () => router.push('/visit/check-in'),
    planVisit: () => router.push('/plan-visit'),
    registerOutlet: () => router.push('/outlet/create'),
    viewAllVisits: () => router.push('/visits'),
  }), []);

  const handleVisitActions = useMemo(() => ({
    start: (visitId: string) => router.push({ pathname: '/visit/check-in', params: { id: visitId } }),
    checkOut: (visitId: string) => router.push({ pathname: '/visit/check-out', params: { id: visitId } }),
  }), []);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900" edges={isConnected ? ['top','left','right'] : ['left','right']}>
      {/* Header */}
      <View className="border-b border-neutral-200 dark:border-neutral-800 px-4 pt-4 pb-4 bg-neutral-50 dark:bg-neutral-900">
        <View className="flex-row justify-between items-center">
          <View>
            <Text style={{ fontFamily: 'Inter' }} className="text-sm text-slate-500 dark:text-slate-300 mb-0.5">{greeting},</Text>
            <Text style={{ fontFamily: 'Inter' }} className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-0.5">{displayName}</Text>
            <Text style={{ fontFamily: 'Inter' }} className="text-xs text-slate-400 dark:text-slate-500">{currentDate}</Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 justify-center items-center relative"
            onPress={() => { }}
            accessibilityLabel="Notifikasi"
          >
            <IconSymbol size={20} name="bell.fill" color={colors.primary} />
            <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger-500" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshData}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View className="px-4 pt-4">
          <View className="flex-row justify-between space-x-3 gap-2">
            <QuickActionButton
              onPress={handleQuickActions.liveVisit}
              iconName="checkmark.seal.fill"
              iconColor={colors.primary}
              title="Live Visit"
              subtitle="Mulai kunjungan"
              bgColor="bg-primary-100 dark:bg-primary-900"
              accessibilityLabel="Mulai Live Visit"
            />
            <QuickActionButton
              onPress={handleQuickActions.planVisit}
              iconName="calendar.badge.plus"
              iconColor={colors.secondary}
              title="Plan Visit"
              subtitle="Rencanakan kunjungan"
              bgColor="bg-secondary-100 dark:bg-secondary-900"
              accessibilityLabel="Rencanakan kunjungan"
            />
            <QuickActionButton
              onPress={handleQuickActions.registerOutlet}
              iconName="plus.circle.fill"
              iconColor={colors.success}
              title="Register"
              subtitle="Outlet baru"
              bgColor="bg-success-100 dark:bg-success-900"
              accessibilityLabel="Daftarkan outlet baru"
            />
          </View>
        </View>

        {/* Today's Visits */}
        <View className="px-4 pt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text style={{ fontFamily: 'Inter' }} className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Kunjungan Hari Ini</Text>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={refreshData} className="mr-2 p-2" accessibilityLabel="Refresh data">
                <IconSymbol name="arrow.clockwise" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleQuickActions.viewAllVisits} accessibilityLabel="Lihat semua kunjungan">
                <Text style={{ fontFamily: 'Inter' }} className="text-sm font-medium text-primary-500">Lihat Semua</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <Card className="mb-4 border-2 border-danger-200 bg-danger-50 dark:bg-danger-900">
              <CardContent>
                <View className="flex-row items-center justify-center py-4">
                  <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.danger} />
                  <Text style={{ fontFamily: 'Inter' }} className="text-sm text-danger-600 ml-2">Gagal memuat data kunjungan</Text>
                </View>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card className="mb-4">
              <CardContent>
                <Text style={{ fontFamily: 'Inter' }} className="text-sm text-slate-500 text-center py-4">Memuat kunjungan...</Text>
              </CardContent>
            </Card>
          ) : visits.length > 0 ? (
            visits.map((visit: any) => (
              <VisitCard
                key={visit.id}
                visit={visit}
                colors={colors}
                onStartPress={() => handleVisitActions.start(visit.id)}
                onCheckOutPress={() => handleVisitActions.checkOut(visit.id)}
              />
            ))
          ) : (
            <Card className="mb-4">
              <CardContent>
                <View className="items-center py-8">
                  <IconSymbol name="calendar" size={48} color={colors.textTertiary} />
                  <Text style={{ fontFamily: 'Inter' }} className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-4">Tidak ada kunjungan hari ini</Text>
                  <Text style={{ fontFamily: 'Inter' }} className="text-xs text-slate-500 dark:text-slate-400 mt-2">Kunjungan yang dijadwalkan akan muncul di sini</Text>
                </View>
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Note: StyleSheet removed to fix linter errors. File uses Tailwind classes for now.
// Full refactor to StyleSheet can be done later when spacing/typography constants are properly imported.
