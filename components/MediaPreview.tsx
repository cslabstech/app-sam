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

  const getContainerClasses = () => {
    return 'mt-2';
  };

  const getMediaContainerClasses = () => {
    return [
      'w-full h-30 rounded-lg',
      'bg-neutral-100 dark:bg-neutral-800',
    ].join(' ');
  };

  const getVideoPlaceholderClasses = () => {
    return [
      'w-full h-30 rounded-lg',
      'bg-neutral-100 dark:bg-neutral-800',
      'justify-center items-center',
    ].join(' ');
  };

  const getVideoLabelClasses = () => {
    return 'text-neutral-600 dark:text-neutral-400 mt-2 text-sm font-sans';
  };

  const getRemoveButtonClasses = () => {
    return 'mt-1 self-start';
  };

  const getRemoveTextClasses = () => {
    return 'text-danger-600 dark:text-danger-400 text-xs font-sans';
  };

  return (
    <View className={getContainerClasses()}>
      {type === 'image' ? (
        <Image 
          source={{ uri }} 
          className={getMediaContainerClasses()}
          style={{
            // ⚠️ SECONDARY - Image specific styling that can't be done with NativeWind
            height: 120,
            borderRadius: 8,
          }}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel="Selected image preview"
        />
      ) : (
        <View className={getVideoPlaceholderClasses()}>
          <IconSymbol 
            name="video" 
            size={40} 
            color={colorScheme === 'dark' ? '#a3a3a3' : '#888888'} 
          />
          <Text className={getVideoLabelClasses()}>
            {label || 'Video Selected'}
          </Text>
        </View>
      )}
      
      {onRemove && (
        <TouchableOpacity 
          className={getRemoveButtonClasses()}
          onPress={handleRemove}
          accessibilityRole="button"
          accessibilityLabel={getRemoveButtonText()}
          accessibilityHint="Ketuk untuk menghapus media"
        >
          <Text className={getRemoveTextClasses()}>
            {getRemoveButtonText()}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

export type { MediaPreviewProps };
