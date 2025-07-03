import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Keyboard, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';

import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { WatermarkOverlay } from '@/components/WatermarkOverlay';
import { Colors } from '@/constants/Colors';
import { useVisit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { processImageWithTargetSize, validateImage } from '@/utils/imageProcessor';

interface Visit {
  id: string | number;
  outlet: {
    id: string | number;
    code: string;
    name: string;
    district?: string;
    owner_name: string;
    address: string;
    badan_usaha: { id: string | number; name: string; };
    division: { id: string | number; name: string; };
    region: { id: string | number; name: string; };
    cluster: { id: string | number; name: string; };
  };
}

interface CheckOutFormData {
  notes: string;
  transaction: 'YES' | 'NO' | null;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const ErrorBoundary = memo(function ErrorBoundary(props: { children: React.ReactNode }) {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-lg font-bold text-danger-600">Terjadi kesalahan pada aplikasi.</Text>
      <Text className="text-base text-neutral-500 mt-2">Silakan tutup dan buka ulang aplikasi.</Text>
    </View>
  );
});

const useCheckOutForm = () => {
  const [formData, setFormData] = useState<CheckOutFormData>({
    notes: '',
    transaction: null,
  });

  const updateField = useCallback((field: keyof CheckOutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!formData.notes.trim()) {
      Alert.alert('Catatan Wajib', 'Mohon isi catatan untuk check out.');
      return false;
    }
    if (!formData.transaction) {
      Alert.alert('Transaksi Wajib', 'Mohon pilih status transaksi.');
      return false;
    }
    return true;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      notes: '',
      transaction: null,
    });
  }, []);

  return {
    formData,
    updateField,
    validateForm,
    resetForm,
  };
};

// Face detection overlay component
const FaceDetectionOverlay = memo(function FaceDetectionOverlay() {
  return (
    <View className="absolute inset-0 items-center justify-center">
      <View 
        className="w-80 h-80 rounded-full border-4 border-white border-dashed"
        style={{
          borderStyle: 'dashed',
        }}
      />
    </View>
  );
});

const Header = memo(function Header({ currentStep, onBack, onRefresh, colors }: { 
  currentStep: number; 
  onBack: () => void; 
  onRefresh?: () => void;
  colors: any;
}) {
  const insets = useSafeAreaInsets();
  
  const headerStyle = useMemo(() => ({ 
    paddingTop: insets.top + 12,
    backgroundColor: colors.primary
  }), [insets.top, colors.primary]);
  
  return (
    <View className="px-4 pb-4" style={headerStyle}>
      <View className="flex-row justify-between items-center">
        <TouchableOpacity 
          onPress={onBack} 
          className="w-8 h-8 items-center justify-center"
          accessibilityRole="button" 
          accessibilityLabel="Kembali"
        >
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1 items-center mx-4">
          <Text className="text-white text-xl font-semibold" style={{ fontFamily: 'Inter_600SemiBold' }}>
            Check Out
          </Text>
          <Text className="text-white/80 text-sm mt-0.5" style={{ fontFamily: 'Inter_400Regular' }}>
            Langkah {currentStep} dari 2
          </Text>
        </View>
        {currentStep === 1 && onRefresh ? (
          <TouchableOpacity 
            onPress={onRefresh} 
            className="w-8 h-8 items-center justify-center"
            accessibilityRole="button" 
            accessibilityLabel="Refresh data"
          >
            <IconSymbol name="arrow.clockwise" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View className="w-8 h-8" />
        )}
      </View>
    </View>
  );
});

function parseLatLong(latlong: string): { latitude: number; longitude: number } | null {
  if (!latlong) return null;
  const [lat, lng] = latlong.split(',').map(Number);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { latitude: lat, longitude: lng };
}

