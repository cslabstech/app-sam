import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';

import { LocationStatus } from '@/components/LocationStatus';
import { OutletDropdown } from '@/components/OutletDropdown';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { WatermarkOverlay } from '@/components/WatermarkOverlay';
import { Colors } from '@/constants/Colors';
import { useOutlet } from '@/hooks/data/useOutlet';
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

function parseLatLong(latlong: string): { latitude: number; longitude: number } | null {
  if (!latlong) return null;
  const [lat, lng] = latlong.split(',').map(Number);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { latitude: lat, longitude: lng };
}

export default function CheckInScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams();
  const outletId = params.id as string;

  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(outletId || null);
  const { outlets, loading: loadingOutlets } = useOutlet('');
  const selectedOutlet = outlets.find(o => o.id === selectedOutletId) || null;

  const { checkInVisit } = useVisit();
  const { checkVisitStatus } = useVisit();

  const [isLoading, setIsLoading] = useState(false);
  const [storePhoto, setStorePhoto] = useState<PhotoMeta | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [currentStep, setCurrentStep] = useState(1);
  const [locationValidated, setLocationValidated] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const MAX_DISTANCE = 100;
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [currentTime, setCurrentTime] = useState(new Date());

  const [cameraRef, setCameraRef] = useState<any>(null);
  const [hasCameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const [rawPhoto, setRawPhoto] = useState<string | null>(null);
  const [watermarkData, setWatermarkData] = useState<{ waktu: string; outlet: string; lokasi: string } | null>(null);
  const viewShotRef = useRef<any>(null);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (currentStep === 2) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentStep]);

  const changeStep = (newStep: number) => {
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
  };

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);

    checkLocationPermission();
  }, []);

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
        const maxAllowedDistance = selectedOutlet.radius || MAX_DISTANCE;
        setLocationValidated(calculatedDistance <= maxAllowedDistance);
      }
    } else {
      setLocationValidated(false);
    }
  }, [selectedOutlet, currentLocation]);

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
      console.error('Location permission check error:', error);
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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

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

  const [showOutletDropdown, setShowOutletDropdown] = useState(false);
  const [locationBlocked, setLocationBlocked] = useState(false);

  return (
    <View style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Check in</Text>
            <Text style={styles.headerStep}>Langkah {currentStep} dari 2</Text>
          </View>
          {currentStep === 1 ? (
            <TouchableOpacity onPress={getLocation}>
              <Ionicons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerIconPlaceholder} />
          )}
        </View>
        <View style={styles.outletDropdownContainer}>
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
      
      {/* MAIN CONTENT */}
      {currentStep === 1 && !locationBlocked && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
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
                <View style={styles.markerContainer}>
                  <View style={styles.markerIconWrapper}>
                    <Ionicons name="business" size={28} color="#C62828" />
                  </View>
                  <View style={styles.markerTriangle} />
                </View>
              </Marker>
            )}
          </MapView>
          <View style={styles.locationStatusContainer}>
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
              style={[styles.lanjutkanButton, { backgroundColor: selectedOutlet ? '#FF8800' : '#ccc' }]}
              onPress={async () => {
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
              }}
              disabled={!selectedOutlet}
            >
              <Text style={styles.lanjutkanButtonText}>Lanjutkan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {currentStep === 1 && locationBlocked && (
        <View style={styles.blockedContainer}>
          <Text style={styles.blockedText}>
            Lokasi outlet belum diisi. Silakan update data outlet terlebih dahulu sebelum check-in.
          </Text>
          <Button title="Update Outlet" onPress={() => router.push(`/outlet/${selectedOutlet?.id}/edit`)} />
        </View>
      )}
      {currentStep === 2 && (
        <View style={styles.cameraStepContainer}>
          <Animated.View style={styles.cameraAnimatedView}>
            <TouchableOpacity style={styles.cameraBackButton} onPress={() => changeStep(1)}>
              <Ionicons name="arrow-back" size={24} color="#222B45" />
            </TouchableOpacity>
            {!storePhoto && hasCameraPermission?.status === 'granted' && (
              <CameraView
                ref={ref => setCameraRef(ref)}
                style={styles.cameraView}
                onCameraReady={() => setIsCameraReady(true)}
                facing="front"
                ratio="16:9"
                flash={isFlashOn ? 'on' : 'off'}
              />
            )}
            {!storePhoto && hasCameraPermission?.status !== 'granted' && (
              <View style={styles.cameraPermissionContainer}>
                <TouchableOpacity onPress={requestCameraPermission} style={styles.cameraPermissionButton}>
                  <Ionicons name="camera" size={60} color="#FF8800" />
                  <Text style={styles.cameraPermissionText}>Izinkan akses kamera</Text>
                </TouchableOpacity>
              </View>
            )}
            {storePhoto && (
              <Image source={{ uri: storePhoto?.uri }} style={styles.cameraImage} />
            )}
            <View style={styles.cameraCircleOverlay} />
            {!storePhoto && hasCameraPermission?.status === 'granted' && (
              <TouchableOpacity style={styles.cameraFlashButton} onPress={() => setIsFlashOn(f => !f)}>
                <Ionicons name={isFlashOn ? 'flash' : 'flash-off'} size={24} color="#FF8800" />
              </TouchableOpacity>
            )}
            {storePhoto && (
              <TouchableOpacity style={styles.cameraRemoveButton} onPress={handleRemovePhoto}>
                <Ionicons name="close" size={24} color="#222B45" />
              </TouchableOpacity>
            )}
            {!storePhoto && hasCameraPermission?.status === 'granted' && (
              <View style={styles.cameraSendButtonContainer}>
                <TouchableOpacity
                  style={styles.cameraSendButton}
                  onPress={handleKirim}
                  disabled={isProcessingPhoto || !isCameraReady}
                >
                  <Text style={styles.cameraSendButtonText}>Kirim</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
          {rawPhoto && watermarkData && selectedOutlet && (
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.5 }} style={styles.viewShot}>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  header: { backgroundColor: '#FF8800', paddingTop: 32, paddingBottom: 16, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerStep: { color: '#fff', fontSize: 14, marginTop: 2 },
  headerIconPlaceholder: { width: 22, height: 22 },
  outletDropdownContainer: { backgroundColor: '#fff', borderRadius: 12, marginTop: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  markerContainer: { alignItems: 'center', justifyContent: 'center' },
  markerIconWrapper: { backgroundColor: '#fff', borderRadius: 24, padding: 6, borderWidth: 2, borderColor: '#C62828', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  markerTriangle: { width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 18, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#C62828', marginTop: -2 },
  locationStatusContainer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'transparent' },
  lanjutkanButton: { borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  lanjutkanButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  blockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  blockedText: { color: '#C62828', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  cameraStepContainer: { flex: 1, backgroundColor: '#F5F6FA' },
  cameraAnimatedView: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 1 },
  cameraBackButton: { position: 'absolute', top: 40, left: 24, backgroundColor: '#fff', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, elevation: 3, alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  cameraView: { flex: 1, width: '100%', height: '100%' },
  cameraPermissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  cameraPermissionButton: { alignItems: 'center', justifyContent: 'center' },
  cameraPermissionText: { color: '#fff', fontSize: 16, marginTop: 16 },
  cameraImage: { flex: 1, width: '100%', height: '100%' },
  cameraCircleOverlay: { position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center', marginTop: -110, pointerEvents: 'none', zIndex: 2, width: '100%' },
  cameraFlashButton: { position: 'absolute', top: 40, right: 24, backgroundColor: '#fff', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, elevation: 3, alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  cameraRemoveButton: { position: 'absolute', bottom: 40, right: 24, backgroundColor: '#fff', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, elevation: 3, alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  cameraSendButtonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'transparent', zIndex: 3, alignItems: 'center' },
  cameraSendButton: { backgroundColor: '#FF8800', borderRadius: 8, paddingVertical: 16, alignItems: 'center', width: '100%' },
  cameraSendButtonText: { color: '#fff', fontSize: 18, fontWeight: '600', letterSpacing: 0.5 },
  viewShot: { flex: 1, width: '100%', height: '100%' },
});