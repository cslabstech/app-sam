import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './ui/IconSymbol';

interface MediaPreviewProps {
  uri: string;
  type: 'image' | 'video';
  onRemove?: () => void;
  label?: string;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ uri, type, onRemove, label }) => {
  return (
    <View style={{ marginTop: 8 }}>
      {type === 'image' ? (
        <Image source={{ uri }} style={{ width: '100%', height: 120, borderRadius: 8, backgroundColor: '#f0f0f0' }} resizeMode="cover" />
      ) : (
        <View style={{ width: '100%', height: 120, borderRadius: 8, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
          <IconSymbol name="video" size={40} color="#888" />
          <Text style={{ color: '#888', marginTop: 8, fontSize: 13 }}>{label || 'Video Selected'}</Text>
        </View>
      )}
      {onRemove && (
        <TouchableOpacity style={{ marginTop: 4, alignSelf: 'flex-start' }} onPress={onRemove}>
          <Text style={{ color: '#E53935', fontSize: 12 }}>Remove {type === 'image' ? 'Photo' : 'Video'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}; 