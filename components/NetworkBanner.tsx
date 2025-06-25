import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNetwork } from '@/context/network-context';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

// 3. Main component (no types or custom hook needed for this simple component)
export const NetworkBanner = React.memo(function NetworkBanner() {
  const { isConnected } = useNetwork();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  if (isConnected) return null;

  // ✅ PRIMARY - NativeWind classes
  const getBannerClasses = () => {
    return [
      'bg-danger-500',
      'px-4 pb-3',
      'items-center justify-center',
      'z-50', // z-index equivalent in NativeWind
    ].join(' ');
  };

  const getTextClasses = () => {
    return [
      'text-white font-bold text-base',
      'text-center font-sans',
    ].join(' ');
  };

  return (
    <View 
      className={getBannerClasses()}
      style={{
        // ⚠️ SECONDARY - Dynamic safe area top padding
        paddingTop: insets.top + 12,
      }}
    >
      <Text 
        className={getTextClasses()}
        style={{
          // ⚠️ SECONDARY - Custom letter spacing
          letterSpacing: 0.5,
        }}
      >
        Tidak dapat terhubung ke server. Periksa koneksi internet Anda.
      </Text>
    </View>
  );
});
