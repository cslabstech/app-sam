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

export default function PlanVisitListScreen() {
  const { planVisits, loading, error, meta, fetchPlanVisits, deletePlanVisit } = usePlanVisit();
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [currentFilters, setCurrentFilters] = useState<FilterParams>({
    filterType: 'all'
  });
  const { colors, styles } = useThemeStyles();
  const insets = useSafeAreaInsets();
  
  // Track mounted state and last fetch params to prevent duplicate calls
  const isMounted = useRef(true);
  const lastFetchParamsRef = useRef<string>('');

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
      // Filter by month and year
      params.month = filters.month;
      params.year = filters.year;
    } else if (filters.filterType === 'date' && filters.date) {
      // Filter by specific date
      params.date = filters.date;
    }

    return params;
  }, [perPage]);

  // Fetch function that doesn't change reference unnecessarily
  const fetchData = useCallback(async (pageNum: number, filters: FilterParams) => {
    const apiParams = getApiParams(filters, pageNum);
    const paramsString = JSON.stringify(apiParams);
    
    // Prevent duplicate calls with same parameters
    if (lastFetchParamsRef.current === paramsString) {
      return;
    }
    
    lastFetchParamsRef.current = paramsString;
    await fetchPlanVisits(apiParams);
  }, [fetchPlanVisits, getApiParams]);

  // Handle filter changes
  const handleFilterChange = useCallback((filters: FilterParams) => {
    setCurrentFilters(filters);
    setPage(1); // Reset to page 1
  }, []);

  // Effect for fetching data when page or filters change
  useEffect(() => {
    if (isMounted.current) {
      fetchData(page, currentFilters);
    }
  }, [page, currentFilters, fetchData]);

  // Refresh data setiap kali halaman di-focus (ketika kembali dari halaman lain)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if component is still mounted
      if (!isMounted.current) {
        isMounted.current = true;
      }
      
      // Always reset to page 1 when focusing
      if (page !== 1) {
        setPage(1);
      } else {
        // Only fetch if we're already on page 1
        fetchData(1, currentFilters);
      }
    }, [currentFilters, page, fetchData])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Reset last fetch params to allow refresh
      lastFetchParamsRef.current = '';
      await fetchData(1, currentFilters);
      setPage(1);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, currentFilters]);

  const handleDelete = useCallback(async (item: PlanVisit) => {
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
            const result = await deletePlanVisit(item.id);
            
            if (result.success) {
              Alert.alert('Berhasil', 'Plan visit berhasil dihapus');
              // Reset last fetch params to allow refresh after delete
              lastFetchParamsRef.current = '';
              await fetchData(page, currentFilters);
            } else {
              Alert.alert('Error', result.error || 'Gagal menghapus plan visit');
            }
          },
        },
      ]
    );
  }, [deletePlanVisit, fetchData, page, currentFilters]);

  const handleCreate = () => {
    router.push('/plan-visit/create');
  };

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
            {item.outlet?.code} • {item.outlet?.district}
          </Text>
          <Text style={[{ fontSize: 16, marginBottom: 8 }, styles.text.primary]}>
            📅 {new Date(item.visit_date).toLocaleDateString('id-ID')}
          </Text>
        </View>
        <Pressable
          style={{ padding: 8 }}
          onPress={() => handleDelete(item)}
          accessibilityRole="button"
        >
          <IconSymbol name="trash" size={20} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  ), [styles, colors, handleDelete]);

  if (loading && !refreshing && planVisits.length === 0) {
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

        {error && (
          <View style={{
            backgroundColor: colors.danger + '10',
            borderColor: colors.danger + '30',
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16
          }}>
            <Text style={[styles.text.error]}>{error}</Text>
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
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              initialNumToRender={10}
              maxToRenderPerBatch={5}
              windowSize={10}
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