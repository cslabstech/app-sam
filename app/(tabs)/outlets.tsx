import OutletItem from '@/components/OutletItem';
import { router } from 'expo-router';
import { debounce } from 'lodash';
import React, { useCallback, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOutlets } from '@/hooks/useOutlets';

export default function OutletsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { outlets, loading, refreshOutlets } = useOutlets(searchQuery);

  // Create a debounced search function to reduce UI updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      setSearchQuery(text);
    }, 300),
    []
  );
  
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
    await refreshOutlets();
    setRefreshing(false);
  }, [refreshOutlets]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[
        styles.header, 
        { 
          backgroundColor: colors.background, 
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        }
      ]}>
        <Text style={[
          styles.screenTitle, 
          { 
            color: colors.text,
            fontWeight: '700',
            fontSize: 28,
            letterSpacing: -0.5,
          }
        ]}>Outlets</Text>
        <Button
          title="+ New Outlet" 
          size="small"
          variant="primary"
          onPress={() => router.push('/register-outlet')}
        />
      </View>
      
      <View style={[
        styles.searchContainer, 
        { 
          backgroundColor: colors.card, 
          borderWidth: 1, 
          borderColor: colors.border,
          borderRadius: 12,
          ...Platform.select({
            ios: {
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
            },
            android: {
              elevation: 2,
            },
          }),
        }
      ]}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.primary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search outlets..."
          placeholderTextColor={colors.textSecondary}
          value={inputValue}
          onChangeText={handleSearchInput}
        />
        {inputValue ? (
          <TouchableOpacity onPress={clearSearch} style={{padding: 4}}>
            <IconSymbol name="xmark.circle.fill" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {searchQuery && outlets.length > 0 && (
        <View style={[styles.searchResultInfo, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Showing {outlets.length} {outlets.length === 1 ? 'outlet' : 'outlets'} for "{searchQuery}"
          </Text>
        </View>
      )}
      
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
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Card style={{ 
            marginTop: 40, 
            padding: 24,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0,
            ...Platform.select({
              ios: {
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
              },
              android: {
                elevation: 2,
              },
            }),
          }}>
            {loading ? (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <IconSymbol name="arrow.clockwise" size={32} color={colors.primary} style={{ marginBottom: 12 }} />
                <Text style={{ 
                  color: colors.text, 
                  textAlign: 'center', 
                  fontWeight: '500',
                  fontSize: 16,
                }}>
                  Loading outlets...
                </Text>
              </View>
            ) : searchQuery ? (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <IconSymbol name="magnifyingglass" size={32} color={colors.textSecondary} style={{ marginBottom: 12 }} />
                <Text style={{ 
                  color: colors.text, 
                  textAlign: 'center', 
                  fontWeight: '500',
                  fontSize: 16,
                  marginBottom: 8,
                }}>
                  No matching outlets
                </Text>
                <Text style={{ 
                  color: colors.textSecondary, 
                  textAlign: 'center',
                  fontSize: 14,
                }}>
                  Try adjusting your search terms
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <IconSymbol name="building.2" size={32} color={colors.textSecondary} style={{ marginBottom: 12 }} />
                <Text style={{ 
                  color: colors.text, 
                  textAlign: 'center', 
                  fontWeight: '500',
                  fontSize: 16,
                  marginBottom: 8,
                }}>
                  No outlets found
                </Text>
                <Text style={{ 
                  color: colors.textSecondary, 
                  textAlign: 'center',
                  fontSize: 14,
                }}>
                  Register a new outlet to get started
                </Text>
              </View>
            )}
          </Card>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100, // Add extra space at bottom for better scrolling
  },
  searchResultInfo: {
    padding: 8, 
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: -4,
    opacity: 0.9,
  },
});