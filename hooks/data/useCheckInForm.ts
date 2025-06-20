import { useOutlet } from '@/hooks/data/useOutlet';
import { useVisit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Linking, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export function useCheckInForm() {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams();
  const outletId = params.id as string;

  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(outletId || null);
  const { outlets, loading: loadingOutlets } = useOutlet('');
  const selectedOutlet = outlets.find(o => o.id === selectedOutletId) || null;

  const { checkInVisit, checkVisitStatus } = useVisit();

  const [storePhoto, setStorePhoto] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [locationValidated, setLocationValidated] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<any>(null);
  const [showOutletDropdown, setShowOutletDropdown] = useState(false);
  const [rawPhoto, setRawPhoto] = useState<string | null>(null);
  const [watermarkData, setWatermarkData] = useState<any>(null);
  const viewShotRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Helper
  function parseLatLong(latlong: string): { latitude: number; longitude: number } | null {
    if (!latlong) return null;
    const [lat, lng] = latlong.split(',').map(Number);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { latitude: lat, longitude: lng };
  }
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  // Location permission
  const checkLocationPermission = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === 'granted') {
        getLocation();
      } else {
        requestLocationPermission();
      }
      setLoadingLocation(false);
    } catch (error) {
      setLoadingLocation(false);
      setPermissionStatus('error');
      setLocationError('Gagal memeriksa izin lokasi: ' + (error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui'));
    }
  };
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === 'granted') {
        getLocation();
      } else {
        Alert.alert(
          'Izin Lokasi Diperlukan',
          'Check-in membutuhkan izin lokasi untuk memverifikasi bahwa Anda berada di outlet. Silakan aktifkan akses lokasi di pengaturan perangkat Anda.',
          [
            { text: 'Buka Pengaturan', onPress: openAppSettings },
            { text: 'Batal', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      setPermissionStatus('error');
      setLocationError('Gagal meminta izin lokasi: ' + (error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui'));
    }
  };
  const openAppSettings = () => {
    try {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    } catch (error) {
      Alert.alert('Kesalahan', 'Tidak dapat membuka pengaturan secara otomatis. Silakan buka pengaturan perangkat Anda dan aktifkan izin lokasi secara manual.');
    }
  };
  const getLocation = async () => {
    try {
      setLoadingLocation(true);
      setLocationError(null);
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoadingLocation(false);
        requestLocationPermission();
        return;
      }
      let location;
      try {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const realLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? undefined,
        };
        setCurrentLocation(realLocation);
        setMapRegion({
          latitude: realLocation.latitude,
          longitude: realLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } catch (locationError) {
        setLocationError('Gagal mendapatkan lokasi Anda. Pastikan GPS aktif dan coba lagi.');
        Alert.alert('Kesalahan Lokasi', 'Gagal mendapatkan lokasi Anda. Pastikan GPS aktif dan coba lagi.');
      }
      setLoadingLocation(false);
    } catch (error) {
      setLoadingLocation(false);
      setLocationError('Gagal mendapatkan lokasi Anda: ' + (error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui'));
      Alert.alert('Kesalahan Lokasi', 'Gagal mendapatkan lokasi Anda. Silakan periksa pengaturan perangkat dan coba lagi.');
    }
  };

  // Step & animasi
  const changeStep = (newStep: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setCurrentStep(newStep);
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  // Validasi lokasi & outlet
  useEffect(() => {
    const outletCoords = selectedOutlet ? parseLatLong(selectedOutlet.location) : null;
    if (selectedOutlet && (!selectedOutlet.location || !outletCoords)) {
      setLocationBlocked(true);
      setLocationValidated(false);
      Alert.alert(
        'Data Outlet Belum Lengkap',
        'Silakan update data outlet terlebih dahulu sebelum check-in.',
        [
          { text: 'Update Outlet', onPress: () => router.push(`/outlet/${selectedOutlet.id}/edit`) },
          { text: 'Batal', style: 'cancel' },
        ]
      );
      return;
    } else {
      setLocationBlocked(false);
    }
    if (selectedOutlet && currentLocation && outletCoords) {
      const calculatedDistance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        outletCoords.latitude,
        outletCoords.longitude
      );
      setDistance(calculatedDistance);
      if (selectedOutlet.radius === 0) {
        setLocationValidated(true);
      } else {
        const maxAllowedDistance = selectedOutlet.radius || 100;
        setLocationValidated(calculatedDistance <= maxAllowedDistance);
      }
    } else {
      setLocationValidated(false);
    }
  }, [selectedOutlet, currentLocation]);

  // Set map region ke latlong outlet jika sudah pilih outlet
  useEffect(() => {
    if (selectedOutlet) {
      const coords = parseLatLong(selectedOutlet.location);
      if (coords) {
        setMapRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    }
  }, [selectedOutlet]);

  // Camera/photo logic
  const handleTakePhoto = async () => {
    if (isProcessingPhoto) return;
    if (!isCameraReady) {
      setIsProcessingPhoto(true);
      setTimeout(() => {
        if (!isCameraReady) {
          Alert.alert('Kamera Belum Siap', 'Kamera belum siap digunakan. Silakan tunggu beberapa detik dan coba lagi.');
        }
        setIsProcessingPhoto(false);
      }, 3000);
      return;
    }
    if (cameraRef) {
      try {
        setIsProcessingPhoto(true);
        const photo = await cameraRef.takePictureAsync({ quality: 0.7, skipProcessing: true, mirrorImage: true });
        const manipulated = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 480 } }],
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );
        const now = new Date();
        const waktu = now.toLocaleString('id-ID', { hour12: false });
        const latitude = currentLocation?.latitude ?? null;
        const longitude = currentLocation?.longitude ?? null;
        const outletName = selectedOutlet?.name ?? '-';
        setStorePhoto({
          uri: manipulated.uri,
          waktu,
          latitude,
          longitude,
          outlet: outletName,
        });
      } catch (err) {
        Alert.alert('Gagal Mengambil Foto', 'Terjadi kesalahan saat mengambil foto. Silakan coba lagi.');
      } finally {
        setIsProcessingPhoto(false);
      }
    } else {
      Alert.alert('Kamera Tidak Terdeteksi', 'Kamera tidak tersedia. Silakan coba ulangi atau restart aplikasi.');
    }
  };
  const handleRemovePhoto = () => {
    setStorePhoto(null);
  };

  // Kirim check-in
  const handleKirim = async () => {
    if (!selectedOutletId) {
      Alert.alert('Pilih Outlet', 'Silakan pilih outlet terlebih dahulu.');
      return;
    }
    if (!currentLocation) {
      Alert.alert('Lokasi Tidak Terdeteksi', 'Lokasi Anda belum terdeteksi. Pastikan GPS aktif.');
      return;
    }
    if (!isCameraReady) {
      Alert.alert('Kamera Belum Siap', 'Kamera belum siap digunakan.');
      return;
    }
    if (!cameraRef) {
      Alert.alert('Kamera Tidak Terdeteksi', 'Kamera tidak tersedia.');
      return;
    }
    setIsProcessingPhoto(true);
    try {
      const photo = await cameraRef.takePictureAsync({ quality: 0.7, skipProcessing: true, mirrorImage: true });
      setRawPhoto(photo.uri);
      const now = new Date();
      const waktu = now.toLocaleString('id-ID', { hour12: false });
      const outletName = selectedOutlet?.name ?? '-';
      const lokasi = `${currentLocation.latitude?.toFixed(6)},${currentLocation.longitude?.toFixed(6)}`;
      setWatermarkData({ waktu, outlet: outletName, lokasi });
      setTimeout(async () => {
        if (viewShotRef.current) {
          try {
            const uri = await captureRef(viewShotRef, { format: 'jpg', quality: 0.5 });
            const formData = new FormData();
            formData.append('outlet_id', selectedOutletId);
            formData.append('checkin_location', `${currentLocation.latitude},${currentLocation.longitude}`);
            formData.append('type', 'EXTRACALL');
            formData.append('checkin_photo', {
              uri,
              name: `checkin-${Date.now()}.jpg`,
              type: 'image/jpeg',
            } as any);
            const res = await checkInVisit(formData);
            if (res?.meta?.code === 200) {
              Alert.alert('Check In Berhasil', 'Data berhasil disimpan.');
              setStorePhoto(null);
              setRawPhoto(null);
              setWatermarkData(null);
              router.replace({ pathname: '/(tabs)', params: { outletId: selectedOutletId } });
            } else {
              Alert.alert('Check In Gagal', res?.meta?.message || 'Gagal check in');
            }
          } catch (err) {
            Alert.alert('Gagal Mengambil Foto', 'Terjadi kesalahan saat mengambil foto. Silakan coba lagi.');
          } finally {
            setIsProcessingPhoto(false);
          }
        }
      }, 400);
    } catch (err) {
      Alert.alert('Gagal Mengambil Foto', 'Terjadi kesalahan saat mengambil foto. Silakan coba lagi.');
      setIsProcessingPhoto(false);
    }
  };

  // Validasi status kunjungan sebelum lanjut
  const handleLanjutkan = async () => {
    if (!selectedOutlet || !selectedOutlet.id) {
      Alert.alert('Pilih Outlet', 'Silakan pilih outlet terlebih dahulu.');
      return;
    }
    if (!locationValidated && selectedOutlet.radius > 0) {
      Alert.alert(
        'Lokasi Terlalu Jauh',
        `Anda berada ${Math.round(distance || 0)}m dari outlet, sedangkan maksimal jarak adalah ${selectedOutlet.radius}m. Apakah Anda ingin memperbarui lokasi outlet?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Update ', onPress: () => router.push(`/outlet/${selectedOutlet.id}/edit` as any) },
        ]
      );
      return;
    }
    try {
      const result = await checkVisitStatus(selectedOutlet.id);
      if (result?.meta?.code === 400 && result?.meta?.message?.includes('berjalan')) {
        Alert.alert('Visit Aktif', result?.meta?.message || 'Masih ada visit yang berjalan, silakan check-out terlebih dahulu.');
        return;
      } else if (result?.meta?.code === 400 && result?.meta?.message?.includes('sudah pernah visit')) {
        Alert.alert('Sudah Pernah Visit', result?.meta?.message || 'Anda sudah pernah visit ke outlet ini hari ini.');
        return;
      } else if (result?.success === false) {
        Alert.alert('Cek Status Gagal', result?.error || 'Gagal memeriksa status kunjungan. Silakan coba lagi.');
        return;
      }
      changeStep(2);
    } catch (err) {
      Alert.alert('Cek Status Gagal', 'Gagal memeriksa status kunjungan. Silakan coba lagi.');
    }
  };

  return {
    selectedOutletId,
    setSelectedOutletId,
    outlets,
    loadingOutlets,
    selectedOutlet,
    currentLocation,
    setCurrentLocation,
    currentStep,
    setCurrentStep,
    storePhoto,
    setStorePhoto,
    handleTakePhoto,
    handleRemovePhoto,
    handleKirim,
    handleLanjutkan,
    locationValidated,
    distance,
    mapRegion,
    loadingLocation,
    locationBlocked,
    permissionStatus,
    locationError,
    isProcessingPhoto,
    cameraRef,
    setCameraRef,
    isCameraReady,
    setIsCameraReady,
    hasCameraPermission,
    setHasCameraPermission,
    showOutletDropdown,
    setShowOutletDropdown,
    rawPhoto,
    setRawPhoto,
    watermarkData,
    setWatermarkData,
    viewShotRef,
    fadeAnim,
    changeStep,
  };
} 