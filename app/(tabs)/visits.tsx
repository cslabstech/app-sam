import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { useDebounce } from 'use-debounce';

import { AdvancedFilterBottomSheet, type AdvancedFilterBottomSheetRef } from '@/components/AdvancedFilterBottomSheet';
import { HeaderSearchFilter } from '@/components/HeaderSearchFilter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';

import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/context/network-context';
import { useVisit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

type FilterType = 'All' | 'extracall' | 'planned';
type SortColumn = 'visit_date' | 'outlet.name' | 'type';

const useVisitFilters = () => {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<SortColumn>('visit_date');
  const [sortDirection, setSortDirection] = useState<'asc'|'desc'>('desc');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  
  const getFilterParam = useCallback((filter: FilterType): Record<string, any> => {
    switch (filter) {
      case 'extracall':
        return { 'filters[type]': 'extracall' };
      case 'planned':
        return { 'filters[type]': 'planned' };
      default:
        return {};
    }
  }, []);

  // Create a debounced search value to reduce API calls
  const [debouncedInputValue] = useDebounce(inputValue, 300);

  // Update searchQuery when debounced value changes
  useEffect(() => {
    setSearchQuery(debouncedInputValue);
  }, [debouncedInputValue]);

  React.useEffect(() => { 
    setPage(1); 
  }, [searchQuery, perPage, sortColumn, sortDirection, selectedFilter, dateFilter]);

  const handleSearchInput = useCallback((text: string) => {
    setInputValue(text);
  }, []);

  const clearSearch = useCallback(() => {
    setInputValue('');
    setSearchQuery('');
  }, []);

  // Check if filters are active
  const hasActiveFilters = useCallback(() => {
    return perPage !== 10 || sortColumn !== 'visit_date' || sortDirection !== 'desc' || selectedFilter !== 'All';
  }, [perPage, sortColumn, sortDirection, selectedFilter]);

  return {
    inputValue,
    searchQuery,
    refreshing,
    page,
    perPage,
    sortColumn,
    sortDirection,
    selectedFilter,
    dateFilter,
    setRefreshing,
    setPage,
    setPerPage,
    setSortColumn,
    setSortDirection,
    setSelectedFilter,
    setDateFilter,
    getFilterParam,
    handleSearchInput,
    clearSearch,
    hasActiveFilters,
  };
};

const useVisitActions = (fetchVisits: any, page: number, perPage: number, sortColumn: SortColumn, sortDirection: 'asc'|'desc', searchQuery: string, selectedFilter: FilterType, getFilterParam: (filter: FilterType) => Record<string, any>) => {
  const fetchPage = useCallback((newPage: number) => {
    fetchVisits({
      page: newPage,
      per_page: perPage,
      sort_column: sortColumn,
      sort_direction: sortDirection,
      search: searchQuery,
      ...getFilterParam(selectedFilter),
    });
  }, [fetchVisits, perPage, sortColumn, sortDirection, searchQuery, selectedFilter, getFilterParam]);

  React.useEffect(() => {
    fetchVisits({
      page,
      per_page: perPage,
      sort_column: sortColumn,
      sort_direction: sortDirection,
      search: searchQuery,
      ...getFilterParam(selectedFilter),
    });
  }, [page, perPage, sortColumn, sortDirection, searchQuery, selectedFilter, fetchVisits, getFilterParam]);

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
          Loading visits...
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
        <IconSymbol name="calendar" size={32} color={colors.primary} />
      </View>
      <Text 
        style={{ fontFamily: 'Inter' }} 
        className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2"
      >
        {searchQuery ? 'No visits found' : 'No visits available'}
      </Text>
      <Text 
        style={{ fontFamily: 'Inter' }} 
        className="text-base text-neutral-600 dark:text-neutral-400 text-center mb-6"
      >
        {searchQuery 
          ? `No visits match "${searchQuery}". Try adjusting your search.`
          : 'Start by planning your first outlet visit.'
        }
      </Text>
      {!searchQuery && (
        <Button
          title="Plan Visit"
          variant="primary"
          size="md"
          onPress={() => router.push('/plan-visit')}
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
    <View className="flex-row justify-between items-center mt-6 px-2">
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
          {meta.total} total visits
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

const VisitCard = React.memo(function VisitCard({
  item,
  colors,
  onPress
}: {
  item: any;
  colors: any;
  onPress: () => void;
}) {
  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'planned': return { bg: '#dbeafe', text: '#1d4ed8' };
      case 'extracall': return { bg: '#fef3c7', text: '#d97706' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const typeColors = getTypeColor(item.type);
  const visitDate = new Date(item.visit_date);
  const isToday = new Date().toDateString() === visitDate.toDateString();

  // Format waktu check-in/check-out
  const formatTime = (timeString: string | null) => {
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

  const checkinTime = formatTime(item.checkin_time);
  const checkoutTime = formatTime(item.checkout_time);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-neutral-900 rounded-xl p-4 mb-3 border border-neutral-200 dark:border-neutral-700"
      activeOpacity={0.7}
    >
      {/* Header - Basic Outlet Info + Badges */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <Text 
            style={{ fontFamily: 'Inter' }} 
            className="text-base font-semibold text-neutral-900 dark:text-neutral-100"
            numberOfLines={1}
          >
            {item.outlet?.name || 'Unknown Outlet'}
          </Text>
          <Text 
            style={{ fontFamily: 'Inter' }} 
            className="text-sm text-neutral-600 dark:text-neutral-400 mt-1"
            numberOfLines={1}
          >
            {item.outlet?.code} {item.outlet?.owner_name}
          </Text>
        </View>
        
        {/* Visit Type Badge */}
        <View 
          className="px-2 py-1 rounded-md"
          style={{ 
            backgroundColor: typeColors.bg
          }}
        >
          <Text 
            style={{ 
              fontFamily: 'Inter',
              color: typeColors.text,
              fontSize: 10,
              fontWeight: '600'
            }}
          >
            {item.type?.toUpperCase()}
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
  );
});

export default function VisitsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isConnected } = useNetwork();

  // Get visits data from the hook
  const { visits, loading, meta, fetchVisits } = useVisit();

  // Custom hooks for state management
  const {
    inputValue,
    searchQuery,
    refreshing,
    page,
    perPage,
    sortColumn,
    sortDirection,
    selectedFilter,
    dateFilter,
    setRefreshing,
    setPage,
    setPerPage,
    setSortColumn,
    setSortDirection,
    setSelectedFilter,
    setDateFilter,
    getFilterParam,
    handleSearchInput,
    clearSearch,
    hasActiveFilters,
  } = useVisitFilters();

  const { fetchPage, handleRefresh } = useVisitActions(
    fetchVisits,
    page,
    perPage,
    sortColumn,
    sortDirection,
    searchQuery,
    selectedFilter,
    getFilterParam
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
      case 'sortDirection':
        setSortDirection(value as 'asc' | 'desc');
        break;
      case 'filterType':
        setSelectedFilter(value as FilterType);
        break;
      default:
        break;
    }
  }, [setPerPage, setPage, setSortDirection, setSelectedFilter]);

  const handleApplyFilters = useCallback(() => {
    // Filters are applied automatically through useEffect in useVisitActions
    console.log('Filters applied');
  }, []);

  const handleClearFilters = useCallback(() => {
    setPerPage(10);
    setSortDirection('desc');
    setSelectedFilter('All');
    setDateFilter(null);
    setPage(1);
  }, [setPerPage, setSortDirection, setSelectedFilter, setDateFilter, setPage]);

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
      title: 'Filter Berdasarkan Type',
      key: 'filterType',
      options: [
        { label: 'Semua', value: 'All' },
        { label: 'Extracall', value: 'extracall' },
        { label: 'Planned', value: 'planned' },
      ],
      selectedValue: selectedFilter,
    },
    {
      title: 'Arah Pengurutan',
      key: 'sortDirection',
      options: [
        { label: 'Terbaru Dahulu', value: 'desc' },
        { label: 'Terlama Dahulu', value: 'asc' },
      ],
      selectedValue: sortDirection,
    },
  ], [perPage, selectedFilter, sortDirection]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900" edges={isConnected ? [] : ['left','right']}>
      {/* Header with Search and Filter */}
      <HeaderSearchFilter
        searchValue={inputValue}
        onSearchChange={handleSearchInput}
        onClearSearch={clearSearch}
        onAdvancedFilterPress={handleAdvancedFilterPress}
        placeholder="Cari kunjungan atau outlet..."
        hasActiveFilter={hasActiveFilters()}
        showAdvancedFilter={true}
      />
      
      {/* Visit List */}
      <FlatList
        data={visits}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        onRefresh={handleRefreshWrapper}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <VisitCard
            item={item}
            colors={colors}
            onPress={() => router.push(`/visit/view?id=${item.id}`)}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
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
          <Card className="mt-10 p-6 items-center justify-center border-0 shadow-sm">
            <EmptyState
              loading={loading}
              searchQuery={searchQuery}
              colors={colors}
            />
          </Card>
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