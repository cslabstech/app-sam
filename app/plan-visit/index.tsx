import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const Header = ({ 
  colors, 
  insets, 
  onBack, 
  onCreate 
}: { 
  colors: any; 
  insets: any; 
  onBack: () => void;
  onCreate: () => void;
}) => (
  <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
    <View style={styles.headerContent}>
      <Pressable onPress={onBack} style={styles.headerButton} accessibilityRole="button">
        <IconSymbol name="chevron.left" size={24} color={colors.textInverse} />
      </Pressable>
      <View style={styles.headerTitleContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Plan Visit
        </Text>
      </View>
      <Pressable onPress={onCreate} style={styles.headerButton} accessibilityRole="button">
        <IconSymbol name="plus" size={24} color={colors.textInverse} />
      </Pressable>
    </View>
  </View>
);

const LoadingScreen = ({ colors }: { colors: any }) => (
  <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
      Memuat...
    </Text>
  </View>
);

const ErrorDisplay = ({ 
  error, 
  fetchError, 
  colors 
}: { 
  error: string | null; 
  fetchError: string | null; 
  colors: any;
}) => {
  if (!error && !fetchError) return null;

  return (
    <View style={[styles.errorContainer, { backgroundColor: colors.danger + '20', borderColor: colors.danger + '40' }]}>
      <Text style={[styles.errorText, { color: colors.danger }]}>
        {error || fetchError}
      </Text>
    </View>
  );
};

const LoadingIndicator = ({ 
  visible, 
  colors 
}: { 
  visible: boolean; 
  colors: any;
}) => {
  if (!visible) return null;

  return (
    <View style={styles.loadingIndicator}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
};

const ListHeader = ({ 
  planVisits, 
  meta, 
  currentFilters, 
  colors 
}: {
  planVisits: PlanVisit[];
  meta: any;
  currentFilters: FilterParams;
  colors: any;
}) => (
  <View style={styles.listHeader}>
    <Text style={[styles.countText, { color: colors.textSecondary }]}>
      {planVisits.length} dari {meta?.total || planVisits.length} plan visit
    </Text>
    {currentFilters.filterType !== 'all' && (
      <View style={styles.filterIndicator}>
        <IconSymbol name="line.3.horizontal.decrease.circle" size={16} color={colors.primary} />
        <Text style={[styles.filterText, { color: colors.primary }]}>
          Terfilter
        </Text>
      </View>
    )}
  </View>
);

const PlanVisitItem = ({ 
  item, 
  onDelete, 
  colors, 
  styles: themeStyles 
}: { 
  item: PlanVisit; 
  onDelete: (item: PlanVisit) => void; 
  colors: any;
  styles: any;
}) => (
  <View style={[styles.planVisitItem, themeStyles.card.default]}>
    <View style={styles.planVisitContent}>
      <View style={styles.planVisitInfo}>
        <Text style={[styles.planVisitTitle, themeStyles.text.primary]}>
          {item.outlet?.name || 'Unknown Outlet'}
        </Text>
        <Text style={[styles.planVisitSubtitle, themeStyles.text.secondary]}>
          {item.outlet?.code} • {item.outlet?.district || 'No District'}
        </Text>
        <Text style={[styles.planVisitDate, themeStyles.text.primary]}>
          📅 {new Date(item.visit_date).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>
      <Pressable
        style={styles.deleteButton}
        onPress={() => onDelete(item)}
        accessibilityRole="button"
        accessibilityLabel={`Hapus plan visit ${item.outlet?.name}`}
      >
        <IconSymbol name="trash" size={20} color={colors.danger} />
      </Pressable>
    </View>
  </View>
);

const EmptyState = ({ 
  currentFilters, 
  colors 
}: { 
  currentFilters: FilterParams; 
  colors: any;
}) => (
  <View style={styles.emptyState}>
    <IconSymbol name="calendar" size={60} color={colors.textSecondary} />
    <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
      {currentFilters.filterType === 'all' 
        ? 'Belum ada plan visit'
        : 'Tidak ada plan visit'
      }
    </Text>
    <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
      {currentFilters.filterType === 'all' 
        ? 'Tap tombol + untuk menambah plan visit baru'
        : 'Tidak ditemukan plan visit untuk filter yang dipilih'
      }
    </Text>
  </View>
);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        colors={colors}
        insets={insets}
        onBack={handleBack}
        onCreate={handleCreate}
      />

      <View style={styles.content}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
  },
  loadingIndicator: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  countText: {
    fontSize: 14,
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  planVisitItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
  },
  planVisitContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planVisitInfo: {
    flex: 1,
  },
  planVisitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planVisitSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  planVisitDate: {
    fontSize: 16,
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
}); 