import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

// 1. Types first
interface AdvancedFilterProps {
  showAdvancedFilter: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

// 3. Main component (skip custom hook for simple logic)
/**
 * Komponen Advanced Filter yang dapat di-collapse/expand
 * Digunakan untuk menampilkan filter tambahan tanpa memenuhi layar
 */
export const AdvancedFilter = React.memo(function AdvancedFilter({ 
  showAdvancedFilter, 
  onToggle, 
  children 
}: AdvancedFilterProps) {
  const colorScheme = useColorScheme();

  // ✅ PRIMARY - NativeWind classes
  const getToggleButtonClasses = () => {
    return [
      'flex-row items-center justify-center',
      'py-2 px-3 mb-2',
      'rounded-lg border border-neutral-200 dark:border-neutral-600',
      'bg-transparent',
      'active:bg-neutral-50 dark:active:bg-neutral-800',
    ].join(' ');
  };

  const getToggleTextClasses = () => {
    return 'text-sm font-medium text-primary-500 mr-1';
  };

  const getContentClasses = () => {
    return 'overflow-hidden';
  };

  return (
    <>
      {/* Advanced Filter Toggle Button */}
      <TouchableOpacity 
        className={getToggleButtonClasses()}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${showAdvancedFilter ? 'Sembunyikan' : 'Tampilkan'} advanced filter`}
        accessibilityHint="Ketuk untuk toggle advanced filter"
      >
        <Text className={getToggleTextClasses()}>
          Advanced Filter
        </Text>
        <IconSymbol 
          name={showAdvancedFilter ? 'chevron.up' : 'chevron.down'} 
          size={16} 
          color="#FF6B35"
        />
      </TouchableOpacity>
      
      {/* Advanced Filter Content */}
      {showAdvancedFilter && (
        <View className={getContentClasses()}>
          {children}
        </View>
      )}
    </>
  );
});

// 4. Export types for reuse
export type { AdvancedFilterProps };
