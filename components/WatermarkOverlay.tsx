import React from 'react';
import { Image, Text, View } from 'react-native';

interface WatermarkData {
  waktu: string;
  outlet: string;
  lokasi: string;
}

interface WatermarkOverlayProps {
  photoUri: string;
  watermarkData: WatermarkData;
  currentLocation?: { latitude: number; longitude: number } | null;
  selectedOutlet?: { code?: string; name?: string; district?: string } | null;
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  photoUri,
  watermarkData,
  currentLocation,
  selectedOutlet,
}) => {
  return (
    <>
      <Image source={{ uri: photoUri }} style={{ flex: 1, width: '100%', height: '100%' }} resizeMode="cover" />
      <View style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 16,
      }}>
        <Text style={{ color: '#FF8800', fontSize: 16, fontWeight: 'bold' }}>
          {selectedOutlet?.code ?? '-'} • {selectedOutlet?.name ?? '-'}
        </Text>
        <Text style={{ color: '#fff', fontSize: 13, marginTop: 3 }}>
          {selectedOutlet?.district ?? '-'}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 5, justifyContent: 'space-between' }}>
          <Text style={{ color: '#fff', fontSize: 12, opacity: 0.9 }}>
            {watermarkData.waktu}
          </Text>
          <Text style={{ color: '#fff', fontSize: 12, opacity: 0.9 }}>
            {currentLocation?.latitude?.toFixed(6)}, {currentLocation?.longitude?.toFixed(6)}
          </Text>
        </View>
      </View>
    </>
  );
}; 