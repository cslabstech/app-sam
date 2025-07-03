import { MediaPreview } from '@/components/MediaPreview';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FormData {
  code: string;
  location: string;
  owner_name: string;
  owner_phone: string;
  photo_shop_sign: string;
  photo_front: string;
  photo_left: string;
  photo_right: string;
  video: string;
}

interface FormErrors {
  [key: string]: string;
}

type PhotoField = 'photo_shop_sign' | 'photo_front' | 'photo_left' | 'photo_right';

const Header = React.memo(function Header({ 
  title, 
  colors, 
  onBack 
}: { 
  title: string; 
  colors: any; 
  onBack: () => void; 
}) {
  const insets = useSafeAreaInsets();
  
  const headerStyle = useMemo(() => ({ 
    paddingTop: insets.top + 12, 
    backgroundColor: colors.primary 
  }), [insets.top, colors.primary]);

  return (
    <View className="px-4 pb-4" style={headerStyle}>
      <View className="flex-row justify-between items-center">
        <TouchableOpacity 
          onPress={onBack}
          className="w-8 h-8 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1 items-center mx-4">
          <Text className="text-white text-xl font-semibold" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {title}
          </Text>
        </View>
        <View className="w-8 h-8" />
      </View>
    </View>
  );
});

const useEditOutletForm = (outlet: any) => {
  const [form, setForm] = useState<FormData>({
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
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (outlet) {
      setForm({
        code: outlet.code || '',
        location: outlet.location || '',
        owner_name: (outlet as any).owner_name || '',
        owner_phone: (outlet as any).owner_phone || '',
        photo_shop_sign: (outlet as any).photo_shop_sign || '',
        photo_front: (outlet as any).photo_front || '',
        photo_left: (outlet as any).photo_left || '',
        photo_right: (outlet as any).photo_right || '',
        video: (outlet as any).video || '',
      });
    }
  }, [outlet]);

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback(() => {
    const errors: FormErrors = {};
    if (!form.owner_name.trim()) errors.owner_name = 'Nama pemilik wajib diisi';
    if (!form.owner_phone.trim()) errors.owner_phone = 'Nomor HP pemilik wajib diisi';
    if (!form.location.trim()) errors.location = 'Lokasi wajib diisi';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  return {
    form,
    formErrors,
    handleChange,
    setForm,
    validateForm,
  };
};

const useLocationManager = () => {
  const getCurrentLocation = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin lokasi ditolak', 'Aplikasi tidak bisa mengambil lokasi. Silakan ubah manual jika diperlukan.');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High,
      });
      if (loc && loc.coords) {
        return `${loc.coords.latitude},${loc.coords.longitude}`;
      }
      return null;
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Gagal Mendapatkan Lokasi', 'Tidak dapat mengambil lokasi otomatis. Silakan ubah manual jika diperlukan.');
      return null;
    }
  }, []);

  return { getCurrentLocation };
};

const useMediaManager = () => {
  const { compress } = useVideoCompressor();

  const compressImage = useCallback(async (uri: string) => {
    let compressed = { uri };
    try {
      let quality = 0.5; // Reduced from 0.7 for better performance
      for (let i = 0; i < 3; i++) { // Reduced iterations from 5 to 3
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
        return null;
      }
      return compressed.uri;
    } catch (e) {
      Alert.alert('Gagal kompres foto', 'Terjadi kesalahan saat kompresi.');
      return null;
    }
  }, []);

  const takePhoto = useCallback(async (field: PhotoField, onSuccess: (uri: string) => void) => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin kamera ditolak', 'Aplikasi membutuhkan izin kamera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.5, // Reduced from 0.7 for better performance
    });
    if (!result.canceled && result.assets[0]) {
      const compressedUri = await compressImage(result.assets[0].uri);
      if (compressedUri) {
        onSuccess(compressedUri);
      }
    }
  }, [compressImage]);

  const takeVideo = useCallback(async (onSuccess: (uri: string) => void) => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin kamera ditolak', 'Aplikasi membutuhkan izin kamera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      videoMaxDuration: 8,
      quality: 0.2, // Reduced from 0.3 for better performance
    });
    if (!result.canceled && result.assets[0]) {
      let uri = result.assets[0].uri;
      
      try {
        const originalInfo = await FileSystem.getInfoAsync(uri);
        if (originalInfo.exists && 'size' in originalInfo) {
          if (originalInfo.size > 15 * 1024 * 1024) {
            Alert.alert('Video terlalu besar', 'Video yang direkam terlalu besar. Silakan rekam video yang lebih pendek.');
            return;
          }
        }

        const compressedUri = await compress(uri, {
          compressionMethod: 'manual',
          preset: 'H264_640x480',
          quality: 'low',
        });
        
        const info = await FileSystem.getInfoAsync(compressedUri);
        if (!info.exists) {
          Alert.alert('Gagal kompres video', 'File video tidak dapat diakses setelah kompresi. Silakan coba lagi.');
          return;
        }
        
        if ('size' in info && info.size > 5 * 1024 * 1024) {
          Alert.alert('Video masih terlalu besar', 'Ukuran video hasil kompres masih di atas 5MB. Silakan rekam video yang lebih pendek.');
          return;
        }
        
        onSuccess(compressedUri);
      } catch (e) {
        console.error('Video compression error:', e);
        Alert.alert('Gagal kompres video', 'Terjadi kesalahan saat kompresi. Silakan coba lagi.');
      }
    }
  }, [compress]);

  return { takePhoto, takeVideo };
};

