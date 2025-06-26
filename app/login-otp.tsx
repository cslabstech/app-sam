import { useNetwork } from '@/context/network-context';
import { useOtpLoginForm } from '@/hooks/data/useOtpLoginForm';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableWithoutFeedback, View } from 'react-native';
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
        Login dengan WhatsApp
      </Text>
      <Text 
        className="text-base text-slate-600 dark:text-slate-300 mb-8"
        style={{ fontFamily: 'Inter' }}
      >
        Masukkan nomor HP untuk menerima OTP via WhatsApp
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

  const handleManualLogin = () => {
    router.replace('/login');
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
            className="flex-1" 
            contentContainerStyle={{ flexGrow: 1 }} 
            showsVerticalScrollIndicator={false}
          >
            <View className="px-4 mt-10 pb-8">
              <PageHeader />
              
              {error && <ErrorAlert error={error} />}
              
              <View className="space-y-6 mb-8 w-full gap-5">
                <Input
                  label="Nomor HP"
                  placeholder="Masukkan nomor HP"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  returnKeyType="next"
                  accessibilityLabel="Input nomor HP"
                  accessibilityHint="Masukkan nomor HP Anda untuk menerima OTP"
                />
                
                {showOtp && (
                  <Input
                    label="OTP"
                    placeholder="Masukkan kode OTP"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    accessibilityLabel="Input kode OTP"
                    accessibilityHint="Masukkan kode OTP yang dikirim ke WhatsApp"
                  />
                )}
              </View>
              
              {!showOtp && (
                <View className="mb-4">
                  <Button
                    title="Kirim OTP ke WhatsApp"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    disabled={phone.trim() === ''}
                    onPress={handleRequestOtp}
                    fullWidth={true}
                    accessibilityLabel="Kirim OTP ke WhatsApp"
                    accessibilityHint="Menekan tombol ini akan mengirim kode OTP ke WhatsApp Anda"
                  />
                </View>
              )}
              
              {showOtp && (
                <View className="mb-8">
                  <Button
                    title="Verifikasi OTP"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    disabled={otp.trim() === ''}
                    onPress={handleVerifyOtp}
                    fullWidth={true}
                    accessibilityLabel="Verifikasi OTP"
                    accessibilityHint="Menekan tombol ini akan memverifikasi kode OTP yang dimasukkan"
                  />
                </View>
              )}
              
              {!showOtp && (
                <>
                  <OrSeparator />
                  <View className="mb-8">
                    <Button
                      title="Login manual"
                      variant="outline"
                      size="lg"
                      onPress={handleManualLogin}
                      fullWidth={true}
                      leftIcon={<Ionicons name="person-outline" size={20} color="#f97316" />}
                      accessibilityLabel="Login manual"
                      accessibilityHint="Login menggunakan username dan password"
                    />
                  </View>
                </>
              )}
              
              <Footer />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
