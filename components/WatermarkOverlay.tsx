import React, { useMemo } from 'react';
import { Image, Text, View } from 'react-native';

interface WatermarkData {
  waktu: string;
  outlet: string;
  lokasi: string;
}

interface WatermarkOverlayProps {
  photoUri?: string | null;
  watermarkData?: WatermarkData | null;
  currentLocation?: { latitude: number; longitude: number } | null;
  selectedOutlet?: { code?: string; name?: string; district?: string } | null;
}

const useWatermarkOverlayLogic = ({ 
  photoUri, 
  watermarkData, 
  currentLocation, 
  selectedOutlet 
}: WatermarkOverlayProps) => {
  const isDataAvailable = useMemo(() => {
    return !!(photoUri && watermarkData);
  }, [photoUri, watermarkData]);

  const outletDisplayText = useMemo(() => {
    const code = selectedOutlet?.code ?? '-';
    const name = selectedOutlet?.name ?? '-';
    return `${code} • ${name}`;
  }, [selectedOutlet?.code, selectedOutlet?.name]);

  const locationDisplayText = useMemo(() => {
    const lat = currentLocation?.latitude;
    const long = currentLocation?.longitude;
    
    if (lat !== undefined && long !== undefined) {
      return `${lat.toFixed(6)}, ${long.toFixed(6)}`;
    }
    return '-';
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  const timeDisplayText = useMemo(() => {
    return watermarkData?.waktu ?? '-';
  }, [watermarkData?.waktu]);

  return {
    isDataAvailable,
    outletDisplayText,
    locationDisplayText,
    timeDisplayText,
  };
};

export const WatermarkOverlay = React.memo(function WatermarkOverlay({
  photoUri,
  watermarkData,
  currentLocation,
  selectedOutlet,
}: WatermarkOverlayProps) {
  const {
    isDataAvailable,
    outletDisplayText,
    locationDisplayText,
    timeDisplayText,
  } = useWatermarkOverlayLogic({ 
    photoUri, 
    watermarkData, 
    currentLocation, 
    selectedOutlet 
  });

  const getErrorContainerClasses = () => {
    return 'flex-1 justify-center items-center bg-black';
  };

  const getErrorTextClasses = () => {
    return 'text-white text-base font-sans';
  };

  const getImageClasses = () => {
    return 'flex-1 w-full h-full';
  };

  const getOverlayContainerClasses = () => {
    return 'absolute left-0 right-0 bottom-0 px-4 pb-5';
  };

  const getWatermarkBoxClasses = () => {
    return 'bg-black/70 rounded-xl px-4 pt-3 pb-4';
  };

  const getOutletCodeClasses = () => {
    return 'text-warning-500 text-base font-bold mb-1 font-sans tracking-wide';
  };

  const getDistrictTextClasses = () => {
    return 'text-white/80 text-xs mb-1 font-sans';
  };

  const getFooterRowClasses = () => {
    return 'flex-row justify-between items-center mt-1';
  };

  const getTimeTextClasses = () => {
    return 'text-white/70 text-xs font-medium font-sans';
  };

  const getLocationTextClasses = () => {
    return 'text-white/70 text-xs font-medium font-sans';
  };

  if (!isDataAvailable) {
    return (
      <View className={getErrorContainerClasses()}>
        <Text className={getErrorTextClasses()}>
          Gambar tidak tersedia
        </Text>
      </View>
    );
  }

  return (
    <>
      <Image 
        source={{ uri: photoUri! }} 
        className={getImageClasses()} 
        resizeMode="cover"
        accessibilityRole="image"
        accessibilityLabel="Watermarked photo preview"
      />
      
      <View className={getOverlayContainerClasses()}>
        <View 
          className={getWatermarkBoxClasses()}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 8,
          }}
        >
          <Text className={getOutletCodeClasses()}>
            {outletDisplayText}
          </Text>
          
          {selectedOutlet?.district && (
            <Text className={getDistrictTextClasses()}>
              {selectedOutlet.district}
            </Text>
          )}
          
          <View className={getFooterRowClasses()}>
            <Text className={getTimeTextClasses()}>
              {timeDisplayText}
            </Text>
            <Text className={getLocationTextClasses()}>
              {locationDisplayText}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
});

export type { WatermarkData, WatermarkOverlayProps };
