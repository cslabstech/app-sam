import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { useChangePassword } from '@/hooks/data/useChangePassword';
import { useThemeStyles } from '@/hooks/utils/useThemeStyles';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useMemo, useState } from 'react';
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

const Header = memo(function Header({ 
  onBack, 
  colors 
}: { 
  onBack: () => void; 
  colors: any;
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
            Ubah Password
          </Text>
        </View>
        <View className="w-8 h-8" />
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

const SecurityTips = memo(function SecurityTips({ colors }: { colors: any }) {
  const tips = useMemo(() => [
    'Minimal 8 karakter',
    'Kombinasi huruf besar, kecil, angka, dan simbol',
    'Hindari informasi pribadi seperti nama atau tanggal lahir',
    'Password baru harus berbeda dengan password saat ini'
  ], []);

  return (
    <View className="mb-6">
      <Text className="text-base font-medium mb-3" style={{ fontFamily: 'Inter_500Medium', color: colors.text }}>
        Tips Keamanan Password
      </Text>
      
      <View className="gap-2">
        {tips.map((tip, index) => (
          <View key={index} className="flex-row items-start">
            <View className="w-1.5 h-1.5 rounded-full mt-2 mr-3" style={{ backgroundColor: colors.primary }} />
            <Text className="text-sm flex-1" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
              {tip}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
});

export default memo(function ChangePasswordScreen() {
  const { colors } = useThemeStyles();
  const router = useRouter();
  const { loading, changePassword } = useChangePassword();
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
      newErrors.newPassword = 'Password baru minimal 8 karakter';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'Password baru harus berbeda dengan password saat ini';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Konfirmasi password baru wajib diisi';
    } else if (formData.confirmPassword.length < 8) {
      newErrors.confirmPassword = 'Konfirmasi password baru minimal 8 karakter';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Konfirmasi password baru tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      const result = await changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        new_password_confirmation: formData.confirmPassword,
      });

      if (result.success) {
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
      } else {
        Alert.alert('Gagal', result.error || 'Terjadi kesalahan saat mengubah password.');
      }
    } catch (error: any) {
      // Handle specific backend validation errors
      if (error.errors) {
        const errorMessages = Object.values(error.errors).flat().join('\n');
        Alert.alert('Gagal', errorMessages);
      } else {
        Alert.alert('Gagal', error.message || 'Terjadi kesalahan saat mengubah password. Pastikan password saat ini benar.');
      }
    }
  }, [formData, validateForm, changePassword, router]);

  const handleToggleCurrentPassword = useCallback(() => {
    setShowCurrentPassword(!showCurrentPassword);
  }, [showCurrentPassword]);

  const handleToggleNewPassword = useCallback(() => {
    setShowNewPassword(!showNewPassword);
  }, [showNewPassword]);

  const handleToggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword(!showConfirmPassword);
  }, [showConfirmPassword]);

  // Check if form is valid (all required fields filled)
  const isFormValid = useMemo(() => {
    return formData.currentPassword.trim() !== '' && 
           formData.newPassword.trim() !== '' && 
           formData.confirmPassword.trim() !== '';
  }, [formData.currentPassword, formData.newPassword, formData.confirmPassword]);

  if (loading) {
    return <LoadingScreen colors={colors} onBack={handleBack} />;
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <Header onBack={handleBack} colors={colors} />
      
      <ScrollView 
        className="flex-1"
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-4 pt-6">
          {/* Form Fields - Following login screen pattern */}
          <View className="space-y-6 mb-8 w-full gap-5">
            <Input
              label="Password Saat Ini"
              placeholder="Masukkan password saat ini"
              value={formData.currentPassword}
              onChangeText={(value) => updateField('currentPassword', value)}
              secureTextEntry={!showCurrentPassword}
              error={errors.currentPassword}
              size="lg"
              rightIcon={
                <TouchableOpacity onPress={handleToggleCurrentPassword}>
                  <IconSymbol 
                    name={showCurrentPassword ? "eye.slash" : "eye"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              }
              textContentType="password"
              autoComplete="current-password"
              maxLength={50}
            />

            <Input
              label="Password Baru"
              placeholder="Masukkan password baru"
              value={formData.newPassword}
              onChangeText={(value) => updateField('newPassword', value)}
              secureTextEntry={!showNewPassword}
              error={errors.newPassword}
              size="lg"
              rightIcon={
                <TouchableOpacity onPress={handleToggleNewPassword}>
                  <IconSymbol 
                    name={showNewPassword ? "eye.slash" : "eye"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              }
              textContentType="newPassword"
              autoComplete="new-password"
              maxLength={50}
            />

            <Input
              label="Konfirmasi Password Baru"
              placeholder="Konfirmasi password baru"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              error={errors.confirmPassword}
              size="lg"
              rightIcon={
                <TouchableOpacity onPress={handleToggleConfirmPassword}>
                  <IconSymbol 
                    name={showConfirmPassword ? "eye.slash" : "eye"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              }
              textContentType="newPassword"
              autoComplete="new-password"
              maxLength={50}
            />
          </View>

          {/* Security Tips - Simplified */}
          <SecurityTips colors={colors} />

          {/* Submit Button - Following login screen pattern */}
          <View className="mb-4">
            <Button
              title={loading ? "Memperbarui..." : "Ubah Password"}
              variant="primary"
              size="lg"
              fullWidth={true}
              onPress={handleSubmit}
              disabled={!isFormValid || loading}
              loading={loading}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}); 