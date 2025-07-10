import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Third-party libraries
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';

// Local components
import { PermissionBottomSheet } from '@/components/PermissionBottomSheet';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Constants & utilities
import { Colors } from '@/constants/Colors';

// Hooks & contexts
import { useNetwork } from '@/context/network-context';
import { usePlanVisit } from '@/hooks/data/usePlanVisit';
import { useVisit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { usePermissionWithModal } from '@/hooks/utils/usePermission';
import { useUserData } from './_layout';

// Types
interface Visit {
  id: string | number;
  visit_date: string;
  checkin_time?: string | null;
  checkout_time?: string | null;
  outlet?: {
    id?: string | number;
    name?: string;
    code?: string;
    owner_name?: string;
    address?: string;
    location?: string;
    district?: string;
    status?: string;
    radius?: number;
  };
  outlet_id?: string | number;
  user_id?: string | number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Allow other properties for backward compatibility
}

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

// Updated hook to fetch both plan visits and today visits using correct hooks
const useVisitData = () => {
  const { fetchVisits } = useVisit();
  const { fetchPlanVisits } = usePlanVisit();
  const [planVisits, setPlanVisits] = useState<Visit[]>([]);
  const [todayVisits, setTodayVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get today's date string
  const getTodayDateString = useCallback(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Fetch both plan visits and today visits
  const fetchAllVisits = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const todayStr = getTodayDateString();
      
      // Fetch plan visits using usePlanVisit hook with correct parameter format
      const planResult = await fetchPlanVisits({ 
        date: todayStr  // Plan visit menggunakan parameter 'date' untuk filter hari ini
      });
      
      // Fetch today visits using useVisit hook
      const todayResult = await fetchVisits({ 
        'filters[date]': todayStr  // Visit menggunakan format 'filters[date]'
      });
      
      if (planResult.success && todayResult.success) {
        // Convert PlanVisit to Visit format for consistency
        const convertedPlanVisits = (planResult.data || []).map((planVisit: any) => ({
          ...planVisit,
          checkin_time: null,
          checkout_time: null,
        }));
        
        setPlanVisits(convertedPlanVisits);
        setTodayVisits(todayResult.data || []);
      } else {
        setError(planResult.error || todayResult.error || 'Failed to fetch visits');
      }
    } catch (err: any) {
      setError('Failed to fetch visit data');
    } finally {
      setLoading(false);
    }
  }, [fetchVisits, fetchPlanVisits, getTodayDateString]);

  // Auto-refresh when screen focused
  useFocusEffect(
    useCallback(() => {
      fetchAllVisits();
    }, [fetchAllVisits])
  );

  return {
    planVisits,
    todayVisits,
    loading,
    error,
    refreshData: fetchAllVisits,
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
      className="flex-1 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 items-center min-h-[48px]"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.85}
    >
      <View className={`w-9 h-9 rounded-lg ${bgColor} items-center justify-center mb-2 border`} 
           style={{ borderColor: iconColor + '40' }}>
        <IconSymbol size={20} name={iconName} color={iconColor} />
      </View>
      <Text style={{ fontFamily: 'Inter' }} className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{title}</Text>
      <Text style={{ fontFamily: 'Inter' }} className="text-xs text-neutral-600 dark:text-neutral-400 text-center mt-1">{subtitle}</Text>
    </TouchableOpacity>
  );
});

