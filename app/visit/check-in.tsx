import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useDebounce } from 'use-debounce';

import { LocationStatus } from '@/components/LocationStatus';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { WatermarkOverlay } from '@/components/WatermarkOverlay';
import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
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
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={onBack}>
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Check in</Text>
          <Text style={styles.headerSubtitle}>Langkah {currentStep} dari 2</Text>
        </View>
        {currentStep === 1 ? (
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>
    </View>
  );
};

const OutletTypeToggle = ({ visitType, onTypeChange }: { 
  visitType: 'planned' | 'extracall'; 
  onTypeChange: (type: 'planned' | 'extracall') => void; 
}) => (
  <View style={styles.toggleContainer}>
    <Text style={styles.toggleLabel}>Tipe Kunjungan</Text>
    <View style={styles.toggleButtons}>
      <TouchableOpacity
        onPress={() => onTypeChange('planned')}
        style={[styles.toggleButton, visitType === 'planned' && styles.toggleButtonActive]}
      >
        <Text style={[styles.toggleButtonText, visitType === 'planned' && styles.toggleButtonTextActive]}>
          Planned
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onTypeChange('extracall')}
        style={[styles.toggleButton, visitType === 'extracall' && styles.toggleButtonActive]}
      >
        <Text style={[styles.toggleButtonText, visitType === 'extracall' && styles.toggleButtonTextActive]}>
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
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={18} color={colors.textSecondary} />
      <TextInput
        style={styles.searchInput}
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Memuat...</Text>
      </View>
    );
  }

  if (displayData.length === 0) {
    return (
      <Text style={styles.emptyText}>
        {visitType === 'planned' ? 'Tidak ada plan visit untuk hari ini' : 'Outlet tidak ditemukan'}
      </Text>
    );
  }

  return (
    <Animated.ScrollView persistentScrollbar style={styles.outletList}>
      {displayData.map(item => (
        <TouchableOpacity
          key={item.id}
          onPress={() => onOutletSelect(String(item.id), item.planVisitId || undefined)}
          style={[
            styles.outletItem,
            String(item.id) === selectedOutletId && styles.outletItemSelected
          ]}
        >
          <Text style={styles.outletName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.outletDetails}>
            <Text style={styles.outletCode} numberOfLines={1}>
              {item.code}
            </Text>
            {item.district && (
              <Text style={styles.outletDistrict} numberOfLines={1}>
                {item.district}
              </Text>
            )}
            {visitType === 'planned' && item.visitDate && (
              <Text style={styles.outletDate} numberOfLines={1}>
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
  <View style={styles.locationBlockedContainer}>
    <Text style={styles.locationBlockedText}>
      Lokasi outlet belum diisi. Silakan update data outlet terlebih dahulu sebelum check-in.
    </Text>
    <Button 
      title="Update Outlet" 
      onPress={() => router.push(`/outlet/${selectedOutlet?.id}/edit`)} 
    />
  </View>
);

const CameraScreen = ({ 
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
  onGoBack 
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
}) => (
  <View style={styles.cameraContainer}>
    <Animated.View style={styles.cameraOverlay}>
      <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
        <Ionicons name="arrow-back" size={24} color="#222B45" />
      </TouchableOpacity>
      
      {hasCameraPermission?.status === 'granted' ? (
        <CameraView
          ref={ref => setCameraRef(ref)}
          style={styles.camera}
          onCameraReady={() => setIsCameraReady(true)}
          facing="front"
          ratio="16:9"
          flash={isFlashOn ? 'on' : 'off'}
        />
      ) : (
        <View style={styles.cameraPermissionContainer}>
          <TouchableOpacity onPress={requestCameraPermission} style={styles.cameraPermissionButton}>
            <Ionicons name="camera" size={60} color="#FF8800" />
            <Text style={styles.cameraPermissionText}>Izinkan akses kamera</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {hasCameraPermission?.status === 'granted' && (
                          <TouchableOpacity style={styles.flashButton} onPress={() => setIsFlashOn(!isFlashOn)}>
          <Ionicons name={isFlashOn ? 'flash' : 'flash-off'} size={24} color="#FF8800" />
        </TouchableOpacity>
      )}
      
      {hasCameraPermission?.status === 'granted' && (
        <View style={styles.captureButtonContainer}>
          <TouchableOpacity
            style={[styles.captureButton, (!isCameraReady || isProcessingPhoto) && styles.captureButtonDisabled]}
            onPress={onTakePhoto}
            disabled={isProcessingPhoto || !isCameraReady}
          >
            <Text style={styles.captureButtonText}>
              {isProcessingPhoto ? 'Memproses...' : 'Kirim'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  </View>
);

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

  const MAX_DISTANCE = 100;

  // Initialize
  useEffect(() => {
    if (outletId) {
      outletManager.setSelectedOutletId(outletId);
    }
    locationManager.getLocation();
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
    
    setIsProcessingPhoto(true);
    
    try {
      const photo = await cameraRef.takePictureAsync({ 
        quality: 0.7, 
        skipProcessing: true, 
        mirrorImage: true 
      });
      
      setRawPhoto(photo.uri);
      const now = new Date();
      const waktu = now.toLocaleString('id-ID', { hour12: false });
      const outletName = outletManager.selectedOutlet?.name ?? '-';
      const lokasi = `${locationManager.currentLocation?.latitude?.toFixed(6)},${locationManager.currentLocation?.longitude?.toFixed(6)}`;
      
      setWatermarkData({ waktu, outlet: outletName, lokasi });
      
      setTimeout(async () => {
        if (viewShotRef.current) {
          try {
            const uri = await captureRef(viewShotRef, { format: 'jpg', quality: 0.5 });
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
              Alert.alert('Check In Berhasil', 'Data berhasil disimpan.');
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
    } catch (err) {
      Alert.alert('Gagal Mengambil Foto', 'Terjadi kesalahan saat mengambil foto. Silakan coba lagi.');
      setIsProcessingPhoto(false);
    }
  }, [
    hasCameraPermission,
    requestCameraPermission,
    isCameraReady,
    cameraRef,
    outletManager,
    locationManager,
    checkInVisit,
    router
  ]);

  // Render early returns
  if (currentStep === 1 && locationBlocked) {
    return (
      <View style={styles.container}>
        <Header currentStep={currentStep} onBack={() => router.back()} onRefresh={locationManager.getLocation} />
        <LocationBlocked selectedOutlet={outletManager.selectedOutlet} router={router} />
      </View>
    );
  }

  if (currentStep === 2) {
    return (
      <View style={styles.container}>
        <Header currentStep={currentStep} onBack={() => router.back()} onRefresh={locationManager.getLocation} />
        
        <CameraScreen
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
        />
        
        {rawPhoto && watermarkData && outletManager.selectedOutlet && (
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.5 }} style={styles.hiddenViewShot}>
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

  // Main render - Step 1
  return (
    <View style={styles.container}>
      <Header currentStep={currentStep} onBack={() => router.back()} onRefresh={locationManager.getLocation} />
      
      <View style={styles.content}>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={mapRegion}
            provider={PROVIDER_GOOGLE}
            showsUserLocation
            showsMyLocationButton={false}
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
                <View style={styles.markerContainer}>
                  <View style={styles.marker}>
                    <Ionicons name="business" size={28} color="#C62828" />
                  </View>
                  <View style={styles.markerArrow} />
                </View>
              </Marker>
            )}
          </MapView>
          
          {outletManager.selectedOutlet && locationManager.currentLocation && (
            <View style={styles.locationStatusContainer}>
              <LocationStatus
                locationValidated={locationValidated}
                distance={distance ?? 0}
                outletRadius={outletManager.selectedOutlet.radius ?? 0}
                onUpdateOutlet={() => router.push(`/outlet/${outletManager.selectedOutlet!.id}/edit` as any)}
                colors={colors}
              />
            </View>
          )}
        </View>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          style={styles.bottomSheet}
        >
          <View style={styles.outletCard}>
            <OutletTypeToggle 
              visitType={outletManager.visitType} 
              onTypeChange={handleTypeChange} 
            />

            <View style={styles.outletSelection}>
              <Text style={styles.outletSelectionTitle}>
                {outletManager.visitType === 'planned' ? 'Pilih Plan Visit Hari Ini' : 'Pilih Outlet'}
              </Text>
              
              <OutletSearchInput
                visitType={outletManager.visitType}
                searchValue={outletManager.outletSearch}
                onSearchChange={outletManager.setOutletSearch}
                colors={colors}
              />
              
              <View style={styles.outletListContainer}>
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
            
            <TouchableOpacity
              style={[
                styles.continueButton, 
                outletManager.selectedOutlet ? styles.continueButtonActive : styles.continueButtonInactive
              ]}
              onPress={handleContinue}
              disabled={!outletManager.selectedOutlet}
            >
              <Text style={styles.continueButtonText}>Lanjutkan</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#FF8800',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: typography.fontSize2xl,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: typography.fontSizeSm,
    marginTop: 4,
  },
  headerPlaceholder: {
    width: 22,
    height: 22,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#C62828',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#C62828',
    marginTop: -2,
  },
  locationStatusContainer: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: spacing.md,
    zIndex: 10,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  outletCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  toggleContainer: {
    marginBottom: spacing.md,
  },
  toggleLabel: {
    fontWeight: 'bold',
    fontSize: typography.fontSizeLg,
    marginBottom: 12,
    color: '#000',
  },
  toggleButtons: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#FF8800',
  },
  toggleButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    fontSize: typography.fontSizeMd,
    color: '#000',
  },
  outletSelection: {
    marginBottom: 12,
  },
  outletSelectionTitle: {
    fontWeight: 'bold',
    fontSize: typography.fontSizeLg,
    marginBottom: 8,
    color: '#000',
  },
  outletListContainer: {
    maxHeight: 160,
  },
  outletList: {
    maxHeight: 160,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizeMd,
  },
  emptyText: {
    padding: spacing.md,
    color: '#9ca3af',
    textAlign: 'center',
  },
  outletItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderRadius: 4,
    backgroundColor: '#fff',
    marginBottom: 2,
  },
  outletItemSelected: {
    backgroundColor: '#fff7ed',
  },
  outletName: {
    fontWeight: '600',
    fontSize: typography.fontSizeMd,
    color: '#000',
  },
  outletDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  outletCode: {
    fontSize: typography.fontSizeXs,
    color: '#6b7280',
    marginRight: 8,
  },
  outletDistrict: {
    fontSize: typography.fontSizeXs,
    color: '#9ca3af',
  },
  outletDate: {
    fontSize: typography.fontSizeXs,
    color: '#3b82f6',
    marginLeft: 'auto',
  },
  continueButton: {
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: 12,
  },
  continueButtonActive: {
    backgroundColor: '#FF8800',
  },
  continueButtonInactive: {
    backgroundColor: '#d1d5db',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: typography.fontSizeLg,
    fontWeight: 'bold',
  },
  locationBlockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  locationBlockedText: {
    color: '#dc2626',
    fontSize: typography.fontSizeMd,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraPermissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  cameraPermissionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraPermissionText: {
    color: '#fff',
    fontSize: typography.fontSizeMd,
    marginTop: spacing.md,
  },
  flashButton: {
    position: 'absolute',
    top: 40,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#FF8800',
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    width: '100%',
  },
  captureButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: typography.fontSizeLg,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  hiddenViewShot: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});