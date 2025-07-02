import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Keyboard, Linking, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useDebounce } from 'use-debounce';

import { LocationStatus } from '@/components/LocationStatus';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { WatermarkOverlay } from '@/components/WatermarkOverlay';
import { Colors } from '@/constants/Colors';
import { useOutlet } from '@/hooks/data/useOutlet';
import { usePlanVisit } from '@/hooks/data/usePlanVisit';
import { useVisit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface PhotoMeta {
  uri: string;
  waktu: string;
  latitude: number | null;
  longitude: number | null;
  outlet: string;
}

interface OutletDisplayData {
  id: string;
  name: string;
  code: string;
  district: string;
  location: string;
  radius: number;
  planVisitId: string | null;
  visitDate: string | null;
}

function parseLatLong(latlong: string): { latitude: number; longitude: number } | null {
  if (!latlong) return null;
  const [lat, lng] = latlong.split(',').map(Number);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { latitude: lat, longitude: lng };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

const useLocationManager = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const openAppSettings = useCallback(() => {
    try {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening settings:', error);
      Alert.alert('Kesalahan', 'Tidak dapat membuka pengaturan secara otomatis.');
    }
  }, []);

  const getLocation = useCallback(async () => {
    try {
      setLoadingLocation(true);
      setLocationError(null);

      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            'Izin Lokasi Diperlukan',
            'Check-in membutuhkan izin lokasi untuk memverifikasi bahwa Anda berada di outlet.',
            [
              { text: 'Buka Pengaturan', onPress: openAppSettings },
              { text: 'Batal', style: 'cancel' }
            ]
          );
          return;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
      Alert.alert('Kesalahan Lokasi', 'Gagal mendapatkan lokasi. Pastikan GPS aktif dan coba lagi.');
    } finally {
      setLoadingLocation(false);
    }
  }, [openAppSettings]);

  return {
    currentLocation,
    loadingLocation,
    permissionStatus,
    locationError,
    getLocation,
  };
};

const useOutletManager = () => {
  const [visitType, setVisitType] = useState<'planned' | 'extracall'>('planned');
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);
  const [selectedPlanVisitId, setSelectedPlanVisitId] = useState<string | null>(null);
  const [outletSearch, setOutletSearch] = useState('');
  const [debouncedSearch] = useDebounce(outletSearch, 400);

  const { outlets, loading: loadingOutlets, fetchOutletsAdvanced } = useOutlet('');
  const { planVisits, loading: loadingPlanVisits, fetchPlanVisits } = usePlanVisit();

  const displayData: OutletDisplayData[] = visitType === 'planned' ? 
    planVisits.map(pv => ({
      id: String(pv.outlet.id),
      name: pv.outlet.name,
      code: pv.outlet.code,
      district: pv.outlet.district || '',
      location: pv.outlet.location || '',
      radius: pv.outlet.radius || 0,
      planVisitId: String(pv.id),
      visitDate: pv.visit_date
    })) : 
    outlets.map(outlet => ({
      id: String(outlet.id),
      name: outlet.name,
      code: outlet.code,
      district: outlet.district || '',
      location: outlet.location || '',
      radius: outlet.radius || 0,
      planVisitId: null,
      visitDate: null
    }));

  const dataLoading = visitType === 'planned' ? loadingPlanVisits : loadingOutlets;
  const selectedOutlet = displayData.find(o => String(o.id) === selectedOutletId) || null;

  const lastFetchRef = useRef<string>('');

  const fetchData = useCallback(() => {
    const fetchKey = `${visitType}-${debouncedSearch}-${new Date().toISOString().split('T')[0]}`;
    if (lastFetchRef.current === fetchKey) return;
    lastFetchRef.current = fetchKey;

    if (visitType === 'extracall') {
      fetchOutletsAdvanced({ search: debouncedSearch, per_page: 100 });
    } else {
      const today = new Date().toISOString().split('T')[0];
      fetchPlanVisits({
        per_page: 100,
        'filters[date]': today,
        sort_column: 'visit_date',
        sort_direction: 'asc'
      });
    }
  }, [visitType, debouncedSearch, fetchOutletsAdvanced, fetchPlanVisits]);

  return {
    visitType,
    setVisitType,
    selectedOutletId,
    setSelectedOutletId,
    selectedPlanVisitId,
    setSelectedPlanVisitId,
    outletSearch,
    setOutletSearch,
    displayData,
    dataLoading,
    selectedOutlet,
    fetchData,
  };
};

