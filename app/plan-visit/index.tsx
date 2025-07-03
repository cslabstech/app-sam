import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router, useFocusEffect } from 'expo-router';

import { DateFilter } from '@/components/DateFilter';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { PlanVisit, usePlanVisit } from '@/hooks/data/usePlanVisit';
import { useThemeStyles } from '@/hooks/utils/useThemeStyles';

interface FilterParams {
  filterType: 'all' | 'month' | 'date';
  month?: string;
  year?: string;
  date?: string;
}

interface FetchState {
  loading: boolean;
  error: string | null;
  lastParams: string;
}

const usePlanVisitFilters = () => {
  const [currentFilters, setCurrentFilters] = useState<FilterParams>({
    filterType: 'all'
  });

  const getApiParams = useCallback((filters: FilterParams, pageNum: number, perPage: number) => {
    const params: Record<string, any> = {
      page: pageNum,
      per_page: perPage,
      sort_column: 'visit_date',
      sort_direction: 'desc',
    };

    if (filters.filterType === 'month' && filters.month && filters.year) {
      params.month = filters.month;
      params.year = filters.year;
    } else if (filters.filterType === 'date' && filters.date) {
      params.date = filters.date;
    }

    return params;
  }, []);

  const updateFilters = useCallback((filters: FilterParams) => {
    setCurrentFilters(filters);
  }, []);

  return {
    currentFilters,
    updateFilters,
    getApiParams,
  };
};

const usePlanVisitFetch = () => {
  const [fetchState, setFetchState] = useState<FetchState>({
    loading: false,
    error: null,
    lastParams: ''
  });
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);
  const abortController = useRef<AbortController | null>(null);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      mounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const executeFetch = useCallback(async (
    fetchFunction: (params: any) => Promise<any>,
    apiParams: Record<string, any>,
    forceRefresh = false
  ) => {
    if (!mounted.current) return;

    const paramsString = JSON.stringify(apiParams);
    
    if (!forceRefresh && fetchState.lastParams === paramsString) {
      return;
    }

    if (abortController.current) {
      abortController.current.abort();
    }

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    abortController.current = new AbortController();

    setFetchState(prev => ({
      ...prev,
      loading: true,
      error: null,
      lastParams: paramsString
    }));

    try {
      await new Promise(resolve => {
        fetchTimeoutRef.current = setTimeout(resolve, 100) as any;
      });

      if (!mounted.current) return;

      await fetchFunction(apiParams);

      if (mounted.current) {
        setFetchState(prev => ({
          ...prev,
          loading: false,
          error: null
        }));
      }
    } catch (error) {
      if (!mounted.current) return;

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }

      console.error('Fetch error:', error);
      setFetchState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [fetchState.lastParams]);

  const setRefreshState = useCallback((state: boolean) => {
    if (mounted.current) {
      setRefreshing(state);
    }
  }, []);

  return {
    fetchState,
    refreshing,
    executeFetch,
    setRefreshState,
    mounted,
  };
};

