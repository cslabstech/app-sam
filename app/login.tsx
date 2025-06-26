import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/context/network-context';
import { useLoginForm } from '@/hooks/data/useLoginForm';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Local components
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Memoized components for performance
const PageHeader = React.memo(function PageHeader() {
  return (
    <>
      <Text 
        className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2"
        style={{ fontFamily: 'Inter' }}
      >
        Login
      </Text>
      <Text 
        className="text-base text-slate-600 dark:text-slate-300 mb-8"
        style={{ fontFamily: 'Inter' }}
      >
        Masukkan username dan password untuk masuk
      </Text>
    </>
  );
});

const ErrorAlert = React.memo(function ErrorAlert({ error }: { error: string }) {
  return (
    <View 
      className="flex-row items-center bg-danger-50 dark:bg-danger-900 border border-danger-200 dark:border-danger-700 rounded-md p-4 mb-8" 
      accessible 
      accessibilityLabel={`Error: ${error}`} 
      accessibilityRole="alert"
    >
      <Ionicons name="alert-circle" size={18} color="#dc2626" />
      <Text 
        className="text-danger-700 dark:text-danger-300 text-sm flex-1 ml-2"
        style={{ fontFamily: 'Inter' }}
      >
        {error}
      </Text>
    </View>
  );
});

const PasswordToggleIcon = React.memo(function PasswordToggleIcon({ 
  showPassword, 
  onToggle 
}: { 
  showPassword: boolean; 
  onToggle: () => void; 
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
      accessibilityRole="button"
    >
      <Ionicons
        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color="#64748b"
      />
    </Pressable>
  );
});

const OrSeparator = React.memo(function OrSeparator() {
  return (
    <View className="flex-row items-center mb-4">
      <View className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
      <Text 
        className="text-sm text-slate-500 dark:text-slate-400 mx-4"
        style={{ fontFamily: 'Inter' }}
      >
        atau
      </Text>
      <View className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
    </View>
  );
});

const Footer = React.memo(function Footer() {
  return (
    <View className="items-center pb-8">
      <Text 
        className="text-xs text-slate-500 dark:text-slate-400 text-center"
        style={{ fontFamily: 'Inter' }}
      >
        Dengan melanjutkan, Anda menyetujui syarat dan ketentuan yang berlaku
      </Text>
    </View>
  );
});

export default function LoginScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    touched,
    formErrors,
    showPassword,
    setShowPassword,
    handleBlur,
    handleLogin,
    isFormValid,
    keyboardVisible,
  } = useLoginForm();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isConnected } = useNetwork();

  const handleWhatsAppLogin = () => {
    router.replace('/login-otp');
  };

  return (
    <SafeAreaView 
      className="flex-1 bg-neutral-50 dark:bg-neutral-900" 
      edges={isConnected ? ['top','left','right'] : ['left','right']}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1" 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            className={`flex-1 ${keyboardVisible ? 'pb-32' : 'pb-4'}`}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="px-4 mt-10 pb-8">
              <PageHeader />
              
              {error && <ErrorAlert error={error} />}
              
              <View className="space-y-6 mb-8 w-full gap-5">
                <Input
                  label="Username"
                  placeholder="Masukkan username"
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => handleBlur('email')}
                  error={touched.email && formErrors.email ? formErrors.email : undefined}
                  textContentType="username"
                  autoComplete="username"
                  accessibilityLabel="Input username"
                  accessibilityHint="Masukkan username Anda untuk login"
                />
                
                <Input
                  label="Kata Sandi"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => handleBlur('password')}
                  secureTextEntry={!showPassword}
                  error={touched.password && formErrors.password ? formErrors.password : undefined}
                  rightIcon={
                    <PasswordToggleIcon 
                      showPassword={showPassword} 
                      onToggle={() => setShowPassword((v) => !v)} 
                    />
                  }
                  textContentType="password"
                  autoComplete="password"
                  accessibilityLabel="Input kata sandi"
                  accessibilityHint="Masukkan kata sandi Anda untuk login"
                />
              </View>
              
              <View className="mb-4">
                <Button
                  title="Masuk"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  disabled={!isFormValid}
                  onPress={handleLogin}
                  fullWidth={true}
                  accessibilityLabel="Login manual"
                  accessibilityHint="Login menggunakan username dan password"
                />
              </View>
              
              <OrSeparator />
              
              <View className="mb-8">
                <Button
                  title="Login dengan WhatsApp"
                  variant="outline"
                  size="lg"
                  onPress={handleWhatsAppLogin}
                  fullWidth={true}
                  leftIcon={<Ionicons name="logo-whatsapp" size={20} color="#f97316" />}
                  accessibilityLabel="Login dengan WhatsApp"
                  accessibilityHint="Login menggunakan OTP WhatsApp"
                />
              </View>
              
              <Footer />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}