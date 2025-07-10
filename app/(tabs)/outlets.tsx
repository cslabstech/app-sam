import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { useDebounce } from 'use-debounce';

import { AdvancedFilterBottomSheet, type AdvancedFilterBottomSheetRef } from '@/components/AdvancedFilterBottomSheet';
import { HeaderSearchFilter } from '@/components/HeaderSearchFilter';
import OutletItem from '@/components/OutletItem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';

import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/context/network-context';
import { useOutlet } from '@/hooks/data/useOutlet';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

type SortColumn = 'name'|'code'|'district'|'status';

const useOutletFilters = () => {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<'asc'|'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Create a debounced search value to reduce API calls
  const [debouncedInputValue] = useDebounce(inputValue, 300);

  // Update searchQuery when debounced value changes
  useEffect(() => {
    setSearchQuery(debouncedInputValue);
  }, [debouncedInputValue]);

  // Reset to page 1 when search/filter/sort parameters change
  React.useEffect(() => { 
    setPage(1); 
  }, [searchQuery, perPage, sortColumn, sortDirection, filters]);

  // Handle text input changes
  const handleSearchInput = useCallback((text: string) => {
    setInputValue(text);
  }, []);

  // Clear search input
  const clearSearch = useCallback(() => {
    setInputValue('');
    setSearchQuery('');
  }, []);

  // Check if filters are active
  const hasActiveFilters = useCallback(() => {
    return perPage !== 10 || sortColumn !== 'name' || sortDirection !== 'asc';
  }, [perPage, sortColumn, sortDirection]);

  return {
    inputValue,
    searchQuery,
    refreshing,
    page,
    perPage,
    sortColumn,
    sortDirection,
    filters,
    setRefreshing,
    setPage,
    setPerPage,
    setSortColumn,
    setSortDirection,
    setFilters,
    handleSearchInput,
    clearSearch,
    hasActiveFilters,
  };
};

const useOutletActions = (fetchOutletsAdvanced: any, page: number, perPage: number, sortColumn: SortColumn, sortDirection: 'asc'|'desc', searchQuery: string, filters: Record<string, any>) => {
  // Fetch with advanced params
  const fetchPage = useCallback((newPage: number) => {
    fetchOutletsAdvanced({
      page: newPage,
      per_page: perPage,
      sort_column: sortColumn,
      sort_direction: sortDirection,
      search: searchQuery,
      filters,
    });
  }, [fetchOutletsAdvanced, perPage, sortColumn, sortDirection, searchQuery, filters]);

  // Fetch on mount and when params change
  React.useEffect(() => {
    fetchOutletsAdvanced({
      page,
      per_page: perPage,
      sort_column: sortColumn,
      sort_direction: sortDirection,
      search: searchQuery,
      filters,
    });
  }, [page, perPage, sortColumn, sortDirection, searchQuery, filters, fetchOutletsAdvanced]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async (setRefreshing: (value: boolean) => void, setPage: (value: number) => void) => {
    setRefreshing(true);
    fetchPage(1);
    setPage(1);
    setRefreshing(false);
  }, [fetchPage]);

  return {
    fetchPage,
    handleRefresh,
  };
};

const EmptyState = React.memo(function EmptyState({
  loading,
  searchQuery,
  colors
}: {
  loading: boolean;
  searchQuery: string;
  colors: any;
}) {
  if (loading) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text 
          style={{ fontFamily: 'Inter' }} 
          className="mt-3 text-base text-neutral-600 dark:text-neutral-400"
        >
          Loading outlets...
        </Text>
      </View>
    );
  }
  
  return (
    <View className="items-center py-12">
      <View 
        className="w-16 h-16 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: colors.primary + '20' }}
      >
        <IconSymbol name="building.2" size={32} color={colors.primary} />
      </View>
      <Text 
        style={{ fontFamily: 'Inter' }} 
        className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2"
      >
        {searchQuery ? 'No outlets found' : 'No outlets available'}
      </Text>
      <Text 
        style={{ fontFamily: 'Inter' }} 
        className="text-base text-neutral-600 dark:text-neutral-400 text-center mb-6"
      >
        {searchQuery 
          ? `No outlets match "${searchQuery}". Try adjusting your search.`
          : 'Start by adding your first outlet to get started.'
        }
      </Text>
      {!searchQuery && (
      <Button 
          title="Add First Outlet"
        variant="primary"
          size="md"
        onPress={() => router.push('/outlet/create')}
      />
      )}
    </View>
  );
});

const Pagination = React.memo(function Pagination({
  meta,
  page,
  loading,
  onPrevPage,
  onNextPage
}: {
  meta: any;
  page: number;
  loading: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}) {
  if (!meta || meta.last_page <= 1) return null;
  
  return (
    <View className="flex-row justify-between items-center mt-6 mx-4">
      <TouchableOpacity
         onPress={onPrevPage} 
        disabled={page <= 1 || loading}
        className="flex-row items-center px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700"
        style={{ 
          opacity: (page <= 1 || loading) ? 0.5 : 1,
          backgroundColor: 'rgba(249, 115, 22, 0.1)'
        }}
      >
        <IconSymbol name="chevron.left" size={16} color="#f97316" />
        <Text style={{ fontFamily: 'Inter' }} className="ml-1 text-orange-500 font-medium">
          Previous
        </Text>
      </TouchableOpacity>

      <View className="items-center">
        <Text style={{ fontFamily: 'Inter' }} className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          Page {page} of {meta.last_page}
        </Text>
        <Text style={{ fontFamily: 'Inter' }} className="text-xs text-neutral-600 dark:text-neutral-400">
          {meta.total} total outlets
         </Text>
       </View>
       
      <TouchableOpacity
         onPress={onNextPage} 
        disabled={page >= meta.last_page || loading}
        className="flex-row items-center px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700"
        style={{ 
          opacity: (page >= meta.last_page || loading) ? 0.5 : 1,
          backgroundColor: 'rgba(249, 115, 22, 0.1)'
        }}
      >
        <Text style={{ fontFamily: 'Inter' }} className="mr-1 text-orange-500 font-medium">
          Next
        </Text>
        <IconSymbol name="chevron.right" size={16} color="#f97316" />
      </TouchableOpacity>
    </View>
  );
});