const usePlanVisitActions = () => {
  const { deletePlanVisit } = usePlanVisit();

  const handleDelete = useCallback(async (
    item: PlanVisit,
    onSuccess: () => void
  ) => {
    if (!item.id) {
      Alert.alert('Error', 'ID plan visit tidak ditemukan');
      return;
    }

    Alert.alert(
      'Hapus Plan Visit',
      `Yakin ingin menghapus plan visit untuk ${item.outlet?.name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deletePlanVisit(item.id);
              
              if (result.success) {
                Alert.alert('Berhasil', 'Plan visit berhasil dihapus');
                onSuccess();
              } else {
                Alert.alert('Error', result.error || 'Gagal menghapus plan visit');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Terjadi kesalahan saat menghapus data');
            }
          },
        },
      ]
    );
  }, [deletePlanVisit]);

  const handleCreate = useCallback(() => {
    router.push('/plan-visit/create');
  }, []);

  return {
    handleDelete,
    handleCreate,
  };
};

const Header = React.memo(function Header({ 
  colors, 
  insets, 
  onBack, 
  onCreate 
}: { 
  colors: any; 
  insets: any; 
  onBack: () => void;
  onCreate: () => void;
}) {
  const headerStyle = useMemo(() => ({ 
    paddingTop: insets.top + 12, 
    backgroundColor: colors.primary 
  }), [insets.top, colors.primary]);

  return (
    <View className="px-4 pb-4" style={headerStyle}>
      <View className="flex-row items-center justify-between">
        <Pressable 
          onPress={onBack} 
          className="w-8 h-8 items-center justify-center" 
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </Pressable>
        <View className="flex-1 items-center mx-4">
          <Text className="text-white text-xl font-semibold" style={{ fontFamily: 'Inter_600SemiBold' }}>
            Plan Visit
          </Text>
        </View>
        <Pressable 
          onPress={onCreate} 
          className="w-8 h-8 items-center justify-center" 
          accessibilityRole="button"
          accessibilityLabel="Tambah plan visit"
        >
          <IconSymbol name="plus" size={24} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
});

const LoadingScreen = React.memo(function LoadingScreen({ colors }: { colors: any }) {
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 justify-center items-center px-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-base" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
          Memuat plan visit...
        </Text>
      </View>
    </View>
  );
});

const ErrorDisplay = React.memo(function ErrorDisplay({ 
  error, 
  fetchError, 
  colors 
}: { 
  error: string | null; 
  fetchError: string | null; 
  colors: any;
}) {
  const errorStyle = useMemo(() => ({ 
    backgroundColor: colors.danger + '10', 
    borderColor: colors.danger + '30' 
  }), [colors.danger]);

  if (!error && !fetchError) return null;

  return (
    <View className="rounded-lg p-3 mb-4 border" style={errorStyle}>
      <Text className="text-sm" style={{ fontFamily: 'Inter_400Regular', color: colors.danger }}>
        {error || fetchError}
      </Text>
    </View>
  );
});

const LoadingIndicator = React.memo(function LoadingIndicator({ 
  visible, 
  colors 
}: { 
  visible: boolean; 
  colors: any;
}) {
  if (!visible) return null;

  return (
    <View className="py-2 items-center">
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
});

const ListHeader = React.memo(function ListHeader({ 
  planVisits, 
  meta, 
  currentFilters, 
  colors 
}: {
  planVisits: PlanVisit[];
  meta: any;
  currentFilters: FilterParams;
  colors: any;
}) {
  const isFiltered = useMemo(() => 
    currentFilters.filterType !== 'all',
    [currentFilters.filterType]
  );

  const totalText = useMemo(() => 
    `${planVisits.length} dari ${meta?.total || planVisits.length} plan visit`,
    [planVisits.length, meta?.total]
  );

  return (
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-sm" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
        {totalText}
      </Text>
      {isFiltered && (
        <View className="flex-row items-center">
          <IconSymbol name="line.3.horizontal.decrease.circle" size={16} color={colors.primary} />
          <Text className="text-xs ml-1 font-medium" style={{ fontFamily: 'Inter_500Medium', color: colors.primary }}>
            Terfilter
          </Text>
        </View>
      )}
    </View>
  );
});

const PlanVisitItem = React.memo(function PlanVisitItem({ 
  item, 
  onDelete, 
  colors, 
  styles: themeStyles 
}: { 
  item: PlanVisit; 
  onDelete: (item: PlanVisit) => void; 
  colors: any;
  styles: any;
}) {
  const cardStyle = useMemo(() => ({ 
    backgroundColor: colors.card, 
    borderColor: colors.border, 
    minHeight: 48 
  }), [colors.card, colors.border]);

  const iconBackgroundStyle = useMemo(() => ({ 
    backgroundColor: colors.primary + '20' 
  }), [colors.primary]);

  const visitDate = useMemo(() => 
    new Date(item.visit_date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    [item.visit_date]
  );

  const handleDeletePress = useCallback(() => {
    onDelete(item);
  }, [onDelete, item]);

  return (
    <View className="rounded-lg border p-3 mb-3 shadow-sm" style={cardStyle}>
      <View className="flex-row justify-between items-start">
        <View className="flex-1 flex-row items-center">
          <View className="w-9 h-9 rounded-lg items-center justify-center mr-3" style={iconBackgroundStyle}>
            <IconSymbol name="building.2" size={18} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium mb-0.5" style={{ fontFamily: 'Inter_500Medium', color: colors.text }}>
              {item.outlet?.name || 'Unknown Outlet'}
            </Text>
            <Text className="text-xs" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
              {item.outlet?.code} • {item.outlet?.district || 'No District'}
            </Text>
            <Text className="text-xs mt-1" style={{ fontFamily: 'Inter_400Regular', color: colors.text }}>
              {visitDate}
            </Text>
          </View>
        </View>
        <Pressable
          className="w-8 h-8 items-center justify-center"
          onPress={handleDeletePress}
          accessibilityRole="button"
          accessibilityLabel={`Hapus plan visit ${item.outlet?.name}`}
        >
          <IconSymbol name="trash" size={18} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
});

const EmptyState = React.memo(function EmptyState({ 
  currentFilters, 
  colors 
}: { 
  currentFilters: FilterParams; 
  colors: any;
}) {
  const emptyIconStyle = useMemo(() => ({ 
    backgroundColor: colors.textSecondary + '20' 
  }), [colors.textSecondary]);

  const isFilteredView = useMemo(() => 
    currentFilters.filterType === 'all',
    [currentFilters.filterType]
  );

  const title = useMemo(() => 
    isFilteredView ? 'Belum ada plan visit' : 'Tidak ada plan visit',
    [isFilteredView]
  );

  const subtitle = useMemo(() => 
    isFilteredView 
      ? 'Tap tombol + untuk menambah plan visit baru'
      : 'Tidak ditemukan plan visit untuk filter yang dipilih',
    [isFilteredView]
  );

  return (
    <View className="flex-1 justify-center items-center px-6">
      <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={emptyIconStyle}>
        <IconSymbol name="calendar" size={32} color={colors.textSecondary} />
      </View>
      <Text className="text-lg font-semibold text-center mb-2" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
        {title}
      </Text>
      <Text className="text-sm text-center" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
        {subtitle}
      </Text>
    </View>
  );
});

/**
 * Plan Visit List Screen - Daftar rencana kunjungan
 * Mengikuti best practice: UI-only components, custom hooks untuk logic
 */
export default React.memo(function PlanVisitListScreen() {
  const { planVisits, loading, error, meta, fetchPlanVisits } = usePlanVisit();
  const { colors, styles: themeStyles } = useThemeStyles();
  const insets = useSafeAreaInsets();
  
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  // Custom hooks
  const { currentFilters, updateFilters, getApiParams } = usePlanVisitFilters();
  const { fetchState, refreshing, executeFetch, setRefreshState, mounted } = usePlanVisitFetch();
  const { handleDelete, handleCreate } = usePlanVisitActions();

  // Optimized callbacks
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const fetchData = useCallback(async (pageNum: number, filters: FilterParams, forceRefresh = false) => {
    const apiParams = getApiParams(filters, pageNum, perPage);
    await executeFetch(fetchPlanVisits, apiParams, forceRefresh);
  }, [getApiParams, perPage, executeFetch, fetchPlanVisits]);

  const handleFilterChange = useCallback((filters: FilterParams) => {
    if (!mounted.current) return;

    updateFilters(filters);
    setPage(1);
    
    setTimeout(() => {
      if (mounted.current) {
        fetchData(1, filters, true);
      }
    }, 50); // Reduced timeout for better performance
  }, [mounted, updateFilters, fetchData]);

  const handleRefresh = useCallback(async () => {
    if (!mounted.current) return;

    setRefreshState(true);
    try {
      await fetchData(1, currentFilters, true);
      if (mounted.current && page !== 1) {
        setPage(1);
      }
    } finally {
      setRefreshState(false);
    }
  }, [mounted, setRefreshState, fetchData, currentFilters, page]);

  const handleDeleteSuccess = useCallback(async () => {
    await fetchData(page, currentFilters, true);
  }, [fetchData, page, currentFilters]);

  const handleItemDelete = useCallback((item: PlanVisit) => {
    handleDelete(item, handleDeleteSuccess);
  }, [handleDelete, handleDeleteSuccess]);

  const renderPlanVisitItem = useCallback(({ item }: { item: PlanVisit }) => (
    <PlanVisitItem
      item={item}
      onDelete={handleItemDelete}
      colors={colors}
      styles={themeStyles}
    />
  ), [handleItemDelete, colors, themeStyles]);

  const keyExtractor = useCallback((item: PlanVisit, index: number) => 
    String(item.id || `plan-visit-${index}`),
    []
  );

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 120,
    offset: 120 * index,
    index,
  }), []);

  const refreshControl = useMemo(() => (
    <RefreshControl 
      refreshing={refreshing} 
      onRefresh={handleRefresh}
      colors={[colors.primary]}
      tintColor={colors.primary}
    />
  ), [refreshing, handleRefresh, colors.primary]);

  // Effects
  useEffect(() => {
    if (mounted.current && page > 1) {
      fetchData(page, currentFilters);
    }
  }, [page, fetchData, currentFilters]);

  useEffect(() => {
    if (mounted.current) {
      fetchData(1, currentFilters, true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!mounted.current) {
        mounted.current = true;
      }
      fetchData(page, currentFilters, true);
    }, [page, currentFilters, fetchData])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  // Render loading screen
  if (loading && !refreshing && planVisits.length === 0 && !fetchState.loading) {
    return <LoadingScreen colors={colors} />;
  }

  const hasData = useMemo(() => 
    planVisits && planVisits.length > 0,
    [planVisits]
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header
        colors={colors}
        insets={insets}
        onBack={handleBack}
        onCreate={handleCreate}
      />

      <View className="flex-1 px-4 pt-4">
        <DateFilter
          onFilterChange={handleFilterChange}
          initialFilters={currentFilters}
        />
        
        <ErrorDisplay
          error={error}
          fetchError={fetchState.error}
          colors={colors}
        />
        
        <LoadingIndicator
          visible={fetchState.loading && planVisits.length > 0}
          colors={colors}
        />
        
        {hasData ? (
          <>
            <ListHeader
              planVisits={planVisits}
              meta={meta}
              currentFilters={currentFilters}
              colors={colors}
            />
            <FlatList
              data={planVisits}
              renderItem={renderPlanVisitItem}
              keyExtractor={keyExtractor}
              refreshControl={refreshControl}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              initialNumToRender={8}
              maxToRenderPerBatch={5}
              windowSize={8}
              getItemLayout={getItemLayout}
            />
          </>
        ) : (
          <EmptyState currentFilters={currentFilters} colors={colors} />
        )}
      </View>
    </View>
  );
}); 