const LoadingScreen = React.memo(function LoadingScreen({ 
  colors, 
  onGoBack 
}: { 
  colors: any; 
  onGoBack: () => void; 
}) {
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header title="Edit Outlet" colors={colors} onBack={onGoBack} />
      <View className="flex-1 justify-center items-center px-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-base mt-4" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
          Memuat data outlet...
        </Text>
      </View>
    </View>
  );
});

const ErrorScreen = React.memo(function ErrorScreen({ 
  error, 
  colors, 
  onGoBack 
}: { 
  error: string; 
  colors: any; 
  onGoBack: () => void; 
}) {
  const errorIconStyle = useMemo(() => ({ 
    backgroundColor: colors.danger + '20' 
  }), [colors.danger]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header title="Edit Outlet" colors={colors} onBack={onGoBack} />
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={errorIconStyle}>
          <IconSymbol name="exclamationmark.triangle" size={32} color={colors.danger} />
        </View>
        <Text className="text-lg font-semibold text-center mb-2" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
          Gagal Memuat Data
        </Text>
        <Text className="text-sm text-center mb-6" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
          {error}
        </Text>
        <Button title="Kembali" variant="primary" onPress={onGoBack} />
      </View>
    </View>
  );
});

const FormField = React.memo(function FormField({ 
  label, 
  value, 
  onChangeText, 
  error, 
  placeholder, 
  keyboardType, 
  editable = true, 
  colors 
}: {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: any;
  editable?: boolean;
  colors: any;
}) {
  const inputStyle = useMemo(() => ({ 
    fontFamily: 'Inter_400Regular',
    color: editable ? colors.text : colors.textSecondary, 
    borderColor: colors.border,
    backgroundColor: editable ? colors.card : colors.inputBackground,
  }), [editable, colors.text, colors.textSecondary, colors.border, colors.card, colors.inputBackground]);

  return (
    <View className="mb-4">
      <Text className="text-base font-medium mb-3" style={{ fontFamily: 'Inter_500Medium', color: colors.text }}>
        {label}
      </Text>
      <TextInput
        className="border rounded-lg p-3 text-base"
        style={inputStyle}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        editable={editable}
        maxLength={100}
        placeholderTextColor={colors.textSecondary}
      />
      {error && (
        <Text className="text-sm mt-1" style={{ fontFamily: 'Inter_400Regular', color: colors.danger }}>
          {error}
        </Text>
      )}
    </View>
  );
});

const MediaField = React.memo(function MediaField({ 
  label, 
  hasMedia, 
  mediaUri, 
  mediaType, 
  onTake, 
  onRemove, 
  colors 
}: {
  label: string;
  hasMedia: boolean;
  mediaUri: string;
  mediaType: 'image' | 'video';
  onTake: () => void;
  onRemove: () => void;
  colors: any;
}) {
  const buttonStyle = useMemo(() => ({ 
    borderColor: colors.border, 
    backgroundColor: colors.inputBackground 
  }), [colors.border, colors.inputBackground]);

  const buttonText = useMemo(() => 
    hasMedia ? `Ubah ${mediaType === 'image' ? 'Foto' : 'Video'}` : `Ambil ${mediaType === 'image' ? 'Foto' : 'Video'}`,
    [hasMedia, mediaType]
  );

  const labelText = useMemo(() => 
    mediaType === 'video' ? mediaUri.split('/').pop()?.substring(0, 30) + '...' : undefined,
    [mediaType, mediaUri]
  );

  return (
    <View className="mb-4">
      <Text className="text-base font-medium mb-3" style={{ fontFamily: 'Inter_500Medium', color: colors.text }}>
        {label}
      </Text>
      <TouchableOpacity
        className="border rounded-lg p-3 items-center"
        style={buttonStyle}
        onPress={onTake}
        accessibilityRole="button"
        accessibilityLabel={`${hasMedia ? 'Ubah' : 'Ambil'} ${mediaType === 'image' ? 'foto' : 'video'}`}
      >
        <Text className="text-base" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
          {buttonText}
        </Text>
      </TouchableOpacity>
      {hasMedia && (
        <View className="mt-2">
          <MediaPreview
            uri={mediaUri}
            type={mediaType}
            label={labelText}
            onRemove={onRemove}
          />
        </View>
      )}
    </View>
  );
});

