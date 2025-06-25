import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/Card';
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
  // Debug log untuk memastikan data outlet yang diterima
  console.log('OutletItem props:', outlet);

  const colorScheme = useColorScheme();
  const { handlePress, getStatusColor, getStatusBgColor } = useOutletItemLogic(outlet);
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      className="mb-3 mx-0.5"
      activeOpacity={0.92}
    >
      <Card 
        noPadding
        variant="elevated"
        className="rounded-2xl overflow-hidden border-0"
        style={{
          // ⚠️ SECONDARY - Complex shadow for elevated card
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
            android: {
              elevation: 4,
            },
          }),
        }}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1 p-4">
            {/* Header with Status Badge */}
            <View className="flex-row justify-between items-center mb-2">
              <Text 
                className="flex-1 text-lg font-bold text-neutral-900 dark:text-white mr-2" 
                style={{ letterSpacing: -0.3 }}
                numberOfLines={2} 
                ellipsizeMode="tail"
              >
                {outlet.name || '-'}
              </Text>
              <View 
                className={`px-2 py-1 ml-2 rounded-lg border ${getStatusBgColor(outlet.status)}`}
              >
                <Text 
                  className={`text-xs font-semibold ${getStatusColor(outlet.status)}`}
                  style={{ letterSpacing: -0.2 }}
                > 
                  {outlet.status ? outlet.status.charAt(0).toUpperCase() + outlet.status.slice(1) : '-'}
                </Text>
              </View>
            </View>
            
            {/* Outlet Code */}
            <View className="flex-row items-center mb-2.5">
              <View className="flex-row items-center mr-3">
                <IconSymbol name="qrcode" size={14} color="#FF6B35" />
                <Text 
                  className="text-sm font-semibold text-primary-500 ml-1" 
                  numberOfLines={1} 
                  ellipsizeMode="tail"
                >
                  {outlet.code || '-'}
                </Text>
              </View>
            </View>

            {/* Location Info */}
            <View className="mt-1">
              <View className="flex-row items-start mb-2">
                <IconSymbol 
                  name="mappin.and.ellipse" 
                  size={14} 
                  color={colorScheme === 'dark' ? '#a3a3a3' : '#737373'} 
                  style={{ marginTop: 2 }} 
                />
                <Text 
                  className="flex-1 text-sm font-medium text-neutral-900 dark:text-white ml-1" 
                  style={{ lineHeight: 18 }}
                  numberOfLines={2} 
                  ellipsizeMode="tail"
                >
                  {outlet.district || '-'}
                </Text>
              </View>

              {/* Location Details */}
              <View className="flex-row flex-wrap mt-1">
                {outlet.region?.name && (
                  <View className="flex-row items-center mr-3 mb-1">
                    <IconSymbol 
                      name="map.fill" 
                      size={12} 
                      color={colorScheme === 'dark' ? '#a3a3a3' : '#737373'} 
                    />
                    <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400 ml-1">
                      {outlet.region.name}
                    </Text>
                  </View>
                )}

                {outlet.cluster?.name && (
                  <View className="flex-row items-center mr-3 mb-1">
                    <IconSymbol 
                      name="location.circle.fill" 
                      size={14} 
                      color={colorScheme === 'dark' ? '#a3a3a3' : '#737373'} 
                    />
                    <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400 ml-1">
                      {outlet.cluster.name}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View className="px-3">
            <IconSymbol 
              name="chevron.right" 
              size={22} 
              color={colorScheme === 'dark' ? '#a3a3a3' : '#737373'} 
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
});

// 4. Export
export default OutletItem;
