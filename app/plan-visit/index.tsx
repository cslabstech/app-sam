import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
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

export default function PlanVisitListScreen() {
  const { planVisits, loading, error, meta, fetchPlanVisits, deletePlanVisit } = usePlanVisit();
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [currentFilters, setCurrentFilters] = useState<FilterParams>({
    filterType: 'all'
  });
  const [fetchState, setFetchState] = useState<FetchState>({
    loading: false,
    error: null,
    lastParams: ''
  });
  
  const { colors, styles } = useThemeStyles();
  const insets = useSafeAreaInsets();
  
  // Refs untuk tracking state dan cleanup
  const mounted = useRef(true);
  const abortController = useRef<AbortController | null>(null);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Cleanup on unmount
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

  // Convert filter params to API params - memoized function
  const getApiParams = useCallback((filters: FilterParams, pageNum: number) => {
    const params: Record<string, any> = {
      page: pageNum,
      per_page: perPage,
      sort_column: 'visit_date',
      sort_direction: 'desc',
    };

    // Add date filters based on filter type
    if (filters.filterType === 'month' && filters.month && filters.year) {
      params.month = filters.month;
      params.year = filters.year;
    } else if (filters.filterType === 'date' && filters.date) {
      params.date = filters.date;
    }

    return params;
  }, [perPage]);

  // Robust fetch function dengan abort controller dan debouncing
  const fetchData = useCallback(async (pageNum: number, filters: FilterParams, forceRefresh = false) => {
    if (!mounted.current) return;

    const apiParams = getApiParams(filters, pageNum);
    const paramsString = JSON.stringify(apiParams);
    
    // Prevent duplicate calls with same parameters unless forced
    if (!forceRefresh && fetchState.lastParams === paramsString) {
      return;
    }

    // Abort previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    // Clear existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Create new abort controller
    abortController.current = new AbortController();

    // Update fetch state
    setFetchState(prev => ({
      ...prev,
      loading: true,
      error: null,
      lastParams: paramsString
    }));

    try {
           // Add small delay untuk debouncing
     await new Promise(resolve => {
       fetchTimeoutRef.current = setTimeout(resolve, 100) as any;
     });

      if (!mounted.current) return;

      await fetchPlanVisits(apiParams);

      if (mounted.current) {
        setFetchState(prev => ({
          ...prev,
          loading: false,
          error: null
        }));
      }
    } catch (fetchError) {
      if (!mounted.current) return;

      // Handle abort errors gracefully
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }

      console.error('Fetch error:', fetchError);
      setFetchState(prev => ({
        ...prev,
        loading: false,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }));
    }
  }, [fetchPlanVisits, getApiParams, fetchState.lastParams]);

  // Handle filter changes dengan debouncing
  const handleFilterChange = useCallback((filters: FilterParams) => {
    if (!mounted.current) return;

    setCurrentFilters(filters);
    setPage(1); // Reset to page 1
    
    // Debounce filter changes
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      if (mounted.current) {
        fetchData(1, filters, true);
      }
    }, 200);
  }, [fetchData]);

  // Effect for fetching data when page changes (not filters)
  useEffect(() => {
    if (mounted.current && page > 1) {
      fetchData(page, currentFilters);
    }
  }, [page, fetchData, currentFilters]);

  // Initial load
  useEffect(() => {
    if (mounted.current) {
      fetchData(1, currentFilters, true);
    }
  }, []);

  // Refresh data setiap kali halaman di-focus
  useFocusEffect(
    useCallback(() => {
      if (!mounted.current) {
        mounted.current = true;
      }
      
      // Always refresh when focusing
      fetchData(page, currentFilters, true);
    }, [page, currentFilters, fetchData])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (!mounted.current) return;

    setRefreshing(true);
    try {
      await fetchData(1, currentFilters, true);
      if (mounted.current && page !== 1) {
        setPage(1);
      }
    } finally {
      if (mounted.current) {
        setRefreshing(false);
      }
    }
  }, [fetchData, currentFilters, page]);

  const handleDelete = useCallback(async (item: PlanVisit) => {
    if (!mounted.current || !item.id) {
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
              
              if (!mounted.current) return;
              
              if (result.success) {
                Alert.alert('Berhasil', 'Plan visit berhasil dihapus');
                // Refresh data after successful delete
                await fetchData(page, currentFilters, true);
              } else {
                Alert.alert('Error', result.error || 'Gagal menghapus plan visit');
              }
            } catch (deleteError) {
              if (mounted.current) {
                console.error('Delete error:', deleteError);
                Alert.alert('Error', 'Terjadi kesalahan saat menghapus data');
              }
            }
          },
        },
      ]
    );
  }, [deletePlanVisit, fetchData, page, currentFilters]);

  const handleCreate = useCallback(() => {
    router.push('/plan-visit/create');
  }, []);

  const renderPlanVisitItem = useCallback(({ item }: { item: PlanVisit }) => (
    <View style={[
      {
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
        borderWidth: 1,
      },
      styles.card.default
    ]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={[{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }, styles.text.primary]}>
            {item.outlet?.name || 'Unknown Outlet'}
          </Text>
          <Text style={[{ fontSize: 14, marginBottom: 4 }, styles.text.secondary]}>
            {item.outlet?.code} • {item.outlet?.district || 'No District'}
          </Text>
          <Text style={[{ fontSize: 16, marginBottom: 8 }, styles.text.primary]}>
            📅 {new Date(item.visit_date).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>
        <Pressable
          style={{ padding: 8 }}
          onPress={() => handleDelete(item)}
          accessibilityRole="button"
          accessibilityLabel={`Hapus plan visit ${item.outlet?.name}`}
        >
          <IconSymbol name="trash" size={20} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  ), [styles, colors, handleDelete]);

  // Show loading only on initial load
  if (loading && !refreshing && planVisits.length === 0 && !fetchState.loading) {
    return (
      <View style={[{ flex: 1 }, styles.background.primary]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary, fontSize: 16 }}>Memuat...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1 }, styles.background.primary]}>
      {/* Header */}
      <View style={[styles.header.primary, { paddingHorizontal: 16, paddingBottom: 16, paddingTop: insets.top + 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }} accessibilityRole="button">
            <IconSymbol name="chevron.left" size={24} color={colors.textInverse} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[{ fontSize: 20, fontWeight: 'bold' }, styles.text.inverse]}>Plan Visit</Text>
          </View>
          <Pressable onPress={handleCreate} style={{ padding: 4 }} accessibilityRole="button">
            <IconSymbol name="plus" size={24} color={colors.textInverse} />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        {/* Date Filter */}
        <DateFilter
          onFilterChange={handleFilterChange}
          initialFilters={currentFilters}
        />

        {/* Error Display */}
        {(error || fetchState.error) && (
          <View style={{
            backgroundColor: colors.danger + '10',
            borderColor: colors.danger + '30',
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16
          }}>
            <Text style={[styles.text.error]}>{error || fetchState.error}</Text>
          </View>
        )}

        {/* Loading Indicator for subsequent loads */}
        {fetchState.loading && planVisits.length > 0 && (
          <View style={{ paddingVertical: 8, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {planVisits && planVisits.length > 0 ? (
          <>
            {/* Results Count */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={[{ fontSize: 14 }, styles.text.secondary]}>
                {planVisits.length} dari {meta?.total || planVisits.length} plan visit
              </Text>
              {currentFilters.filterType !== 'all' && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconSymbol name="line.3.horizontal.decrease.circle" size={16} color={colors.primary} />
                  <Text style={[{ fontSize: 12, marginLeft: 4, fontWeight: '500' }, { color: colors.primary }]}>
                    Terfilter
                  </Text>
                </View>
              )}
            </View>

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
                length: 120, // Approximate item height
                offset: 120 * index,
                index,
              })}
            />
          </>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <IconSymbol name="calendar" size={60} color={colors.textSecondary} />
            <Text style={[{ fontSize: 18, fontWeight: '600', marginTop: 16 }, styles.text.secondary]}>
              {currentFilters.filterType === 'all' 
                ? 'Belum ada plan visit'
                : 'Tidak ada plan visit'
              }
            </Text>
            <Text style={[{ fontSize: 16, marginTop: 8, textAlign: 'center' }, styles.text.tertiary]}>
              {currentFilters.filterType === 'all' 
                ? 'Tap tombol + untuk menambah plan visit baru'
                : 'Tidak ditemukan plan visit untuk filter yang dipilih'
              }
            </Text>
          </View>
        )}
      </View>
    </View>
  );
} 