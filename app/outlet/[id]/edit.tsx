import { MediaPreview } from '@/components/MediaPreview';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/context/network-context';
import { useOutlet } from '@/hooks/data/useOutlet';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useVideoCompressor } from '@/hooks/utils/useVideoCompressor';
import { log } from '@/utils/logger';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OutletEditPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { outlet, loading, error, fetchOutlet, updateOutlet, updateOutletWithFile } = useOutlet('');
  const [form, setForm] = useState({
    code: '',
    location: '',
    owner_name: '',
    owner_phone: '',
    photo_shop_sign: '',
    photo_front: '',
    photo_left: '',
    photo_right: '',
    video: '',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const { compress } = useVideoCompressor();
  const { isConnected } = useNetwork();

  useEffect(() => {
    if (id) fetchOutlet(id as string);
  }, [id]);

  // Log hanya jika outlet sudah ada dan bukan null
  useEffect(() => {
    if (outlet) {
      console.log('OutletEditPage outlet:', outlet);
    }
  }, [outlet]);

  useEffect(() => {
    if (outlet) {
      setForm(f => ({
        ...f,
        code: outlet.code || '',
        owner_name: (outlet as any).owner_name || '',
        owner_phone: (outlet as any).owner_phone || '',
        photo_shop_sign: (outlet as any).photo_shop_sign || '',
        photo_front: (outlet as any).photo_front || '',
        photo_left: (outlet as any).photo_left || '',
        photo_right: (outlet as any).photo_right || '',
        video: (outlet as any).video || '',
      }));
    }
  }, [outlet]);

  // Ambil lokasi user secara otomatis saat mount
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin lokasi ditolak', 'Aplikasi tidak bisa mengambil lokasi. Silakan ubah manual jika diperlukan.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.High,
        });
        if (loc && loc.coords) {
          const latlong = `${loc.coords.latitude},${loc.coords.longitude}`;
          setForm(f => ({ ...f, location: latlong }));
        }
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Gagal Mendapatkan Lokasi', 'Tidak dapat mengambil lokasi otomatis. Silakan ubah manual jika diperlukan.');
      }
    };
    getCurrentLocation();
  }, []);

  const handleChange = (field: string, value: string | number) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  // Ambil foto dari kamera (bisa untuk field berbeda)
  const takePhoto = async (field: 'photo_shop_sign' | 'photo_front' | 'photo_left' | 'photo_right') => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin kamera ditolak', 'Aplikasi membutuhkan izin kamera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      let uri = result.assets[0].uri;
      // Kompres foto agar < 100KB
      let compressed = { uri };
      try {
        let quality = 0.7;
        for (let i = 0; i < 5; i++) {
          compressed = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 800 } }],
            { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
          );
          const info = await FileSystem.getInfoAsync(compressed.uri);
          if (info.exists && info.size && info.size < 100 * 1024) break;
          quality -= 0.15;
          if (quality < 0.2) break;
        }
        const info = await FileSystem.getInfoAsync(compressed.uri);
        if (!info.exists || !info.size || info.size > 100 * 1024) {
          Alert.alert('Foto terlalu besar', 'Ukuran foto harus di bawah 100KB. Silakan ulangi dengan pencahayaan lebih baik.');
          return;
        }
      } catch (e) {
        Alert.alert('Gagal kompres foto', 'Terjadi kesalahan saat kompresi.');
        return;
      }
      setForm(f => ({ ...f, [field]: compressed.uri }));
    }
  };

  // Ambil video dari kamera dan kompres jika bukan di Expo Go
  const takeVideo = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin kamera ditolak', 'Aplikasi membutuhkan izin kamera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      videoMaxDuration: 10,
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      let uri = result.assets[0].uri;
      try {
        // Kompres video jika di native, jika di Expo Go return uri asli
        const compressedUri = await compress(uri, {
          compressionMethod: 'manual',
          preset: 'H264_640x480',
          quality: 'low',
        });
        const info = await FileSystem.getInfoAsync(compressedUri);
        if (!info.exists || !info.size || info.size > 2 * 1024 * 1024) {
          Alert.alert('Video masih terlalu besar', 'Ukuran video hasil kompres harus di bawah 2MB. Silakan rekam ulang.');
          return;
        }
        setForm(f => ({ ...f, video: compressedUri }));
      } catch (e) {
        Alert.alert('Gagal kompres video', 'Terjadi kesalahan saat kompresi.');
      }
    }
  };

  const handleUpdate = async () => {
    if (!outlet) return;
    // Validasi required
    const errors: { [key: string]: string } = {};
    if (!form.owner_name.trim()) errors.owner_name = 'Nama pemilik wajib diisi';
    if (!form.owner_phone.trim()) errors.owner_phone = 'Nomor HP pemilik wajib diisi';
    if (!form.location.trim()) errors.location = 'Lokasi wajib diisi';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Jika ada file (photo/video), gunakan FormData
    const hasFile = !!form.photo_shop_sign || !!form.video;
    if (hasFile) {
      const formData = new FormData();
      formData.append('code', form.code);
      formData.append('location', form.location);
      formData.append('owner_name', form.owner_name);
      formData.append('owner_phone', form.owner_phone);
      // Kompres gambar jika ada
      if (form.photo_shop_sign) {
        let uri = form.photo_shop_sign;
        let name = uri.split('/').pop() || 'photo.jpg';
        let type = 'image/jpeg';
        if (name.endsWith('.png')) type = 'image/png';
        // Kompres gambar max width 900px, quality 0.7
        try {
          const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 900 } }],
            { compress: 0.7, format: name.endsWith('.png') ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG }
          );
          uri = manipulated.uri;
        } catch (e) {
          // Jika gagal kompres, pakai original
        }
        formData.append('photo_shop_sign', { uri, name, type } as any);
      }
      // Tambahan: upload foto depan, kiri, kanan jika ada
      if (form.photo_front) {
        let uri = form.photo_front;
        let name = uri.split('/').pop() || 'photo_front.jpg';
        let type = 'image/jpeg';
        if (name.endsWith('.png')) type = 'image/png';
        try {
          const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 900 } }],
            { compress: 0.7, format: name.endsWith('.png') ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG }
          );
          uri = manipulated.uri;
        } catch (e) {}
        formData.append('photo_front', { uri, name, type } as any);
      }
      if (form.photo_left) {
        let uri = form.photo_left;
        let name = uri.split('/').pop() || 'photo_left.jpg';
        let type = 'image/jpeg';
        if (name.endsWith('.png')) type = 'image/png';
        try {
          const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 900 } }],
            { compress: 0.7, format: name.endsWith('.png') ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG }
          );
          uri = manipulated.uri;
        } catch (e) {}
        formData.append('photo_left', { uri, name, type } as any);
      }
      if (form.photo_right) {
        let uri = form.photo_right;
        let name = uri.split('/').pop() || 'photo_right.jpg';
        let type = 'image/jpeg';
        if (name.endsWith('.png')) type = 'image/png';
        try {
          const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 900 } }],
            { compress: 0.7, format: name.endsWith('.png') ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG }
          );
          uri = manipulated.uri;
        } catch (e) {}
        formData.append('photo_right', { uri, name, type } as any);
      }
      // Cek ukuran video jika ada
      if (form.video) {
        const uri = form.video;
        const name = uri.split('/').pop() || 'video.mp4';
        let type = 'video/mp4';
        if (name.endsWith('.mov')) type = 'video/quicktime';
        // Cek ukuran file video
        try {
          const info = await FileSystem.getInfoAsync(uri);
          if (info.exists && typeof info.size === 'number' && info.size > 10 * 1024 * 1024) { // 2MB
            Alert.alert('Video terlalu besar', 'Ukuran video maksimal 10MB. Silakan pilih video lain.');
            return;
          }
        } catch (e) {}
        formData.append('video', { uri, name, type } as any);
      }
      log('[OUTLET][UPDATE][FORMDATA]', formData);
      const result = await updateOutletWithFile(outlet.id, formData);
      log('[OUTLET][UPDATE][RESULT]', result);
      if (result.success) {
        Alert.alert('Success', 'Outlet updated successfully');
        router.back();
      } else {
        if (result.error) {
          log('[OUTLET][UPDATE][ERROR]', result.error);
        }
        Alert.alert('Error', result.error || 'Failed to update outlet');
      }
      return;
    }
    // Jika tidak ada file, tetap pakai updateOutlet biasa
    const payload = {
      code: form.code,
      location: form.location,
      owner_name: form.owner_name,
      owner_phone: form.owner_phone,
      photo_shop_sign: form.photo_shop_sign,
      photo_front: form.photo_front,
      photo_left: form.photo_left,
      photo_right: form.photo_right,
      video: form.video,
    };
    log('[OUTLET][UPDATE][PAYLOAD]', payload);
    const result = await updateOutlet(outlet.id, payload);
    log('[OUTLET][UPDATE][RESULT]', result);
    if (result.success) {
      Alert.alert('Success', 'Outlet updated successfully');
      router.back();
    } else {
      if (result.error) {
        log('[OUTLET][UPDATE][ERROR]', result.error);
      }
      Alert.alert('Error', result.error || 'Failed to update outlet');
    }
  };

  if (error) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }} edges={isConnected ? ['top','left','right'] : ['left','right']}>
      <Text style={{ color: colors.danger, margin: 20, textAlign: 'center' }}>{error}</Text>
      <Button title="Go Back" variant="primary" onPress={() => router.back()} />
    </SafeAreaView>
  );

  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }} edges={isConnected ? ['top','left','right'] : ['left','right']}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.text, marginTop: 16 }}>Loading outlet data...</Text>
    </SafeAreaView>
  );

  // Jangan render "Data outlet tidak ditemukan" jika masih loading
  if (!outlet && !loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }} edges={isConnected ? ['top','left','right'] : ['left','right']}>
      <Text style={{ color: colors.danger, margin: 20, textAlign: 'center' }}>Data outlet tidak ditemukan.</Text>
      <Button title="Go Back" variant="primary" onPress={() => router.back()} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={isConnected ? ['top','left','right'] : ['left','right']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <Text style={[styles.formTitle, { color: colors.text }]}>Edit Outlet</Text>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Kode Outlet</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
            value={form.code}
            editable={false}
          />
        </View>
        {/* Location field disembunyikan dari user, tapi tetap digunakan untuk payload */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Nama Pemilik</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={form.owner_name}
            onChangeText={v => handleChange('owner_name', v)}
            placeholder="Nama pemilik outlet"
          />
          {!!formErrors.owner_name && (
            <Text style={{ color: colors.danger, marginTop: 4 }}>{formErrors.owner_name}</Text>
          )}
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Nomor HP Pemilik</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={form.owner_phone}
            onChangeText={v => handleChange('owner_phone', v)}
            placeholder="08xxxxxxxxxx"
            keyboardType="phone-pad"
          />
          {!!formErrors.owner_phone && (
            <Text style={{ color: colors.danger, marginTop: 4 }}>{formErrors.owner_phone}</Text>
          )}
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Photo Shop Sign</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { borderColor: colors.border }]}
            onPress={() => takePhoto('photo_shop_sign')}
          >
            <Text style={{ color: colors.text }}>
              {form.photo_shop_sign ? 'Change Photo' : 'Take Photo'}
            </Text>
          </TouchableOpacity>
          {form.photo_shop_sign && (
            <MediaPreview
              uri={form.photo_shop_sign}
              type="image"
              onRemove={() => setForm(f => ({ ...f, photo_shop_sign: '' }))}
            />
          )}
        </View>
        {/* Tambahan field foto depan, kiri, kanan */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Photo Depan</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { borderColor: colors.border }]}
            onPress={() => takePhoto('photo_front')}
          >
            <Text style={{ color: colors.text }}>
              {form.photo_front ? 'Change Photo' : 'Take Photo'}
            </Text>
          </TouchableOpacity>
          {form.photo_front && (
            <MediaPreview
              uri={form.photo_front}
              type="image"
              onRemove={() => setForm(f => ({ ...f, photo_front: '' }))}
            />
          )}
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Photo Kiri</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { borderColor: colors.border }]}
            onPress={() => takePhoto('photo_left')}
          >
            <Text style={{ color: colors.text }}>
              {form.photo_left ? 'Change Photo' : 'Take Photo'}
            </Text>
          </TouchableOpacity>
          {form.photo_left && (
            <MediaPreview
              uri={form.photo_left}
              type="image"
              onRemove={() => setForm(f => ({ ...f, photo_left: '' }))}
            />
          )}
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Photo Kanan</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { borderColor: colors.border }]}
            onPress={() => takePhoto('photo_right')}
          >
            <Text style={{ color: colors.text }}>
              {form.photo_right ? 'Change Photo' : 'Take Photo'}
            </Text>
          </TouchableOpacity>
          {form.photo_right && (
            <MediaPreview
              uri={form.photo_right}
              type="image"
              onRemove={() => setForm(f => ({ ...f, photo_right: '' }))}
            />
          )}
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Video</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { borderColor: colors.border }]}
            onPress={takeVideo}
          >
            <Text style={{ color: colors.text }}>
              {form.video ? 'Change Video' : 'Take Video'}
            </Text>
          </TouchableOpacity>
          {form.video && (
            <MediaPreview
              uri={form.video}
              type="video"
              label={form.video.split('/').pop()?.substring(0, 30) + '...'}
              onRemove={() => setForm(f => ({ ...f, video: '' }))}
            />
          )}
        </View>
        <Button
          title={loading ? 'Updating...' : 'Update Outlet'}
          onPress={handleUpdate}
          disabled={loading}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
});
