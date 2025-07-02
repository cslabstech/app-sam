import { Button } from '@/components/ui/Button';
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
    <View className="px-4 pb-4" style={{ paddingTop: insets.top + 12, backgroundColor: colors.primary }}>
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
            Ubah Password
          </Text>
        </View>
        <View className="w-8 h-8" />
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header onBack={onBack} colors={colors} />
      <View className="flex-1 justify-center items-center px-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-base" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
          Memperbarui password...
        </Text>
      </View>
    </View>
  );
});

const SecurityTips = React.memo(function SecurityTips({ colors }: { colors: any }) {
  return (
    <TouchableOpacity 
      className="rounded-lg border p-4 mb-4 shadow-sm"
      style={{ 
        backgroundColor: colors.card,
        borderColor: colors.border,
        minHeight: 48 
      }}
      activeOpacity={1}
    >
      <View className="flex-row items-center mb-4">
        <View className="w-9 h-9 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '20' }}>
          <IconSymbol name="shield.fill" size={18} color={colors.primary} />
        </View>
        <Text className="text-lg font-semibold" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
          Tips Keamanan Password
        </Text>
      </View>
      
      <View className="gap-3">
        <View className="flex-row items-start">
          <View className="w-2 h-2 rounded-full mt-1.5 mr-3" style={{ backgroundColor: colors.primary }} />
          <Text className="text-sm flex-1" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
            Minimal 8 karakter
          </Text>
        </View>
        <View className="flex-row items-start">
          <View className="w-2 h-2 rounded-full mt-1.5 mr-3" style={{ backgroundColor: colors.primary }} />
          <Text className="text-sm flex-1" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
            Kombinasi huruf besar, kecil, angka, dan simbol
          </Text>
        </View>
        <View className="flex-row items-start">
          <View className="w-2 h-2 rounded-full mt-1.5 mr-3" style={{ backgroundColor: colors.primary }} />
          <Text className="text-sm flex-1" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
            Hindari informasi pribadi seperti nama atau tanggal lahir
          </Text>
        </View>
      </View>
    </TouchableOpacity>
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header onBack={handleBack} colors={colors} />
      
      <ScrollView className="flex-1 px-4">
        <View className="pt-4 pb-8">
          {/* Change Password Form Card */}
          <TouchableOpacity 
            className="rounded-lg border p-4 mb-4 shadow-sm"
            style={{ 
              backgroundColor: colors.card,
              borderColor: colors.border,
              minHeight: 48 
            }}
            activeOpacity={1}
          >
            <View className="flex-row items-center mb-4">
              <View className="w-9 h-9 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '20' }}>
                <IconSymbol name="lock.fill" size={18} color={colors.primary} />
              </View>
              <Text className="text-lg font-semibold" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
                Ubah Password
              </Text>
            </View>
            
            <View className="gap-4">
              <Input
                label="Password Saat Ini"
                value={formData.currentPassword}
                onChangeText={(value) => updateField('currentPassword', value)}
                placeholder="Masukkan password saat ini"
                secureTextEntry={!showCurrentPassword}
                error={errors.currentPassword}
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
          </TouchableOpacity>

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