const TransactionSelector = memo(function TransactionSelector({ 
  selectedTransaction, 
  onTransactionChange 
}: { 
  selectedTransaction: 'YES' | 'NO' | null;
  onTransactionChange: (transaction: 'YES' | 'NO') => void;
}) {
  const handleYesPress = useCallback(() => onTransactionChange('YES'), [onTransactionChange]);
  const handleNoPress = useCallback(() => onTransactionChange('NO'), [onTransactionChange]);
  
  const yesButtonClass = useMemo(() => 
    `flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg border ${
      selectedTransaction === 'YES' 
        ? 'bg-primary-500 border-primary-500' 
        : 'bg-white border-neutral-200'
    }`,
    [selectedTransaction]
  );

  const noButtonClass = useMemo(() => 
    `flex-1 flex-row items-center justify-center py-3 px-4 rounded-lg border ${
      selectedTransaction === 'NO' 
        ? 'bg-primary-500 border-primary-500' 
        : 'bg-white border-neutral-200'
    }`,
    [selectedTransaction]
  );

  const yesCircleClass = useMemo(() => 
    `w-6 h-6 rounded-full mr-2 items-center justify-center ${
      selectedTransaction === 'YES' ? 'bg-white' : 'bg-neutral-100'
    }`,
    [selectedTransaction]
  );

  const noCircleClass = useMemo(() => 
    `w-6 h-6 rounded-full mr-2 items-center justify-center ${
      selectedTransaction === 'NO' ? 'bg-white' : 'bg-neutral-100'
    }`,
    [selectedTransaction]
  );
  
  return (
    <View className="mb-4">
      <Text className="text-base font-semibold mb-3 text-neutral-800" style={{ fontFamily: 'Inter_500Medium' }}>
        Status Transaksi
      </Text>
      <View className="flex-row gap-3">
        <TouchableOpacity
          className={yesButtonClass}
          onPress={handleYesPress}
          accessibilityRole="button"
          accessibilityLabel="Pilih transaksi YES"
        >
          <View className={yesCircleClass}>
            <IconSymbol 
              name="checkmark" 
              size={14} 
              color={selectedTransaction === 'YES' ? '#f97316' : '#9CA3AF'} 
            />
          </View>
          <Text className={`font-medium ${
            selectedTransaction === 'YES' ? 'text-white' : 'text-neutral-700'
          }`} style={{ fontFamily: 'Inter_500Medium' }}>
            Ada Transaksi
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={noButtonClass}
          onPress={handleNoPress}
          accessibilityRole="button"
          accessibilityLabel="Pilih transaksi NO"
        >
          <View className={noCircleClass}>
            <IconSymbol 
              name="xmark" 
              size={14} 
              color={selectedTransaction === 'NO' ? '#f97316' : '#9CA3AF'} 
            />
          </View>
          <Text className={`font-medium ${
            selectedTransaction === 'NO' ? 'text-white' : 'text-neutral-700'
          }`} style={{ fontFamily: 'Inter_500Medium' }}>
            Tidak Ada
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const NotesInput = memo(function NotesInput({ 
  notes, 
  onNotesChange 
}: { 
  notes: string;
  onNotesChange: (notes: string) => void;
}) {
  const handleSubmitEditing = useCallback(() => Keyboard.dismiss(), []);
  
  const inputStyle = useMemo(() => ({ 
    textAlignVertical: 'top' as const,
    fontFamily: 'Inter_400Regular'
  }), []);
  
  return (
    <View className="mb-6">
      <Text className="text-base font-semibold mb-3 text-neutral-800" style={{ fontFamily: 'Inter_500Medium' }}>
        Catatan Kunjungan
      </Text>
      <View className="bg-white rounded-lg border border-neutral-200">
        <TextInput
          className="p-3 min-h-[100px] text-neutral-800 text-base leading-5"
          placeholder="Tuliskan catatan atau keterangan kunjungan Anda di sini..."
          placeholderTextColor="#9CA3AF"
          multiline
          value={notes}
          onChangeText={onNotesChange}
          style={inputStyle}
          blurOnSubmit={true}
          returnKeyType="done"
          onSubmitEditing={handleSubmitEditing}
          maxLength={500}
          accessibilityLabel="Input catatan kunjungan"
          accessibilityHint="Masukkan catatan atau keterangan untuk kunjungan ini"
        />
      </View>
      <Text className="text-xs text-neutral-500 mt-2" style={{ fontFamily: 'Inter_400Regular' }}>
        {notes.length}/500 karakter
      </Text>
    </View>
  );
});

// Simple camera screen for checkout
const SimpleCameraScreenCheckout = memo(function SimpleCameraScreenCheckout({ 
  hasCameraPermission, 
  requestCameraPermission,
  cameraRef,
  setCameraRef,
  isCameraReady,
  setIsCameraReady,
  isFlashOn,
  setIsFlashOn,
  isProcessingPhoto,
  onTakePhoto,
  onGoBack,
  visit
}: {
  hasCameraPermission: any;
  requestCameraPermission: () => void;
  cameraRef: any;
  setCameraRef: (ref: any) => void;
  isCameraReady: boolean;
  setIsCameraReady: (ready: boolean) => void;
  isFlashOn: boolean;
  setIsFlashOn: (flash: boolean) => void;
  isProcessingPhoto: boolean;
  onTakePhoto: () => void;
  onGoBack: () => void;
  visit: Visit;
}) {
  const insets = useSafeAreaInsets();
  
  const backButtonStyle = useMemo(() => ({ 
    top: insets.top + 16 
  }), [insets.top]);

  const flashButtonStyle = useMemo(() => ({ 
    top: insets.top + 16 
  }), [insets.top]);

  const bottomButtonStyle = useMemo(() => ({ 
    paddingBottom: Math.max(insets.bottom, 16) 
  }), [insets.bottom]);

  const handleToggleFlash = useCallback(() => {
    setIsFlashOn(!isFlashOn);
  }, [isFlashOn, setIsFlashOn]);

  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, [setIsCameraReady]);
  
  return (
    <View className="flex-1 bg-black">
    {/* Back button */}
    <TouchableOpacity 
      className="absolute left-4 bg-black/60 rounded-full p-3 z-30 items-center justify-center" 
      style={backButtonStyle}
      onPress={onGoBack}
      accessibilityRole="button"
      accessibilityLabel="Kembali"
    >
      <Ionicons name="arrow-back" size={20} color="#fff" />
    </TouchableOpacity>
    
    {/* Flash toggle */}
    {hasCameraPermission?.status === 'granted' && (
      <TouchableOpacity 
        className="absolute right-4 bg-black/60 rounded-full p-3 z-30 items-center justify-center" 
        style={flashButtonStyle}
        onPress={handleToggleFlash}
        accessibilityRole="button"
        accessibilityLabel={isFlashOn ? 'Matikan flash' : 'Nyalakan flash'}
      >
        <Ionicons name={isFlashOn ? 'flash' : 'flash-off'} size={20} color="#fff" />
      </TouchableOpacity>
    )}
    
    {/* Camera view */}
    {hasCameraPermission?.status === 'granted' ? (
      <>
        <CameraView
          ref={ref => setCameraRef(ref)}
          style={{ flex: 1, width: '100%', height: '100%' }}
          onCameraReady={handleCameraReady}
          facing="front"
          flash={isFlashOn ? 'on' : 'off'}
        />
        
        {/* Face detection overlay */}
        <FaceDetectionOverlay />
        
        {!isCameraReady && (
          <View className="absolute inset-0 items-center justify-center bg-black bg-opacity-50">
            <ActivityIndicator size="large" color="#f97316" />
            <Text className="text-white text-base mt-4">Menyiapkan kamera...</Text>
          </View>
        )}
      </>
    ) : (
      <View className="flex-1 items-center justify-center bg-black">
        <TouchableOpacity onPress={requestCameraPermission} className="items-center justify-center">
          <Ionicons name="camera" size={60} color="#f97316" />
          <Text className="text-white text-base mt-4">Izinkan akses kamera</Text>
        </TouchableOpacity>
      </View>
    )}

    {/* Fixed bottom button */}
    <View className="absolute bottom-0 left-0 right-0 p-4 items-center" style={bottomButtonStyle}>
      <Button
        title={isProcessingPhoto ? 'Mengompresi...' : 'Kirim'}
        variant="primary"
        size="lg"
        fullWidth
        loading={isProcessingPhoto}
        disabled={!isCameraReady}
        onPress={onTakePhoto}
      />
    </View>
    
    {/* Processing overlay */}
    {isProcessingPhoto && (
      <View className="absolute inset-0 bg-black/50 items-center justify-center z-40">
        <View className="bg-white rounded-xl p-6 mx-8 items-center">
          <ActivityIndicator size="large" color="#f97316" />
          <Text className="text-black text-lg font-semibold mt-4">Memproses Foto</Text>
          <Text className="text-neutral-600 text-sm mt-2 text-center">
            Sedang mengompresi gambar...
          </Text>
          <Text className="text-neutral-500 text-xs mt-2 text-center">
            Mohon tunggu, proses ini membutuhkan beberapa detik
          </Text>
        </View>
      </View>
    )}
      </View>
    );
  });

  const LoadingState = memo(function LoadingState() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <Header currentStep={1} onBack={() => router.back()} colors={colors} />
        <View className="flex-1 justify-center items-center px-6">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-base" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
            Memuat data kunjungan...
          </Text>
        </View>
      </View>
    );
  });

  const ErrorState = memo(function ErrorState({ onBack }: { onBack: () => void }) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <Header currentStep={1} onBack={onBack} colors={colors} />
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: colors.danger + '20' }}>
            <IconSymbol name="exclamationmark.triangle" size={32} color={colors.danger} />
          </View>
          <Text className="text-lg font-semibold text-center mb-2" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
            Data Tidak Ditemukan
          </Text>
          <Text className="text-sm text-center mb-6" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
            Data kunjungan tidak dapat ditemukan atau sudah tidak valid
          </Text>
          <Button
            title="Kembali"
            variant="primary"
            onPress={onBack}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    );
  });

