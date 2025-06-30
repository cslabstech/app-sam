import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { useThemeStyles } from '@/hooks/utils/useThemeStyles';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ValidationErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const Header = React.memo(function Header({ 
  onBack, 
  colors 
}: { 
  onBack: () => void; 
  colors: any;
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
            Ubah Password
          </Text>
        </View>
        <View className="w-6 h-6" />
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
      <Header onBack={onBack} colors={colors} />
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text 
          className="text-base mt-4 text-gray-600 dark:text-gray-400"
          style={{ fontFamily: 'Inter' }}
        >
          Memperbarui password...
        </Text>
      </View>
    </View>
  );
});

const SecurityTips = React.memo(function SecurityTips({ colors }: { colors: any }) {
  return (
    <Card className="p-4 mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <View className="flex-row items-start mb-3">
        <IconSymbol name="shield.fill" size={20} color={colors.primary} />
        <Text className="text-base font-bold ml-2 text-gray-900 dark:text-white" style={{ fontFamily: 'Inter' }}>
          Tips Keamanan Password
        </Text>
      </View>
      
      <View className="gap-2">
        <View className="flex-row items-start">
          <Text style={{ fontFamily: 'Inter', color: colors.primary }} className="text-sm mr-2">•</Text>
          <Text className="text-sm flex-1 text-gray-600 dark:text-gray-400" style={{ fontFamily: 'Inter' }}>
            Minimal 8 karakter
          </Text>
        </View>
        <View className="flex-row items-start">
          <Text style={{ fontFamily: 'Inter', color: colors.primary }} className="text-sm mr-2">•</Text>
          <Text className="text-sm flex-1 text-gray-600 dark:text-gray-400" style={{ fontFamily: 'Inter' }}>
            Kombinasi huruf besar, kecil, angka, dan simbol
          </Text>
        </View>
        <View className="flex-row items-start">
          <Text style={{ fontFamily: 'Inter', color: colors.primary }} className="text-sm mr-2">•</Text>
          <Text className="text-sm flex-1 text-gray-600 dark:text-gray-400" style={{ fontFamily: 'Inter' }}>
            Hindari informasi pribadi seperti nama atau tanggal lahir
          </Text>
        </View>
      </View>
    </Card>
  );
});

export default function ChangePasswordScreen() {
  const { colors } = useThemeStyles();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const updateField = useCallback((field: keyof PasswordForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Password saat ini wajib diisi';
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'Password baru wajib diisi';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password minimal 8 karakter';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'Password baru harus berbeda dengan password saat ini';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Konfirmasi password wajib diisi';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Konfirmasi password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Implement API call to change password
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      Alert.alert('Sukses', 'Password berhasil diubah!', [
        { 
          text: 'OK', 
          onPress: () => {
            // Reset form
            setFormData({
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            });
            router.back();
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Gagal', 'Terjadi kesalahan saat mengubah password. Pastikan password saat ini benar.');
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, router]);

  if (loading) {
    return <LoadingScreen colors={colors} onBack={handleBack} />;
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <Header onBack={handleBack} colors={colors} />
      
      <ScrollView className="flex-1 px-4">
        <View className="pt-4 pb-8">
          {/* Change Password Form Card */}
          <Card className="p-4 mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Text className="text-base font-bold mb-4 text-gray-900 dark:text-white" style={{ fontFamily: 'Inter' }}>
              Ubah Password
            </Text>
            
            <View className="gap-4">
              <Input
                label="Password Saat Ini"
                value={formData.currentPassword}
                onChangeText={(value) => updateField('currentPassword', value)}
                placeholder="Masukkan password saat ini"
                secureTextEntry={!showCurrentPassword}
                error={errors.currentPassword}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                rightIcon={
                  <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    <IconSymbol 
                      name={showCurrentPassword ? "eye.slash" : "eye"} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                }
              />

              <Input
                label="Password Baru"
                value={formData.newPassword}
                onChangeText={(value) => updateField('newPassword', value)}
                placeholder="Masukkan password baru"
                secureTextEntry={!showNewPassword}
                error={errors.newPassword}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                rightIcon={
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <IconSymbol 
                      name={showNewPassword ? "eye.slash" : "eye"} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                }
              />

              <Input
                label="Konfirmasi Password Baru"
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                placeholder="Konfirmasi password baru"
                secureTextEntry={!showConfirmPassword}
                error={errors.confirmPassword}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                rightIcon={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <IconSymbol 
                      name={showConfirmPassword ? "eye.slash" : "eye"} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                }
              />
            </View>
          </Card>

          {/* Security Tips */}
          <SecurityTips colors={colors} />

          {/* Submit Button */}
          <Button
            title="Ubah Password"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSubmit}
            disabled={!formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
          />
        </View>
      </ScrollView>
    </View>
  );
} 