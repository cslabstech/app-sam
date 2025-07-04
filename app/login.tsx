import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/context/network-context';
import { useLoginForm } from '@/hooks/form/useLoginForm';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useMemo } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Local components
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Memoized components for performance
const PageHeader = memo(function PageHeader() {
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

const ErrorAlert = memo(function ErrorAlert({ error }: { error: string }) {
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

const PasswordToggleIcon = memo(function PasswordToggleIcon({ 
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
      android_ripple={{ color: '#f3f4f6', radius: 20 }}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
          padding: 4,
        }
      ]}
    >
      <Ionicons
        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color="#64748b"
      />
    </Pressable>
  );
});

const OrSeparator = memo(function OrSeparator() {
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

const Footer = memo(function Footer() {
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

// Memoized form section untuk mengurangi re-renders
const LoginForm = memo(function LoginForm({
  email,
  password,
  setEmail,
  setPassword,
  showPassword,
  setShowPassword,
  touched,
  formErrors,
  handleBlur,
  handleLogin,
  loading,
  isFormValid,
  onWhatsAppLogin
}: {
  email: string;
  password: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  touched: { email: boolean; password: boolean };
  formErrors: { email: string; password: string };
  handleBlur: (field: 'email' | 'password') => void;
  handleLogin: () => void;
  loading: boolean;
  isFormValid: boolean;
  onWhatsAppLogin: () => void;
}) {
  // Memoize handlers untuk menghindari re-creation
  const handleEmailBlur = useCallback(() => handleBlur('email'), [handleBlur]);
  const handlePasswordBlur = useCallback(() => handleBlur('password'), [handleBlur]);
  const handlePasswordToggle = useCallback(() => setShowPassword(!showPassword), [showPassword, setShowPassword]);

  // Memoize error states
  const emailError = useMemo(() => 
    touched.email && formErrors.email ? formErrors.email : undefined,
    [touched.email, formErrors.email]
  );
  
  const passwordError = useMemo(() => 
    touched.password && formErrors.password ? formErrors.password : undefined,
    [touched.password, formErrors.password]
  );

  return (
    <>
      <View className="space-y-6 mb-8 w-full gap-5">
        <Input
          label="Username"
          placeholder="Masukkan username"
          value={email}
          onChangeText={setEmail}
          onBlur={handleEmailBlur}
          error={emailError}
          textContentType="username"
          autoComplete="username"
          accessibilityLabel="Input username"
          accessibilityHint="Masukkan username Anda untuk login"
          maxLength={50}
        />
        
        <Input
          label="Kata Sandi"
          placeholder="Masukkan kata sandi"
          value={password}
          onChangeText={setPassword}
          onBlur={handlePasswordBlur}
          secureTextEntry={!showPassword}
          error={passwordError}
          rightIcon={
            <PasswordToggleIcon 
              showPassword={showPassword} 
              onToggle={handlePasswordToggle} 
            />
          }
          textContentType="password"
          autoComplete="password"
          accessibilityLabel="Input kata sandi"
          accessibilityHint="Masukkan kata sandi Anda untuk login"
          maxLength={100}
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
          onPress={onWhatsAppLogin}
          fullWidth={true}
          leftIcon={<Ionicons name="logo-whatsapp" size={20} color="#f97316" />}
          accessibilityLabel="Login dengan WhatsApp"
          accessibilityHint="Login menggunakan OTP WhatsApp"
        />
      </View>
    </>
  );
});

export default function LoginScreen() {
  const formManager = useLoginForm();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isConnected } = useNetwork();

  // Memoize navigation handler
  const handleWhatsAppLogin = useCallback(() => {
    router.replace('/login-otp');
  }, [router]);

  // Memoize safe area edges
  const safeAreaEdges = useMemo(() => 
    isConnected ? ['top','left','right'] as const : ['left','right'] as const,
    [isConnected]
  );

  // Memoize scroll view content style
  const scrollContentStyle = useMemo(() => ({
    flexGrow: 1
  }), []);

  // Memoize keyboard vertical offset
  const keyboardOffset = useMemo(() => 
    Platform.OS === 'ios' ? 0 : 20,
    []
  );

  return (
    <SafeAreaView 
      className="flex-1 bg-neutral-50 dark:bg-neutral-900" 
      edges={safeAreaEdges}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1" 
        keyboardVerticalOffset={keyboardOffset}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            className={`flex-1 ${formManager.keyboardVisible ? 'pb-32' : 'pb-4'}`}
            contentContainerStyle={scrollContentStyle}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-4 mt-10 pb-8">
              <PageHeader />
              
              {formManager.error && <ErrorAlert error={formManager.error} />}
              
              <LoginForm
                email={formManager.email}
                password={formManager.password}
                setEmail={formManager.setEmail}
                setPassword={formManager.setPassword}
                showPassword={formManager.showPassword}
                setShowPassword={formManager.setShowPassword}
                touched={formManager.touched}
                formErrors={formManager.formErrors}
                handleBlur={formManager.handleBlur}
                handleLogin={formManager.handleLogin}
                loading={formManager.loading}
                isFormValid={formManager.isFormValid}
                onWhatsAppLogin={handleWhatsAppLogin}
              />
              
              <Footer />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}