const VisitCard = React.memo(function VisitCard({
  visit,
  colors,
  onStartPress,
  onCheckOutPress,
  onViewPress,
}: {
  visit: Visit;
  colors: any;
  onStartPress: () => void;
  onCheckOutPress: () => void;
  onViewPress: () => void;
}) {
  const getStatusColor = (checkinTime: string | null | undefined, checkoutTime: string | null | undefined) => {
    if (!checkinTime && !checkoutTime) {
      return { bg: '#f3f4f6', text: '#6b7280', label: 'PLANNED' };
    }
    if (checkinTime && !checkoutTime) {
      return { bg: '#fef3c7', text: '#d97706', label: 'ON VISIT' };
    }
    if (checkinTime && checkoutTime) {
      return { bg: '#dcfce7', text: '#16a34a', label: 'COMPLETED' };
    }
    return { bg: '#f3f4f6', text: '#6b7280', label: 'UNKNOWN' };
  };

  const statusColors = getStatusColor(visit.checkin_time, visit.checkout_time);
  const visitDate = new Date(visit.visit_date);
  const isToday = new Date().toDateString() === visitDate.toDateString();

  // Format waktu check-in/check-out
  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return null;
    try {
      return new Date(timeString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  const checkinTime = formatTime(visit.checkin_time);
  const checkoutTime = formatTime(visit.checkout_time);



  // Determine card action based on status
  const getCardAction = useCallback(() => {
    if (!visit.checkin_time && !visit.checkout_time) {
      return onStartPress; // PLANNED -> Start visit
    }
    if (visit.checkin_time && !visit.checkout_time) {
      return onCheckOutPress; // ON VISIT -> Check out
    }
    return onViewPress; // COMPLETED -> View detail
  }, [visit.checkin_time, visit.checkout_time, onStartPress, onCheckOutPress, onViewPress]);

  return (
    <View className="px-4 mb-3">
      <TouchableOpacity
        className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700"
        onPress={getCardAction()}
        activeOpacity={0.7}
      >
      {/* Header - Basic Outlet Info + Status Badge */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <Text 
            style={{ fontFamily: 'Inter' }} 
            className="text-base font-semibold text-neutral-900 dark:text-neutral-100"
            numberOfLines={1}
          >
            {visit.outlet?.name || 'Unknown Outlet'}
          </Text>
          <Text 
            style={{ fontFamily: 'Inter' }} 
            className="text-sm text-neutral-600 dark:text-neutral-400 mt-1"
            numberOfLines={1}
          >
            {visit.outlet?.code} {visit.outlet?.owner_name}
          </Text>
        </View>
        
        {/* Visit Status Badge */}
        <View 
          className="px-2 py-1 rounded-md"
          style={{ 
            backgroundColor: statusColors.bg
          }}
        >
          <Text 
            style={{ 
              fontFamily: 'Inter',
              color: statusColors.text,
              fontSize: 10,
              fontWeight: '600'
            }}
          >
            {statusColors.label}
          </Text>
        </View>
      </View>

      {/* Basic Visit Info */}
      <View className="flex-row justify-between items-center">
        {/* Visit Date */}
        <View className="flex-1">
          <Text 
            style={{ fontFamily: 'Inter' }} 
            className={`text-sm ${isToday ? 'font-semibold text-orange-500' : 'text-neutral-600 dark:text-neutral-400'}`}
          >
            {visitDate.toLocaleDateString('id-ID', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
            {isToday && ' (Hari Ini)'}
          </Text>
        </View>

        {/* Check-in/Check-out Times */}
        <View className="flex-row items-center">
          {checkinTime && (
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
              <Text 
                style={{ fontFamily: 'Inter' }} 
                className="text-sm text-neutral-600 dark:text-neutral-400"
              >
                {checkinTime}
              </Text>
            </View>
          )}
          
          {checkinTime && checkoutTime && (
            <View style={{ width: 8 }} />
          )}
          
          {checkoutTime && (
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-red-500 mr-1" />
              <Text 
                style={{ fontFamily: 'Inter' }} 
                className="text-sm text-neutral-600 dark:text-neutral-400"
              >
                {checkoutTime}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
    </View>
  );
});

/**
 * Modern Home Screen - Halaman utama aplikasi SAM
 * Mengikuti best practice: UI-only, menggunakan custom hooks untuk logic
 */
// Header component khusus untuk dashboard
const DashboardHeader = React.memo(function DashboardHeader({
  greeting,
  displayName,
  currentDate,
  colors,
}: {
  greeting: string;
  displayName: string;
  currentDate: string;
  colors: any;
}) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  
  const headerColors = {
    background: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff',
    border: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  };

  return (
    <View 
      className="border-b bg-white dark:bg-neutral-950"
      style={{
        paddingTop: insets.top,
        borderBottomColor: headerColors.border,
        backgroundColor: headerColors.background,
      }}
    >
      <View className="px-4 pb-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text style={{ fontFamily: 'Inter' }} className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
              {greeting},
            </Text>
            <Text style={{ fontFamily: 'Inter' }} className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              {displayName}
            </Text>
            <Text style={{ fontFamily: 'Inter' }} className="text-sm text-neutral-600 dark:text-neutral-400">
              {currentDate}
            </Text>
          </View>
          
          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 justify-center items-center relative"
            onPress={() => { }}
            accessibilityLabel="Notifikasi"
          >
            <IconSymbol size={24} name="bell" color={colors.textSecondary} />
            <View className="absolute top-2 right-2 w-3 h-3 rounded-full bg-orange-500" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

// Modern Compact Quick Action Button for sticky section
const ModernQuickActionButton = React.memo(function ModernQuickActionButton({
  onPress,
  iconName,
  iconColor,
  title,
  accessibilityLabel,
}: {
  onPress: () => void;
  iconName: string;
  iconColor: string;
  title: string;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.8}
      className="flex-1 bg-white dark:bg-neutral-950 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 items-center min-h-[80px]"
      style={{
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View 
        className="w-10 h-10 rounded-xl items-center justify-center mb-2"
        style={{
          backgroundColor: iconColor + '20',
        }}
      >
        <IconSymbol size={22} name={iconName} color={iconColor} />
      </View>
      <Text 
        style={{ fontFamily: 'Inter' }} 
        className="text-sm font-medium text-neutral-900 dark:text-neutral-100 text-center"
        numberOfLines={1}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
});

// Minimalist Tab Header Component
const TabHeader = React.memo(function TabHeader({
  activeTab,
  onTabChange,
  planCount,
  todayCount,
}: {
  activeTab: 'plan' | 'today';
  onTabChange: (tab: 'plan' | 'today') => void;
  planCount: number;
  todayCount: number;
}) {
  const colorScheme = useColorScheme();
  
  return (
    <View className="px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      <View className="flex-row bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
        <TouchableOpacity
          onPress={() => onTabChange('plan')}
          className={`flex-1 py-2 rounded-md ${activeTab === 'plan' ? 'bg-white dark:bg-neutral-700' : ''}`}
          style={{
            shadowColor: activeTab === 'plan' ? '#000000' : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: activeTab === 'plan' ? 0.1 : 0,
            shadowRadius: 2,
            elevation: activeTab === 'plan' ? 2 : 0,
          }}
        >
          <View className="flex-row items-center justify-center">
            <Text 
              style={{ fontFamily: 'Inter' }} 
              className={`text-sm font-medium ${
                activeTab === 'plan' 
                  ? 'text-neutral-900 dark:text-neutral-100' 
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Plan Visit
            </Text>
            {planCount > 0 && (
              <View 
                className="ml-2 w-5 h-5 rounded-full bg-blue-500 items-center justify-center"
              >
                <Text 
                  style={{ fontFamily: 'Inter' }} 
                  className="text-xs text-white font-medium"
                >
                  {planCount > 9 ? '9+' : planCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => onTabChange('today')}
          className={`flex-1 py-2 rounded-md ${activeTab === 'today' ? 'bg-white dark:bg-neutral-700' : ''}`}
          style={{
            shadowColor: activeTab === 'today' ? '#000000' : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: activeTab === 'today' ? 0.1 : 0,
            shadowRadius: 2,
            elevation: activeTab === 'today' ? 2 : 0,
          }}
        >
          <View className="flex-row items-center justify-center">
            <Text 
              style={{ fontFamily: 'Inter' }} 
              className={`text-sm font-medium ${
                activeTab === 'today' 
                  ? 'text-neutral-900 dark:text-neutral-100' 
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Visit
            </Text>
            {todayCount > 0 && (
              <View 
                className="ml-2 w-5 h-5 rounded-full bg-orange-500 items-center justify-center"
              >
                <Text 
                  style={{ fontFamily: 'Inter' }} 
                  className="text-xs text-white font-medium"
                >
                  {todayCount > 9 ? '9+' : todayCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Empty state for visits
const VisitsEmptyState = React.memo(function VisitsEmptyState({
  loading,
  error,
  colors,
  activeTab,
}: {
  loading: boolean;
  error: string | null;
  colors: any;
  activeTab: 'plan' | 'today';
}) {
  if (loading) {
    return (
      <View className="items-center py-12 mx-4">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text 
          style={{ fontFamily: 'Inter' }} 
          className="mt-4 text-base text-neutral-600 dark:text-neutral-400"
        >
          Memuat kunjungan...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="mx-4">
        <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <View className="flex-row items-center justify-center">
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.danger} />
            <Text style={{ fontFamily: 'Inter' }} className="text-base text-red-600 dark:text-red-400 ml-3">
              Gagal memuat data kunjungan
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Different empty states based on active tab
  const emptyContent = activeTab === 'plan' 
    ? {
        icon: 'calendar.badge.plus',
        title: 'Belum ada plan visit',
        subtitle: 'Plan visit yang dijadwalkan akan muncul di sini',
        bgColor: colors.primary + '20'
      }
    : {
        icon: 'checkmark.seal',
        title: 'Belum ada kunjungan',
        subtitle: 'Kunjungan yang sudah dimulai akan muncul di sini',
        bgColor: colors.success + '20'
      };

  return (
    <View className="items-center py-16 mx-4">
      <View 
        className="w-16 h-16 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: emptyContent.bgColor }}
      >
        <IconSymbol name={emptyContent.icon} size={32} color={activeTab === 'plan' ? colors.primary : colors.success} />
      </View>
      <Text 
        style={{ fontFamily: 'Inter' }} 
        className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2"
      >
        {emptyContent.title}
      </Text>
      <Text 
        style={{ fontFamily: 'Inter' }} 
        className="text-base text-neutral-600 dark:text-neutral-400 text-center"
      >
        {emptyContent.subtitle}
      </Text>
    </View>
  );
});

// Sticky Quick Actions Section (not floating, stays after header)
const StickyQuickActions = React.memo(function StickyQuickActions({
  handleQuickActions,
  colors,
}: {
  handleQuickActions: any;
  colors: any;
}) {
  return (
    <View className="bg-neutral-50 dark:bg-neutral-900 px-4 pt-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
      <View className="flex-row" style={{ gap: 6 }}>
        <ModernQuickActionButton
          onPress={handleQuickActions.liveVisit}
          iconName="checkmark.seal.fill"
          iconColor="#f97316"
          title="Live Visit"
          accessibilityLabel="Mulai Live Visit"
        />
        <ModernQuickActionButton
          onPress={handleQuickActions.planVisit}
          iconName="calendar.badge.plus"
          iconColor="#10b981"
          title="Plan Visit"
          accessibilityLabel="Rencanakan kunjungan"
        />
        <ModernQuickActionButton
          onPress={handleQuickActions.registerOutlet}
          iconName="plus.circle.fill"
          iconColor="#3b82f6"
          title="Register"
          accessibilityLabel="Daftarkan outlet baru"
        />
      </View>
    </View>
  );
});

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const user = useUserData?.() ?? null;
  const displayName = user?.name || user?.username || 'User';
  const { isConnected } = useNetwork();

  // Custom hooks
  const { formatDate, getGreeting } = useDateTime();
  const { planVisits, todayVisits, loading, error, refreshData } = useVisitData();
  
  // Tab state with auto-select logic
  const [activeTab, setActiveTab] = useState<'plan' | 'today'>('plan');
  
  // Auto-select tab based on data count
  useEffect(() => {
    if (planVisits.length > todayVisits.length) {
      setActiveTab('plan');
    } else if (todayVisits.length > planVisits.length) {
      setActiveTab('today');
    }
    // If equal, keep current tab or default to 'plan'
  }, [planVisits.length, todayVisits.length]);

  // Get current visits based on active tab
  const currentVisits = activeTab === 'plan' ? planVisits : todayVisits;

  const {
    showModal,
    modalType,
    requestLocationWithModal,
    requestCameraWithModal,
    handleModalRequestPermission,
    handleModalOpenSettings,
    closeModal,
    isPermissionPermanentlyDenied,
  } = usePermissionWithModal();

  // Handler permission blocking universal
  const handleWithPermission = useCallback(
    async (action: () => void, type: 'location' | 'camera' | 'both') => {
      let granted = false;
      
      if (type === 'location') {
        const res = await requestLocationWithModal();
        granted = res.granted;
      } else if (type === 'camera') {
        const res = await requestCameraWithModal();
        granted = res.granted;
      } else if (type === 'both') {
        // Request location first, then camera
        const locationRes = await requestLocationWithModal();
        if (locationRes.granted) {
          const cameraRes = await requestCameraWithModal();
          granted = cameraRes.granted;
        } else {
          granted = false;
        }
      }
      
      if (granted) action();
    },
    [requestLocationWithModal, requestCameraWithModal]
  );

  // Memoized values
  const greeting = useMemo(() => getGreeting(), [getGreeting]);
  const currentDate = useMemo(() => formatDate(), [formatDate]);

  // Handler untuk quick actions
  const handleQuickActions = useMemo(() => ({
    liveVisit: () => handleWithPermission(() => router.push('/visit/check-in'), 'both'),
    planVisit: () => handleWithPermission(() => router.push('/plan-visit'), 'location'),
    registerOutlet: () => handleWithPermission(() => router.push('/outlet/create'), 'both'),
    viewAllVisits: () => router.push('/visits'),
  }), [handleWithPermission]);

  // Handler untuk visit actions  
  const handleVisitActions = useMemo(() => ({
    start: (visitId: string) => handleWithPermission(() => router.push({ pathname: '/visit/check-in', params: { id: visitId } }), 'both'),
    checkOut: (visitId: string) => handleWithPermission(() => router.push({ pathname: '/visit/check-out', params: { id: visitId } }), 'both'),
    view: (visitId: string) => router.push({ pathname: '/visit/view', params: { id: visitId } }),
  }), [handleWithPermission]);

  // Pull to refresh handler
  const handleRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900" edges={isConnected ? [] : ['left','right']}>
      {/* Dashboard Header */}
      <DashboardHeader
        greeting={greeting}
        displayName={displayName}
        currentDate={currentDate}
        colors={colors}
      />

      {/* Sticky Quick Actions */}
      <StickyQuickActions
        handleQuickActions={handleQuickActions}
        colors={colors}
      />

      {/* Tab Header */}
      <TabHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        planCount={planVisits.length}
        todayCount={todayVisits.length}
      />

      {/* Scrollable Visit List */}
      <FlatList<Visit>
        data={currentVisits}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        onRefresh={handleRefresh}
        refreshing={loading}
        renderItem={({ item }) => (
          <VisitCard
            visit={item}
            colors={colors}
            onStartPress={() => handleVisitActions.start(String(item.id))}
            onCheckOutPress={() => handleVisitActions.checkOut(String(item.id))}
            onViewPress={() => handleVisitActions.view(String(item.id))}
          />
        )}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        style={{ backgroundColor: 'transparent' }}
        ListEmptyComponent={
          <VisitsEmptyState
            loading={loading}
            error={error}
            colors={colors}
            activeTab={activeTab}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
      />
      
      <PermissionBottomSheet
        visible={showModal}
        type={modalType}
        onRequestPermission={handleModalRequestPermission}
        onClose={closeModal}
        onOpenSettings={handleModalOpenSettings}
        isDenied={isPermissionPermanentlyDenied(modalType)}
      />
    </SafeAreaView>
  );
}

// Note: StyleSheet removed to fix linter errors. File uses Tailwind classes for now.
// Full refactor to StyleSheet can be done later when spacing/typography constants are properly imported.
