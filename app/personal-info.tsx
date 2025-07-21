import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/hooks/data/useProfile';
import { useThemeStyles } from '@/hooks/utils/useThemeStyles';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PersonalInfoForm {
  name: string;
  phone: string;
  email: string;
  photo: string;
}

const Header = memo(function Header({ 
  onBack, 
  colors,
  editing,
  onEdit,
  onCancel
}: { 
  onBack: () => void; 
  colors: any;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
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
            Informasi Personal
          </Text>
        </View>
        
        {/* Header Actions - Removed Save button */}
        <View className="flex-row items-center">
          {editing ? (
            <TouchableOpacity
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Batal edit"
            >
              <Text style={{ fontFamily: 'Inter_500Medium', color: '#fff' }} className="text-base">
                Batal
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onEdit}
              accessibilityRole="button"
              accessibilityLabel="Edit informasi"
            >
              <Text style={{ fontFamily: 'Inter_500Medium', color: '#fff' }} className="text-base">
                Edit
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

const LoadingScreen = memo(function LoadingScreen({ 
  colors, 
  onBack 
}: { 
  colors: any; 
  onBack: () => void;
}) {
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header onBack={onBack} colors={colors} editing={false} onEdit={() => {}} onCancel={() => {}} />
      <View className="flex-1 justify-center items-center px-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-base" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
          Memuat informasi personal...
        </Text>
      </View>
    </View>
  );
});

const ProfilePhoto = memo(function ProfilePhoto({
  photoUri,
  editing,
  onPhotoChange,
  colors
}: {
  photoUri: string;
  editing: boolean;
  onPhotoChange: (uri: string) => void;
  colors: any;
}) {
  const defaultImage = useMemo(() => 'https://i.pravatar.cc/300', []);

  const handlePhotoPress = useCallback(async () => {
    if (!editing) return;

    Alert.alert(
      'Ubah Foto Profil',
      'Pilih sumber foto',
      [
        { text: 'Kamera', onPress: () => openCamera() },
        { text: 'Galeri', onPress: () => openGallery() },
        { text: 'Batal', style: 'cancel' }
      ]
    );
  }, [editing]);

  const openCamera = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Izin Kamera', 'Aplikasi membutuhkan izin kamera untuk mengambil foto.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoChange(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal mengambil foto dari kamera.');
    }
  }, [onPhotoChange]);

  const openGallery = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Izin Galeri', 'Aplikasi membutuhkan izin galeri untuk memilih foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoChange(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memilih foto dari galeri.');
    }
  }, [onPhotoChange]);

  return (
    <View className="items-center mb-8">
      <TouchableOpacity
        onPress={handlePhotoPress}
        disabled={!editing}
        className="relative"
        accessibilityRole="button"
        accessibilityLabel={editing ? "Ubah foto profil" : "Foto profil"}
      >
        <View className="w-24 h-24 rounded-full overflow-hidden">
          <Image 
            source={{ uri: photoUri || defaultImage }} 
            className="w-full h-full"
            style={{ backgroundColor: colors.backgroundAlt }}
          />
        </View>
        
        {editing && (
          <View 
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 border-white items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <IconSymbol name="camera.fill" size={14} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {editing && (
        <Text 
          style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }} 
          className="text-sm mt-2 text-center"
        >
          Ketuk untuk mengubah foto
        </Text>
      )}
    </View>
  );
});

export default memo(function PersonalInfoScreen() {
  const { colors } = useThemeStyles();
  const router = useRouter();
  const { user } = useAuth();
  const { loading, updateProfile, updatePhoto } = useProfile();
  const [editing, setEditing] = useState(false);
  
  const [formData, setFormData] = useState<PersonalInfoForm>({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    photo: user?.photo || '',
  });

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEdit = useCallback(() => {
    setEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    setEditing(false);
    // Reset form data to original values
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      photo: user?.photo || '',
    });
  }, [user]);

  const handleSave = useCallback(async () => {
    try {
      // Prepare payload for profile update
      const payload: any = {};
      if (formData.name !== user?.name) payload.name = formData.name;
      if (formData.email !== user?.email) payload.email = formData.email;
      if (formData.phone !== user?.phone) payload.phone = formData.phone;

      // Update profile if there are changes
      if (Object.keys(payload).length > 0) {
        const result = await updateProfile(payload);
        if (!result.success) {
          Alert.alert('Gagal', result.error || 'Terjadi kesalahan saat memperbarui informasi personal.');
          return;
        }
      }

      // Update photo if changed
      if (formData.photo !== user?.photo && formData.photo && !formData.photo.startsWith('http')) {
        const photoResult = await updatePhoto({ photo: formData.photo });
        if (!photoResult.success) {
          Alert.alert('Gagal', photoResult.error || 'Terjadi kesalahan saat memperbarui foto profil.');
          return;
        }
      }
      
      Alert.alert('Sukses', 'Informasi personal berhasil diperbarui!', [
        { text: 'OK', onPress: () => setEditing(false) }
      ]);
    } catch (error) {
      Alert.alert('Gagal', 'Terjadi kesalahan saat memperbarui informasi personal.');
    }
  }, [formData, user, updateProfile, updatePhoto]);

  const updateField = useCallback((field: keyof PersonalInfoForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Check if form is valid (all required fields filled)
  const isFormValid = useMemo(() => {
    return formData.name.trim() !== '' && 
           formData.phone.trim() !== '' && 
           formData.email.trim() !== '';
  }, [formData.name, formData.phone, formData.email]);

  if (loading && !editing) {
    return <LoadingScreen colors={colors} onBack={handleBack} />;
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <Header 
        onBack={handleBack} 
        colors={colors} 
        editing={editing} 
        onEdit={handleEdit} 
        onCancel={handleCancel} 
      />
      
      <ScrollView 
        className="flex-1"
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-4 pt-6">
          {/* Profile Photo */}
          <ProfilePhoto
            photoUri={formData.photo}
            editing={editing}
            onPhotoChange={(uri) => updateField('photo', uri)}
            colors={colors}
          />

          {/* Form Fields - Following login screen pattern */}
          <View className="space-y-6 mb-8 w-full gap-5">
            <Input
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              editable={editing}
              size="lg"
              textContentType="name"
              autoComplete="name"
              style={{
                backgroundColor: editing ? 'transparent' : colors.backgroundAlt,
                color: editing ? colors.text : colors.textSecondary
              }}
              maxLength={50}
            />

            <Input
              label="No. HP"
              placeholder="Masukkan nomor HP"
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              editable={editing}
              size="lg"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              style={{
                backgroundColor: editing ? 'transparent' : colors.backgroundAlt,
                color: editing ? colors.text : colors.textSecondary
              }}
              maxLength={15}
            />

            <Input
              label="Email"
              placeholder="Masukkan email"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              editable={editing}
              size="lg"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              autoCapitalize="none"
              style={{
                backgroundColor: editing ? 'transparent' : colors.backgroundAlt,
                color: editing ? colors.text : colors.textSecondary
              }}
              maxLength={50}
            />
          </View>

          {/* Save Button - Following login screen pattern */}
          {editing && (
            <View className="mb-4">
              <Button
                title={loading ? "Menyimpan..." : "Simpan Perubahan"}
                variant="primary"
                size="lg"
                fullWidth={true}
                onPress={handleSave}
                disabled={!isFormValid || loading}
                loading={loading}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}); 