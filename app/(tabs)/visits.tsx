import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { debounce } from 'lodash';

import { AdvancedFilter } from '@/components/AdvancedFilter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';

import { Colors } from '@/constants/Colors';

import { useNetwork } from '@/context/network-context';
import { useVisit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

type FilterType = 'All' | 'Today' | 'Planned' | 'Completed' | 'Cancelled';
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
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  const filterTabs: FilterType[] = ['All', 'Today', 'Planned', 'Completed', 'Cancelled'];
  
  const getFilterParam = useCallback((filter: FilterType): Record<string, any> => {
    switch (filter) {
      case 'Today':
        return { 'filters[date]': new Date().toISOString().split('T')[0] };
      case 'Planned':
        return { 'filters[type]': 'planned' };
      case 'Completed':
        return { 'filters[type]': 'completed' };
      case 'Cancelled':
        return { 'filters[type]': 'cancelled' };
      default:
        return {};
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((text: string) => {
      setSearchQuery(text);
    }, 300),
    []
  );

  React.useEffect(() => { 
    setPage(1); 
  }, [searchQuery, perPage, sortColumn, sortDirection, selectedFilter, dateFilter]);

  const handleSearchInput = useCallback((text: string) => {
    setInputValue(text);
    debouncedSearch(text);
  }, [debouncedSearch]);

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
    selectedFilter,
    dateFilter,
    showAdvancedFilter,
    filterTabs,
    setRefreshing,
    setPage,
    setPerPage,
    setSortColumn,
    setSortDirection,
    setSelectedFilter,
    setDateFilter,
    setShowAdvancedFilter,
    getFilterParam,
    handleSearchInput,
    clearSearch,
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

const FilterChip = React.memo(function FilterChip({ 
  value, 
  currentValue, 
  label, 
  onPress, 
  isActive,
  colors 
}: { 
  value: string; 
  currentValue: string; 
  label: string; 
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
        placeholder="Search visits or outlets..."
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
          Loading visits...
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
          No matching visits
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
        <IconSymbol name="calendar" size={32} color={colors.textSecondary} />
      </View>
      <Text style={{ fontFamily: 'Inter' }} className="text-base font-medium text-neutral-900 dark:text-neutral-100 text-center mb-2">
        No visits found
      </Text>
      <Text style={{ fontFamily: 'Inter' }} className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-4">
        Plan a new visit to get started
      </Text>
      <Button 
        title="+ Plan Visit"
        size="sm"
        variant="primary"
        onPress={() => router.push('/visit/check-in')}
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

const VisitCard = React.memo(function VisitCard({
  item,
  colors,
  onPress
}: {
  item: any;
  colors: any;
  onPress: () => void;
}) {
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  }, []);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Card>
        <View className="flex-row items-center justify-between py-3">
          <View className="flex-1">
            <View className="flex-row justify-between items-center mb-1">
              <Text style={{ fontFamily: 'Inter' }} className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {item.outlet.name}
              </Text>
            </View>
            <View className="flex-row items-center mb-2">
              <IconSymbol name="location.fill" size={14} color={colors.textSecondary} />
              <Text style={{ fontFamily: 'Inter' }} className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">
                {item.outlet.district}
              </Text>
            </View>
            <View className="flex-row">
              <View className="flex-row items-center mr-4">
                <IconSymbol name="calendar" size={14} color={colors.textSecondary} />
                <Text style={{ fontFamily: 'Inter' }} className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">
                  {formatDate(item.visit_date)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <IconSymbol name="person.fill" size={14} color={colors.textSecondary} />
                <Text style={{ fontFamily: 'Inter' }} className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">
                  {item.user.name}
                </Text>
              </View>
            </View>
          </View>
          <View className="ml-2">
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
});

export default function VisitsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isConnected } = useNetwork();

  const { visits, loading, meta, fetchVisits } = useVisit();
  
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
    showAdvancedFilter,
    filterTabs,
    setRefreshing,
    setPage,
    setPerPage,
    setSortColumn,
    setSortDirection,
    setSelectedFilter,
    setDateFilter,
    setShowAdvancedFilter,
    getFilterParam,
    handleSearchInput,
    clearSearch,
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
      <View className="flex-row justify-between items-center px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <Text style={{ fontFamily: 'Inter' }} className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Visits
        </Text>
        <Button
          title="+ Plan Visit"
          size="sm"
          variant="primary"
          onPress={() => router.push('/visit/check-in')}
        />
      </View>

      <Card className="m-4 mb-2 p-3 rounded-xl">
        <SearchBar
          inputValue={inputValue}
          onChangeText={handleSearchInput}
          onClear={clearSearch}
          colors={colors}
        />
        
        <AdvancedFilter 
          showAdvancedFilter={showAdvancedFilter}
          onToggle={() => setShowAdvancedFilter(!showAdvancedFilter)}
        >
          <View className="mb-2">
            <Text style={{ fontFamily: 'Inter' }} className="text-xs mb-1 text-neutral-600 dark:text-neutral-400">
              Filter
            </Text>
            <View className="flex-row flex-wrap mb-2">
              {filterTabs.map((item) => (
                <FilterChip
                  key={`filter-${item}`}
                  value={item}
                  currentValue={selectedFilter}
                  label={item}
                  onPress={() => setSelectedFilter(item)}
                  isActive={item === selectedFilter}
                  colors={colors}
                />
              ))}
            </View>
          </View>
          
          <View className="flex-row flex-wrap justify-between mb-3">
            <View className="mb-2">
              <Text style={{ fontFamily: 'Inter' }} className="text-xs mb-1 text-neutral-600 dark:text-neutral-400">
                Show
              </Text>
              <View className="flex-row flex-wrap">
                {[10, 20, 50].map(n => 
                  <FilterChip
                    key={`perpage-${n}`}
                    value={String(n)}
                    currentValue={String(perPage)}
                    label={String(n)}
                    onPress={() => { setPerPage(n); setPage(1); }}
                    isActive={String(n) === String(perPage)}
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
                  { id: 'visit_date', label: 'Date' },
                  { id: 'outlet.name', label: 'Outlet' },
                  { id: 'type', label: 'Type' },
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

        <View className="flex-row items-center pt-1">
          {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />}
          
          {meta && (
            <Text style={{ fontFamily: 'Inter' }} className="text-xs text-neutral-600 dark:text-neutral-400">
              Showing {visits.length} of {meta.total} visits
              {searchQuery ? ` for "${searchQuery}"` : ''}
            </Text>
          )}
        </View>
      </Card>
       
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
            onPress={() => router.push({ pathname: '/visit/view', params: { id: item.id } })}
          />
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