export default memo(function CheckOutScreen() {
  // CRITICAL: All hooks must be at the top level and in consistent order
  const { id } = useLocalSearchParams();
  const { checkOutVisit, fetchVisit } = useVisit();
  const colorScheme = useColorScheme();
  const [hasCameraPermission, requestCameraPermission] = useCameraPermissions();
  const formManager = useCheckOutForm();
  
  // State hooks in consistent order
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rawPhoto, setRawPhoto] = useState<string | null>(null);
  const [watermarkData, setWatermarkData] = useState<{ waktu: string; outlet: string; lokasi: string } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(1);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  
  // Refs
  const viewShotRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  // Safe area hook
  const insets = useSafeAreaInsets();
  
  // Derived values
  const visitId = useMemo(() => typeof id === 'string' ? id : '', [id]);
  const colors = useMemo(() => Colors[colorScheme ?? 'light'], [colorScheme]);

  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          return null;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
      };
      
      setCurrentLocation(coords);
      return coords;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }, []);

  const changeStep = useCallback((newStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(newStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchVisitDetail = async () => {
      if (!visitId) return;
      
      try {
        setLoading(true);
        const res = await fetchVisit(visitId);
        
        if (isMounted) {
          if (res.success) {
            setVisit(res.data || null);
          } else {
            setVisit(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching visit:', error);
        if (isMounted) {
          setVisit(null);
          setLoading(false);
        }
      }
    };

    fetchVisitDetail();
    getCurrentLocation();
    
    // Add keyboard listeners for better keyboard handling
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Optionally handle keyboard hide
    });
    
    return () => {
      isMounted = false;
      keyboardDidHideListener.remove();
    };
  }, [visitId, fetchVisit, getCurrentLocation]);

  // Map region update
  useEffect(() => {
    if (currentLocation) {
      setMapRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } else if (visit?.outlet?.address) {
      // Default region for Indonesia if no location is available
      setMapRegion({
        latitude: -6.2088,
        longitude: 106.8456,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [currentLocation, visit?.outlet?.address]);

  const handleFormSubmit = useCallback(() => {
    if (!formManager.validateForm()) {
      return;
    }
    
    // Hide keyboard and go to camera step
    Keyboard.dismiss();
    changeStep(2);
  }, [formManager, changeStep]);

  const handleBottomSheetAction = useCallback(() => {
    handleFormSubmit();
  }, [handleFormSubmit]);

  const handleTakePhoto = useCallback(async () => {
    if (!hasCameraPermission || hasCameraPermission.status !== 'granted') {
      const { status } = await requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert('Izin Kamera', 'Akses kamera diperlukan untuk check-out.');
        return;
      }
    }
    
    if (!isCameraReady || !cameraRef) {
      Alert.alert('Kamera Belum Siap', 'Kamera belum siap digunakan.');
      return;
    }
    
    if (isSubmitting) return;
    
    if (!visit?.outlet?.code) {
      Alert.alert('Error Data', 'Data outlet tidak valid. Silakan kembali dan coba lagi.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Take photo with higher quality first
      const photo = await cameraRef.takePictureAsync({ 
        quality: 0.5, // Reduced quality for performance
        skipProcessing: true,
        mirrorImage: true
      });
      
      if (!photo?.uri) {
        Alert.alert('Gagal Mengambil Foto', 'Tidak dapat mengambil foto. Silakan coba lagi.');
        setIsSubmitting(false);
        return;
      }

      console.log(`[CheckOut] Raw photo taken, processing...`);

      // Step 2: Validate the original photo first
      const validation = await validateImage(photo.uri);
      if (!validation.isValid) {
        Alert.alert('Foto Tidak Valid', `Foto yang diambil tidak valid (${validation.fileSizeKB}KB). Silakan coba lagi.`);
        setIsSubmitting(false);
        return;
      }

      console.log(`[CheckOut] Photo validated: ${validation.fileSizeKB}KB`);

      // Step 3: Process image with target size (50-100KB)
      const processedImage = await processImageWithTargetSize({
        uri: photo.uri,
        targetSizeKB: 75,
        minSizeKB: 50,
        maxSizeKB: 100,
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.8
      });

      console.log(`[CheckOut] Image processed to ${processedImage.fileSizeKB}KB (${processedImage.width}x${processedImage.height})`);

      let checkout_location = '';
      try {
        const loc = currentLocation || await getCurrentLocation();
        if (loc) {
          checkout_location = `${loc.latitude},${loc.longitude}`;
          setCurrentLocation(loc);
        }
      } catch (locationError) {
        console.warn('Failed to get location:', locationError);
      }

      // Prepare watermark data
      setRawPhoto(processedImage.uri);
      const now = new Date();
      const waktu = now.toLocaleString('id-ID', { hour12: false });
      const outletName = `${visit.outlet.code} • ${visit.outlet.name}`;
      const lokasi = currentLocation 
        ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
        : 'Lokasi tidak tersedia';
      
      setWatermarkData({ waktu, outlet: outletName, lokasi });
      
      // Step 4: Create watermarked image with ViewShot
      setTimeout(async () => {
        if (viewShotRef.current) {
          try {
            const watermarkedUri = await captureRef(viewShotRef, { 
              format: 'jpg', 
              quality: 0.5, // Reduced quality for performance
              result: 'tmpfile'
            });

            // Step 5: Process the watermarked image to ensure proper size
            const finalProcessedImage = await processImageWithTargetSize({
              uri: watermarkedUri,
              targetSizeKB: 80,
              minSizeKB: 55,
              maxSizeKB: 120, // Slightly higher limit for watermarked images
              maxWidth: 1280,
              maxHeight: 1280,
              quality: 0.7
            });

            console.log(`[CheckOut] Final watermarked image: ${finalProcessedImage.fileSizeKB}KB`);

            // Step 6: Validate final image
            const finalValidation = await validateImage(finalProcessedImage.uri);
            if (!finalValidation.isValid || finalValidation.fileSizeKB < 20) {
              throw new Error(`Final image invalid or too small: ${finalValidation.fileSizeKB}KB`);
            }

            const formData = new FormData();
            formData.append('checkout_location', checkout_location);
            formData.append('transaction', formManager.formData.transaction!);
            formData.append('report', formManager.formData.notes);
            formData.append('checkout_photo', {
              uri: finalProcessedImage.uri,
              name: `checkout-${Date.now()}.jpg`,
              type: 'image/jpeg',
            } as any);

            const res = await checkOutVisit(visitId, formData);
            
            if (res && res.meta && typeof res.meta.code === 'number') {
              if (res.meta.code === 200) {
                Alert.alert('Check Out Berhasil', `Data berhasil disimpan dengan foto (${finalProcessedImage.fileSizeKB}KB).`);
                formManager.resetForm();
                setRawPhoto(null);
                setWatermarkData(null);
                router.back();
              } else {
                Alert.alert('Check Out Gagal', res.meta.message || 'Gagal melakukan check out');
              }
            } else {
              Alert.alert('Check Out Gagal', 'Respon server tidak valid.');
            }
          } catch (err) {
            console.error('Error processing watermarked image:', err);
            Alert.alert('Gagal Memproses Foto', 'Terjadi kesalahan saat mengompresi gambar. Silakan coba lagi.');
          }
        }
        setIsSubmitting(false);
      }, 300); // Reduced timeout for better performance
    } catch (error) {
      console.error('Error in checkout process:', error);
      setIsSubmitting(false);
      setRawPhoto(null);
      setWatermarkData(null);
      Alert.alert('Check Out Gagal', `Terjadi kesalahan saat melakukan check out: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [
    hasCameraPermission,
    requestCameraPermission,
    isCameraReady,
    cameraRef,
    isSubmitting,
    visit,
    currentLocation,
    getCurrentLocation,
    formManager,
    checkOutVisit,
    visitId
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      formManager.resetForm();
      setRawPhoto(null);
      setWatermarkData(null);
    };
  }, [formManager]);

  // Memoized values
  const isFormValid = useMemo(() => 
    formManager.formData.notes.trim() && formManager.formData.transaction,
    [formManager.formData.notes, formManager.formData.transaction]
  );

  // Early returns after all hooks
  if (loading) {
    return <LoadingState />;
  }

  if (!loading && !visit) {
    return <ErrorState onBack={() => router.back()} />;
  }

  // Show camera screen (Step 2)
  if (currentStep === 2) {
    return (
      <ErrorBoundary>
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          <Header currentStep={currentStep} onBack={() => changeStep(1)} colors={colors} />
          
          <SimpleCameraScreenCheckout
            hasCameraPermission={hasCameraPermission}
            requestCameraPermission={requestCameraPermission}
            cameraRef={cameraRef}
            setCameraRef={setCameraRef}
            isCameraReady={isCameraReady}
            setIsCameraReady={setIsCameraReady}
            isFlashOn={isFlashOn}
            setIsFlashOn={setIsFlashOn}
            isProcessingPhoto={isSubmitting}
            onTakePhoto={handleTakePhoto}
            onGoBack={() => changeStep(1)}
            visit={visit!}
          />
          
          {rawPhoto && watermarkData && visit && (
            <ViewShot 
              ref={viewShotRef} 
              options={{ format: 'jpg', quality: 0.3 }} // Reduced quality for performance
              style={{ 
                position: 'absolute', 
                left: -1000, 
                top: -1000, 
                width: '100%', 
                height: '100%' 
              }}
            >
              <WatermarkOverlay
                photoUri={rawPhoto}
                watermarkData={watermarkData}
                currentLocation={currentLocation}
                selectedOutlet={visit.outlet}
              />
            </ViewShot>
          )}
        </View>
      </ErrorBoundary>
    );
  }

  // Show form screen (Step 1) with Bottom Sheet
  
  return (
    <ErrorBoundary>
      <Animated.View className="flex-1" style={{ opacity: fadeAnim, backgroundColor: colors.background }}>
        <Header 
          currentStep={currentStep} 
          onBack={() => router.back()} 
          onRefresh={getCurrentLocation}
          colors={colors}
        />
        
        <View className="flex-1">
          <MapView
            style={{ flex: 1 }}
            region={mapRegion}
            provider={PROVIDER_GOOGLE}
            showsUserLocation
            showsMyLocationButton={false}
            removeClippedSubviews={true}
            toolbarEnabled={false}
            moveOnMarkerPress={false}
            pitchEnabled={false}
            rotateEnabled={false}
            maxZoomLevel={18}
            minZoomLevel={10}
            onPress={() => Keyboard.dismiss()}
          >
            {visit && currentLocation && (
              <Marker
                coordinate={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                title={visit.outlet.name}
                description={visit.outlet.district ?? ''}
              >
                <View className="items-center justify-center">
                  <View className="rounded-full p-2 border-2 shadow-lg" style={{ backgroundColor: colors.card, borderColor: colors.primary }}>
                    <IconSymbol name="building.2" size={24} color={colors.primary} />
                  </View>
                  <View 
                    className="w-0 h-0 -mt-0.5"
                    style={{
                      borderLeftWidth: 8,
                      borderRightWidth: 8,
                      borderTopWidth: 12,
                      borderLeftColor: 'transparent',
                      borderRightColor: 'transparent',
                      borderTopColor: colors.primary,
                    }}
                  />
                </View>
              </Marker>
            )}
          </MapView>
          
          {/* Outlet Info Card Overlay */}
          <View className="absolute left-4 right-4 z-10" style={{ top: 16 }}>
            <TouchableOpacity 
              className="rounded-lg border p-3 shadow-sm"
              style={{ 
                backgroundColor: colors.card,
                borderColor: colors.border,
                minHeight: 48 
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '20' }}>
                  <IconSymbol name="building.2" size={18} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs mb-0.5" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
                    Outlet Check Out
                  </Text>
                  <Text className="text-sm font-medium" style={{ fontFamily: 'Inter_500Medium', color: colors.text }}>
                    {visit!.outlet.name}
                  </Text>
                  <Text className="text-xs" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
                    {visit!.outlet.code} • {visit!.outlet.district || 'Tidak ada distrik'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Bottom Sheet for Step 1 */}
          <BottomSheet
            ref={bottomSheetRef}
            index={1}
            snapPoints={['10%', '55%']}
            enableDynamicSizing={true}
            enablePanDownToClose={false}
            handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40, height: 4 }}
            backgroundStyle={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
            onChange={(index) => {
              setBottomSheetIndex(index);
            }}
          >
            <BottomSheetView className="flex-1 px-4" style={{ paddingBottom: Math.max(insets.bottom, 32) }}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View className="flex-1">
                  {/* Form - always rendered and visible when expanded */}
                  <View style={{ 
                    opacity: bottomSheetIndex >= 1 ? 1 : 0,
                    height: bottomSheetIndex >= 1 ? 'auto' : 0,
                    overflow: 'hidden'
                  }}>
                    <Text className="text-lg font-semibold mb-4 text-neutral-800" style={{ fontFamily: 'Inter_600SemiBold' }}>
                      Data Check Out
                    </Text>
                    
                    <TransactionSelector
                      selectedTransaction={formManager.formData.transaction}
                      onTransactionChange={(transaction) => formManager.updateField('transaction', transaction)}
                    />
                    
                    <NotesInput
                      notes={formManager.formData.notes}
                      onNotesChange={(notes) => formManager.updateField('notes', notes)}
                    />
                  </View>
                  
                  {/* Button with consistent text */}
                  <Button
                    title={isSubmitting ? 'Mengompresi...' : 'Lanjutkan'}
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isSubmitting}
                    disabled={!isFormValid}
                    onPress={handleBottomSheetAction}
                  />
                </View>
              </TouchableWithoutFeedback>
            </BottomSheetView>
          </BottomSheet>
        </View>
      </Animated.View>
    </ErrorBoundary>
  );
});