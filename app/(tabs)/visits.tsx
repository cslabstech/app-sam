import { router } from 'expo-router';
import { debounce } from 'lodash';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdvancedFilter } from '@/components/AdvancedFilter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
import { useNetwork } from '@/context/network-context';
import { useVisit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

type FilterType = 'All' | 'Today' | 'Planned' | 'Completed' | 'Cancelled';
type SortColumn = 'visit_date' | 'outlet.name' | 'type';

export default function VisitsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isConnected } = useNetwork();

  // State management for visits list
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
  
  // Get visits data from the hook
  const { visits, loading, meta, fetchVisits } = useVisit();
  
  // Filter types and their mapping to API filters
  const filterTabs: FilterType[] = ['All', 'Today', 'Planned', 'Completed', 'Cancelled'];
  
  const getFilterParam = (filter: FilterType): Record<string, any> => {
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
  };

  // Create a debounced search function to reduce API calls
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      setSearchQuery(text);
    }, 300),
    []
  );

  // Reset to page 1 when search/filter/sort parameters change
  React.useEffect(() => { 
    setPage(1); 
  }, [searchQuery, perPage, sortColumn, sortDirection, selectedFilter, dateFilter]);

  // Fetch with advanced params
  const fetchPage = useCallback((newPage: number) => {
    setPage(newPage);
    fetchVisits({
      page: newPage,
      per_page: perPage,
      sort_column: sortColumn,
      sort_direction: sortDirection,
      search: searchQuery,
      ...getFilterParam(selectedFilter),
    });
  }, [fetchVisits, perPage, sortColumn, sortDirection, searchQuery, selectedFilter]);

  // Fetch on mount and when params change
  React.useEffect(() => {
    fetchVisits({
      page,
      per_page: perPage,
      sort_column: sortColumn,
      sort_direction: sortDirection,
      search: searchQuery,
      ...getFilterParam(selectedFilter),
    });
  }, [page, perPage, sortColumn, sortDirection, searchQuery, selectedFilter, fetchVisits]);

  // Pagination controls
  const handleNextPage = () => {
    if (meta && page < meta.last_page) setPage(page + 1);
  };
  
  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  // Handle text input changes
  const handleSearchInput = (text: string) => {
    setInputValue(text);
    debouncedSearch(text);
  };

  // Clear search input
  const clearSearch = () => {
    setInputValue('');
    setSearchQuery('');
  };

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    fetchPage(1);
    setRefreshing(false);
  }, [fetchPage]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.background,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
    },
    headerTitle: {
      fontSize: typography.fontSize2xl,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.5,
    },
    controlsCard: {
      margin: spacing.lg,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: 12,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.sm,
      borderRadius: 8,
      marginBottom: spacing.sm,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      height: 38,
      marginLeft: 8,
      fontSize: typography.fontSizeMd,
      color: colors.text
    },
    clearButton: {
      padding: 4
    },
    filterContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 8,
    },
    controlsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    controlGroup: {
      marginBottom: spacing.xs
    },
    controlLabel: {
      fontSize: 13,
      marginBottom: 4,
      color: colors.textSecondary
    },
    controlsWrapper: {
      flexDirection: 'row',
      flexWrap: 'wrap'
    },
    chipButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      marginRight: 4,
      marginBottom: 4,
      minWidth: 40,
      alignItems: 'center',
    },
    activeChip: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    inactiveChip: {
      backgroundColor: 'transparent',
      borderColor: colors.border
    },
    chipText: {
      color: colors.textSecondary,
      fontWeight: '400'
    },
    activeChipText: {
      color: 'white',
      fontWeight: '600'
    },
    sortButton: {
      width: 36,
      height: 32,
      borderRadius: 6,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: colors.border
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 4
    },
    statusText: {
      fontSize: 13,
      color: colors.textSecondary
    },
    listContainer: {
      padding: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: 100,
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: spacing.lg,
    },
    paginationButton: {
      minWidth: 80,
      marginRight: 8
    },
    paginationText: {
      paddingHorizontal: spacing.lg
    },
    pageNumberText: {
      fontSize: typography.fontSizeMd,
      color: colors.text
    },
    emptyContainer: {
      marginTop: 40,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
      ...Platform.select({
        ios: {
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    loadingContainer: {
      alignItems: 'center',
      padding: 20
    },
    loadingIndicator: {
      marginBottom: 16
    },
    emptyStateIcon: {
      marginBottom: 12
    },
    emptyStateTitle: {
      color: colors.text,
      textAlign: 'center',
      fontWeight: '500',
      fontSize: 16,
      marginBottom: 8,
    },
    emptyStateMessage: {
      color: colors.textSecondary,
      textAlign: 'center',
      fontSize: 14,
    },
    actionButton: {
      marginTop: 16
    },
    visitCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    visitInfo: {
      flex: 1,
    },
    visitHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    visitOutletName: {
      fontSize: 16,
      fontWeight: '600',
    },
    visitAddressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    visitAddress: {
      fontSize: 14,
      marginLeft: 4,
    },
    visitDetailsContainer: {
      flexDirection: 'row',
    },
    visitDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    visitDetailText: {
      fontSize: 14,
      marginLeft: 4,
    },
    viewButtonAccessory: {
      marginLeft: 8,
    },
  });

  const renderChip = (value: string, currentValue: string, label: string, onPress: () => void, key?: string) => (
    <TouchableOpacity
      key={key || value}
      style={[
        styles.chipButton,
        value === currentValue ? styles.activeChip : styles.inactiveChip
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.chipText,
        value === currentValue && styles.activeChipText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const EmptyState = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />
          <Text style={styles.emptyStateTitle}>
            Loading visits...
          </Text>
        </View>
      );
    }
    
    if (searchQuery) {
      return (
        <View style={styles.loadingContainer}>
          <IconSymbol name="magnifyingglass" size={32} color={colors.textSecondary} style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateTitle}>
            No matching visits
          </Text>
          <Text style={styles.emptyStateMessage}>
            Try adjusting your search terms
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.loadingContainer}>
        <IconSymbol name="calendar" size={32} color={colors.textSecondary} style={styles.emptyStateIcon} />
        <Text style={styles.emptyStateTitle}>
          No visits found
        </Text>
        <Text style={styles.emptyStateMessage}>
          Plan a new visit to get started
        </Text>
        <Button 
          title="+ Plan Visit"
          size="medium"
          variant="primary"
          onPress={() => router.push('/visit/check-in')}
          style={styles.actionButton}
        />
      </View>
    );
  };

  const Pagination = () => {
    if (!meta) return null;
    
    return (
      <View style={styles.paginationContainer}>
        <Button 
          title="Prev" 
          size="small" 
          variant="secondary"
          onPress={handlePrevPage} 
          disabled={page === 1 || loading} 
          style={styles.paginationButton} 
        />
        
        <View style={styles.paginationText}>
          <Text style={styles.pageNumberText}>
            Page <Text style={{ fontWeight: 'bold' }}>{meta.current_page}</Text> of {meta.last_page}
          </Text>
        </View>
        
        <Button 
          title="Next" 
          size="small" 
          variant="secondary"
          onPress={handleNextPage} 
          disabled={page === meta.last_page || loading} 
          style={{ minWidth: 80 }} 
        />
      </View>
    );
  };

  // Format date for display (2023-01-01 -> Jan 1, 2023)
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={isConnected ? ['top','left','right'] : ['left','right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Visits</Text>
        <Button
          title="+ Plan Visit"
          size="small"
          variant="primary"
          onPress={() => router.push('/visit/check-in')}
        />
      </View>

      {/* Filters & Controls Section */}
      <Card style={styles.controlsCard}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search visits or outlets..."
            placeholderTextColor={colors.textSecondary}
            value={inputValue}
            onChangeText={handleSearchInput}
          />
          {inputValue ? (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <IconSymbol name="xmark.circle.fill" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Advanced Filter */}
        <AdvancedFilter 
          showAdvancedFilter={showAdvancedFilter}
          onToggle={() => setShowAdvancedFilter(!showAdvancedFilter)}
        >
          {/* Filter tabs */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Filter</Text>
            <View style={styles.filterContainer}>
              {filterTabs.map((item) => (
                renderChip(item, selectedFilter, item, () => setSelectedFilter(item), `filter-${item}`)
              ))}
            </View>
          </View>
          
          {/* PerPage & Sorting */}
          <View style={styles.controlsRow}>
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>Show</Text>
              <View style={styles.controlsWrapper}>
                {[10, 20, 50].map(n => 
                  renderChip(String(n), String(perPage), String(n), () => { setPerPage(n); setPage(1); }, `perpage-${n}`)
                )}
              </View>
            </View>
            
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>Sort by</Text>
              <View style={styles.controlsWrapper}>
                {[
                  { id: 'visit_date', label: 'Date' },
                  { id: 'outlet.name', label: 'Outlet' },
                  { id: 'type', label: 'Type' },
                ].map(item => 
                  renderChip(item.id, sortColumn, item.label, () => setSortColumn(item.id as any), `sortcol-${item.id}`)
                )}
                <TouchableOpacity
                  style={styles.sortButton}
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
        <View style={styles.statusRow}>
          {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />}
          
          {meta && (
            <Text style={styles.statusText}>
              Showing {visits.length} of {meta.total} visits
              {searchQuery ? ` for "${searchQuery}"` : ''}
            </Text>
          )}
        </View>
      </Card>
       {/* Visit List */}
      <FlatList
        data={visits}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/visit/view', params: { id: item.id } })}
            activeOpacity={0.7}
          >
            <Card>
              <View style={styles.visitInfo}>
                <View style={styles.visitHeader}>
                  <Text style={[styles.visitOutletName, { color: colors.text }]}>{item.outlet.name}</Text>
                </View>
                <View style={styles.visitAddressContainer}>
                  <IconSymbol name="location.fill" size={14} color={colors.textSecondary} />
                  <Text style={[styles.visitAddress, { color: colors.textSecondary }]}>{item.outlet.district}</Text>
                </View>
                <View style={styles.visitDetailsContainer}>
                  <View style={styles.visitDetail}>
                    <IconSymbol name="calendar" size={14} color={colors.textSecondary} />
                    <Text style={[styles.visitDetailText, { color: colors.textSecondary }]}>
                      {formatDate(item.visit_date)}
                    </Text>
                  </View>
                  <View style={styles.visitDetail}>
                    <IconSymbol name="person.fill" size={14} color={colors.textSecondary} />
                    <Text style={[styles.visitDetailText, { color: colors.textSecondary }]}>
                      {item.user.name}
                    </Text>
                  </View>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} style={styles.viewButtonAccessory} />
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={<Pagination />}
        ListEmptyComponent={
          <Card style={styles.emptyContainer}>
            <EmptyState />
          </Card>
        }
      />
    </SafeAreaView>
  );
}