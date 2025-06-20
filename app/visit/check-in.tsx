import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location'; // Import Location API
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';

import { LocationStatus } from '@/components/LocationStatus';
import { OutletDropdown } from '@/components/OutletDropdown';
import { Button } from '@/components/ui/Button'; // Import Button component
import { WatermarkOverlay } from '@/components/WatermarkOverlay';
import { Colors } from '@/constants/Colors';
import { useOutlet } from '@/hooks/data/useOutlet'; // Changed from useOutlets to useOutlet
import { useVisit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

// Tambahkan ulang tipe ini karena sudah tidak ada di OutletAPI
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

// Helper to parse latlong string to { latitude, longitude }
function parseLatLong(latlong: string): { latitude: number; longitude: number } | null {
  if (!latlong) return null;
  const [lat, lng] = latlong.split(',').map(Number);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { latitude: lat, longitude: lng };
}

/**
 * Check-in Screen Component
 * 
 * Fitur utama:
 * - Validasi lokasi berdasarkan radius outlet (jika radius = 0, skip validasi)
 * - Two-step process: validasi lokasi → selfie check-in
 * - Menggunakan GPS dan kamera untuk verifikasi
 * 
 * @author SAM App Team
 */
export default function CheckInScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams();
  const outletId = params.id as string;

  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(outletId || null);
  const { outlets, loading: loadingOutlets } = useOutlet('');
  const selectedOutlet = outlets.find(o => o.id === selectedOutletId) || null;

  const { checkInVisit } = useVisit();
  // Panggil hook di level atas komponen
  const { checkVisitStatus } = useVisit();

  const [isLoading, setIsLoading] = useState(false);
  const [storePhoto, setStorePhoto] = useState<PhotoMeta | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Two-step process states
  const [currentStep, setCurrentStep] = useState(1); // 1 = location validation, 2 = clock in
  const [locationValidated, setLocationValidated] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null); // MapView accepts undefined/null
  const MAX_DISTANCE = 100; // Maximum distance in meters allowed for check-in

  // New state variables for enhanced UX
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Animation values for step transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [currentTime, setCurrentTime] = useState(new Date()); // For updating the clock

  const insets = useSafeAreaInsets();

  // Camera state for CameraView
  const [cameraRef, setCameraRef] = useState<any>(null); // Accept any for CameraView ref
  const [hasCameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // New states for selfie photo and watermark
  const [rawPhoto, setRawPhoto] = useState<string | null>(null); // Foto asli sebelum watermark
  const [watermarkData, setWatermarkData] = useState<{ waktu: string; outlet: string; lokasi: string } | null>(null);
  const viewShotRef = useRef<any>(null);

  // Update time every second for the clock display
  useEffect(() => {
    if (currentStep === 2) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentStep]);

  // Step transition with fade animation and auto-open camera
  const changeStep = (newStep: number) => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(newStep);
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    // Format the current date
    const now = new Date();
    setCurrentDate(now);

    // Check location permission on component mount
    checkLocationPermission();
  }, []);

  // Update distance & locationValidated setiap kali currentLocation atau outlet berubah
  useEffect(() => {
    const outletCoords = selectedOutlet ? parseLatLong(selectedOutlet.location) : null;

    // Jika location outlet null/invalid, blokir semua validasi dan UI radius
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
      // Jika radius outlet 0, skip validasi jarak (langsung valid)
      if (selectedOutlet.radius === 0) {
        setLocationValidated(true);
      } else {
        // Gunakan radius dari outlet, fallback ke MAX_DISTANCE jika radius tidak ada
        const maxAllowedDistance = selectedOutlet.radius || MAX_DISTANCE;
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

  // Check and request location permissions with better UI
  const checkLocationPermission = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted') {
        getLocation();
      } else {
        // If permission is not granted, we'll request it
        requestLocationPermission();
      }
      setLoadingLocation(false);
    } catch (error) {
      setLoadingLocation(false);
      setPermissionStatus('error');
      setLocationError('Gagal memeriksa izin lokasi: ' + (error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui'));
      console.error('Location permission check error:', error);
    }
  };

  // Request location permission with better explanation
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted') {
        getLocation();
      } else {
        // Permission denied, show alert with option to open settings
        Alert.alert(
          'Izin Lokasi Diperlukan',
          'Check-in membutuhkan izin lokasi untuk memverifikasi bahwa Anda berada di outlet. Silakan aktifkan akses lokasi di pengaturan perangkat Anda.',
          [
            {
              text: 'Buka Pengaturan',
              onPress: openAppSettings
            },
            {
              text: 'Batal',
              style: 'cancel',
            }
          ]
        );
      }
    } catch (error) {
      setPermissionStatus('error');
      setLocationError('Gagal meminta izin lokasi: ' + (error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui'));
      console.error('Location permission request error:', error);
    }
  };

  // Function to open app settings
  const openAppSettings = () => {
    try {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening settings:', error);
      Alert.alert(
        'Kesalahan',
        'Tidak dapat membuka pengaturan secara otomatis. Silakan buka pengaturan perangkat Anda dan aktifkan izin lokasi secara manual.'
      );
    }
  };

  // Calculate distance between two coordinates in meters using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // in meters
  };

  const getLocation = async () => {
    try {
      setLoadingLocation(true);
      setLocationError(null);

      // Check permission status again before trying to get location
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLoadingLocation(false);
        requestLocationPermission();
        return;
      }

      // Get the real user location with high accuracy
      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Lebih cepat, cukup akurat untuk check-in
        });

        // Use the real location
        const realLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? undefined,
        };

        setCurrentLocation(realLocation);
        // Set map region to user location as default
        setMapRegion({
          latitude: realLocation.latitude,
          longitude: realLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } catch (locationError) {
        console.error('Error getting location:', locationError);
        setLocationError('Gagal mendapatkan lokasi Anda. Pastikan GPS aktif dan coba lagi.');
        Alert.alert('Kesalahan Lokasi', 'Gagal mendapatkan lokasi Anda. Pastikan GPS aktif dan coba lagi.');
      }

      setLoadingLocation(false);
    } catch (error) {
      setLoadingLocation(false);
      setLocationError('Gagal mendapatkan lokasi Anda: ' + (error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui'));
      console.error('Get location error:', error);
      Alert.alert('Kesalahan Lokasi', 'Gagal mendapatkan lokasi Anda. Silakan periksa pengaturan perangkat dan coba lagi.');
    }
  };

  const handleTakePhoto = async () => {
    if (isProcessingPhoto) return;
    if (!hasCameraPermission || hasCameraPermission.status !== 'granted') {
      const { status } = await requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert(
          'Izin Diperlukan',
          'Anda harus memberikan izin kamera untuk mengambil foto.',
          [
            {
              text: 'Buka Pengaturan',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            },
            { text: 'Batal', style: 'cancel' }
          ]
        );
        return;
      }
    }
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
        // Kompres dan resize gambar
        const manipulated = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 480 } }], // resize lebih kecil agar file <100KB
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );
        // Siapkan metadata
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
        // Hapus auto-call handleClockIn setelah ambil foto
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

  // Ganti: tombol Kirim langsung ambil foto dan submit, bukan validasi storePhoto
  const handleKirim = async () => {
    if (!selectedOutletId) {
      Alert.alert('Pilih Outlet', 'Silakan pilih outlet terlebih dahulu.');
      return;
    }
    if (!currentLocation) {
      Alert.alert('Lokasi Tidak Terdeteksi', 'Lokasi Anda belum terdeteksi. Pastikan GPS aktif.');
      return;
    }
    if (!hasCameraPermission || hasCameraPermission.status !== 'granted') {
      const { status } = await requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert('Izin Kamera', 'Akses kamera diperlukan untuk check-in.');
        return;
      }
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
      // Ambil foto selfie
      const photo = await cameraRef.takePictureAsync({ quality: 0.7, skipProcessing: true, mirrorImage: true });
      setRawPhoto(photo.uri);
      // Siapkan data watermark
      const now = new Date();
      const waktu = now.toLocaleString('id-ID', { hour12: false });
      const outletName = selectedOutlet?.name ?? '-';
      const lokasi = `${currentLocation.latitude?.toFixed(6)},${currentLocation.longitude?.toFixed(6)}`;
      setWatermarkData({ waktu, outlet: outletName, lokasi });
      // Tunggu render ViewShot, lalu capture
      setTimeout(async () => {
        if (viewShotRef.current) {
          try {
            const uri = await captureRef(viewShotRef, { format: 'jpg', quality: 0.5 });
            // Submit check-in
            const formData = new FormData();
            formData.append('outlet_id', selectedOutletId); // Correct key for backend validation
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
      }, 400); // beri waktu render overlay
    } catch (err) {
      Alert.alert('Gagal Mengambil Foto', 'Terjadi kesalahan saat mengambil foto. Silakan coba lagi.');
      setIsProcessingPhoto(false);
    }
  };

  const [showOutletDropdown, setShowOutletDropdown] = useState(false);
  const [locationBlocked, setLocationBlocked] = useState(false); // Tambah state blokir validasi jika outlet location null

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Red Header */}
      <View style={{
        backgroundColor: '#FF8800',
        paddingTop: insets.top + 8,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>Check in</Text>
            <Text style={{ color: '#fff', fontSize: 14, marginTop: 2 }}>Langkah {currentStep} dari 2</Text>
          </View>
          {/* Tampilkan tombol refresh hanya di step 1 */}
          {currentStep === 1 ? (
            <TouchableOpacity onPress={getLocation}>
              <Ionicons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 22, height: 22 }} />
          )}
        </View>
        {/* Schedule Card */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          marginTop: 18,
          padding: 16,
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <OutletDropdown
            outlets={outlets}
            selectedOutletId={selectedOutletId}
            onSelect={setSelectedOutletId}
            disabled={currentStep === 2}
            loading={loadingOutlets}
            showDropdown={showOutletDropdown}
            setShowDropdown={setShowOutletDropdown}
          />
        </View>
      </View>

      {/* Step 1: Map View */}
      {currentStep === 1 && !locationBlocked && (
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            region={mapRegion}
            provider={PROVIDER_GOOGLE}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {selectedOutlet && selectedOutlet.location && (
              <Marker
                coordinate={{
                  latitude: Number(selectedOutlet.location.split(',')[0]),
                  longitude: Number(selectedOutlet.location.split(',')[1]),
                }}
                title={selectedOutlet.name}
                description={selectedOutlet.district ?? ''}
              >
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 6, borderWidth: 2, borderColor: '#C62828', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 }}>
                    <Ionicons name="business" size={28} color="#C62828" />
                  </View>
                  <View style={{ width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 18, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#C62828', marginTop: -2 }} />
                </View>
              </Marker>
            )}
          </MapView>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'transparent' }}>
            {/* Status Validasi Lokasi */}
            {selectedOutlet && currentLocation && (
              <LocationStatus
                locationValidated={locationValidated}
                distance={distance ?? 0}
                outletRadius={selectedOutlet.radius ?? 0}
                onUpdateOutlet={() => router.push(`/outlet/${selectedOutlet.id}/edit` as any)}
                colors={colors}
              />
            )}
            <TouchableOpacity
              style={{ backgroundColor: selectedOutlet ? '#FF8800' : '#ccc', borderRadius: 8, paddingVertical: 16, alignItems: 'center' }}
              onPress={async () => {
                if (!selectedOutlet) {
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
                // Validasi status kunjungan sebelum lanjut
                try {
                  const result = await useVisit().checkVisitStatus(selectedOutlet.id);
                  if (result?.meta?.code === 400 && result?.meta?.message?.includes('berjalan')) {
                    Alert.alert('Visit Aktif', result?.meta?.message || 'Masih ada visit yang berjalan, silakan check-out terlebih dahulu.');
                    return;
                  } else if (result?.meta?.code === 400 && result?.meta?.message?.includes('sudah pernah visit')) {
                    Alert.alert('Sudah Pernah Visit', result?.meta?.message || 'Anda sudah pernah visit ke outlet ini hari ini.');
                    return;
                  }
                  changeStep(2);
                } catch {
                  Alert.alert('Cek Status Gagal', 'Gagal memeriksa status kunjungan. Silakan coba lagi.');
                }
              }}
              disabled={!selectedOutlet}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Lanjutkan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Jika locationBlocked, tampilkan info blokir */}
      {currentStep === 1 && locationBlocked && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: colors.danger, fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
            Lokasi outlet belum diisi. Silakan update data outlet terlebih dahulu sebelum check-in.
          </Text>
          <Button title="Update Outlet" onPress={() => router.push(`/outlet/${selectedOutlet?.id}/edit`)} />
        </View>
      )}

      {/* Step 2: Selfie/Face Verification */}
      {currentStep === 2 && (
        <View style={{ flex: 1, backgroundColor: '#F5F6FA' }}>
          <Animated.View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000',
            zIndex: 1,
          }}>
            {/* Tombol kembali ke step 1 di kiri atas area kamera */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 40,
                left: 24,
                backgroundColor: '#fff',
                borderRadius: 24,
                padding: 8,
                shadowColor: '#000',
                shadowOpacity: 0.10,
                shadowRadius: 8,
                elevation: 3,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
              }}
              onPress={() => changeStep(1)}
            >
              <Ionicons name="arrow-back" size={24} color="#222B45" />
            </TouchableOpacity>
            {/* CameraView hanya render jika permission granted dan belum ambil foto */}
            {!storePhoto && hasCameraPermission?.status === 'granted' && (
              <CameraView
                ref={ref => setCameraRef(ref)}
                style={{ flex: 1, width: '100%', height: '100%' }}
                onCameraReady={() => setIsCameraReady(true)}
                facing="front"
                ratio="16:9"
                flash={isFlashOn ? 'on' : 'off'}
              />
            )}
            {/* Jika permission belum granted, tampilkan tombol untuk request permission */}
            {!storePhoto && hasCameraPermission?.status !== 'granted' && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                <TouchableOpacity onPress={requestCameraPermission} style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="camera" size={60} color="#FF8800" />
                  <Text style={{ color: '#fff', fontSize: 16, marginTop: 16 }}>Izinkan akses kamera</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Preview foto jika sudah ambil foto */}
            {storePhoto && (
              <Image source={{ uri: storePhoto?.uri }} style={{ flex: 1, width: '100%', height: '100%' }} />
            )}
            {/* Dotted face outline overlay di tengah layar */}
            <View style={{ position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center', marginTop: -110, pointerEvents: 'none', zIndex: 2 }}>
              <View style={{
                width: 220,
                height: 220,
                borderRadius: 110,
                borderWidth: 3,
                borderColor: '#fff',
                borderStyle: 'dotted',
                backgroundColor: 'transparent',
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 8,
              }} />
            </View>
            {/* Tombol flash di kanan atas area kamera */}
            {!storePhoto && hasCameraPermission?.status === 'granted' && (
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 40,
                  right: 24,
                  backgroundColor: '#fff',
                  borderRadius: 24,
                  padding: 8,
                  shadowColor: '#000',
                  shadowOpacity: 0.10,
                  shadowRadius: 8,
                  elevation: 3,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 3,
                }}
                onPress={() => setIsFlashOn(f => !f)}
              >
                <Ionicons name={isFlashOn ? 'flash' : 'flash-off'} size={24} color="#FF8800" />
              </TouchableOpacity>
            )}
            {/* Tombol close di kanan bawah setelah foto diambil */}
            {storePhoto && (
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  bottom: 40,
                  right: 24,
                  backgroundColor: '#fff',
                  borderRadius: 24,
                  padding: 8,
                  shadowColor: '#000',
                  shadowOpacity: 0.10,
                  shadowRadius: 8,
                  elevation: 3,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 3,
                }}
                onPress={handleRemovePhoto}
              >
                <Ionicons name="close" size={24} color="#222B45" />
              </TouchableOpacity>
            )}
            {/* Tombol Kirim di bawah kamera, hanya jika belum ambil foto (otomatis kirim setelah ambil foto) */}
            {!storePhoto && hasCameraPermission?.status === 'granted' && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 16,
                  backgroundColor: 'transparent',
                  zIndex: 3,
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: '#FF8800',
                    borderRadius: 8,
                    paddingVertical: 16,
                    alignItems: 'center',
                    width: '100%',
                  }}
                  onPress={handleKirim}
                  disabled={isProcessingPhoto || !isCameraReady}
                >
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', letterSpacing: 0.5 }}>Kirim</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
          {/* Render ViewShot overlay jika rawPhoto & watermarkData ada */}
          {rawPhoto && watermarkData && selectedOutlet && (
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.5 }} style={{ flex: 1, width: '100%', height: '100%' }}>
              <WatermarkOverlay
                photoUri={rawPhoto}
                watermarkData={watermarkData}
                currentLocation={currentLocation}
                selectedOutlet={selectedOutlet}
              />
            </ViewShot>
          )}
        </View>
      )}
    </View>
  );
}