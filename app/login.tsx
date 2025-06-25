import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/context/network-context';
import { useLoginForm } from '@/hooks/data/useLoginForm';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const UsernameField = React.memo(function UsernameField({ 
  email, 
  setEmail, 
  handleBlur, 
  touched, 
  formErrors 
}: { 
  email: string; 
  setEmail: (value: string) => void; 
  handleBlur: (field: "email" | "password") => void; 
  touched: any; 
  formErrors: any; 
}) {
  return (
    <View className="space-y-2 w-full">
      <Text 
        className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200"
        style={{ fontFamily: 'Inter' }}
      >
        Username
      </Text>
      <TextInput
        className="px-4 pr-12 py-3 border rounded-md bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 text-base leading-[24px]"
        style={{ flex: 1, fontFamily: 'Inter' }}
        placeholder="Masukkan username"
        placeholderTextColor="#a3a3a3"
        value={email}
        onChangeText={setEmail}
        onBlur={() => handleBlur('email')}
        textAlignVertical="center"
        accessibilityLabel="Input username"
        accessibilityHint="Masukkan username Anda untuk login"
        textContentType="username"
        importantForAutofill="yes"
        autoComplete="username"
      />
      {touched.email && formErrors.email ? (
        <Text 
          className="text-xs text-danger-600 dark:text-danger-400"
          style={{ fontFamily: 'Inter' }}
        >
          {formErrors.email}
        </Text>
      ) : null}
    </View>
  );
});

const PasswordField = React.memo(function PasswordField({ 
  password, 
  setPassword, 
  showPassword, 
  setShowPassword, 
  handleBlur, 
  touched, 
  formErrors 
}: { 
  password: string; 
  setPassword: (value: string) => void; 
  showPassword: boolean; 
  setShowPassword: (value: boolean | ((prev: boolean) => boolean)) => void; 
  handleBlur: (field: "email" | "password") => void; 
  touched: any; 
  formErrors: any; 
}) {
  return (
    <View className="space-y-2 w-full">
      <Text 
        className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200"
        style={{ fontFamily: 'Inter' }}
      >
        Kata Sandi
      </Text>
      <View className="relative flex-row items-center w-full">
        <TextInput
          className="px-4 pr-12 py-3 border rounded-md bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 text-base leading-[24px]"
          style={{ flex: 1, fontFamily: 'Inter' }}
          placeholder="Masukkan kata sandi"
          placeholderTextColor="#a3a3a3"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          onBlur={() => handleBlur('password')}
          textAlignVertical="center"
          accessibilityLabel="Input kata sandi"
          accessibilityHint="Masukkan kata sandi Anda untuk login"
          textContentType="password"
          importantForAutofill="yes"
          autoComplete="password"
        />
        <Pressable
          className="absolute right-4 h-12 w-10 items-center justify-center"
          onPress={() => setShowPassword((v) => !v)}
          accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          accessibilityRole="button"
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#64748b"
          />
        </Pressable>
      </View>
      {touched.password && formErrors.password ? (
        <Text 
          className="text-xs text-danger-600 dark:text-danger-400"
          style={{ fontFamily: 'Inter' }}
        >
          {formErrors.password}
        </Text>
      ) : null}
    </View>
  );
});

const LoginButton = React.memo(function LoginButton({ 
  onPress, 
  loading, 
  isFormValid 
}: { 
  onPress: () => void; 
  loading: boolean; 
  isFormValid: boolean; 
}) {
  const isDisabled = loading || !isFormValid;
  const buttonClasses = `h-12 rounded-md items-center justify-center mb-4 ${
    isDisabled ? 'bg-neutral-300 dark:bg-neutral-700' : 'bg-primary-500 active:bg-primary-600'
  }`;
  const textClasses = `text-base font-semibold ${
    isDisabled ? 'text-neutral-500 dark:text-neutral-400' : 'text-white'
  }`;

  return (
    <Pressable
      className={buttonClasses}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel="Login manual"
      accessibilityHint="Login menggunakan username dan password"
    >
      <Text 
        className={textClasses}
        style={{ fontFamily: 'Inter' }}
      >
        {loading ? 'Memproses...' : 'Masuk'}
      </Text>
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

const WhatsAppLoginButton = React.memo(function WhatsAppLoginButton({ 
  onPress 
}: { 
  onPress: () => void; 
}) {
  return (
    <Pressable
      className="h-12 border-2 border-primary-500 rounded-md items-center justify-center flex-row mb-8 bg-white dark:bg-neutral-950 active:bg-neutral-50 dark:active:bg-neutral-900"
      onPress={onPress}
      accessibilityLabel="Login dengan WhatsApp"
      accessibilityHint="Login menggunakan OTP WhatsApp"
    >
      <Ionicons name="logo-whatsapp" size={20} color="#f97316" style={{ marginRight: 8 }} />
      <Text 
        className="text-base font-semibold text-primary-500"
        style={{ fontFamily: 'Inter' }}
      >
        Login dengan WhatsApp
      </Text>
    </Pressable>
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
                <UsernameField
                  email={email}
                  setEmail={setEmail}
                  handleBlur={handleBlur}
                  touched={touched}
                  formErrors={formErrors}
                />
                
                <PasswordField
                  password={password}
                  setPassword={setPassword}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  handleBlur={handleBlur}
                  touched={touched}
                  formErrors={formErrors}
                />
              </View>
              
              <LoginButton
                onPress={handleLogin}
                loading={loading}
                isFormValid={isFormValid}
              />
              
              <OrSeparator />
              
              <WhatsAppLoginButton onPress={handleWhatsAppLogin} />
              
              <Footer />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}