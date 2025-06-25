import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

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
  disabled?: boolean;
  loading?: boolean;
  showDropdown: boolean;
  setShowDropdown: (v: boolean) => void;
}

const useOutletDropdownLogic = ({ 
  outlets, 
  selectedOutletId, 
  onSelect, 
  setShowDropdown, 
  disabled 
}: {
  outlets: Outlet[];
  selectedOutletId: string | null;
  onSelect: (id: string) => void;
  setShowDropdown: (v: boolean) => void;
  disabled?: boolean;
}) => {
  const selectedOutlet = useMemo(() => {
    return outlets.find(o => o.id === selectedOutletId) || null;
  }, [outlets, selectedOutletId]);

  const handleToggleDropdown = useCallback(() => {
    if (!disabled) {
      setShowDropdown(true);
    }
  }, [disabled, setShowDropdown]);

  const handleSelectOutlet = useCallback((outletId: string | number) => {
    onSelect(outletId.toString());
    setShowDropdown(false);
  }, [onSelect, setShowDropdown]);

  const getDisplayText = useCallback(() => {
    if (selectedOutlet) {
      return `${selectedOutlet.name} (${selectedOutlet.code})`;
    }
    return 'Pilih outlet...';
  }, [selectedOutlet]);

  return {
    selectedOutlet,
    handleToggleDropdown,
    handleSelectOutlet,
    getDisplayText,
  };
};

export const OutletDropdown = React.memo(function OutletDropdown({
  outlets,
  selectedOutletId,
  onSelect,
  disabled = false,
  loading = false,
  showDropdown,
  setShowDropdown,
}: OutletDropdownProps) {
  const colorScheme = useColorScheme();
  const {
    selectedOutlet,
    handleToggleDropdown,
    handleSelectOutlet,
    getDisplayText,
  } = useOutletDropdownLogic({ 
    outlets, 
    selectedOutletId, 
    onSelect, 
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

  const handleClose = useCallback(() => {
    setShowDropdown(false);
  }, [setShowDropdown]);

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
          {loading ? (
            <Text className={getLoadingTextClasses()}>
              Memuat outlet...
            </Text>
          ) : (
            <Animated.ScrollView 
              persistentScrollbar
              nestedScrollEnabled
              showsVerticalScrollIndicator={true}
            >
              {outlets.map(outlet => (
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
              ))}
            </Animated.ScrollView>
          )}
        </View>
      )}
    </View>
  );
});

export type { Outlet, OutletDropdownProps };
