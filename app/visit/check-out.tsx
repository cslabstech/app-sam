import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { WatermarkOverlay } from '@/components/WatermarkOverlay';
import { Colors } from '@/constants/Colors';
import { useVisit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useCurrentLocation } from '@/hooks/utils/useCurrentLocation';

// ErrorBoundary sederhana
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
          <Text className="text-lg font-bold text-red-600">Terjadi kesalahan pada aplikasi.</Text>
          <Text className="text-base text-gray-500 mt-2">Silakan tutup dan buka ulang aplikasi.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function CheckOutScreen() {
  const { id } = useLocalSearchParams();
  const visitId = typeof id === 'string' ? id : '';
  const { checkOutVisit, fetchVisit } = useVisit();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [notes, setNotes] = useState<string>('');
  const [transaksi, setTransaksi] = useState<'YES' | 'NO' | null>(null);

  const [cameraRef, setCameraRef] = useState<any>(null);
  const [hasCameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [rawPhoto, setRawPhoto] = useState<string | null>(null);
  const [storeImage, setStoreImage] = useState<string | null>(null);
  const [watermarkData, setWatermarkData] = useState<{ waktu: string; outlet: string; lokasi: string } | null>(null);
  const viewShotRef = useRef<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { location: currentLocation, getLocation } = useCurrentLocation();
  const insets = useSafeAreaInsets();

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

  // Handler pakai useCallback agar tidak recreate tiap render
  const handleTakePhoto = useCallback(async () => {
    try {
      if (!hasCameraPermission || hasCameraPermission.status !== 'granted') {
        const { status } = await requestCameraPermission();
        if (status !== 'granted') {
          Alert.alert('Izin Kamera', 'Akses kamera diperlukan.');
          return;
        }
      }
      if (!cameraRef) {
        Alert.alert('Kamera tidak siap', 'Kamera belum siap digunakan.');
        return;
      }
      setIsProcessingPhoto(true);
      await getLocation();
      let lokasi = currentLocation ? `${currentLocation.latitude?.toFixed(6)},${currentLocation.longitude?.toFixed(6)}` : '-';
      const now = new Date();
      const waktu = now.toLocaleString('id-ID', { hour12: false });
      const outletName = visit?.outlet?.name || '-';
      let photo, manipulated;
      try {
        photo = await cameraRef.takePictureAsync({ quality: 0.7, skipProcessing: true });
        manipulated = await ImageManipulator.manipulateAsync(photo.uri, [
          { resize: { width: 480 } },
          { flip: ImageManipulator.FlipType.Horizontal }
        ], { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG });
      } catch (err) {
        console.error('Error proses foto:', err);
        Alert.alert('Gagal Mengambil Foto', 'Terjadi kesalahan saat mengambil foto. Silakan coba lagi.');
        return;
      }
      setRawPhoto(manipulated.uri);
      setWatermarkData({ waktu, outlet: outletName, lokasi });
      setTimeout(async () => {
        if (viewShotRef.current) {
          setStoreImage(null);
          setTimeout(async () => {
            try {
              const uri = await captureRef(viewShotRef, { format: 'jpg', quality: 0.5 });
              setStoreImage(uri);
              setIsModalVisible(true);
              setWatermarkData(null);
              setRawPhoto(null);
            } catch (err) {
              console.error('Error capture view:', err);
              Alert.alert('Gagal Proses Gambar', 'Terjadi kesalahan saat memproses gambar.');
            }
          }, 300);
        }
      }, 100);
    } catch (err) {
      console.error('Error umum proses foto:', err);
      Alert.alert('Gagal Mengambil Foto', 'Terjadi kesalahan tidak terduga.');
    } finally {
      setIsProcessingPhoto(false);
    }
  }, [hasCameraPermission, requestCameraPermission, cameraRef, getLocation, currentLocation, visit]);

  const handleCheckOut = useCallback(async () => {
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
      if (res && res.meta && typeof res.meta.code === 'number') {
        if (res.meta.code === 200) {
          Alert.alert('Check Out Success', 'Data berhasil disimpan.');
          router.back();
        } else {
          Alert.alert('Check Out Failed', res.meta.message || 'Gagal check out');
        }
      } else {
        Alert.alert('Check Out Failed', 'Respon server tidak valid.');
      }
    } catch (err) {
      console.error('Error checkout:', err);
      Alert.alert('Check Out Failed', 'Terjadi kesalahan saat mengirim data.');
    }
  }, [storeImage, visit, currentLocation, notes, transaksi, checkOutVisit, visitId]);

  // Reset state saat unmount
  useEffect(() => {
    return () => {
      setRawPhoto(null);
      setStoreImage(null);
      setWatermarkData(null);
      setIsModalVisible(false);
      setNotes('');
      setTransaksi(null);
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>Memuat data kunjungan...</Text>
        </View>
      </View>
    );
  }

  if (!loading && !visit) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 justify-center items-center p-5">
          <IconSymbol name="exclamationmark.triangle" size={60} color={colors.danger} />
          <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>Data kunjungan tidak ditemukan.</Text>
          <Pressable onPress={() => router.back()} className="mt-5 px-6 py-3 bg-primary-500 rounded-lg" accessibilityRole="button">
            <Text className="text-white font-semibold">Kembali</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const outlet = visit.outlet;

  return (
    <ErrorBoundary>
      <View className="flex-1 bg-white">
        <View className="bg-primary-500 px-4 pb-4" style={{ paddingTop: insets.top + 8 }}>
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => router.back()} className="p-1" accessibilityRole="button">
              <IconSymbol name="chevron.left" size={24} color="#fff" />
            </Pressable>
            <View className="flex-1 items-center">
              <Text className="text-white text-xl font-bold">Check Out</Text>
            </View>
            <View style={{ width: 22, height: 22 }} />
          </View>
          <View className="bg-white rounded-xl mt-5 p-4 shadow-sm">
            <Text className="text-[14px] text-slate-400 mb-1">Informasi Outlet</Text>
            <Text className="text-primary-900 text-base font-bold mb-0.5">{outlet.name} ({outlet.code})</Text>
            <View className="flex-row items-center mt-0.5">
              <IconSymbol name="mappin.and.ellipse" size={18} color="#222B45" style={{ marginRight: 8 }} />
              <Text className="text-primary-900 text-[15px]">{outlet.district}</Text>
            </View>
          </View>
        </View>
        <View className="flex-1 bg-black">
          {!storeImage && !watermarkData ? (
            <View className="flex-1 w-full h-full">
              {hasCameraPermission?.status === 'granted' ? (
                <CameraView
                  ref={ref => setCameraRef(ref)}
                  style={{ flex: 1, width: '100%', height: '100%' }}
                  onCameraReady={() => setIsCameraReady(true)}
                  flash={isFlashOn ? 'on' : 'off'}
                  facing="front"
                />
              ) : (
                <Pressable onPress={requestCameraPermission} className="flex-1 items-center justify-center bg-black" accessibilityRole="button">
                  <IconSymbol name="camera.fill" size={60} color="#FF8800" />
                  <Text className="text-white text-base mt-4">Izinkan akses kamera</Text>
                </Pressable>
              )}
              {hasCameraPermission?.status === 'granted' && (
                <Pressable className="absolute top-10 right-6 bg-white rounded-full p-2 shadow" onPress={() => setIsFlashOn(f => !f)} accessibilityRole="button">
                  <IconSymbol name={isFlashOn ? 'bolt.fill' : 'bolt.slash'} size={24} color="#FF8800" />
                </Pressable>
              )}
              <View className="absolute bottom-0 left-0 right-0 p-4 z-10 items-center">
                {hasCameraPermission?.status === 'granted' && (
                  <Pressable
                    className={`w-full h-12 rounded-md items-center justify-center ${!isCameraReady || isProcessingPhoto ? 'bg-gray-400' : 'bg-primary-500 active:bg-primary-600'}`}
                    onPress={async () => {
                      setIsProcessingPhoto(true);
                      await handleTakePhoto();
                      setIsProcessingPhoto(false);
                    }}
                    disabled={!isCameraReady || isProcessingPhoto}
                    accessibilityRole="button"
                  >
                    <Text className={`text-base font-semibold ${!isCameraReady || isProcessingPhoto ? 'text-neutral-500' : 'text-white'}`}>
                      {isProcessingPhoto ? 'Memproses...' : 'Ambil Foto'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : null}
          {watermarkData && rawPhoto && (
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.5 }} style={{ flex: 1, width: '100%', height: '100%' }}>
              <WatermarkOverlay
                photoUri={rawPhoto}
                watermarkData={watermarkData}
                currentLocation={currentLocation}
                selectedOutlet={outlet}
              />
            </ViewShot>
          )}
          {storeImage && !watermarkData && (
            <View className="flex-1 w-full h-full">
              <Image source={{ uri: storeImage }} className="flex-1 w-full h-full" />
              <Pressable className="absolute top-10 right-6 bg-white rounded-full p-2 shadow" onPress={() => { setStoreImage(null); setIsModalVisible(false); }} accessibilityRole="button">
                <IconSymbol name="xmark" size={24} color="#222B45" />
              </Pressable>
              <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setIsModalVisible(false)}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  style={{ flex: 1 }}
                  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View className="flex-1 bg-black/50 justify-center items-center">
                      <View className="bg-white rounded-2xl p-6 w-[90%]">
                        <Text className="text-lg font-bold mb-4 text-primary-900">Catatan & Transaksi</Text>
                        <Text className="text-base font-semibold mb-2 text-primary-900">Transaksi</Text>
                        <View className="flex-row gap-4 mb-4">
                          <Pressable
                            className={`flex-row items-center p-2.5 rounded-lg mr-2 ${transaksi === 'YES' ? 'bg-primary-500' : 'bg-gray-100'}`}
                            onPress={() => setTransaksi('YES')}
                            accessibilityRole="button"
                          >
                            <IconSymbol name="checkmark.circle.fill" size={20} color={transaksi === 'YES' ? '#fff' : '#FF8800'} />
                            <Text className={`ml-2 font-semibold ${transaksi === 'YES' ? 'text-white' : 'text-primary-900'}`}>YES</Text>
                          </Pressable>
                          <Pressable
                            className={`flex-row items-center p-2.5 rounded-lg mr-2 ${transaksi === 'NO' ? 'bg-primary-500' : 'bg-gray-100'}`}
                            onPress={() => setTransaksi('NO')}
                            accessibilityRole="button"
                          >
                            <IconSymbol name="xmark.circle.fill" size={20} color={transaksi === 'NO' ? '#fff' : '#FF8800'} />
                            <Text className={`ml-2 font-semibold ${transaksi === 'NO' ? 'text-white' : 'text-primary-900'}`}>NO</Text>
                          </Pressable>
                        </View>
                        <Text className="text-base font-semibold mb-2 text-primary-900">Catatan (Opsional)</Text>
                        <TextInput
                          className="bg-white rounded-lg border border-slate-200 p-3 min-h-[80px] text-primary-900 mb-4"
                          placeholder="Tambahkan catatan untuk kunjungan ini..."
                          placeholderTextColor="#7B8FA1"
                          multiline
                          value={notes}
                          onChangeText={setNotes}
                        />
                        <Pressable
                          className={`w-full h-12 rounded-md items-center justify-center ${!storeImage || !notes.trim() || !transaksi ? 'bg-gray-400' : 'bg-primary-500 active:bg-primary-600'}`}
                          onPress={() => { setIsModalVisible(false); handleCheckOut(); }}
                          disabled={!storeImage || !notes.trim() || !transaksi}
                          accessibilityRole="button"
                        >
                          <Text className={`text-base font-semibold ${!storeImage || !notes.trim() || !transaksi ? 'text-neutral-500' : 'text-white'}`}>Check Out</Text>
                        </Pressable>
                        <Pressable
                          className="w-full h-12 rounded-md items-center justify-center mt-2 bg-gray-200"
                          onPress={() => setIsModalVisible(false)}
                          accessibilityRole="button"
                        >
                          <Text className="text-primary-900 text-base font-semibold">Batal</Text>
                        </Pressable>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
              </Modal>
            </View>
          )}
        </View>
      </View>
    </ErrorBoundary>
  );
}