export default React.memo(function OutletEditPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { outlet, loading, error, fetchOutlet, updateOutlet, updateOutletWithFile } = useOutlet('');
  const { isConnected } = useNetwork();

  const { form, formErrors, handleChange, setForm, validateForm } = useEditOutletForm(outlet);
  const { getCurrentLocation } = useLocationManager();
  const { takePhoto, takeVideo } = useMediaManager();

  useEffect(() => {
    if (id) fetchOutlet(id as string);
  }, [id]);

  useEffect(() => {
    const setLocation = async () => {
      const location = await getCurrentLocation();
      if (location) {
        handleChange('location', location);
      }
    };
    setLocation();
  }, [getCurrentLocation, handleChange]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handlePhotoTake = useCallback((field: PhotoField) => {
    takePhoto(field, (uri) => handleChange(field, uri));
  }, [takePhoto, handleChange]);

  const handleVideoTake = useCallback(() => {
    takeVideo((uri) => handleChange('video', uri));
  }, [takeVideo, handleChange]);

  const handleMediaRemove = useCallback((field: keyof FormData) => {
    setForm(prev => ({ ...prev, [field]: '' }));
  }, [setForm]);

  const prepareFormData = useCallback(async () => {
    const formData = new FormData();
    formData.append('code', form.code);
    formData.append('location', form.location);
    formData.append('owner_name', form.owner_name);
    formData.append('owner_phone', form.owner_phone);

    const processImage = async (uri: string, fieldName: string) => {
      if (!uri) return;
      let processedUri = uri;
      const name = uri.split('/').pop() || `${fieldName}.jpg`;
      let type = 'image/jpeg';
      if (name.endsWith('.png')) type = 'image/png';

      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 900 } }],
          { compress: 0.5, format: name.endsWith('.png') ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG } // Reduced from 0.7
        );
        processedUri = manipulated.uri;
      } catch (e) {
        // Use original if compression fails
      }
      formData.append(fieldName, { uri: processedUri, name, type } as any);
    };

    await Promise.all([
      processImage(form.photo_shop_sign, 'photo_shop_sign'),
      processImage(form.photo_front, 'photo_front'),
      processImage(form.photo_left, 'photo_left'),
      processImage(form.photo_right, 'photo_right'),
    ]);

    if (form.video) {
      const uri = form.video;
      const name = uri.split('/').pop() || 'video.mp4';
      
      const supportedFormats = ['.mp4', '.mov', '.avi'];
      const isValidFormat = supportedFormats.some(format => name.toLowerCase().endsWith(format));
      if (!isValidFormat) {
        Alert.alert('Format video tidak didukung', 'Hanya mendukung format MP4, MOV, dan AVI.');
        return null;
      }

      let type = 'video/mp4';
      if (name.endsWith('.mov')) type = 'video/quicktime';
      if (name.endsWith('.avi')) type = 'video/x-msvideo';
      
      try {
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists) {
          Alert.alert('File video tidak ditemukan', 'File video tidak dapat diakses. Silakan rekam ulang.');
          return null;
        }
        
        if ('size' in info && info.size > 5 * 1024 * 1024) {
          Alert.alert('Video terlalu besar', 'Ukuran video maksimal 5MB. Silakan rekam video yang lebih pendek.');
          return null;
        }
      } catch (e) {
        console.error('Error checking video file:', e);
        Alert.alert('Error', 'Tidak dapat memvalidasi file video. Silakan coba lagi.');
        return null;
      }
      
      formData.append('video', { uri, name, type } as any);
    }

    return formData;
  }, [form]);

  const handleUpdate = useCallback(async () => {
    if (!outlet || !validateForm()) return;

    const hasFile = !!(form.photo_shop_sign || form.photo_front || form.photo_left || form.photo_right || form.video);
    
    if (hasFile) {
      const formData = await prepareFormData();
      if (!formData) return;

      log('[OUTLET][UPDATE][FORMDATA]', formData);
      const result = await updateOutletWithFile(outlet.id.toString(), formData);
      log('[OUTLET][UPDATE][RESULT]', result);
      
      if (result.success) {
        Alert.alert('Success', 'Outlet updated successfully');
        router.back();
      } else {
        log('[OUTLET][UPDATE][ERROR]', result.error);
        Alert.alert('Error', result.error || 'Failed to update outlet');
      }
    } else {
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
      const result = await updateOutlet(outlet.id.toString(), payload);
      log('[OUTLET][UPDATE][RESULT]', result);
      
      if (result.success) {
        Alert.alert('Success', 'Outlet updated successfully');
        router.back();
      } else {
        log('[OUTLET][UPDATE][ERROR]', result.error);
        Alert.alert('Error', result.error || 'Failed to update outlet');
      }
    }
  }, [outlet, validateForm, form, prepareFormData, updateOutletWithFile, updateOutlet, router]);

  // Memoized card styles
  const basicInfoCardStyle = useMemo(() => ({ 
    backgroundColor: colors.card,
    borderColor: colors.border,
    minHeight: 48 
  }), [colors.card, colors.border]);

  const mediaCardStyle = useMemo(() => ({ 
    backgroundColor: colors.card,
    borderColor: colors.border,
    minHeight: 48 
  }), [colors.card, colors.border]);

  const basicInfoIconStyle = useMemo(() => ({ 
    backgroundColor: colors.primary + '20' 
  }), [colors.primary]);

  const mediaIconStyle = useMemo(() => ({ 
    backgroundColor: colors.primary + '20' 
  }), [colors.primary]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setForm({
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
    };
  }, [setForm]);

  if (loading) {
    return <LoadingScreen colors={colors} onGoBack={handleGoBack} />;
  }

  if (error) {
    return <ErrorScreen error={error} colors={colors} onGoBack={handleGoBack} />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header title="Edit Outlet" colors={colors} onBack={handleGoBack} />
      
      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-4 pb-8">
          {/* Basic Information Card */}
          <TouchableOpacity 
            className="rounded-lg border p-4 mb-4 shadow-sm"
            style={basicInfoCardStyle}
            activeOpacity={1}
          >
            <View className="flex-row items-center mb-4">
              <View className="w-9 h-9 rounded-lg items-center justify-center mr-3" style={basicInfoIconStyle}>
                <IconSymbol name="info.circle" size={18} color={colors.primary} />
              </View>
              <Text className="text-lg font-semibold" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
                Informasi Dasar
              </Text>
            </View>
            
            <FormField
              label="Kode Outlet"
              value={form.code}
              editable={false}
              colors={colors}
            />
            
            <FormField
              label="Nama Pemilik"
              value={form.owner_name}
              onChangeText={(value) => handleChange('owner_name', value)}
              placeholder="Nama pemilik outlet"
              error={formErrors.owner_name}
              colors={colors}
            />
            
            <View className="mb-0">
              <FormField
                label="Nomor HP Pemilik"
                value={form.owner_phone}
                onChangeText={(value) => handleChange('owner_phone', value)}
                placeholder="08xxxxxxxxxx"
                keyboardType="phone-pad"
                error={formErrors.owner_phone}
                colors={colors}
              />
            </View>
          </TouchableOpacity>
          
          {/* Media Card */}
          <TouchableOpacity 
            className="rounded-lg border p-4 mb-4 shadow-sm"
            style={mediaCardStyle}
            activeOpacity={1}
          >
            <View className="flex-row items-center mb-4">
              <View className="w-9 h-9 rounded-lg items-center justify-center mr-3" style={mediaIconStyle}>
                <IconSymbol name="photo" size={18} color={colors.primary} />
              </View>
              <Text className="text-lg font-semibold" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
                Media Outlet
              </Text>
            </View>
            
            <MediaField
              label="Photo Shop Sign"
              hasMedia={!!form.photo_shop_sign}
              mediaUri={form.photo_shop_sign}
              mediaType="image"
              onTake={() => handlePhotoTake('photo_shop_sign')}
              onRemove={() => handleMediaRemove('photo_shop_sign')}
              colors={colors}
            />
            
            <MediaField
              label="Photo Depan"
              hasMedia={!!form.photo_front}
              mediaUri={form.photo_front}
              mediaType="image"
              onTake={() => handlePhotoTake('photo_front')}
              onRemove={() => handleMediaRemove('photo_front')}
              colors={colors}
            />
            
            <MediaField
              label="Photo Kiri"
              hasMedia={!!form.photo_left}
              mediaUri={form.photo_left}
              mediaType="image"
              onTake={() => handlePhotoTake('photo_left')}
              onRemove={() => handleMediaRemove('photo_left')}
              colors={colors}
            />
            
            <MediaField
              label="Photo Kanan"
              hasMedia={!!form.photo_right}
              mediaUri={form.photo_right}
              mediaType="image"
              onTake={() => handlePhotoTake('photo_right')}
              onRemove={() => handleMediaRemove('photo_right')}
              colors={colors}
            />
            
            <View className="mb-0">
              <MediaField
                label="Video"
                hasMedia={!!form.video}
                mediaUri={form.video}
                mediaType="video"
                onTake={handleVideoTake}
                onRemove={() => handleMediaRemove('video')}
                colors={colors}
              />
            </View>
          </TouchableOpacity>
          
          <Button
            title={loading ? 'Updating...' : 'Update Outlet'}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleUpdate}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </View>
  );
}); 