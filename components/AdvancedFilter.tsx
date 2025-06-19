import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

interface AdvancedFilterProps {
  showAdvancedFilter: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/**
 * Komponen Advanced Filter yang dapat di-collapse/expand
 * Digunakan untuk menampilkan filter tambahan tanpa memenuhi layar
 */
export function AdvancedFilter({ showAdvancedFilter, onToggle, children }: AdvancedFilterProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const styles = StyleSheet.create({
    advancedFilterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
      marginBottom: spacing.sm,
    },
    advancedFilterButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
      marginRight: 4,
    },
    advancedFilterContent: {
      overflow: 'hidden',
    },
  });

  return (
    <>
      {/* Advanced Filter Toggle Button */}
      <TouchableOpacity 
        style={styles.advancedFilterButton}
        onPress={onToggle}
      >
        <Text style={styles.advancedFilterButtonText}>Advanced Filter</Text>
        <IconSymbol 
          name={showAdvancedFilter ? 'chevron.up' : 'chevron.down'} 
          size={16} 
          color={colors.primary} 
        />
      </TouchableOpacity>
      
      {/* Advanced Filter Content */}
      {showAdvancedFilter && (
        <View style={styles.advancedFilterContent}>
          {children}
        </View>
      )}
    </>
  );
}
