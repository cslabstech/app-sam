import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';

import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { WatermarkOverlay } from '@/components/WatermarkOverlay';
import { Colors } from '@/constants/Colors';
import { useVisit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useCurrentLocation } from '@/hooks/utils/useCurrentLocation';

export default function CheckOutScreen() {
  const { id } = useLocalSearchParams();
  const visitId = typeof id === 'string' ? id : '';
  const { checkOutVisit, fetchVisit } = useVisit();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Notes & transaksi
  const [notes, setNotes] = useState<string>('');
  const [transaksi, setTransaksi] = useState<'YES' | 'NO' | null>(null);

  // Kamera & foto
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [hasCameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [rawPhoto, setRawPhoto] = useState<string | null>(null);
  const [storeImage, setStoreImage] = useState<string | null>(null);
  const [watermarkData, setWatermarkData] = useState<{ waktu: string; hari: string; location: string } | null>(null);
  const viewShotRef = useRef<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Lokasi
  const { location: currentLocation, getLocation } = useCurrentLocation();

  // Ambil detail visit
  useEffect(() => {
    async function fetchVisitDetail() {
      if (!visitId) return;
      setLoading(true);
      try {
        const res = await fetchVisit(visitId);
        if (res.success) setVisit(res.data || null);
        else setVisit(null);
      } finally {
        setLoading(false);
      }
    }
    fetchVisitDetail();
  }, [visitId]);

  // Ambil foto & overlay watermark
  const handleTakePhoto = async () => {
    if (!hasCameraPermission || hasCameraPermission.status !== 'granted') {
      const { status } = await requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert('Izin Kamera', 'Akses kamera diperlukan.');
        return;
      }
    }
    if (cameraRef) {
      try {
        setIsProcessingPhoto(true);
        await getLocation();
        let locationText = currentLocation ? `${currentLocation.latitude?.toFixed(6)}, ${currentLocation.longitude?.toFixed(6)}` : '';
        const now = new Date();
        const waktuText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const hariText = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const photo = await cameraRef.takePictureAsync({ quality: 0.7, skipProcessing: true, mirrorImage: true });
        const manipulated = await ImageManipulator.manipulateAsync(photo.uri, [{ resize: { width: 480 } }], { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG });
        setRawPhoto(manipulated.uri);
        setWatermarkData({ location: locationText, waktu: waktuText, hari: hariText });
        setTimeout(async () => {
          if (viewShotRef.current) {
            setStoreImage(null);
            setTimeout(async () => {
              const uri = await captureRef(viewShotRef, { format: 'jpg', quality: 0.5 });
              setStoreImage(uri);
              setIsModalVisible(true);
              setWatermarkData(null);
              setRawPhoto(null);
            }, 300);
          }
        }, 100);
      } catch {
        Alert.alert('Gagal Mengambil Foto', 'Terjadi kesalahan saat mengambil foto. Silakan coba lagi.');
      } finally {
        setIsProcessingPhoto(false);
      }
    }
  };

  // Submit check-out
  const handleCheckOut = async () => {
    if (!storeImage) {
      Alert.alert('Image Required', 'Silakan ambil foto toko.');
      return;
    }
    if (!visit?.outlet?.code) {
      Alert.alert('Outlet Error', 'Data outlet tidak valid. Silakan ulangi dari halaman utama.');
      return;
    }
    let latlong_out = '';
    if (currentLocation) {
      latlong_out = `${currentLocation.latitude},${currentLocation.longitude}`;
    }
    if (!notes.trim()) {
      Alert.alert('Catatan Wajib', 'Mohon isi catatan untuk check out.');
      return;
    }
    if (!transaksi) {
      Alert.alert('Transaksi Wajib', 'Mohon pilih status transaksi.');
      return;
    }
    try {
      const fileObj = {
        uri: storeImage,
        name: `checkout-${Date.now()}.jpg`,
        type: 'image/jpeg',
      };
      const formData = new FormData();
      formData.append('checkout_location', latlong_out);
      formData.append('checkout_photo', fileObj as any);
      formData.append('transaction', transaksi);
      formData.append('report', notes);
      const res = await checkOutVisit(visitId, formData);
      if (res?.meta?.code === 200) {
        Alert.alert('Check Out Success', 'Data berhasil disimpan.');
        router.back();
      } else {
        Alert.alert('Check Out Failed', res?.meta?.message || 'Gagal check out');
      }
    } catch {
      Alert.alert('Check Out Failed', 'Terjadi kesalahan saat mengirim data.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Loading visit data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!visit) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={60} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.text }]}>Visit not found</Text>
          <Button onPress={() => router.back()} title="Go Back" style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  const outlet = visit.outlet;

  // UI utama
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header Merah */}
      <View style={{ backgroundColor: '#FF8800', paddingTop: 32, paddingBottom: 16, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>Check Out</Text>
          </View>
          <View style={{ width: 22, height: 22 }} />
        </View>
        {/* Info Outlet */}
        <View style={{ backgroundColor: '#fff', borderRadius: 12, marginTop: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ color: '#7B8FA1', fontSize: 14, marginBottom: 4 }}>Informasi Outlet</Text>
          <Text style={{ color: '#222B45', fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}>{outlet.name} ({outlet.code})</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <IconSymbol name="mappin.and.ellipse" size={18} color="#222B45" style={{ marginRight: 8 }} />
            <Text style={{ color: '#222B45', fontSize: 15 }}>{outlet.district}</Text>
          </View>
        </View>
      </View>
      {/* Step: Foto Selfie/Store + Notes + Transaksi */}
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Kamera & overlay watermark */}
        {!storeImage && !watermarkData ? (
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            {hasCameraPermission?.status === 'granted' ? (
              <CameraView
                ref={ref => setCameraRef(ref)}
                style={{ flex: 1, width: '100%', height: '100%' }}
                onCameraReady={() => setIsCameraReady(true)}
                flash={isFlashOn ? 'on' : 'off'}
                facing="front"
              />
            ) : (
              <TouchableOpacity onPress={requestCameraPermission} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                <IconSymbol name="camera.fill" size={60} color="#FF8800" />
                <Text style={{ color: '#fff', fontSize: 16, marginTop: 16 }}>Izinkan akses kamera</Text>
              </TouchableOpacity>
            )}
            {/* Tombol flash kanan atas */}
            {hasCameraPermission?.status === 'granted' && (
              <TouchableOpacity style={{ position: 'absolute', top: 40, right: 24, backgroundColor: '#fff', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, elevation: 3, alignItems: 'center', justifyContent: 'center', zIndex: 3 }} onPress={() => setIsFlashOn(f => !f)}>
                <IconSymbol name={isFlashOn ? 'bolt.fill' : 'bolt.slash'} size={24} color="#FF8800" />
              </TouchableOpacity>
            )}
            {/* Tombol ambil foto di bawah */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'transparent', zIndex: 3, alignItems: 'center' }}>
              <Button
                title={isProcessingPhoto ? 'Memproses...' : 'Ambil Foto'}
                onPress={async () => {
                  setIsProcessingPhoto(true);
                  await handleTakePhoto();
                  setIsProcessingPhoto(false);
                }}
                disabled={!isCameraReady || isProcessingPhoto}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        ) : null}
        {/* Overlay watermark */}
        {watermarkData && rawPhoto && (
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.5 }} style={{ flex: 1, width: '100%', height: '100%' }}>
            <WatermarkOverlay
              photoUri={rawPhoto}
              watermarkData={{
                waktu: watermarkData.waktu,
                outlet: outlet?.name || '-',
                lokasi: watermarkData.location,
              }}
              currentLocation={currentLocation}
              selectedOutlet={outlet}
            />
          </ViewShot>
        )}
        {/* Preview & modal input setelah foto diambil */}
        {storeImage && !watermarkData && (
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <Image source={{ uri: storeImage }} style={{ flex: 1, width: '100%', height: '100%' }} />
            {/* Tombol close kanan atas */}
            <TouchableOpacity style={{ position: 'absolute', top: 40, right: 24, backgroundColor: '#fff', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, elevation: 3, alignItems: 'center', justifyContent: 'center', zIndex: 3 }} onPress={() => { setStoreImage(null); setIsModalVisible(false); }}>
              <IconSymbol name="xmark" size={24} color="#222B45" />
            </TouchableOpacity>
            {/* Modal input notes & transaksi */}
            <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setIsModalVisible(false)}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%' }}>
                  <Text style={{ color: '#222B45', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Catatan & Transaksi</Text>
                  <Text style={{ color: '#222B45', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Catatan (Opsional)</Text>
                  <TextInput
                    style={{ backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', padding: 12, minHeight: 80, color: '#222B45', marginBottom: 16 }}
                    placeholder="Tambahkan catatan untuk kunjungan ini..."
                    placeholderTextColor="#7B8FA1"
                    multiline
                    value={notes}
                    onChangeText={setNotes}
                  />
                  <Text style={{ color: '#222B45', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Transaksi</Text>
                  <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, backgroundColor: transaksi === 'YES' ? '#FF8800' : '#fff', borderWidth: 1, borderColor: transaksi === 'YES' ? '#FF8800' : '#E5E7EB', marginRight: 8 }}
                      onPress={() => setTransaksi('YES')}
                    >
                      <IconSymbol name="checkmark.circle.fill" size={20} color={transaksi === 'YES' ? '#fff' : '#FF8800'} />
                      <Text style={{ color: transaksi === 'YES' ? '#fff' : '#222B45', marginLeft: 8, fontWeight: '600' }}>YES</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, backgroundColor: transaksi === 'NO' ? '#FF8800' : '#fff', borderWidth: 1, borderColor: transaksi === 'NO' ? '#FF8800' : '#E5E7EB' }}
                      onPress={() => setTransaksi('NO')}
                    >
                      <IconSymbol name="xmark.circle.fill" size={20} color={transaksi === 'NO' ? '#fff' : '#FF8800'} />
                      <Text style={{ color: transaksi === 'NO' ? '#fff' : '#222B45', marginLeft: 8, fontWeight: '600' }}>NO</Text>
                    </TouchableOpacity>
                  </View>
                  <Button title="Check Out" onPress={() => { setIsModalVisible(false); handleCheckOut(); }} disabled={!storeImage || !notes.trim() || !transaksi} />
                  <Button title="Batal" onPress={() => setIsModalVisible(false)} style={{ marginTop: 8 }} variant="secondary" />
                </View>
              </View>
            </Modal>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
});