const Header = ({ currentStep, onBack, onRefresh }: { 
  currentStep: number; 
  onBack: () => void; 
  onRefresh: () => void; 
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View className="bg-primary-500 px-4 pb-4" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row justify-between items-center">
        <TouchableOpacity onPress={onBack}>
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-white text-2xl font-bold">Check in</Text>
          <Text className="text-white text-sm mt-1">Langkah {currentStep} dari 2</Text>
        </View>
        {currentStep === 1 ? (
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View className="w-6 h-6" />
        )}
      </View>
    </View>
  );
};

const OutletTypeToggle = ({ visitType, onTypeChange }: { 
  visitType: 'planned' | 'extracall'; 
  onTypeChange: (type: 'planned' | 'extracall') => void; 
}) => (
  <View className="mb-4">
    <Text className="font-bold text-lg mb-3 text-black">Tipe Kunjungan</Text>
    <View className="flex-row bg-neutral-100 rounded-lg p-1">
      <TouchableOpacity
        onPress={() => onTypeChange('planned')}
        className={`flex-1 py-2 px-4 rounded-md ${visitType === 'planned' ? 'bg-primary-500' : ''}`}
      >
        <Text className={`text-center font-semibold ${visitType === 'planned' ? 'text-white' : 'text-neutral-600'}`}>
          Planned
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onTypeChange('extracall')}
        className={`flex-1 py-2 px-4 rounded-md ${visitType === 'extracall' ? 'bg-primary-500' : ''}`}
      >
        <Text className={`text-center font-semibold ${visitType === 'extracall' ? 'text-white' : 'text-neutral-600'}`}>
          Extracall
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const OutletSearchInput = ({ 
  visitType, 
  searchValue, 
  onSearchChange, 
  colors 
}: { 
  visitType: 'planned' | 'extracall';
  searchValue: string;
  onSearchChange: (value: string) => void;
  colors: any;
}) => {
  if (visitType !== 'extracall') return null;

  return (
    <View className="flex-row items-center border border-neutral-300 rounded-lg px-3 mb-2 bg-white">
      <Ionicons name="search" size={18} color={colors.textSecondary} />
      <TextInput
        className="flex-1 h-10 ml-2 text-base text-black"
        placeholder="Cari outlet berdasarkan nama/kode..."
        placeholderTextColor={colors.textSecondary}
        value={searchValue}
        onChangeText={onSearchChange}
      />
      {searchValue ? (
        <TouchableOpacity onPress={() => onSearchChange('')}>
          <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const OutletList = ({ 
  displayData, 
  dataLoading, 
  visitType, 
  selectedOutletId, 
  onOutletSelect, 
  colors 
}: {
  displayData: OutletDisplayData[];
  dataLoading: boolean;
  visitType: 'planned' | 'extracall';
  selectedOutletId: string | null;
  onOutletSelect: (id: string, planVisitId?: string) => void;
  colors: any;
}) => {
  if (dataLoading) {
    return (
      <View className="flex-1 justify-center items-center py-4">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>Memuat...</Text>
      </View>
    );
  }

  if (displayData.length === 0) {
    return (
      <Text className="p-4 text-neutral-400 text-center">
        {visitType === 'planned' ? 'Tidak ada plan visit untuk hari ini' : 'Outlet tidak ditemukan'}
      </Text>
    );
  }

  return (
    <Animated.ScrollView persistentScrollbar className="max-h-40">
      {displayData.map(item => (
        <TouchableOpacity
          key={item.id}
          onPress={() => onOutletSelect(String(item.id), item.planVisitId || undefined)}
          className={`py-2 px-3 border-b border-neutral-200 rounded bg-white mb-0.5 ${
            String(item.id) === selectedOutletId ? 'bg-primary-50' : ''
          }`}
        >
          <Text className="font-semibold text-base text-black" numberOfLines={1}>
            {item.name}
          </Text>
          <View className="flex-row items-center mt-0.5">
            <Text className="text-xs text-neutral-500 mr-2" numberOfLines={1}>
              {item.code}
            </Text>
            {item.district && (
              <Text className="text-xs text-neutral-400" numberOfLines={1}>
                {item.district}
              </Text>
            )}
            {visitType === 'planned' && item.visitDate && (
              <Text className="text-xs text-blue-600 ml-auto" numberOfLines={1}>
                📅 {new Date(item.visitDate).toLocaleDateString('id-ID')}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </Animated.ScrollView>
  );
};

const LocationBlocked = ({ selectedOutlet, router }: { selectedOutlet: OutletDisplayData | null; router: any }) => (
  <View className="flex-1 items-center justify-center px-8">
    <Text className="text-danger-600 text-base text-center mb-4">
      Lokasi outlet belum diisi. Silakan update data outlet terlebih dahulu sebelum check-in.
    </Text>
    <Button 
      title="Update Outlet" 
      onPress={() => router.push(`/outlet/${selectedOutlet?.id}/edit`)} 
    />
  </View>
);

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

// Plan visit info card for camera overlay
const PlanVisitCard = ({ selectedOutlet }: { selectedOutlet: OutletDisplayData | null }) => {
  const insets = useSafeAreaInsets();
  
  if (!selectedOutlet?.visitDate) return null;
  
  const visitDate = new Date(selectedOutlet.visitDate);
  const dateStr = visitDate.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
  const timeStr = visitDate.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <View className="absolute left-4 right-4 z-10" style={{ top: insets.top + 64 }}>
      <View className="bg-white rounded-xl p-4 shadow-lg">
        <Text className="text-neutral-500 text-sm mb-1">Plan Visit</Text>
        <View className="flex-row items-center">
          <IconSymbol name="calendar" size={16} color="#222B45" style={{ marginRight: 8 }} />
          <Text className="text-black font-semibold">
            {dateStr} ({timeStr} - 17:00)
          </Text>
        </View>
      </View>
    </View>
  );
};

// Simple camera screen for check-in
const SimpleCameraScreen = ({ 
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
  selectedOutlet
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
  selectedOutlet: OutletDisplayData | null;
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
        title={isProcessingPhoto ? 'Memproses...' : 'Kirim'}
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
        <ActivityIndicator size="large" color="#f97316" />
        <Text className="text-white text-base mt-4">Memproses foto dengan watermark...</Text>
      </View>
    )}
  </View>
  );
};

export default function CheckInScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams();
  const outletId = params.id as string;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const viewShotRef = useRef<any>(null);

  // Custom hooks
  const locationManager = useLocationManager();
  const outletManager = useOutletManager();
  const { checkInVisit, checkVisitStatus } = useVisit();

  // Camera management
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [hasCameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [rawPhoto, setRawPhoto] = useState<string | null>(null);
  const [watermarkData, setWatermarkData] = useState<{ waktu: string; outlet: string; lokasi: string } | null>(null);

  // State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [locationValidated, setLocationValidated] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(1);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const MAX_DISTANCE = 100;

  // Initialize
  useEffect(() => {
    if (outletId) {
      outletManager.setSelectedOutletId(outletId);
    }
    locationManager.getLocation();
    
    // Add keyboard listeners for better keyboard handling
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Optionally handle keyboard hide
    });
    
    return () => {
      keyboardDidHideListener.remove();
    };
  }, [outletId]);

  // Fetch data
  useFocusEffect(
    React.useCallback(() => {
      outletManager.fetchData();
    }, [outletManager.fetchData])
  );

  useEffect(() => {
    outletManager.fetchData();
  }, [outletManager.fetchData]);

  // Location validation
  useEffect(() => {
    if (!outletManager.selectedOutlet) {
      setLocationBlocked(false);
      setLocationValidated(false);
      setDistance(null);
      return;
    }

    const outletCoords = parseLatLong(outletManager.selectedOutlet.location);

    if (!outletManager.selectedOutlet.location || !outletCoords) {
      setLocationBlocked(true);
      setLocationValidated(false);
      return;
    } else {
      setLocationBlocked(false);
    }

    if (locationManager.currentLocation && outletCoords) {
      const calculatedDistance = calculateDistance(
        locationManager.currentLocation.latitude,
        locationManager.currentLocation.longitude,
        outletCoords.latitude,
        outletCoords.longitude
      );
      setDistance(calculatedDistance);
      
      if (outletManager.selectedOutlet.radius === 0) {
        setLocationValidated(true);
      } else {
        const maxAllowedDistance = outletManager.selectedOutlet.radius || MAX_DISTANCE;
        setLocationValidated(calculatedDistance <= maxAllowedDistance);
      }
    } else {
      setLocationValidated(false);
      setDistance(null);
    }
  }, [outletManager.selectedOutlet, locationManager.currentLocation]);

  // Map region update
  useEffect(() => {
    if (outletManager.selectedOutlet?.location) {
      const coords = parseLatLong(outletManager.selectedOutlet.location);
      if (coords) {
        setMapRegion((prevRegion: any) => {
          if (prevRegion && 
              Math.abs(prevRegion.latitude - coords.latitude) < 0.0001 && 
              Math.abs(prevRegion.longitude - coords.longitude) < 0.0001) {
            return prevRegion;
          }
          return {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
        });
      }
    }
  }, [outletManager.selectedOutlet?.id, outletManager.selectedOutlet?.location]);

  // Handlers
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

  const handleOutletSelect = useCallback((id: string, planVisitId?: string) => {
    outletManager.setSelectedOutletId(id);
    if (outletManager.visitType === 'planned' && planVisitId) {
      outletManager.setSelectedPlanVisitId(planVisitId);
    }
  }, [outletManager]);

  const handleTypeChange = useCallback((type: 'planned' | 'extracall') => {
    outletManager.setVisitType(type);
    outletManager.setSelectedOutletId(null);
    outletManager.setSelectedPlanVisitId(null);
  }, [outletManager]);

  const handleContinue = useCallback(async () => {
    if (!outletManager.selectedOutlet || !outletManager.selectedOutlet.id) {
      Alert.alert('Pilih Outlet', 'Silakan pilih outlet terlebih dahulu.');
      return;
    }
    
    if (!locationValidated && (outletManager.selectedOutlet.radius || 0) > 0) {
      Alert.alert(
        'Lokasi Terlalu Jauh',
        `Anda berada ${Math.round(distance || 0)}m dari outlet, sedangkan maksimal jarak adalah ${outletManager.selectedOutlet.radius || 0}m. Apakah Anda ingin memperbarui lokasi outlet?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Update', onPress: () => router.push(`/outlet/${outletManager.selectedOutlet!.id}/edit` as any) },
        ]
      );
      return;
    }
    
    try {
      const result = await checkVisitStatus(String(outletManager.selectedOutlet.id));
      if (result?.meta?.code === 400) {
        Alert.alert('Status Visit', result?.meta?.message || 'Tidak dapat melakukan check-in.');
        return;
      } else if (result?.success === false) {
        Alert.alert('Cek Status Gagal', result?.error || 'Gagal memeriksa status kunjungan.');
        return;
      }
      changeStep(2);
    } catch (err) {
      Alert.alert('Cek Status Gagal', 'Gagal memeriksa status kunjungan. Silakan coba lagi.');
    }
  }, [outletManager.selectedOutlet, locationValidated, distance, checkVisitStatus, router, changeStep]);

  const handleTakePhoto = useCallback(async () => {
    if (!hasCameraPermission || hasCameraPermission.status !== 'granted') {
      const { status } = await requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert('Izin Kamera', 'Akses kamera diperlukan untuk check-in.');
        return;
      }
    }
    
    if (!isCameraReady || !cameraRef) {
      Alert.alert('Kamera Belum Siap', 'Kamera belum siap digunakan.');
      return;
    }

    if (isProcessingPhoto) return;
    
    if (!outletManager.selectedOutlet?.id) {
      Alert.alert('Error Data', 'Data outlet tidak valid. Silakan kembali dan coba lagi.');
      return;
    }
    
    setIsProcessingPhoto(true);
    
    try {
      const photo = await cameraRef.takePictureAsync({ 
        quality: 0.7, 
        skipProcessing: true,
        mirrorImage: true
      });
      
      if (!photo?.uri) {
        Alert.alert('Gagal Mengambil Foto', 'Tidak dapat mengambil foto. Silakan coba lagi.');
        setIsProcessingPhoto(false);
        return;
      }

      setRawPhoto(photo.uri);
      const now = new Date();
      const waktu = now.toLocaleString('id-ID', { hour12: false });
      const outletName = `${outletManager.selectedOutlet.code} • ${outletManager.selectedOutlet.name}`;
      const lokasi = locationManager.currentLocation 
        ? `${locationManager.currentLocation.latitude.toFixed(6)}, ${locationManager.currentLocation.longitude.toFixed(6)}`
        : 'Lokasi tidak tersedia';
      
      setWatermarkData({ waktu, outlet: outletName, lokasi });
      
      setTimeout(async () => {
        if (viewShotRef.current) {
          try {
            const uri = await captureRef(viewShotRef, { format: 'jpg', quality: 0.4 });
            
            const formData = new FormData();
            formData.append('outlet_id', outletManager.selectedOutletId!);
            formData.append('checkin_location', `${locationManager.currentLocation!.latitude},${locationManager.currentLocation!.longitude}`);
            formData.append('type', outletManager.visitType.toUpperCase());
            
            if (outletManager.visitType === 'planned' && outletManager.selectedOutlet?.planVisitId) {
              formData.append('plan_visit_id', String(outletManager.selectedOutlet.planVisitId));
            }
            
            formData.append('checkin_photo', {
              uri,
              name: `checkin-${Date.now()}.jpg`,
              type: 'image/jpeg',
            } as any);
            
            const res = await checkInVisit(formData);
            
            if (res?.meta?.code === 200) {
              Alert.alert('Check In Berhasil', 'Data berhasil disimpan dengan foto dan watermark.');
              setRawPhoto(null);
              setWatermarkData(null);
              router.replace({ pathname: '/(tabs)', params: { outletId: outletManager.selectedOutletId } });
            } else {
              Alert.alert('Check In Gagal', res?.meta?.message || 'Gagal check in');
            }
          } catch (err) {
            Alert.alert('Gagal Mengambil Foto', 'Terjadi kesalahan saat mengambil foto. Silakan coba lagi.');
          }
        }
        setIsProcessingPhoto(false);
      }, 400);
    } catch (error) {
      console.error('Error in checkin process:', error);
      setIsProcessingPhoto(false);
      setRawPhoto(null);
      setWatermarkData(null);
      Alert.alert('Check In Gagal', 'Terjadi kesalahan saat melakukan check in.');
    }
  }, [
    hasCameraPermission,
    requestCameraPermission,
    isCameraReady,
    cameraRef,
    isProcessingPhoto,
    outletManager,
    locationManager,
    checkInVisit,
    router
  ]);

  const handleBottomSheetAction = useCallback(() => {
    handleContinue();
  }, [handleContinue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setRawPhoto(null);
      setWatermarkData(null);
    };
  }, []);

  // Render early returns
  if (currentStep === 1 && locationBlocked) {
    return (
      <View className="flex-1 bg-white">
        <Header currentStep={currentStep} onBack={() => router.back()} onRefresh={locationManager.getLocation} />
        <LocationBlocked selectedOutlet={outletManager.selectedOutlet} router={router} />
      </View>
    );
  }

  if (currentStep === 2) {
    return (
      <View className="flex-1 bg-white">
        <Header currentStep={currentStep} onBack={() => changeStep(1)} onRefresh={locationManager.getLocation} />
        
        <SimpleCameraScreen
          hasCameraPermission={hasCameraPermission}
          requestCameraPermission={requestCameraPermission}
          cameraRef={cameraRef}
          setCameraRef={setCameraRef}
          isCameraReady={isCameraReady}
          setIsCameraReady={setIsCameraReady}
          isFlashOn={isFlashOn}
          setIsFlashOn={setIsFlashOn}
          isProcessingPhoto={isProcessingPhoto}
          onTakePhoto={handleTakePhoto}
          onGoBack={() => changeStep(1)}
          selectedOutlet={outletManager.selectedOutlet}
        />
        
        {rawPhoto && watermarkData && outletManager.selectedOutlet && (
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
              currentLocation={locationManager.currentLocation}
              selectedOutlet={outletManager.selectedOutlet}
            />
          </ViewShot>
        )}
      </View>
    );
  }

  // Main render - Step 1 with Bottom Sheet
  return (
    <View className="flex-1 bg-white">
      <Header currentStep={currentStep} onBack={() => router.back()} onRefresh={locationManager.getLocation} />
      
      <View className="flex-1">
        <MapView
          style={{ flex: 1 }}
          region={mapRegion}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={() => Keyboard.dismiss()}
        >
          {outletManager.selectedOutlet && outletManager.selectedOutlet.location && (
            <Marker
              coordinate={{
                latitude: Number(outletManager.selectedOutlet.location.split(',')[0]),
                longitude: Number(outletManager.selectedOutlet.location.split(',')[1]),
              }}
              title={outletManager.selectedOutlet.name}
              description={outletManager.selectedOutlet.district ?? ''}
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
        
        {outletManager.selectedOutlet && locationManager.currentLocation && (
          <View className="absolute left-4 right-4 top-4 z-10">
            <LocationStatus
              locationValidated={locationValidated}
              distance={distance ?? 0}
              outletRadius={outletManager.selectedOutlet.radius ?? 0}
              onUpdateOutlet={() => router.push(`/outlet/${outletManager.selectedOutlet!.id}/edit` as any)}
            />
          </View>
        )}
        
        {/* Bottom Sheet for Step 1 */}
        <BottomSheet
          ref={bottomSheetRef}
          index={1}
          snapPoints={['10%', '60%']}
          enableDynamicSizing={true}
          enablePanDownToClose={false}
          handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40, height: 4 }}
          backgroundStyle={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
          onChange={(index) => {
            setBottomSheetIndex(index);
          }}
        >
          <BottomSheetView className="flex-1 px-4" style={{ paddingBottom: Math.max(useSafeAreaInsets().bottom, 32) }}>
            {/* Form - always rendered and visible when expanded */}
            <View style={{ 
              opacity: bottomSheetIndex >= 1 ? 1 : 0,
              height: bottomSheetIndex >= 1 ? 'auto' : 0,
              overflow: 'hidden'
            }}>
              <OutletTypeToggle 
                visitType={outletManager.visitType} 
                onTypeChange={handleTypeChange} 
              />

              <View className="mb-3">
                <Text className="font-bold text-lg mb-2 text-black">
                  {outletManager.visitType === 'planned' ? 'Pilih Plan Visit Hari Ini' : 'Pilih Outlet'}
                </Text>
                
                <OutletSearchInput
                  visitType={outletManager.visitType}
                  searchValue={outletManager.outletSearch}
                  onSearchChange={outletManager.setOutletSearch}
                  colors={colors}
                />
                
                <View className="max-h-40">
                  <OutletList
                    displayData={outletManager.displayData}
                    dataLoading={outletManager.dataLoading}
                    visitType={outletManager.visitType}
                    selectedOutletId={outletManager.selectedOutletId}
                    onOutletSelect={handleOutletSelect}
                    colors={colors}
                  />
                </View>
              </View>
            </View>
            
            {/* Button with consistent text */}
            <Button
              title="Lanjutkan"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!outletManager.selectedOutlet}
              onPress={handleBottomSheetAction}
            />
          </BottomSheetView>
        </BottomSheet>
      </View>
    </View>
  );
}
