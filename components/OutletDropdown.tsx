import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { Animated, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useColorScheme } from '@/hooks/utils/useColorScheme';

interface Outlet {
  id: string | number;
  name: string;
  code: string;
}

interface OutletDropdownProps {
  outlets: Outlet[];
  selectedOutletId: string | null;
  onSelect: (id: string) => void;
  onSearchChange?: (query: string) => void; // Tambah prop untuk search backend
  disabled?: boolean;
  loading?: boolean;
  showDropdown: boolean;
  setShowDropdown: (v: boolean) => void;
}

const useOutletDropdownLogic = ({ 
  outlets, 
  selectedOutletId, 
  onSelect, 
  onSearchChange,
  setShowDropdown, 
  disabled 
}: {
  outlets: Outlet[];
  selectedOutletId: string | null;
  onSelect: (id: string) => void;
  onSearchChange?: (query: string) => void;
  setShowDropdown: (v: boolean) => void;
  disabled?: boolean;
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOutlet = useMemo(() => {
    return outlets.find(o => o.id === selectedOutletId) || null;
  }, [outlets, selectedOutletId]);

  // Remove client-side filtering, karena sekarang search di-handle backend
  const filteredOutlets = outlets;

  const handleToggleDropdown = useCallback(() => {
    if (!disabled) {
      setShowDropdown(true);
      setSearchQuery(''); // Reset search when opening
      // Reset search di backend juga
      onSearchChange?.('');
    }
  }, [disabled, setShowDropdown, onSearchChange]);

  const handleSelectOutlet = useCallback((outletId: string | number) => {
    onSelect(outletId.toString());
    setShowDropdown(false);
    setSearchQuery(''); // Reset search after selection
    // Reset search di backend juga
    onSearchChange?.('');
  }, [onSelect, setShowDropdown, onSearchChange]);

  const handleCloseDropdown = useCallback(() => {
    setShowDropdown(false);
    setSearchQuery('');
    // Reset search di backend juga
    onSearchChange?.('');
  }, [setShowDropdown, onSearchChange]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    // Kirim search query ke backend
    onSearchChange?.(query);
  }, [onSearchChange]);

  const getDisplayText = useCallback(() => {
    if (selectedOutlet) {
      return `${selectedOutlet.name} (${selectedOutlet.code})`;
    }
    return 'Pilih outlet...';
  }, [selectedOutlet]);

  return {
    selectedOutlet,
    filteredOutlets,
    searchQuery,
    handleToggleDropdown,
    handleSelectOutlet,
    handleCloseDropdown,
    handleSearchChange,
    getDisplayText,
  };
};

export const OutletDropdown = React.memo(function OutletDropdown({
  outlets,
  selectedOutletId,
  onSelect,
  onSearchChange,
  disabled = false,
  loading = false,
  showDropdown,
  setShowDropdown,
}: OutletDropdownProps) {
  const colorScheme = useColorScheme();
  const {
    selectedOutlet,
    filteredOutlets,
    searchQuery,
    handleToggleDropdown,
    handleSelectOutlet,
    handleCloseDropdown,
    handleSearchChange,
    getDisplayText,
  } = useOutletDropdownLogic({ 
    outlets, 
    selectedOutletId, 
    onSelect,
    onSearchChange,
    setShowDropdown, 
    disabled 
  });

  const getContainerClasses = () => {
    return [
      'border border-neutral-200 dark:border-neutral-600',
      'rounded-lg mb-2',
      'bg-white dark:bg-neutral-900',
      disabled && 'opacity-60',
    ].filter(Boolean).join(' ');
  };

  const getTriggerClasses = () => {
    return [
      'flex-row items-center justify-between p-3',
      'active:bg-neutral-50 dark:active:bg-neutral-800',
    ].join(' ');
  };

  const getTriggerTextClasses = () => {
    return [
      'text-base font-sans',
      selectedOutlet 
        ? 'text-neutral-900 dark:text-white' 
        : 'text-neutral-500 dark:text-neutral-400',
    ].join(' ');
  };

  const getDropdownClasses = () => {
    return [
      'max-h-80',
      'border-t border-neutral-200 dark:border-neutral-600',
      'bg-white dark:bg-neutral-900',
    ].join(' ');
  };

  const getSearchInputClasses = () => {
    return [
      'border-b border-neutral-200 dark:border-neutral-600',
      'p-3',
      'text-base font-sans',
      'text-neutral-900 dark:text-white',
      'bg-neutral-50 dark:bg-neutral-800',
    ].join(' ');
  };

  const getLoadingTextClasses = () => {
    return 'p-4 text-neutral-600 dark:text-neutral-400 font-sans';
  };

  const getOptionClasses = () => {
    return [
      'p-3',
      'border-b border-neutral-100 dark:border-neutral-700',
      'active:bg-neutral-50 dark:active:bg-neutral-800',
    ].join(' ');
  };

  const getOptionTextClasses = () => {
    return 'text-neutral-900 dark:text-white font-sans';
  };

  const getNoResultsClasses = () => {
    return 'p-4 text-neutral-500 dark:text-neutral-400 font-sans text-center';
  };

  return (
    <View className={getContainerClasses()}>
      <TouchableOpacity
        className={getTriggerClasses()}
        onPress={handleToggleDropdown}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={selectedOutlet ? `Outlet terpilih: ${getDisplayText()}` : 'Pilih outlet'}
        accessibilityHint="Ketuk untuk membuka daftar outlet"
      >
        <Text className={getTriggerTextClasses()}>
          {getDisplayText()}
        </Text>
        <Ionicons 
          name={showDropdown ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={colorScheme === 'dark' ? '#a3a3a3' : '#737373'} 
        />
      </TouchableOpacity>

      {showDropdown && !disabled && (
        <View className={getDropdownClasses()}>
          {/* Search Input */}
          <TextInput
            className={getSearchInputClasses()}
            placeholder="Cari outlet..."
            placeholderTextColor={colorScheme === 'dark' ? '#9ca3af' : '#6b7280'}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus
          />

          {loading ? (
            <Text className={getLoadingTextClasses()}>
              Memuat outlet...
            </Text>
          ) : (
            <Animated.ScrollView 
              persistentScrollbar
              nestedScrollEnabled
              showsVerticalScrollIndicator={true}
              style={{ maxHeight: 200 }}
            >
              {filteredOutlets.length > 0 ? (
                filteredOutlets.map(outlet => (
                  <TouchableOpacity
                    key={outlet.id}
                    className={getOptionClasses()}
                    onPress={() => handleSelectOutlet(outlet.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${outlet.name} ${outlet.code}`}
                  >
                    <Text className={getOptionTextClasses()}>
                      {outlet.name} ({outlet.code})
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text className={getNoResultsClasses()}>
                  {searchQuery.trim() ? 'Outlet tidak ditemukan' : 'Tidak ada outlet'}
                </Text>
              )}
            </Animated.ScrollView>
          )}

          {/* Close button area - tap outside to close */}
          <TouchableOpacity
            className="p-2 items-center border-t border-neutral-200 dark:border-neutral-600"
            onPress={handleCloseDropdown}
          >
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              Tutup
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export type { Outlet, OutletDropdownProps };