export default function OutletsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isConnected } = useNetwork();

  // Get outlets data from the hook
  const { outlets, loading, meta, fetchOutletsAdvanced } = useOutlet('');

  // Custom hooks for state management
  const {
    inputValue,
    searchQuery,
    refreshing,
    page,
    perPage,
    sortColumn,
    sortDirection,
    filters,
    setRefreshing,
    setPage,
    setPerPage,
    setSortColumn,
    setSortDirection,
    setFilters,
    handleSearchInput,
    clearSearch,
    hasActiveFilters,
  } = useOutletFilters();

  const { fetchPage, handleRefresh } = useOutletActions(
    fetchOutletsAdvanced, 
    page, 
    perPage, 
    sortColumn, 
    sortDirection, 
    searchQuery, 
    filters
  );

  // Advanced filter bottom sheet ref
  const filterBottomSheetRef = React.useRef<AdvancedFilterBottomSheetRef>(null);

  // Pagination handlers
  const handleNextPage = useCallback(() => {
    if (meta && page < meta.last_page) {
      const newPage = page + 1;
      setPage(newPage);
      fetchPage(newPage);
    }
  }, [meta, page, setPage, fetchPage]);
  
  const handlePrevPage = useCallback(() => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      fetchPage(newPage);
    }
  }, [page, setPage, fetchPage]);

  const handleRefreshWrapper = useCallback(() => {
    handleRefresh(setRefreshing, setPage);
  }, [handleRefresh, setRefreshing, setPage]);

  // Advanced filter handlers
  const handleAdvancedFilterPress = useCallback(() => {
    filterBottomSheetRef.current?.present();
  }, []);

  const handleFilterChange = useCallback((sectionKey: string, value: string | number | string[]) => {
    switch (sectionKey) {
      case 'perPage':
        setPerPage(value as number);
        setPage(1);
        break;
      case 'sortColumn':
        setSortColumn(value as SortColumn);
        break;
      case 'sortDirection':
        setSortDirection(value as 'asc' | 'desc');
        break;
      default:
        // Handle other filters
        setFilters(prev => ({ ...prev, [sectionKey]: value }));
        break;
    }
  }, [setPerPage, setPage, setSortColumn, setSortDirection, setFilters]);

  const handleApplyFilters = useCallback(() => {
    // Filters are applied automatically through useEffect in useOutletActions
    console.log('Filters applied');
  }, []);

  const handleClearFilters = useCallback(() => {
    setPerPage(10);
    setSortColumn('name');
    setSortDirection('asc');
    setFilters({});
    setPage(1);
  }, [setPerPage, setSortColumn, setSortDirection, setFilters, setPage]);

  // Prepare filter sections for bottom sheet
  const filterSections = React.useMemo(() => [
    {
      title: 'Jumlah Item per Halaman',
      key: 'perPage',
      options: [
        { label: '10 item', value: 10 },
        { label: '20 item', value: 20 },
        { label: '50 item', value: 50 },
        { label: '100 item', value: 100 },
      ],
      selectedValue: perPage,
    },
    {
      title: 'Urutkan Berdasarkan',
      key: 'sortColumn',
      options: [
        { label: 'Nama Outlet', value: 'name' },
        { label: 'Kode Outlet', value: 'code' },
        { label: 'Wilayah', value: 'district' },
        { label: 'Status', value: 'status' },
      ],
      selectedValue: sortColumn,
    },
    {
      title: 'Arah Pengurutan',
      key: 'sortDirection',
      options: [
        { label: 'A sampai Z', value: 'asc' },
        { label: 'Z sampai A', value: 'desc' },
      ],
      selectedValue: sortDirection,
    },
  ], [perPage, sortColumn, sortDirection]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900" edges={isConnected ? [] : ['left','right']}>
      {/* Header with Search and Filter */}
      <HeaderSearchFilter
        searchValue={inputValue}
        onSearchChange={handleSearchInput}
        onClearSearch={clearSearch}
        onAdvancedFilterPress={handleAdvancedFilterPress}
        placeholder="Cari outlet..."
        hasActiveFilter={hasActiveFilters()}
        showAdvancedFilter={true}
      />
      
      {/* Outlet List */}
      <FlatList
        data={outlets}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        onRefresh={handleRefreshWrapper}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <OutletItem outlet={item} />
        )}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        ListFooterComponent={
          <Pagination
            meta={meta}
            page={page}
            loading={loading}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
          />
        }
        ListEmptyComponent={
          <View className="mx-4 mt-10">
            <Card className="p-6 items-center justify-center border-0 shadow-sm">
              <EmptyState
                loading={loading}
                searchQuery={searchQuery}
                colors={colors}
              />
            </Card>
          </View>
        }
      />

      {/* Advanced Filter Bottom Sheet */}
      <AdvancedFilterBottomSheet
        ref={filterBottomSheetRef}
        sections={filterSections}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters()}
      />
    </SafeAreaView>
  );
}