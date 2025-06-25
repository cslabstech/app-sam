import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { useColorScheme } from '@/hooks/utils/useColorScheme';

// 1. Types first
interface LocationStatusProps {
  locationValidated: boolean;
  distance: number | null;
  outletRadius: number;
  onUpdateOutlet: () => void;
}

// 2. Custom hook for component logic
const useLocationStatusLogic = ({ locationValidated, distance, outletRadius }: {
  locationValidated: boolean;
  distance: number | null;
  outletRadius: number;
}) => {
  const isRadiusUnlimited = useMemo(() => outletRadius === 0, [outletRadius]);
  
  const statusConfig = useMemo(() => {
    if (isRadiusUnlimited) {
      return {
        iconName: 'checkmark-circle' as 'checkmark-circle',
        iconColor: '#22C55E',
        textColor: 'text-success-500',
        message: 'Validasi lokasi dilewati (radius tidak dibatasi)',
      };
    }
    
    return {
      iconName: (locationValidated ? 'checkmark-circle' : 'close-circle') as 'checkmark-circle' | 'close-circle',
      iconColor: locationValidated ? '#22C55E' : '#EF4444',
      textColor: locationValidated ? 'text-success-500' : 'text-danger-500',
      message: locationValidated ? 'Lokasi valid' : 'Lokasi terlalu jauh',
    };
  }, [isRadiusUnlimited, locationValidated]);

  const distanceText = useMemo(() => {
    if (distance === null || isRadiusUnlimited) return null;
    return `Jarak: ${Math.round(distance)}m (Max: ${outletRadius}m)`;
  }, [distance, outletRadius, isRadiusUnlimited]);

  const shouldShowUpdateButton = useMemo(() => {
    return !isRadiusUnlimited && !locationValidated;
  }, [isRadiusUnlimited, locationValidated]);

  return {
    isRadiusUnlimited,
    statusConfig,
    distanceText,
    shouldShowUpdateButton,
  };
};

// 3. Main component
export const LocationStatus = React.memo(function LocationStatus({
  locationValidated,
  distance,
  outletRadius,
  onUpdateOutlet,
}: LocationStatusProps) {
  const colorScheme = useColorScheme();
  const {
    isRadiusUnlimited,
    statusConfig,
    distanceText,
    shouldShowUpdateButton,
  } = useLocationStatusLogic({ locationValidated, distance, outletRadius });

  // ✅ PRIMARY - NativeWind classes
  const getContainerClasses = () => {
    return [
      'bg-white/95 dark:bg-neutral-800/95',
      'rounded-lg p-3 mb-3',
    ].join(' ');
  };

  const getStatusRowClasses = () => {
    return 'flex-row items-center mb-1';
  };

  const getStatusTextClasses = () => {
    return `ml-2 font-medium ${statusConfig.textColor}`;
  };

  const getDistanceTextClasses = () => {
    return 'text-neutral-600 dark:text-neutral-400 text-xs mb-2';
  };

  const getUpdateButtonClasses = () => {
    return [
      'bg-warning-500 rounded-md py-2 px-3',
      'flex-row items-center self-start',
      'active:bg-warning-600',
    ].join(' ');
  };

  const getUpdateButtonTextClasses = () => {
    return 'text-white text-xs font-medium ml-1';
  };

  if (isRadiusUnlimited) {
    return (
      <View 
        className={getContainerClasses()}
        style={{
          // ⚠️ SECONDARY - Complex shadow styling
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View className={getStatusRowClasses()}>
          <Ionicons 
            name={statusConfig.iconName} 
            size={20} 
            color={statusConfig.iconColor} 
          />
          <Text className={getStatusTextClasses()}>
            {statusConfig.message}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View 
      className={getContainerClasses()}
      style={{
        // ⚠️ SECONDARY - Complex shadow styling
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className={getStatusRowClasses()}>
        <Ionicons 
          name={statusConfig.iconName} 
          size={20} 
          color={statusConfig.iconColor} 
        />
        <Text className={getStatusTextClasses()}>
          {statusConfig.message}
        </Text>
      </View>
      
      {distanceText && (
        <Text className={getDistanceTextClasses()}>
          {distanceText}
        </Text>
      )}
      
      {shouldShowUpdateButton && (
        <TouchableOpacity
          className={getUpdateButtonClasses()}
          onPress={onUpdateOutlet}
          accessibilityRole="button"
          accessibilityLabel="Update lokasi outlet"
          accessibilityHint="Ketuk untuk mengubah koordinat outlet"
        >
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Text className={getUpdateButtonTextClasses()}>
            Update Lokasi Outlet
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// 4. Export types for reuse
export type { LocationStatusProps };
