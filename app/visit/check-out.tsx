import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/IconSymbol';
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

  // Handler baru: Ambil foto lalu langsung submit
  const handleTakePhotoAndCheckOut = useCallback(async () => {
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
    if (!visit?.outlet?.code) {
      Alert.alert('Outlet Error', 'Data outlet tidak valid. Silakan ulangi dari halaman utama.');
      return;
    }
    if (!notes.trim()) {
      Alert.alert('Catatan Wajib', 'Mohon isi catatan untuk check out.');
      return;
    }
    if (!transaksi) {
      Alert.alert('Transaksi Wajib', 'Mohon pilih status transaksi.');
      return;
    }
    setIsProcessingPhoto(true);
    try {
      // Ambil lokasi langsung dari API agar tidak null
      let checkout_location = '';
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        checkout_location = `${loc.coords.latitude},${loc.coords.longitude}`;
      } catch (e) {
        checkout_location = '';
      }
      const now = new Date();
      const waktu = now.toLocaleString('id-ID', { hour12: false });
      const outletName = visit?.outlet?.name || '-';
      // Ambil foto
      let photo = await cameraRef.takePictureAsync({ quality: 0.7, skipProcessing: true });
      let manipulated = await ImageManipulator.manipulateAsync(photo.uri, [
        { resize: { width: 480 } },
        { flip: ImageManipulator.FlipType.Horizontal }
      ], { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG });
      // Kirim ke backend
      const fileObj = {
        uri: manipulated.uri,
        name: `checkout-${Date.now()}.jpg`,
        type: 'image/jpeg',
      };
      const formData = new FormData();
      formData.append('checkout_location', checkout_location);
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
    } finally {
      setIsProcessingPhoto(false);
    }
  }, [hasCameraPermission, requestCameraPermission, cameraRef, notes, transaksi, checkOutVisit, visit, visitId]);

  // Reset state saat unmount
  useEffect(() => {
    return () => {
      // Tidak perlu reset state foto/modal
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
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
                {/* Form input di bawah kamera */}
                <View className="absolute bottom-0 left-0 right-0 p-4 z-10 bg-white rounded-t-2xl">
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
                    className={`w-full h-12 rounded-md items-center justify-center ${!isCameraReady || isProcessingPhoto || !notes.trim() || !transaksi ? 'bg-gray-400' : 'bg-primary-500 active:bg-primary-600'}`}
                    onPress={handleTakePhotoAndCheckOut}
                    disabled={!isCameraReady || isProcessingPhoto || !notes.trim() || !transaksi}
                    accessibilityRole="button"
                  >
                    <Text className={`text-base font-semibold ${!isCameraReady || isProcessingPhoto || !notes.trim() || !transaksi ? 'text-neutral-500' : 'text-white'}`}>{isProcessingPhoto ? 'Memproses...' : 'Ambil Foto & Check Out'}</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </View>
    </ErrorBoundary>
  );
}