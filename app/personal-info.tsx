import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/auth-context';
import { useThemeStyles } from '@/hooks/utils/useThemeStyles';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PersonalInfoForm {
  name: string;
  username: string;
  phone: string;
  email: string;
  photo: string;
}

const Header = React.memo(function Header({ 
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
  
  return (
    <View className="bg-primary-500 px-4 pb-4" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row justify-between items-center">
        <TouchableOpacity onPress={onBack}>
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text 
            className="text-white text-2xl font-bold"
            style={{ fontFamily: 'Inter' }}
          >
            Informasi Personal
          </Text>
        </View>
        
        {/* Header Actions */}
        <View className="flex-row items-center gap-2">
          {editing ? (
            <>
              <TouchableOpacity
                onPress={onCancel}
                className="px-3 py-1 rounded-md border border-white/30"
                disabled={loading}
              >
                <Text style={{ fontFamily: 'Inter', color: '#fff' }} className="text-sm font-medium">
                  Batal
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={onSave}
                className="px-3 py-1 rounded-md"
                style={{ 
                  backgroundColor: loading ? 'rgba(255,255,255,0.3)' : '#fff',
                  opacity: loading ? 0.7 : 1
                }}
                disabled={loading}
              >
                <Text 
                  style={{ 
                    fontFamily: 'Inter', 
                    color: loading ? '#fff' : colors.primary 
                  }} 
                  className="text-sm font-medium"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={onEdit}
              className="px-3 py-1 rounded-md"
              style={{ backgroundColor: '#fff' }}
            >
              <Text style={{ fontFamily: 'Inter', color: colors.primary }} className="text-sm font-medium">
                Edit
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

const LoadingScreen = React.memo(function LoadingScreen({ 
  colors, 
  onBack 
}: { 
  colors: any; 
  onBack: () => void;
}) {
  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <Header onBack={onBack} colors={colors} editing={false} loading={false} onEdit={() => {}} onSave={() => {}} onCancel={() => {}} />
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text 
          className="text-base mt-4 text-gray-600 dark:text-gray-400"
          style={{ fontFamily: 'Inter' }}
        >
          Memuat informasi personal...
        </Text>
      </View>
    </View>
  );
});

const ProfilePhoto = React.memo(function ProfilePhoto({
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
  const defaultImage = 'https://i.pravatar.cc/300';

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
        quality: 0.8,
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
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoChange(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memilih foto dari galeri.');
    }
  }, [onPhotoChange]);

  return (
    <View className="items-center mb-6">
      <TouchableOpacity
        onPress={handlePhotoPress}
        disabled={!editing}
        className="relative"
      >
        <View 
          className="w-24 h-24 rounded-full border-4 overflow-hidden"
          style={{ borderColor: colors.primary }}
        >
          <Image 
            source={{ uri: photoUri || defaultImage }} 
            className="w-full h-full"
            style={{ backgroundColor: colors.background }}
          />
        </View>
        
        {editing && (
          <View 
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 border-white items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <IconSymbol name="camera.fill" size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {editing && (
        <Text 
          style={{ fontFamily: 'Inter', color: colors.textSecondary }} 
          className="text-xs mt-2 text-center"
        >
          Ketuk untuk mengubah foto
        </Text>
      )}
    </View>
  );
});

export default function PersonalInfoScreen() {
  const { colors } = useThemeStyles();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [formData, setFormData] = useState<PersonalInfoForm>({
    name: user?.nama_lengkap || user?.name || '',
    username: user?.username || '',
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
      name: user?.nama_lengkap || user?.name || '',
      username: user?.username || '',
      phone: user?.phone || '',
      email: user?.email || '',
      photo: user?.photo || '',
    });
  }, [user]);

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to update user info
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      Alert.alert('Sukses', 'Informasi personal berhasil diperbarui!', [
        { text: 'OK', onPress: () => setEditing(false) }
      ]);
    } catch (error) {
      Alert.alert('Gagal', 'Terjadi kesalahan saat memperbarui informasi personal.');
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const updateField = useCallback((field: keyof PersonalInfoForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  if (loading && !editing) {
    return <LoadingScreen colors={colors} onBack={handleBack} />;
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <Header onBack={handleBack} colors={colors} editing={editing} loading={loading} onEdit={handleEdit} onSave={handleSave} onCancel={handleCancel} />
      
      <ScrollView className="flex-1 px-4">
        <View className="pt-4 pb-8">
          {/* Profile Photo */}
          <ProfilePhoto
            photoUri={formData.photo}
            editing={editing}
            onPhotoChange={(uri) => updateField('photo', uri)}
            colors={colors}
          />

          {/* Personal Information Card */}
          <Card className="p-4 mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Inter' }}>
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
                style={{ 
                  backgroundColor: editing ? 'transparent' : colors.background + '80',
                  color: editing ? colors.text : colors.textSecondary
                }}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />

              <Input
                label="Username"
                value={formData.username}
                onChangeText={(value) => updateField('username', value)}
                placeholder="Masukkan username"
                autoCapitalize="none"
                editable={editing}
                style={{ 
                  backgroundColor: editing ? 'transparent' : colors.background + '80',
                  color: editing ? colors.text : colors.textSecondary
                }}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />

              <Input
                label="No. HP"
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                placeholder="Masukkan nomor HP"
                keyboardType="phone-pad"
                editable={editing}
                style={{ 
                  backgroundColor: editing ? 'transparent' : colors.background + '80',
                  color: editing ? colors.text : colors.textSecondary
                }}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />

              <Input
                label="Email"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                placeholder="Masukkan email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={editing}
                style={{ 
                  backgroundColor: editing ? 'transparent' : colors.background + '80',
                  color: editing ? colors.text : colors.textSecondary
                }}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </View>
          </Card>

          {/* Account Information Card */}
          <Card className="p-4 mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Text className="text-base font-bold mb-4 text-gray-900 dark:text-white" style={{ fontFamily: 'Inter' }}>
              Informasi Akun
            </Text>
            
            <View className="gap-4">
              <View>
                <Text className="text-sm font-medium mb-2 text-gray-900 dark:text-white" style={{ fontFamily: 'Inter' }}>
                  Role
                </Text>
                <Text 
                  className="text-base px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Inter' }}
                  numberOfLines={1}
                >
                  {typeof user?.role === 'string' ? user.role : user?.role?.name || 'User'}
                </Text>
              </View>

              <View>
                <Text className="text-sm font-medium mb-2 text-gray-900 dark:text-white" style={{ fontFamily: 'Inter' }}>
                  User ID
                </Text>
                <Text 
                  className="text-base px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  style={{ fontFamily: 'Inter' }}
                  numberOfLines={1}
                >
                  {user?.id || '-'}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
} 