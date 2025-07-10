import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Linking, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PermissionBottomSheetProps {
  visible: boolean;
  type: 'location' | 'camera';
  onRequestPermission: () => void;
  onClose: () => void;
  onOpenSettings?: () => void;
  isDenied?: boolean;
}

export const PermissionBottomSheet: React.FC<PermissionBottomSheetProps> = ({
  visible,
  type,
  onRequestPermission,
  onClose,
  onOpenSettings,
  isDenied = false
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%'], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  // Simple backdrop with high z-index
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    []
  );

  const getContent = () => {
    if (type === 'location') {
      return {
        icon: 'location-outline' as const,
        title: 'Izin Lokasi',
        description: 'Diperlukan untuk check-in dan check-out kunjungan',
        buttonText: isDenied ? 'Buka Pengaturan' : 'Berikan Izin',
      };
    } else {
      return {
        icon: 'camera-outline' as const,
        title: 'Izin Kamera',
        description: 'Diperlukan untuk dokumentasi kunjungan',
        buttonText: isDenied ? 'Buka Pengaturan' : 'Berikan Izin',
      };
    }
  };

  const content = getContent();

  const handleButtonPress = async () => {
    if (isDenied) {
      // Jika permission ditolak, langsung buka pengaturan aplikasi
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } else {
      // Jika belum pernah diminta, request permission normal
      onRequestPermission();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      statusBarTranslucent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, position: 'relative' }}>
        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose
          onClose={onClose}
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={{ 
            backgroundColor: colorScheme === 'dark' ? '#525252' : '#d1d5db', 
            width: 32, 
            height: 3 
          }}
          backgroundStyle={{ 
            backgroundColor: colorScheme === 'dark' ? '#171717' : '#ffffff',
            borderTopLeftRadius: 16, 
            borderTopRightRadius: 16,
          }}
        >
          <BottomSheetView 
            className="flex-1 px-6 pt-6" 
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            {/* Simple icon and title */}
            <View className="items-center mb-6">
              <View className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center mb-4">
                <Ionicons 
                  name={content.icon} 
                  size={24} 
                  color={colors.textSecondary} 
                />
              </View>
              
              <Text 
                className="text-xl font-semibold text-center mb-2"
                style={{ color: colors.text, fontFamily: 'Inter' }}
              >
                {content.title}
              </Text>
              
              <Text 
                className="text-base text-center"
                style={{ color: colors.textSecondary, fontFamily: 'Inter' }}
              >
                {content.description}
              </Text>
            </View>

            {/* Simple denied message */}
            {isDenied && (
              <View className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 mb-6">
                <Text 
                  className="text-sm text-center"
                  style={{ color: '#d97706', fontFamily: 'Inter' }}
                >
                  Izin telah ditolak. Tekan tombol di bawah untuk membuka pengaturan.
                </Text>
              </View>
            )}

            {/* Single clear action button */}
            <View className="space-y-3">
              <TouchableOpacity
                onPress={handleButtonPress}
                className="w-full py-3 rounded-lg bg-neutral-900 dark:bg-neutral-100"
              >
                <Text 
                  className="text-white dark:text-neutral-900 font-medium text-base text-center"
                  style={{ fontFamily: 'Inter' }}
                >
                  {content.buttonText}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                className="w-full py-2"
              >
                <Text 
                  className="text-center text-base"
                  style={{ color: colors.textTertiary, fontFamily: 'Inter' }}
                >
                  Lewati
                </Text>
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </Modal>
  );
}; 