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
  loading,
  onEdit,
  onSave,
  onCancel
}: { 
  onBack: () => void; 
  colors: any;
  editing: boolean;
  loading: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  
  const headerStyle = useMemo(() => ({ 
    paddingTop: insets.top + 12, 
    backgroundColor: colors.primary 
  }), [insets.top, colors.primary]);

  const editButtonStyle = useMemo(() => ({ 
    backgroundColor: loading ? 'rgba(255,255,255,0.3)' : '#fff',
    opacity: loading ? 0.7 : 1
  }), [loading]);

  const editButtonTextStyle = useMemo(() => ({ 
    fontFamily: 'Inter_500Medium', 
    color: loading ? '#fff' : colors.primary 
  }), [loading, colors.primary]);
  
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
        
        {/* Header Actions */}
        <View className="flex-row items-center gap-2">
          {editing ? (
            <>
              <TouchableOpacity
                onPress={onCancel}
                className="px-3 py-1.5 rounded-lg border border-white/30"
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Batal edit"
              >
                <Text style={{ fontFamily: 'Inter_500Medium', color: '#fff' }} className="text-sm">
                  Batal
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={onSave}
                className="px-3 py-1.5 rounded-lg"
                style={editButtonStyle}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Simpan perubahan"
              >
                <Text style={editButtonTextStyle} className="text-sm">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={onEdit}
              className="px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: '#fff' }}
              accessibilityRole="button"
              accessibilityLabel="Edit informasi"
            >
              <Text style={{ fontFamily: 'Inter_500Medium', color: colors.primary }} className="text-sm">
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
      <Header onBack={onBack} colors={colors} editing={false} loading={false} onEdit={() => {}} onSave={() => {}} onCancel={() => {}} />
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
        quality: 0.5, // Reduced quality for performance
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
        quality: 0.5, // Reduced quality for performance
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoChange(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memilih foto dari galeri.');
    }
  }, [onPhotoChange]);

  const borderStyle = useMemo(() => ({ borderColor: colors.primary }), [colors.primary]);
  const cameraButtonStyle = useMemo(() => ({ backgroundColor: colors.primary }), [colors.primary]);

  return (
    <View className="items-center mb-6">
      <TouchableOpacity
        onPress={handlePhotoPress}
        disabled={!editing}
        className="relative"
        accessibilityRole="button"
        accessibilityLabel={editing ? "Ubah foto profil" : "Foto profil"}
      >
        <View 
          className="w-28 h-28 rounded-full border-4 overflow-hidden shadow-lg"
          style={borderStyle}
        >
          <Image 
            source={{ uri: photoUri || defaultImage }} 
            className="w-full h-full"
            style={{ backgroundColor: colors.backgroundAlt }}
          />
        </View>
        
        {editing && (
          <View 
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-3 border-white items-center justify-center shadow-lg"
            style={cameraButtonStyle}
          >
            <IconSymbol name="camera.fill" size={18} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {editing && (
        <Text 
          style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }} 
          className="text-sm mt-3 text-center"
        >
          Ketuk untuk mengubah foto
        </Text>
      )}
    </View>
  );
});

const PersonalInfoCard = memo(function PersonalInfoCard({ 
  formData, 
  editing, 
  colors, 
  updateField 
}: {
  formData: PersonalInfoForm;
  editing: boolean;
  colors: any;
  updateField: (field: keyof PersonalInfoForm, value: string) => void;
}) {
  const cardStyle = useMemo(() => ({ 
    backgroundColor: colors.card,
    borderColor: colors.border,
    minHeight: 48 
  }), [colors.card, colors.border]);

  const iconBackgroundStyle = useMemo(() => ({ 
    backgroundColor: colors.primary + '20' 
  }), [colors.primary]);

  const getInputStyle = useCallback((editable: boolean) => ({ 
    backgroundColor: editable ? 'transparent' : colors.backgroundAlt,
    color: editable ? colors.text : colors.textSecondary
  }), [colors.backgroundAlt, colors.text, colors.textSecondary]);

  return (
    <TouchableOpacity 
      className="rounded-lg border p-4 mb-4 shadow-sm"
      style={cardStyle}
      activeOpacity={1}
    >
      <View className="flex-row items-center mb-4">
        <View className="w-9 h-9 rounded-lg items-center justify-center mr-3" style={iconBackgroundStyle}>
          <IconSymbol name="person.fill" size={18} color={colors.primary} />
        </View>
        <Text className="text-lg font-semibold" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
          Data Personal
        </Text>
      </View>
      
      <View className="gap-4">
        <Input
          label="Nama Lengkap"
          value={formData.name}
          onChangeText={(value) => updateField('name', value)}
          placeholder="Masukkan nama lengkap"
          editable={editing}
          style={getInputStyle(editing)}
          maxLength={50}
        />

        <Input
          label="No. HP"
          value={formData.phone}
          onChangeText={(value) => updateField('phone', value)}
          placeholder="Masukkan nomor HP"
          keyboardType="phone-pad"
          editable={editing}
          style={getInputStyle(editing)}
          maxLength={15}
        />

        <Input
          label="Email"
          value={formData.email}
          onChangeText={(value) => updateField('email', value)}
          placeholder="Masukkan email"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={editing}
          style={getInputStyle(editing)}
          maxLength={50}
        />
      </View>
    </TouchableOpacity>
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

  if (loading && !editing) {
    return <LoadingScreen colors={colors} onBack={handleBack} />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header 
        onBack={handleBack} 
        colors={colors} 
        editing={editing} 
        loading={loading} 
        onEdit={handleEdit} 
        onSave={handleSave} 
        onCancel={handleCancel} 
      />
      
      <ScrollView 
        className="flex-1 px-4"
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-4 pb-8">
          {/* Profile Photo */}
          <ProfilePhoto
            photoUri={formData.photo}
            editing={editing}
            onPhotoChange={(uri) => updateField('photo', uri)}
            colors={colors}
          />

          {/* Personal Information Card */}
          <PersonalInfoCard
            formData={formData}
            editing={editing}
            colors={colors}
            updateField={updateField}
          />
        </View>
      </ScrollView>
    </View>
  );
}); 