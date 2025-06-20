import { useVisit } from '@/hooks/data/useVisit';
import { useCurrentLocation } from '@/hooks/utils/useCurrentLocation';
import * as ImageManipulator from 'expo-image-manipulator';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export function useCheckOutForm() {
  const { id } = useLocalSearchParams();
  const visitId = typeof id === 'string' ? id : '';
  const { checkOutVisit, fetchVisit } = useVisit();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<string>('');
  const [transaksi, setTransaksi] = useState<'YES' | 'NO' | null>(null);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<any>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [rawPhoto, setRawPhoto] = useState<string | null>(null);
  const [storeImage, setStoreImage] = useState<string | null>(null);
  const [watermarkData, setWatermarkData] = useState<any>(null);
  const viewShotRef = useRef<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { location: currentLocation, getLocation } = useCurrentLocation();

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

  const handleTakePhoto = async () => {
    if (!hasCameraPermission || hasCameraPermission.status !== 'granted') {
      return;
    }
    if (cameraRef) {
      try {
        setIsProcessingPhoto(true);
        await getLocation();
        let locationText = currentLocation ? `${currentLocation.latitude?.toFixed(6)},${currentLocation.longitude?.toFixed(6)}` : '';
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

  return {
    visit,
    loading,
    notes,
    setNotes,
    transaksi,
    setTransaksi,
    cameraRef,
    setCameraRef,
    hasCameraPermission,
    setHasCameraPermission,
    isCameraReady,
    setIsCameraReady,
    isFlashOn,
    setIsFlashOn,
    isProcessingPhoto,
    rawPhoto,
    setRawPhoto,
    storeImage,
    setStoreImage,
    watermarkData,
    setWatermarkData,
    viewShotRef,
    isModalVisible,
    setIsModalVisible,
    currentLocation,
    handleTakePhoto,
    handleCheckOut,
  };
} 