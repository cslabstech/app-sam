import { useNetwork } from '@/context/network-context';
import { useOtpLoginForm } from '@/hooks/data/useOtpLoginForm';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginOtpScreen() {
  const router = useRouter();
  const {
    phone,
    setPhone,
    otp,
    setOtp,
    showOtp,
    loading,
    error,
    keyboardVisible,
    handleRequestOtp,
    handleVerifyOtp,
  } = useOtpLoginForm();
  const { isConnected } = useNetwork();

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900" edges={isConnected ? ['top','left','right'] : ['left','right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1" keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <View className="px-4 mt-10 pb-8">
              <Text style={{ fontFamily: 'Inter' }} className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Login dengan WhatsApp</Text>
              <Text style={{ fontFamily: 'Inter' }} className="text-base text-slate-600 dark:text-slate-300 mb-8">Masukkan nomor HP untuk menerima OTP via WhatsApp</Text>
              {error ? (
                <View className="flex-row items-center bg-danger-50 dark:bg-danger-900 border border-danger-200 dark:border-danger-700 rounded-md p-4 mb-8" accessible accessibilityLabel={`Error: ${error}`} accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={18} color="#dc2626" />
                  <Text style={{ fontFamily: 'Inter' }} className="text-danger-700 dark:text-danger-300 text-sm flex-1 ml-2">{error}</Text>
                </View>
              ) : null}
              <View className="space-y-6 mb-8 w-full gap-5">
                {/* Input Nomor HP */}
                <View className="space-y-2 w-full">
                  <Text style={{ fontFamily: 'Inter' }} className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">Nomor HP</Text>
                  <TextInput
                    style={{ flex: 1, fontFamily: 'Inter', fontSize: 16, height: 48, paddingVertical: 12, paddingHorizontal: 16 }}
                    className="pr-12 border rounded-md bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 text-base"
                    placeholder="Masukkan nomor HP"
                    placeholderTextColor="#a3a3a3"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    textAlignVertical="center"
                    accessibilityLabel="Input nomor HP"
                    accessibilityHint="Masukkan nomor HP Anda untuk menerima OTP"
                    textContentType="telephoneNumber"
                    importantForAutofill="yes"
                    autoComplete="tel"
                    returnKeyType="next"
                  />
                </View>
                {/* Input OTP */}
                {showOtp && (
                  <View className="space-y-2 w-full">
                    <Text style={{ fontFamily: 'Inter' }} className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">OTP</Text>
                    <TextInput
                      style={{ flex: 1, fontFamily: 'Inter', fontSize: 16, height: 48, paddingVertical: 12, paddingHorizontal: 16 }}
                      className="pr-12 border rounded-md bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 text-base"
                      placeholder="Masukkan kode OTP"
                      placeholderTextColor="#a3a3a3"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      textAlignVertical="center"
                      accessibilityLabel="Input kode OTP"
                      accessibilityHint="Masukkan kode OTP yang dikirim ke WhatsApp"
                      returnKeyType="done"
                    />
                  </View>
                )}
              </View>
              {/* Tombol Kirim OTP / Verifikasi OTP */}
              {!showOtp && (
                <Pressable
                  className={`h-12 rounded-md items-center justify-center mb-8 ${loading || phone.trim() === '' ? 'bg-neutral-300 dark:bg-neutral-700' : 'bg-primary-500 active:bg-primary-600'}`}
                  onPress={handleRequestOtp}
                  disabled={loading || phone.trim() === ''}
                  accessibilityLabel="Kirim OTP ke WhatsApp"
                  accessibilityHint="Menekan tombol ini akan mengirim kode OTP ke WhatsApp Anda"
                >
                  <Text style={{ fontFamily: 'Inter' }} className={`text-base font-semibold ${loading || phone.trim() === '' ? 'text-neutral-500 dark:text-neutral-400' : 'text-white'}`}>{loading ? 'Mengirim OTP...' : 'Kirim OTP ke WhatsApp'}</Text>
                </Pressable>
              )}
              {showOtp && (
                <Pressable
                  className={`h-12 rounded-md items-center justify-center mb-4 ${loading || otp.trim() === '' ? 'bg-neutral-300 dark:bg-neutral-700' : 'bg-primary-500 active:bg-primary-600'}`}
                  onPress={handleVerifyOtp}
                  disabled={loading || otp.trim() === ''}
                  accessibilityLabel="Verifikasi OTP"
                  accessibilityHint="Menekan tombol ini akan memverifikasi kode OTP yang dimasukkan"
                >
                  <Text style={{ fontFamily: 'Inter' }} className={`text-base font-semibold ${loading || otp.trim() === '' ? 'text-neutral-500 dark:text-neutral-400' : 'text-white'}`}>{loading ? 'Verifikasi...' : 'Verifikasi OTP'}</Text>
                </Pressable>
              )}
              {/* Separator ala login */}
              {!showOtp && (
                <View className="flex-row items-center mb-4">
                  <View className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                  <Text style={{ fontFamily: 'Inter' }} className="text-sm text-slate-500 dark:text-slate-400 mx-4">atau</Text>
                  <View className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                </View>
              )}
              {!showOtp && (
                <Pressable
                  className="h-12 border-2 border-primary-500 rounded-md items-center justify-center flex-row mb-8 bg-white dark:bg-neutral-950 active:bg-neutral-50 dark:active:bg-neutral-900"
                  onPress={() => router.replace('/login')}
                  accessibilityLabel="Login manual"
                  accessibilityHint="Login menggunakan username dan password"
                >
                  <Ionicons name="person-outline" size={20} color="#f97316" style={{ marginRight: 8 }} />
                  <Text style={{ fontFamily: 'Inter' }} className="text-base font-semibold text-primary-500">Login manual</Text>
                </Pressable>
              )}
              {/* Footer */}
              <View className="items-center pb-8">
                <Text style={{ fontFamily: 'Inter' }} className="text-xs text-slate-500 dark:text-slate-400 text-center">Dengan melanjutkan, Anda menyetujui syarat dan ketentuan yang berlaku</Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
