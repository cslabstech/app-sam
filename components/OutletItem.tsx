import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { OutletAPI } from '@/hooks/data/useOutlet';

// Types
interface OutletItemProps {
  outlet: OutletAPI;
}

// Custom hook for status badge logic
const useStatusBadge = () => {
  const getStatusConfig = useCallback((status?: string) => {
    if (!status || typeof status !== 'string') {
      return {
        color: '#6b7280',
        bgColor: '#f3f4f6',
        label: 'Unknown'
      };
    }
    
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'maintain':
        return {
          color: '#16a34a',
          bgColor: '#dcfce7',
          label: 'MAINTAIN'
        };
      case 'unmaintain':
        return {
          color: '#f59e0b',
          bgColor: '#fef3c7',
          label: 'UNMAINTAIN'
        };
      case 'unproductive':
        return {
          color: '#dc2626',
          bgColor: '#fecaca',
          label: 'UNPRODUCTIVE'
        };
      default:
        return {
          color: '#6b7280',
          bgColor: '#f3f4f6',
          label: status.toUpperCase()
        };
    }
  }, []);

  return { getStatusConfig };
};

// OutletItem with VisitCard styling
const OutletItem: React.FC<OutletItemProps> = React.memo(function OutletItem({ outlet }) {
  const { getStatusConfig } = useStatusBadge();
  
  const statusConfig = getStatusConfig(outlet.status);
  
  const handlePress = useCallback(() => {
    router.push({ pathname: '/outlet/[id]/view', params: { id: outlet.id } });
  }, [outlet.id]);
  
  return (
    <View className="px-4 mb-3">
      <TouchableOpacity
        className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700"
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Header - Outlet Name + Status Badge */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text 
              style={{ fontFamily: 'Inter' }} 
              className="text-base font-semibold text-neutral-900 dark:text-neutral-100"
              numberOfLines={1}
            >
              {outlet.name || 'Unknown Outlet'}
            </Text>
            <Text 
              style={{ fontFamily: 'Inter' }} 
              className="text-sm text-neutral-600 dark:text-neutral-400 mt-1"
              numberOfLines={1}
            >
              {outlet.code} • {outlet.district}
            </Text>
          </View>
          
          {/* Status Badge */}
          <View 
            className="px-2 py-1 rounded-md"
            style={{ 
              backgroundColor: statusConfig.bgColor
            }}
          >
            <Text 
              style={{ 
                fontFamily: 'Inter',
                color: statusConfig.color,
                fontSize: 10,
                fontWeight: '600'
              }}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Basic Info - Two columns */}
        <View className="flex-row justify-between items-center">
          {/* Left: Divisi */}
          <View className="flex-1">
            <Text 
              style={{ fontFamily: 'Inter' }} 
              className="text-sm text-neutral-600 dark:text-neutral-400"
              numberOfLines={1}
            >
              {outlet.division?.name || 'No Division'}
            </Text>
          </View>

          {/* Right: Level */}
          <View className="flex-row items-center">
            <Text 
              style={{ fontFamily: 'Inter' }} 
              className="text-sm text-neutral-600 dark:text-neutral-400"
            >
              Level: {(outlet as any).level || '-'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

export default OutletItem;
