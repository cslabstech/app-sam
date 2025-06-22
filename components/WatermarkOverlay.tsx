import React from 'react';
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

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  photoUri,
  watermarkData,
  currentLocation,
  selectedOutlet,
}) => {
  if (!photoUri || !watermarkData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Gambar tidak tersedia</Text>
      </View>
    );
  }
  let lat = currentLocation?.latitude;
  let long = currentLocation?.longitude;
  return (
    <>
 <Image source={{ uri: photoUri }} className="flex-1 w-full h-full" resizeMode="cover" />
      <View className="absolute left-0 right-0 bottom-0 px-4 pb-5">
        <View className="bg-black/70 rounded-xl shadow-lg px-4 pt-3 pb-4">
          <Text className="text-[#FF8800] text-base font-bold mb-1 tracking-wide">
            {(selectedOutlet?.code ?? '-') + ' • ' + (selectedOutlet?.name ?? '-')}
          </Text>
          {selectedOutlet?.district && (
            <Text className="text-white/80 text-xs mb-1">{selectedOutlet.district}</Text>
          )}
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-white/70 text-xs font-medium">
              {watermarkData.waktu ?? '-'}
            </Text>
            <Text className="text-white/70 text-xs font-medium">
              {lat !== undefined && long !== undefined ? `${lat.toFixed(6)}, ${long.toFixed(6)}` : '-'}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}; 