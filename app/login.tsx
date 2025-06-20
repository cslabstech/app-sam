import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/context/network-context';
import { useLoginForm } from '@/hooks/data/useLoginForm';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
              <Text style={{ fontFamily: 'Inter' }} className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                Login
              </Text>
              <Text style={{ fontFamily: 'Inter' }} className="text-base text-slate-600 dark:text-slate-300 mb-8">
                Masukkan username dan password untuk masuk
              </Text>
              {error ? (
                <View className="flex-row items-center bg-danger-50 dark:bg-danger-900 border border-danger-200 dark:border-danger-700 rounded-md p-4 mb-8" accessible accessibilityLabel={`Error: ${error}`} accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={18} color="#dc2626" />
                  <Text style={{ fontFamily: 'Inter' }} className="text-danger-700 dark:text-danger-300 text-sm flex-1 ml-2">{error}</Text>
                </View>
              ) : null}
              <View className="space-y-6 mb-8 w-full gap-5">
                <View className="space-y-2 w-full">
                  <Text style={{ fontFamily: 'Inter' }} className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    Username
                  </Text>
                  <TextInput
                    style={{ flex: 1, fontFamily: 'Inter' }}
                    className="px-4 pr-12 py-3 border rounded-md bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 text-base leading-[24px]"
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
                    <Text style={{ fontFamily: 'Inter' }} className="text-xs text-danger-600 dark:text-danger-400">{formErrors.email}</Text>
                  ) : null}
                </View>
                <View className="space-y-2 w-full">
                  <Text style={{ fontFamily: 'Inter' }} className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    Kata Sandi
                  </Text>
                  <View className="relative flex-row items-center w-full">
                    <TextInput
                      style={{ flex: 1, fontFamily: 'Inter' }}
                      className="px-4 pr-12 py-3 border rounded-md bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 text-base leading-[24px]"
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
                    <Text style={{ fontFamily: 'Inter' }} className="text-xs text-danger-600 dark:text-danger-400">{formErrors.password}</Text>
                  ) : null}
                </View>
              </View>
              <Pressable
                className={`h-12 rounded-md items-center justify-center mb-4 ${loading || !isFormValid ? 'bg-neutral-300 dark:bg-neutral-700' : 'bg-primary-500 active:bg-primary-600'}`}
                onPress={handleLogin}
                disabled={loading || !isFormValid}
                accessibilityLabel="Login manual"
                accessibilityHint="Login menggunakan username dan password"
              >
                <Text style={{ fontFamily: 'Inter' }} className={`text-base font-semibold ${loading || !isFormValid ? 'text-neutral-500 dark:text-neutral-400' : 'text-white'}`}>
                  {loading ? 'Memproses...' : 'Masuk'}
                </Text>
              </Pressable>
              <View className="flex-row items-center mb-4">
                <View className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                <Text style={{ fontFamily: 'Inter' }} className="text-sm text-slate-500 dark:text-slate-400 mx-4">atau</Text>
                <View className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
              </View>
              <Pressable
                className="h-12 border-2 border-primary-500 rounded-md items-center justify-center flex-row mb-8 bg-white dark:bg-neutral-950 active:bg-neutral-50 dark:active:bg-neutral-900"
                onPress={() => router.replace('/login-otp')}
                accessibilityLabel="Login dengan WhatsApp"
                accessibilityHint="Login menggunakan OTP WhatsApp"
              >
                <Ionicons name="logo-whatsapp" size={20} color="#f97316" style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: 'Inter' }} className="text-base font-semibold text-primary-500">{'Login dengan WhatsApp'}</Text>
              </Pressable>
              <View className="items-center pb-8">
                <Text style={{ fontFamily: 'Inter' }} className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  Dengan melanjutkan, Anda menyetujui syarat dan ketentuan yang berlaku
                </Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}