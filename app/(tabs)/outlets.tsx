import { AdvancedFilter } from '@/components/AdvancedFilter';
import OutletItem from '@/components/OutletItem';
import { router } from 'expo-router';
import { debounce } from 'lodash';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
import { useOutlet } from '@/hooks/data/useOutlet';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

export default function OutletsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // State management for outlets list
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<'name'|'code'|'district'|'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc'|'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  
  // Get outlets data from the hook
  const { outlets, loading, meta, fetchOutletsAdvanced } = useOutlet(searchQuery);

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

  // Fetch with advanced params
  const fetchPage = useCallback((newPage: number) => {
    setPage(newPage);
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
    }
  });

  const renderChip = (value: number | string, currentValue: number | string, label: string | number, onPress: () => void, key?: string) => (
    <TouchableOpacity
      key={key}
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
            Loading outlets...
          </Text>
        </View>
      );
    }
    
    if (searchQuery) {
      return (
        <View style={styles.loadingContainer}>
          <IconSymbol name="magnifyingglass" size={32} color={colors.textSecondary} style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateTitle}>
            No matching outlets
          </Text>
          <Text style={styles.emptyStateMessage}>
            Try adjusting your search terms
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.loadingContainer}>
        <IconSymbol name="building.2" size={32} color={colors.textSecondary} style={styles.emptyStateIcon} />
        <Text style={styles.emptyStateTitle}>
          No outlets found
        </Text>
        <Text style={styles.emptyStateMessage}>
          Register a new outlet to get started
        </Text>
        <Button 
          title="+ Register Outlet"
          size="medium"
          variant="primary"
          onPress={() => router.push('/register-outlet')}
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Outlets</Text>
        <Button
          title="+ New Outlet"
          size="small"
          variant="primary"
          onPress={() => router.push('/register-outlet')}
        />
      </View>

      {/* Filters & Controls Section */}
      <Card style={styles.controlsCard}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search outlets..."
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
          {/* PerPage & Sorting */}
          <View style={styles.controlsRow}>
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>Show</Text>
              <View style={styles.controlsWrapper}>
                {[10, 20, 50, 100].map(n => 
                  renderChip(n, perPage, n, () => { setPerPage(n); setPage(1); }, `perpage-${n}`)
                )}
              </View>
            </View>
            
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>Sort by</Text>
              <View style={styles.controlsWrapper}>
                {[
                  { id: 'name', label: 'Name' },
                  { id: 'code', label: 'Code' },
                  { id: 'district', label: 'District' },
                  { id: 'status', label: 'Status' },
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
              Showing {outlets.length} of {meta.total} outlets
              {searchQuery ? ` for "${searchQuery}"` : ''}
            </Text>
          )}
        </View>
      </Card>
      
      {/* Outlet List */}
      <FlatList
        data={outlets}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <OutletItem outlet={item} />
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