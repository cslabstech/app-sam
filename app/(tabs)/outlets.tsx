import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { debounce } from 'lodash';

import { AdvancedFilter } from '@/components/AdvancedFilter';
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
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  // Create a debounced search function to reduce API calls
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      setSearchQuery(text);
    }, 300),
    []
  );

  // Reset to page 1 when search/filter/sort parameters change
  React.useEffect(() => { 
    setPage(1); 
  }, [searchQuery, perPage, sortColumn, sortDirection, filters]);

  // Handle text input changes
  const handleSearchInput = useCallback((text: string) => {
    setInputValue(text);
    debouncedSearch(text);
  }, [debouncedSearch]);

  // Clear search input
  const clearSearch = useCallback(() => {
    setInputValue('');
    setSearchQuery('');
  }, []);

  return {
    inputValue,
    searchQuery,
    refreshing,
    page,
    perPage,
    sortColumn,
    sortDirection,
    filters,
    showAdvancedFilter,
    setRefreshing,
    setPage,
    setPerPage,
    setSortColumn,
    setSortDirection,
    setFilters,
    setShowAdvancedFilter,
    handleSearchInput,
    clearSearch,
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

// Memoized components for performance
const FilterChip = React.memo(function FilterChip({ 
  value, 
  currentValue, 
  label, 
  onPress, 
  isActive,
  colors 
}: { 
  value: number | string; 
  currentValue: number | string; 
  label: string | number; 
  onPress: () => void; 
  isActive: boolean;
  colors: any;
}) {
  return (
    <TouchableOpacity
      className={`px-3 py-1.5 rounded-md border mr-1 mb-1 min-w-[40px] items-center ${
        isActive 
          ? 'border-primary-500' 
          : 'border-neutral-200 dark:border-neutral-700'
      }`}
      style={{
        backgroundColor: isActive ? colors.primary : 'transparent',
      }}
      onPress={onPress}
    >
      <Text 
        style={{ fontFamily: 'Inter' }}
        className={`font-normal ${
          isActive 
            ? 'text-white font-semibold' 
            : 'text-neutral-600 dark:text-neutral-400'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});

const SearchBar = React.memo(function SearchBar({
  inputValue,
  onChangeText,
  onClear,
  colors
}: {
  inputValue: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  colors: any;
}) {
  return (
    <View className="flex-row items-center p-3 rounded-lg mb-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
      <IconSymbol name="magnifyingglass" size={20} color={colors.primary} />
      <TextInput
        className="flex-1 h-9 ml-2 text-base text-neutral-900 dark:text-neutral-100"
        style={{ fontFamily: 'Inter' }}
        placeholder="Search outlets..."
        placeholderTextColor={colors.textSecondary}
        value={inputValue}
        onChangeText={onChangeText}
      />
      {inputValue ? (
        <TouchableOpacity onPress={onClear} className="p-1">
          <IconSymbol name="xmark.circle.fill" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

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
      <View className="items-center p-5">
        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 16 }} />
        <Text style={{ fontFamily: 'Inter' }} className="text-base font-medium text-neutral-900 dark:text-neutral-100">
          Loading outlets...
        </Text>
      </View>
    );
  }
  
  if (searchQuery) {
    return (
      <View className="items-center p-5">
        <View className="mb-3">
          <IconSymbol name="magnifyingglass" size={32} color={colors.textSecondary} />
        </View>
        <Text style={{ fontFamily: 'Inter' }} className="text-base font-medium text-neutral-900 dark:text-neutral-100 text-center mb-2">
          No matching outlets
        </Text>
        <Text style={{ fontFamily: 'Inter' }} className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
          Try adjusting your search terms
        </Text>
      </View>
    );
  }
  
  return (
    <View className="items-center p-5">
      <View className="mb-3">
        <IconSymbol name="building.2" size={32} color={colors.textSecondary} />
      </View>
      <Text style={{ fontFamily: 'Inter' }} className="text-base font-medium text-neutral-900 dark:text-neutral-100 text-center mb-2">
        No outlets found
      </Text>
      <Text style={{ fontFamily: 'Inter' }} className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-4">
        Register a new outlet to get started
      </Text>
      <Button 
        title="+ Register Outlet"
        size="sm"
        variant="primary"
        onPress={() => router.push('/outlet/create')}
      />
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
  if (!meta) return null;
  
  return (
    <View className="flex-row justify-center items-center my-4">
             <Button 
         title="Prev" 
         size="sm" 
         variant="secondary"
         onPress={onPrevPage} 
         disabled={page === 1 || loading} 
         style={{ minWidth: 80, marginRight: 8 }}
       />
       
       <View className="px-4">
         <Text style={{ fontFamily: 'Inter' }} className="text-base text-neutral-900 dark:text-neutral-100">
           Page <Text className="font-bold">{meta.current_page}</Text> of {meta.last_page}
         </Text>
       </View>
       
       <Button 
         title="Next" 
         size="sm" 
         variant="secondary"
         onPress={onNextPage} 
         disabled={page === meta.last_page || loading} 
         style={{ minWidth: 80 }}
       />
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
    showAdvancedFilter,
    setRefreshing,
    setPage,
    setPerPage,
    setSortColumn,
    setSortDirection,
    setShowAdvancedFilter,
    handleSearchInput,
    clearSearch,
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

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900" edges={isConnected ? ['top','left','right'] : ['left','right']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <Text style={{ fontFamily: 'Inter' }} className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Outlets
        </Text>
                 <Button
           title="+ New Outlet"
           size="sm"
           variant="primary"
           onPress={() => router.push('/outlet/create')}
         />
      </View>

      {/* Filters & Controls Section */}
      <Card className="m-4 mb-2 p-3 rounded-xl">
        {/* Search */}
        <SearchBar
          inputValue={inputValue}
          onChangeText={handleSearchInput}
          onClear={clearSearch}
          colors={colors}
        />
        
        {/* Advanced Filter */}
        <AdvancedFilter 
          showAdvancedFilter={showAdvancedFilter}
          onToggle={() => setShowAdvancedFilter(!showAdvancedFilter)}
        >
          {/* PerPage & Sorting */}
          <View className="flex-row flex-wrap justify-between mb-3">
            <View className="mb-2">
              <Text style={{ fontFamily: 'Inter' }} className="text-xs mb-1 text-neutral-600 dark:text-neutral-400">
                Show
              </Text>
              <View className="flex-row flex-wrap">
                {[10, 20, 50, 100].map(n => 
                  <FilterChip
                    key={`perpage-${n}`}
                    value={n}
                    currentValue={perPage}
                    label={n}
                    onPress={() => { setPerPage(n); setPage(1); }}
                    isActive={n === perPage}
                    colors={colors}
                  />
                )}
              </View>
            </View>
            
            <View className="mb-2">
              <Text style={{ fontFamily: 'Inter' }} className="text-xs mb-1 text-neutral-600 dark:text-neutral-400">
                Sort by
              </Text>
              <View className="flex-row flex-wrap items-center">
                {[
                  { id: 'name', label: 'Name' },
                  { id: 'code', label: 'Code' },
                  { id: 'district', label: 'District' },
                  { id: 'status', label: 'Status' },
                ].map(item => 
                  <FilterChip
                    key={`sortcol-${item.id}`}
                    value={item.id}
                    currentValue={sortColumn}
                    label={item.label}
                    onPress={() => setSortColumn(item.id as SortColumn)}
                    isActive={item.id === sortColumn}
                    colors={colors}
                  />
                )}
                <TouchableOpacity
                  className="w-9 h-8 rounded-md border border-neutral-200 dark:border-neutral-700 justify-center items-center"
                  onPress={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  <IconSymbol 
                    name={sortDirection === 'asc' ? 'arrow.up' : 'arrow.down'} 
                    size={18} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </AdvancedFilter>

        {/* Status & Info */}
        <View className="flex-row items-center pt-1">
          {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />}
          
          {meta && (
            <Text style={{ fontFamily: 'Inter' }} className="text-xs text-neutral-600 dark:text-neutral-400">
              Showing {outlets.length} of {meta.total} outlets
              {searchQuery ? ` for "${searchQuery}"` : ''}
            </Text>
          )}
        </View>
      </Card>
      
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
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 100 }}
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
    </SafeAreaView>
  );
}