import React, { useCallback } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

interface HeaderSearchFilterProps {
  searchValue: string;
  onSearchChange: (text: string) => void;
  onClearSearch: () => void;
  onAdvancedFilterPress: () => void;
  placeholder?: string;
  hasActiveFilter?: boolean;
  showAdvancedFilter?: boolean;
  useSafeArea?: boolean; // Add option to control safe area
}

export const HeaderSearchFilter = React.memo(function HeaderSearchFilter({
  searchValue,
  onSearchChange,
  onClearSearch,
  onAdvancedFilterPress,
  placeholder = "Cari...",
  hasActiveFilter = false,
  showAdvancedFilter = true,
  useSafeArea = true,
}: HeaderSearchFilterProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  
  const colors = {
    background: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff',
    border: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    searchBackground: colorScheme === 'dark' ? '#1a1a1a' : '#f8f9fa',
    searchBorder: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
    text: colorScheme === 'dark' ? '#ffffff' : '#1f2937',
    textSecondary: colorScheme === 'dark' ? '#9ca3af' : '#6b7280',
    primary: '#f97316',
    filterActive: '#10b981',
  };

  const handleClearPress = useCallback(() => {
    onClearSearch();
  }, [onClearSearch]);

  return (
    <View 
      className="border-b bg-white dark:bg-neutral-950"
      style={{
        paddingTop: useSafeArea ? insets.top : 12, // Use smaller padding when not using safe area
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      {/* Header Content */}
      <View className="px-4 pb-3">
        {/* Search Bar */}
        <View className="flex-row items-center">
          <View 
            className="flex-1 flex-row items-center rounded-xl border px-3 py-3 mr-3"
            style={{
              backgroundColor: colors.searchBackground,
              borderColor: colors.searchBorder,
            }}
          >
            <View className="mr-3">
              <IconSymbol 
                name="magnifyingglass" 
                size={20} 
                color={colors.textSecondary}
              />
            </View>
            <TextInput
              className="flex-1 text-base"
              style={{ 
                fontFamily: 'Inter',
                color: colors.text,
              }}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              value={searchValue}
              onChangeText={onSearchChange}
              returnKeyType="search"
              clearButtonMode="never"
            />
            {searchValue ? (
              <TouchableOpacity 
                onPress={handleClearPress} 
                className="p-1 ml-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol 
                  name="xmark.circle.fill" 
                  size={18} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Advanced Filter Button */}
          {showAdvancedFilter && (
            <TouchableOpacity
              onPress={onAdvancedFilterPress}
              className="w-12 h-12 rounded-xl items-center justify-center border"
              style={{
                backgroundColor: hasActiveFilter ? colors.filterActive : colors.searchBackground,
                borderColor: hasActiveFilter ? colors.filterActive : colors.searchBorder,
              }}
              accessibilityLabel="Advanced Filter"
              accessibilityHint="Opens advanced filter options"
            >
              <IconSymbol 
                name="slider.horizontal.3" 
                size={20} 
                color={hasActiveFilter ? '#ffffff' : colors.textSecondary}
              />
              {hasActiveFilter && (
                <View 
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-950"
                  style={{ backgroundColor: colors.primary }}
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}); 