import { MediaPreview } from '@/components/MediaPreview';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/context/network-context';
import { useOutlet } from '@/hooks/data/useOutlet';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useVideoCompressor } from '@/hooks/utils/useVideoCompressor';
import { log } from '@/utils/logger';
import { Camera } from 'expo-camera';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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

// Stepper Component
const StepIndicator = React.memo(function StepIndicator({
  currentStep,
  totalSteps,
  colors
}: {
  currentStep: number;
  totalSteps: number;
  colors: any;
}) {
  return (
    <View className="px-4 py-4">
      <View className="flex-row items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <React.Fragment key={stepNumber}>
              <View className="items-center">
                <View 
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    isCompleted ? 'bg-green-500' : 
                    isActive ? 'bg-orange-500' : 'bg-neutral-300 dark:bg-neutral-600'
                  }`}
                >
                  {isCompleted ? (
                    <IconSymbol name="checkmark" size={16} color="#fff" />
                  ) : (
                    <Text 
                      className={`text-sm font-medium ${
                        isActive ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                      style={{ fontFamily: 'Inter' }}
                    >
                      {stepNumber}
                    </Text>
                  )}
                </View>
                <Text 
                  className={`text-xs mt-1 ${
                    isActive ? 'text-orange-600 dark:text-orange-400' : 
                    isCompleted ? 'text-green-600 dark:text-green-400' :
                    'text-neutral-500 dark:text-neutral-400'
                  }`}
                  style={{ fontFamily: 'Inter' }}
                >
                  {stepNumber === 1 ? 'Info Dasar' : 'Media'}
                </Text>
              </View>
              {stepNumber < totalSteps && (
                <View 
                  className={`flex-1 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'
                  }`} 
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
});

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
      // Only populate code field, leave others empty for fresh edit
      setForm({
        code: outlet.code || '',
        location: '',
        owner_name: '',
        owner_phone: '',
        photo_shop_sign: '',
        photo_front: '',
        photo_left: '',
        photo_right: '',
        video: '',
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
      videoMaxDuration: 6, // Reduced from 8 to 6 seconds
      quality: 0.1, // Ultra low quality for faster upload
    });
    if (!result.canceled && result.assets[0]) {
      let uri = result.assets[0].uri;
      
      try {
        const originalInfo = await FileSystem.getInfoAsync(uri);
        console.log('Original video info:', originalInfo);
        
        if (!originalInfo.exists || !('size' in originalInfo) || !originalInfo.size || originalInfo.size === 0) {
          Alert.alert('Video tidak valid', 'Video yang direkam tidak valid. Silakan coba lagi.');
          return;
        }
        
        if (originalInfo.size > 8 * 1024 * 1024) {
          Alert.alert('Video terlalu besar', 'Video yang direkam terlalu besar. Silakan rekam video yang lebih pendek.');
          return;
        }

        const compressedUri = await compress(uri, {
          compressionMethod: 'manual',
          preset: 'H264_480x360', // Even smaller resolution for faster upload
          quality: 'low',
        });
        
        // Check if compression actually happened (native build) or returned original (Expo Go)
        const isCompressed = compressedUri !== uri;
        const finalUri = compressedUri;
        
        const info = await FileSystem.getInfoAsync(finalUri);
        console.log(`${isCompressed ? 'Compressed' : 'Original'} video info:`, info);
        
        if (!info.exists) {
          Alert.alert('File video tidak ditemukan', 'File video tidak dapat diakses. Silakan coba lagi.');
          return;
        }
        
        // Check if size exists and is greater than 0
        if (!('size' in info) || !info.size || info.size === 0) {
          Alert.alert('File video kosong', 'Video tidak valid atau kosong. Silakan rekam ulang.');
          return;
        }
        
        // Additional validation: minimum size should be at least 1KB
        if (info.size < 1024) {
          Alert.alert('Video terlalu kecil', 'Video yang direkam terlalu kecil atau corrupted. Silakan rekam ulang.');
          return;
        }
        
        // Different size limits for compressed vs original - more strict for faster upload
        const maxSize = isCompressed ? 3 * 1024 * 1024 : 5 * 1024 * 1024; // 3MB for compressed, 5MB for original
        if (info.size > maxSize) {
          const sizeText = isCompressed ? '3MB' : '5MB';
          Alert.alert('Video terlalu besar', `Ukuran video maksimal ${sizeText}. Silakan rekam video yang lebih pendek.`);
          return;
        }
        
        console.log(`Video ${isCompressed ? 'compressed' : 'ready'} successfully: ${info.size} bytes`);
        
        // Show info for Expo Go users
        if (Constants.appOwnership === 'expo' && !isCompressed) {
          Alert.alert(
            'Info Expo Go', 
            'Video compression tidak tersedia di Expo Go. Video akan dikirim dalam format asli.', 
            [{ text: 'OK' }]
          );
        }
        
        onSuccess(finalUri);
      } catch (e) {
        console.error('Video processing error:', e);
        Alert.alert('Gagal proses video', 'Terjadi kesalahan saat memproses video. Silakan coba lagi.');
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
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <Header title="Edit Outlet" colors={colors} onBack={onGoBack} />
      <View className="flex-1 justify-center items-center px-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-base" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
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
  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <Header title="Edit Outlet" colors={colors} onBack={onGoBack} />
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-16 h-16 rounded-full items-center justify-center mb-4 bg-red-100 dark:bg-red-900/30">
          <IconSymbol name="exclamationmark.triangle" size={32} color="#dc2626" />
        </View>
        <Text className="text-lg font-semibold text-center mb-2 text-neutral-900 dark:text-neutral-100" style={{ fontFamily: 'Inter_600SemiBold' }}>
          Gagal Memuat Data
        </Text>
        <Text className="text-sm text-center mb-6 text-neutral-600 dark:text-neutral-400" style={{ fontFamily: 'Inter_400Regular' }}>
          {error}
        </Text>
        <Button title="Kembali" variant="primary" size="lg" onPress={onGoBack} />
      </View>
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
  const buttonText = useMemo(() => 
    hasMedia ? `Ubah ${mediaType === 'image' ? 'Foto' : 'Video'}` : `Ambil ${mediaType === 'image' ? 'Foto' : 'Video'}`,
    [hasMedia, mediaType]
  );

  const labelText = useMemo(() => 
    mediaType === 'video' ? mediaUri.split('/').pop()?.substring(0, 30) + '...' : undefined,
    [mediaType, mediaUri]
  );

  return (
    <View className="mb-6">
      <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200" style={{ fontFamily: 'Inter' }}>
        {label}
      </Text>
      <TouchableOpacity
        className="flex-row items-center rounded-md border h-12 bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
        onPress={onTake}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${hasMedia ? 'Ubah' : 'Ambil'} ${mediaType === 'image' ? 'foto' : 'video'}`}
      >
        <View className="flex-1 px-4 justify-center">
          <Text className="text-base text-neutral-600 dark:text-neutral-400" style={{ fontFamily: 'Inter' }}>
            {buttonText}
          </Text>
        </View>
        <View className="px-4 justify-center">
          <IconSymbol name="camera.fill" size={16} color="#6b7280" />
        </View>
      </TouchableOpacity>
      {hasMedia && (
        <View className="mt-3">
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

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

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

  // Step navigation
  const handleNextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Validation for each step
  const isStep1Valid = useMemo(() => {
    return form.owner_name.trim() !== '' && form.owner_phone.trim() !== '' && form.location.trim() !== '';
  }, [form.owner_name, form.owner_phone, form.location]);

  const isStep2Valid = useMemo(() => {
    // All media fields are required - no empty fields allowed
    return form.photo_shop_sign !== '' && 
           form.photo_front !== '' && 
           form.photo_left !== '' && 
           form.photo_right !== '' && 
           form.video !== '';
  }, [form.photo_shop_sign, form.photo_front, form.photo_left, form.photo_right, form.video]);

  const isAllValid = useMemo(() => {
    return isStep1Valid && isStep2Valid && form.location.trim() !== '';
  }, [isStep1Valid, isStep2Valid, form.location]);

  const prepareFormData = useCallback(async () => {
    console.log('=== PREPARE FORM DATA START ===');
    
    // Validate required basic fields
    if (!form.location || !form.location.trim()) {
      Alert.alert('Error', 'Lokasi wajib diisi. Tekan tombol lokasi untuk mengambil koordinat.');
      return null;
    }
    
    if (!form.owner_name || !form.owner_name.trim()) {
      Alert.alert('Error', 'Nama pemilik wajib diisi.');
      return null;
    }
    
    if (!form.owner_phone || !form.owner_phone.trim()) {
      Alert.alert('Error', 'Nomor HP pemilik wajib diisi.');
      return null;
    }
    
    const formData = new FormData();
    
    // Add basic fields first
    formData.append('code', form.code);
    formData.append('location', form.location.trim());
    formData.append('owner_name', form.owner_name.trim());
    formData.append('owner_phone', form.owner_phone.trim());
    
    console.log('Basic fields added:', {
      code: form.code,
      location: form.location.trim(),
      owner_name: form.owner_name.trim(),
      owner_phone: form.owner_phone.trim()
    });

    const processImage = async (uri: string, fieldName: string) => {
      if (!uri) return;
      console.log(`Processing image ${fieldName}:`, uri);
      
      let processedUri = uri;
      const name = uri.split('/').pop() || `${fieldName}.jpg`;
      let type = 'image/jpeg';
      if (name.endsWith('.png')) type = 'image/png';

      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.5, format: name.endsWith('.png') ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG }
        );
        processedUri = manipulated.uri;
        
        const info = await FileSystem.getInfoAsync(processedUri);
        console.log(`Image ${fieldName} processed:`, {
          originalUri: uri,
          processedUri,
          name,
          type,
          size: info.exists && 'size' in info ? info.size : 'unknown'
        });
      } catch (e) {
        console.log('Image compression failed, using original:', e);
        // Use original if compression fails
      }
      
      // Create file object with proper structure
      const fileObj = {
        uri: processedUri,
        name,
        type
      };
      
      formData.append(fieldName, fileObj as any);
      console.log(`Image ${fieldName} added to FormData`);
    };

    // Only process images that exist
    if (form.photo_shop_sign) await processImage(form.photo_shop_sign, 'photo_shop_sign');
    if (form.photo_front) await processImage(form.photo_front, 'photo_front');
    if (form.photo_left) await processImage(form.photo_left, 'photo_left');
    if (form.photo_right) await processImage(form.photo_right, 'photo_right');

    if (form.video) {
      console.log('Processing video:', form.video);
      const uri = form.video;
      // Force MP4 extension - works for both compressed (native) and original (Expo Go) videos
      const originalName = uri.split('/').pop() || 'video';
      const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, ''); // Remove original extension
      const name = `${nameWithoutExtension}.mp4`; // Force .mp4 extension
      
      console.log(`Original filename: ${originalName}, Forced MP4: ${name}`);
      
      // Set MIME type as MP4 (server will accept this regardless of original format)
      let type = 'video/mp4';
      
      try {
        const info = await FileSystem.getInfoAsync(uri);
        console.log('Video file info:', info);
        
        if (!info.exists) {
          Alert.alert('File video tidak ditemukan', 'File video tidak dapat diakses. Silakan rekam ulang.');
          return null;
        }
        
        // Check if size exists and is greater than 0
        if (!('size' in info) || !info.size || info.size === 0) {
          Alert.alert('File video kosong', 'File video tidak valid atau kosong. Silakan rekam ulang.');
          return null;
        }
        
        // Additional validation: minimum size should be at least 1KB
        if (info.size < 1024) {
          Alert.alert('Video terlalu kecil', 'Video yang direkam terlalu kecil atau corrupted. Silakan rekam ulang.');
          return null;
        }
        
        // Allow reasonable size for faster upload
        const maxSize = 5 * 1024 * 1024; // 5MB for faster upload
        if (info.size > maxSize) {
          Alert.alert('Video terlalu besar', 'Ukuran video maksimal 5MB. Silakan rekam video yang lebih pendek.');
          return null;
        }
        
        console.log(`Video file valid: ${name}, size: ${info.size} bytes, type: ${type}`);
        
        // Create file object with proper structure  
        const videoObj = {
          uri,
          name,
          type
        };
        
        formData.append('video', videoObj as any);
        console.log('Video added to FormData');
      } catch (e) {
        console.error('Error checking video file:', e);
        Alert.alert('Error', 'Tidak dapat memvalidasi file video. Silakan coba lagi.');
        return null;
      }
    }

    console.log('=== FORM DATA PREPARED SUCCESSFULLY ===');
    return formData;
  }, [form]);

  const handleUpdate = useCallback(async () => {
    console.log('=== UPDATE OUTLET START ===');
    console.log('Outlet:', outlet);
    console.log('Form data:', form);
    console.log('Is valid:', isAllValid);
    
    if (!outlet) {
      Alert.alert('Error', 'Data outlet tidak ditemukan');
      return;
    }

    if (!isAllValid) {
      let missingFields = [];
      if (!form.owner_name.trim()) missingFields.push('Nama Pemilik');
      if (!form.owner_phone.trim()) missingFields.push('Nomor HP Pemilik');
      if (!form.location.trim()) missingFields.push('Lokasi');
      if (!form.photo_shop_sign) missingFields.push('Photo Shop Sign');
      if (!form.photo_front) missingFields.push('Photo Depan');
      if (!form.photo_left) missingFields.push('Photo Kiri');
      if (!form.photo_right) missingFields.push('Photo Kanan');
      if (!form.video) missingFields.push('Video');
      
      Alert.alert('Data Tidak Lengkap', `Harap lengkapi: ${missingFields.join(', ')}`);
      return;
    }

    try {
      const hasFile = !!(form.photo_shop_sign || form.photo_front || form.photo_left || form.photo_right || form.video);
      
      console.log('Has file:', hasFile);
      
      if (hasFile) {
        console.log('Preparing form data with files...');
        const formData = await prepareFormData();
        if (!formData) return;

        console.log('Sending formData to API...');
        log('[OUTLET][UPDATE][FORMDATA]', 'FormData with files');
        const result = await updateOutletWithFile(outlet.id.toString(), formData);
        log('[OUTLET][UPDATE][RESULT]', result);
        
        if (result.success) {
          Alert.alert('Sukses', 'Outlet berhasil diperbarui!', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } else {
          log('[OUTLET][UPDATE][ERROR]', result.error);
          // Handle specific error types
          if (result.error && result.error.includes('Request timeout')) {
            Alert.alert(
              'Upload Timeout', 
              'Upload video membutuhkan waktu terlalu lama. Coba:\n\n1. Pastikan koneksi internet stabil\n2. Rekam video lebih pendek (< 5 detik)\n3. Gunakan Wi-Fi jika memungkinkan', 
              [{ text: 'OK' }]
            );
          } else if (result.error && result.error.includes('validation.uploaded') && result.error.includes('video')) {
            Alert.alert('Error Video', 'File video tidak valid atau gagal di-upload. Silakan rekam ulang video.');
          } else if (result.error && result.error.includes('Network request failed')) {
            Alert.alert('Koneksi Bermasalah', 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
          } else {
            Alert.alert('Error', result.error || 'Gagal memperbarui outlet');
          }
        }
      } else {
        console.log('Sending regular payload...');
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
        
        console.log('Payload:', payload);
        log('[OUTLET][UPDATE][PAYLOAD]', payload);
        const result = await updateOutlet(outlet.id.toString(), payload);
        log('[OUTLET][UPDATE][RESULT]', result);
        
        if (result.success) {
          Alert.alert('Sukses', 'Outlet berhasil diperbarui!', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } else {
          log('[OUTLET][UPDATE][ERROR]', result.error);
          Alert.alert('Error', result.error || 'Gagal memperbarui outlet');
        }
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat memperbarui outlet');
    }
  }, [outlet, isAllValid, form, prepareFormData, updateOutletWithFile, updateOutlet, router]);

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
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <Header title="Edit Outlet" colors={colors} onBack={handleGoBack} />
      
      {/* Stepper Indicator */}
      <StepIndicator currentStep={currentStep} totalSteps={totalSteps} colors={colors} />
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-4 pt-2">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <View className="space-y-6 mb-8 w-full gap-5">
              <View className="mb-4">
                <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4" style={{ fontFamily: 'Inter' }}>
                  Informasi Dasar Outlet
                </Text>
              </View>
              
              <Input
                label="Kode Outlet"
                placeholder="Kode outlet"
                value={form.code}
                editable={false}
                size="lg"
                style={{
                  backgroundColor: colors.backgroundAlt,
                  color: colors.textSecondary
                }}
                maxLength={100}
              />
              
              <Input
                label="Nama Pemilik"
                placeholder="Nama pemilik outlet"
                value={form.owner_name}
                onChangeText={(value) => handleChange('owner_name', value)}
                error={formErrors.owner_name}
                size="lg"
                textContentType="name"
                autoComplete="name"
                maxLength={100}
              />
              
              <Input
                label="Nomor HP Pemilik"
                placeholder="08xxxxxxxxxx"
                value={form.owner_phone}
                onChangeText={(value) => handleChange('owner_phone', value)}
                error={formErrors.owner_phone}
                size="lg"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={100}
              />
              
              {/* Location Field */}
              <View className="mb-6">
                <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200" style={{ fontFamily: 'Inter' }}>
                  Lokasi (Koordinat)
                </Text>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Input
                      placeholder="Koordinat akan terisi otomatis"
                      value={form.location}
                      onChangeText={(value) => handleChange('location', value)}
                      error={!form.location.trim() ? 'Lokasi wajib diisi' : undefined}
                      size="lg"
                      editable={false}
                      style={{
                        backgroundColor: colors.backgroundAlt,
                        color: colors.textSecondary
                      }}
                    />
                  </View>
                  <TouchableOpacity
                    className="w-12 h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 items-center justify-center bg-white dark:bg-neutral-800"
                    onPress={async () => {
                      const location = await getCurrentLocation();
                      if (location) {
                        handleChange('location', location);
                        Alert.alert('Sukses', 'Lokasi berhasil diperbarui!');
                      } else {
                        Alert.alert('Gagal', 'Tidak dapat mengambil lokasi. Pastikan GPS aktif dan izin lokasi diberikan.');
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Perbarui lokasi"
                  >
                    <IconSymbol name="location" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {!form.location.trim() && (
                  <Text className="mt-1 text-xs text-red-500" style={{ fontFamily: 'Inter' }}>
                    Tekan tombol lokasi untuk mengambil koordinat
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Step 2: Media */}
          {currentStep === 2 && (
            <View className="space-y-6 mb-8 w-full gap-5">
              <View className="mb-4">
                <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4" style={{ fontFamily: 'Inter' }}>
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
              
              <MediaField
                label="Video"
                hasMedia={!!form.video}
                mediaUri={form.video}
                mediaType="video"
                onTake={handleVideoTake}
                onRemove={() => handleMediaRemove('video')}
                colors={colors}
              />
              
              {/* Video Upload Tips */}
              <View className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Text className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1" style={{ fontFamily: 'Inter' }}>
                  💡 Tips Video:
                </Text>
                <Text className="text-xs text-blue-700 dark:text-blue-300" style={{ fontFamily: 'Inter' }}>
                  • Rekam maksimal 5 detik untuk upload cepat{'\n'}
                  • Gunakan Wi-Fi jika memungkinkan{'\n'}
                  • Pastikan pencahayaan cukup
                </Text>
              </View>
            </View>
          )}
          
          {/* Navigation Buttons */}
          <View className="flex-row gap-3 mb-4">
            {currentStep > 1 && (
              <View className="flex-1">
                <Button
                  title="Sebelumnya"
                  variant="secondary"
                  size="lg"
                  fullWidth={true}
                  onPress={handlePrevStep}
                />
              </View>
            )}
            
            {currentStep < totalSteps ? (
              <View className="flex-1">
                <Button
                  title="Selanjutnya"
                  variant="primary"
                  size="lg"
                  fullWidth={true}
                  onPress={handleNextStep}
                  disabled={!isStep1Valid}
                />
              </View>
            ) : (
              <View className="flex-1">
                <Button
                  title={loading ? 'Uploading... (Mohon Tunggu)' : 'Update Outlet'}
                  variant="primary"
                  size="lg"
                  fullWidth={true}
                  loading={loading}
                  onPress={handleUpdate}
                  disabled={!isAllValid || loading}
                />
                {loading && (
                  <Text className="text-xs text-center mt-2 text-neutral-500 dark:text-neutral-400" style={{ fontFamily: 'Inter' }}>
                    🚀 Video sedang di-upload. Proses ini membutuhkan waktu...
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}); 