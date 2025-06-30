import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  return (
    <View className="bg-primary-500 px-4 pb-4" style={{ paddingTop: insets.top + 8 }} >
      <View className="flex-row items-center justify-between">
        <Pressable onPress={onBack} className="p-1" accessibilityRole="button">
          <IconSymbol name="chevron.left" size={24} color={colors.textInverse} />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="text-white text-xl font-bold">
            Plan Visit
          </Text>
        </View>
        <Pressable onPress={onCreate} className="p-1" accessibilityRole="button">
          <IconSymbol name="plus" size={24} color={colors.textInverse} />
        </Pressable>
      </View>
    </View>
  );
});

const LoadingScreen = React.memo(function LoadingScreen({ colors }: { colors: any }) {
  return (
    <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ fontFamily: 'Inter', color: colors.textSecondary }} className="mt-4 text-base">
        Memuat...
      </Text>
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
  if (!error && !fetchError) return null;

  return (
    <View 
      className="rounded-lg p-3 mb-4 border"
      style={{ 
        backgroundColor: colors.danger + '20', 
        borderColor: colors.danger + '40' 
      }}
    >
      <Text style={{ fontFamily: 'Inter', color: colors.danger }} className="text-sm">
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
  return (
    <View className="flex-row items-center justify-between mb-4">
      <Text style={{ fontFamily: 'Inter', color: colors.textSecondary }} className="text-sm">
        {planVisits.length} dari {meta?.total || planVisits.length} plan visit
      </Text>
      {currentFilters.filterType !== 'all' && (
        <View className="flex-row items-center">
          <IconSymbol name="line.3.horizontal.decrease.circle" size={16} color={colors.primary} />
          <Text style={{ fontFamily: 'Inter', color: colors.primary }} className="text-xs ml-1 font-medium">
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
  return (
    <View 
      className="rounded-xl mb-3 p-4 border"
      style={[themeStyles.card.default]}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text style={[{ fontFamily: 'Inter' }, themeStyles.text.primary]} className="text-lg font-bold mb-1">
            {item.outlet?.name || 'Unknown Outlet'}
          </Text>
          <Text style={[{ fontFamily: 'Inter' }, themeStyles.text.secondary]} className="text-sm mb-1">
            {item.outlet?.code} • {item.outlet?.district || 'No District'}
          </Text>
          <Text style={[{ fontFamily: 'Inter' }, themeStyles.text.primary]} className="text-base mb-2">
            📅 {new Date(item.visit_date).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>
        <Pressable
          className="p-2"
          onPress={() => onDelete(item)}
          accessibilityRole="button"
          accessibilityLabel={`Hapus plan visit ${item.outlet?.name}`}
        >
          <IconSymbol name="trash" size={20} color={colors.danger} />
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
  return (
    <View className="flex-1 justify-center items-center">
      <IconSymbol name="calendar" size={60} color={colors.textSecondary} />
      <Text style={{ fontFamily: 'Inter', color: colors.textSecondary }} className="text-lg font-semibold mt-4">
        {currentFilters.filterType === 'all' 
          ? 'Belum ada plan visit'
          : 'Tidak ada plan visit'
        }
      </Text>
      <Text style={{ fontFamily: 'Inter', color: colors.textTertiary }} className="text-base mt-2 text-center">
        {currentFilters.filterType === 'all' 
          ? 'Tap tombol + untuk menambah plan visit baru'
          : 'Tidak ditemukan plan visit untuk filter yang dipilih'
        }
      </Text>
    </View>
  );
});

/**
 * Plan Visit List Screen - Daftar rencana kunjungan
 * Mengikuti best practice: UI-only components, custom hooks untuk logic
 */
export default function PlanVisitListScreen() {
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
    }, 200);
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

  // Render loading screen
  if (loading && !refreshing && planVisits.length === 0 && !fetchState.loading) {
    return <LoadingScreen colors={colors} />;
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900" style={{ backgroundColor: colors.background }}>
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
        
        {planVisits && planVisits.length > 0 ? (
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
              keyExtractor={(item, index) => String(item.id || `plan-visit-${index}`)}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              initialNumToRender={10}
              maxToRenderPerBatch={5}
              windowSize={10}
              getItemLayout={(data, index) => ({
                length: 120,
                offset: 120 * index,
                index,
              })}
            />
          </>
        ) : (
          <EmptyState currentFilters={currentFilters} colors={colors} />
        )}
      </View>
    </View>
  );
} 