import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { OutletAPI } from '@/hooks/data/useOutlet';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

// 1. Types first
interface OutletItemProps {
  outlet: OutletAPI;
}

// 2. Custom hook for component logic
const useOutletItemLogic = (outlet: OutletAPI) => {
  const handlePress = useCallback(() => {
    router.push({ pathname: '/outlet/[id]/view', params: { id: outlet.id } });
  }, [outlet.id]);

  const getStatusColor = useCallback((status?: string) => {
    if (!status || typeof status !== 'string') return 'text-neutral-600 dark:text-neutral-400';
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'maintain':
        return 'text-success-500';
      case 'unproductive':
        return 'text-danger-500';
      case 'unmaintain':
        return 'text-warning-500';
      default:
        return 'text-neutral-600 dark:text-neutral-400';
    }
  }, []);

  const getStatusBgColor = useCallback((status?: string) => {
    if (!status || typeof status !== 'string') return 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'maintain':
        return 'bg-success-50 dark:bg-success-950 border-success-200 dark:border-success-800';
      case 'unproductive':
        return 'bg-danger-50 dark:bg-danger-950 border-danger-200 dark:border-danger-800';
      case 'unmaintain':
        return 'bg-warning-50 dark:bg-warning-950 border-warning-200 dark:border-warning-800';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
    }
  }, []);

  return {
    handlePress,
    getStatusColor,
    getStatusBgColor,
  };
};

// 3. Main component
const OutletItem: React.FC<OutletItemProps> = React.memo(function OutletItem({ outlet }) {
  const colorScheme = useColorScheme();
  const { handlePress, getStatusColor, getStatusBgColor } = useOutletItemLogic(outlet);
  
  // Get colors object for consistency
  const colors = {
    primary: '#FF6B35',
    textSecondary: colorScheme === 'dark' ? '#a3a3a3' : '#737373',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  };
  
  return (
    <TouchableOpacity
      className="mb-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 min-h-[48px]"
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <View className="flex-row items-center">
        {/* Left: Icon Container */}
        <View 
          className="w-9 h-9 rounded-lg justify-center items-center mr-3 border"
        style={{
            backgroundColor: colors.primary + '20', 
            borderColor: colors.primary 
        }}
      >
          <IconSymbol name="building.2.fill" size={20} color={colors.primary} />
        </View>
        
        {/* Center: Outlet Info */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text style={{ fontFamily: 'Inter' }} className="text-base font-medium text-neutral-900 dark:text-neutral-100 flex-1" numberOfLines={1}>
                {outlet.name || '-'}
              </Text>
            {outlet.status && (
              <View 
                className="ml-2 px-2 py-0.5 rounded-lg border"
                style={{ 
                  backgroundColor: outlet.status === 'maintain' ? colors.success + '20' : 
                                   outlet.status === 'unproductive' ? colors.danger + '20' : 
                                   outlet.status === 'unmaintain' ? colors.warning + '20' : '#f3f4f6',
                  borderColor: outlet.status === 'maintain' ? colors.success : 
                              outlet.status === 'unproductive' ? colors.danger : 
                              outlet.status === 'unmaintain' ? colors.warning : '#d1d5db'
                }}
              >
                <Text 
                  style={{ 
                    fontFamily: 'Inter',
                    color: outlet.status === 'maintain' ? colors.success : 
                           outlet.status === 'unproductive' ? colors.danger : 
                           outlet.status === 'unmaintain' ? colors.warning : colors.textSecondary
                  }}
                  className="text-xs font-semibold"
                >
                  {outlet.status.charAt(0).toUpperCase() + outlet.status.slice(1)}
                </Text>
              </View>
            )}
            </View>
          <Text style={{ fontFamily: 'Inter' }} className="text-sm text-neutral-600 dark:text-neutral-400" numberOfLines={1}>
                  {outlet.code || '-'}
                </Text>
          <View className="flex-row items-center mt-1">
            <Text style={{ fontFamily: 'Inter' }} className="text-xs text-neutral-600 dark:text-neutral-400">
                  {outlet.district || '-'}
                </Text>
                {outlet.region?.name && (
              <Text style={{ fontFamily: 'Inter' }} className="text-xs text-neutral-600 dark:text-neutral-400 ml-3">
                      {outlet.region.name}
                    </Text>
                )}
              </View>
            </View>
        
        {/* Right: Chevron */}
        <View className="ml-3">
          <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

// 4. Export
export default OutletItem;
