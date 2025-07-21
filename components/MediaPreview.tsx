import { useColorScheme } from '@/hooks/utils/useColorScheme';
import React, { useCallback } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './ui/IconSymbol';

interface MediaPreviewProps {
  uri: string;
  type: 'image' | 'video';
  onRemove?: () => void;
  label?: string;
}

const useMediaPreviewLogic = ({ onRemove, type }: {
  onRemove?: () => void;
  type: 'image' | 'video';
}) => {
  const handleRemove = useCallback(() => {
    onRemove?.();
  }, [onRemove]);

  const getRemoveButtonText = useCallback(() => {
    return `Remove ${type === 'image' ? 'Photo' : 'Video'}`;
  }, [type]);

  return {
    handleRemove,
    getRemoveButtonText,
  };
};

export const MediaPreview = React.memo(function MediaPreview({ 
  uri, 
  type, 
  onRemove, 
  label 
}: MediaPreviewProps) {
  const colorScheme = useColorScheme();
  const { handleRemove, getRemoveButtonText } = useMediaPreviewLogic({ onRemove, type });

  return (
    <View className="mt-3">
      {type === 'image' ? (
        <View className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
          <Image 
            source={{ uri }} 
            className="w-full"
            style={{
              height: 200,
              borderRadius: 8,
            }}
            resizeMode="cover"
            accessibilityRole="image"
            accessibilityLabel="Selected image preview"
          />
        </View>
      ) : (
        <View className="w-full h-32 rounded-lg bg-neutral-100 dark:bg-neutral-800 justify-center items-center border border-neutral-200 dark:border-neutral-700">
          <IconSymbol 
            name="video" 
            size={40} 
            color={colorScheme === 'dark' ? '#a3a3a3' : '#666666'} 
          />
          <Text className="text-neutral-600 dark:text-neutral-400 mt-2 text-sm" style={{ fontFamily: 'Inter' }}>
            {label || 'Video Selected'}
          </Text>
        </View>
      )}
      
      {onRemove && (
        <TouchableOpacity 
          className="mt-2 self-start px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800"
          onPress={handleRemove}
          accessibilityRole="button"
          accessibilityLabel={getRemoveButtonText()}
          accessibilityHint="Ketuk untuk menghapus media"
        >
          <Text className="text-red-600 dark:text-red-400 text-sm" style={{ fontFamily: 'Inter' }}>
            {getRemoveButtonText()}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

export type { MediaPreviewProps };
