import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 justify-center items-center bg-white">
          <Text className="text-lg font-bold text-danger-600">Terjadi kesalahan pada aplikasi.</Text>
          <Text className="text-base text-neutral-500 mt-2">Silakan tutup dan buka ulang aplikasi.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

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
const FaceDetectionOverlay = () => (
  <View className="absolute inset-0 items-center justify-center">
    <View 
      className="w-80 h-80 rounded-full border-4 border-white border-dashed"
      style={{
        borderStyle: 'dashed',
      }}
    />
  </View>
);

const Header = React.memo(function Header({ currentStep, onBack, onRefresh }: { 
  currentStep: number; 
  onBack: () => void; 
  onRefresh?: () => void; 
}) {
  const insets = useSafeAreaInsets();
  
  const headerStyle = useMemo(() => ({ 
    paddingTop: insets.top + 8 
  }), [insets.top]);
  
  return (
    <View className="bg-primary-500 px-4 pb-4" style={headerStyle}>
      <View className="flex-row justify-between items-center">
        <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Kembali">
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-white text-2xl font-bold">Check Out</Text>
          <Text className="text-white text-sm mt-1">Langkah {currentStep} dari 2</Text>
        </View>
        {currentStep === 1 && onRefresh ? (
          <TouchableOpacity onPress={onRefresh} accessibilityRole="button" accessibilityLabel="Refresh data">
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View className="w-6 h-6" />
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

const TransactionSelector = React.memo(function TransactionSelector({ 
  selectedTransaction, 
  onTransactionChange 
}: { 
  selectedTransaction: 'YES' | 'NO' | null;
  onTransactionChange: (transaction: 'YES' | 'NO') => void;
}) {
  const handleYesPress = useCallback(() => onTransactionChange('YES'), [onTransactionChange]);
  const handleNoPress = useCallback(() => onTransactionChange('NO'), [onTransactionChange]);
  
  const yesButtonStyle = useMemo(() =>
    `flex-row items-center py-2.5 px-4 rounded-lg mr-2 ${
      selectedTransaction === 'YES' ? 'bg-primary-500' : 'bg-neutral-100'
    }`,
    [selectedTransaction]
  );
  
  const noButtonStyle = useMemo(() =>
    `flex-row items-center py-2.5 px-4 rounded-lg mr-2 ${
      selectedTransaction === 'NO' ? 'bg-primary-500' : 'bg-neutral-100'
    }`,
    [selectedTransaction]
  );
  
  const yesTextStyle = useMemo(() =>
    `ml-2 font-semibold ${
      selectedTransaction === 'YES' ? 'text-white' : 'text-primary-500'
    }`,
    [selectedTransaction]
  );
  
  const noTextStyle = useMemo(() =>
    `ml-2 font-semibold ${
      selectedTransaction === 'NO' ? 'text-white' : 'text-primary-500'
    }`,
    [selectedTransaction]
  );
  
  const yesIconColor = useMemo(() => 
    selectedTransaction === 'YES' ? '#fff' : '#f97316',
    [selectedTransaction]
  );
  
  const noIconColor = useMemo(() => 
    selectedTransaction === 'NO' ? '#fff' : '#f97316',
    [selectedTransaction]
  );

  return (
    <View className="mb-4">
      <Text className="text-base font-semibold mb-2 text-black">Transaksi</Text>
      <View className="flex-row gap-4">
        <TouchableOpacity
          className={yesButtonStyle}
          onPress={handleYesPress}
          accessibilityRole="button"
          accessibilityLabel="Pilih transaksi YES"
        >
          <IconSymbol 
            name="checkmark.circle.fill" 
            size={20} 
            color={yesIconColor} 
          />
          <Text className={yesTextStyle}>
            YES
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={noButtonStyle}
          onPress={handleNoPress}
          accessibilityRole="button"
          accessibilityLabel="Pilih transaksi NO"
        >
          <IconSymbol 
            name="xmark.circle.fill" 
            size={20} 
            color={noIconColor} 
          />
          <Text className={noTextStyle}>
            NO
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const NotesInput = React.memo(function NotesInput({ 
  notes, 
  onNotesChange 
}: { 
  notes: string;
  onNotesChange: (notes: string) => void;
}) {
  const handleSubmitEditing = useCallback(() => Keyboard.dismiss(), []);
  
  return (
    <View className="mb-4">
      <Text className="text-base font-semibold mb-2 text-black">Catatan</Text>
      <TextInput
        className="bg-white rounded-lg border border-neutral-200 p-3 min-h-20 text-black"
        placeholder="Tambahkan catatan untuk kunjungan ini..."
        placeholderTextColor="#7B8FA1"
        multiline
        value={notes}
        onChangeText={onNotesChange}
        style={{ textAlignVertical: 'top' }}
        blurOnSubmit={true}
        returnKeyType="done"
        onSubmitEditing={handleSubmitEditing}
        maxLength={500}
        accessibilityLabel="Input catatan kunjungan"
        accessibilityHint="Masukkan catatan atau keterangan untuk kunjungan ini"
      />
    </View>
  );
});

// Simple camera screen for checkout
const SimpleCameraScreenCheckout = ({ 
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
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View className="flex-1 bg-black">
    {/* Back button */}
    <TouchableOpacity 
      className="absolute left-6 bg-black/50 rounded-full p-2 z-30 items-center justify-center" 
      style={{ top: insets.top + 16 }}
      onPress={onGoBack}
    >
      <Ionicons name="arrow-back" size={24} color="#fff" />
    </TouchableOpacity>
    
    {/* Flash toggle */}
    {hasCameraPermission?.status === 'granted' && (
      <TouchableOpacity 
        className="absolute right-6 bg-black/50 rounded-full p-2 z-30 items-center justify-center" 
        style={{ top: insets.top + 16 }}
        onPress={() => setIsFlashOn(!isFlashOn)}
      >
        <Ionicons name={isFlashOn ? 'flash' : 'flash-off'} size={24} color="#fff" />
      </TouchableOpacity>
    )}
    
    {/* Camera view */}
    {hasCameraPermission?.status === 'granted' ? (
      <>
        <CameraView
          ref={ref => setCameraRef(ref)}
          style={{ flex: 1, width: '100%', height: '100%' }}
          onCameraReady={() => setIsCameraReady(true)}
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
    <View className="absolute bottom-0 left-0 right-0 p-4 items-center" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
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
  };

  const LoadingState = () => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>Memuat...</Text>
      </View>
    );
  };

  const ErrorState = ({ onBack }: { onBack: () => void }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
      <IconSymbol name="exclamationmark.triangle" size={60} color={colors.danger} />
      <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
        Data kunjungan tidak ditemukan.
      </Text>
      <Button
        title="Kembali"
        variant="primary"
        onPress={onBack}
        style={{ marginTop: 24 }}
      />
    </View>
  );
};

export default function CheckOutScreen() {
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
  const visitId = typeof id === 'string' ? id : '';
  const colors = Colors[colorScheme ?? 'light'];

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
        quality: 0.7,
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
              quality: 0.8, // Higher quality for ViewShot
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
      }, 500); // Slightly longer timeout for better ViewShot processing
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

  useEffect(() => {
    return () => {
      formManager.resetForm();
      setRawPhoto(null);
    };
  }, []);

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
        <View className="flex-1 bg-white">
          <Header currentStep={currentStep} onBack={() => changeStep(1)} />
          
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
              options={{ format: 'jpg', quality: 0.5 }} 
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
      <Animated.View className="flex-1 bg-white" style={{ opacity: fadeAnim }}>
        <Header 
          currentStep={currentStep} 
          onBack={() => router.back()} 
          onRefresh={getCurrentLocation}
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
                  <View className="bg-white rounded-full p-1.5 border-2 border-red-700 shadow-md">
                    <Ionicons name="business" size={28} color="#C62828" />
                  </View>
                  <View 
                    className="w-0 h-0 -mt-0.5"
                    style={{
                      borderLeftWidth: 10,
                      borderRightWidth: 10,
                      borderTopWidth: 18,
                      borderLeftColor: 'transparent',
                      borderRightColor: 'transparent',
                      borderTopColor: '#C62828',
                    }}
                  />
                </View>
              </Marker>
            )}
          </MapView>
          
          {/* Outlet Info Card Overlay */}
          <View className="absolute left-4 right-4 z-10" style={{ top: insets.top + 16 }}>
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-sm text-neutral-400 mb-1">Informasi Outlet</Text>
              <Text className="text-primary-500 text-lg font-bold mb-1">{visit!.outlet.name} ({visit!.outlet.code})</Text>
              <View className="flex-row items-center mt-0.5">
                <IconSymbol name="mappin.and.ellipse" size={18} color="#222B45" style={{ marginRight: 8 }} />
                <Text className="text-primary-500 text-base">{visit!.outlet.district || visit!.outlet.address}</Text>
              </View>
            </View>
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
                    <Text className="font-bold text-lg mb-4 text-black">Catatan & Transaksi</Text>
                    
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
}