import { useNetwork } from '@/context/network-context';
import { useOtpLoginForm } from '@/hooks/data/useOtpLoginForm';
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

const PhoneInput = React.memo(function PhoneInput({ 
  phone, 
  setPhone 
}: { 
  phone: string; 
  setPhone: (value: string) => void; 
}) {
  return (
    <View className="space-y-2 w-full">
      <Text 
        className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200"
        style={{ fontFamily: 'Inter' }}
      >
        Nomor HP
      </Text>
      <TextInput
        className="pr-12 border rounded-md bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 text-base"
        style={{ 
          flex: 1, 
          fontFamily: 'Inter', 
          fontSize: 16, 
          height: 48, 
          paddingVertical: 12, 
          paddingHorizontal: 16 
        }}
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
  );
});

const OtpInput = React.memo(function OtpInput({ 
  otp, 
  setOtp 
}: { 
  otp: string; 
  setOtp: (value: string) => void; 
}) {
  return (
    <View className="space-y-2 w-full">
      <Text 
        className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200"
        style={{ fontFamily: 'Inter' }}
      >
        OTP
      </Text>
      <TextInput
        className="pr-12 border rounded-md bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 text-base"
        style={{ 
          flex: 1, 
          fontFamily: 'Inter', 
          fontSize: 16, 
          height: 48, 
          paddingVertical: 12, 
          paddingHorizontal: 16 
        }}
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
  );
});

const RequestOtpButton = React.memo(function RequestOtpButton({ 
  onPress, 
  loading, 
  phone 
}: { 
  onPress: () => void; 
  loading: boolean; 
  phone: string; 
}) {
  const isDisabled = loading || phone.trim() === '';
  const buttonClasses = `h-12 rounded-md items-center justify-center mb-8 ${
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
      accessibilityLabel="Kirim OTP ke WhatsApp"
      accessibilityHint="Menekan tombol ini akan mengirim kode OTP ke WhatsApp Anda"
    >
      <Text 
        className={textClasses}
        style={{ fontFamily: 'Inter' }}
      >
        {loading ? 'Mengirim OTP...' : 'Kirim OTP ke WhatsApp'}
      </Text>
    </Pressable>
  );
});

const VerifyOtpButton = React.memo(function VerifyOtpButton({ 
  onPress, 
  loading, 
  otp 
}: { 
  onPress: () => void; 
  loading: boolean; 
  otp: string; 
}) {
  const isDisabled = loading || otp.trim() === '';
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
      accessibilityLabel="Verifikasi OTP"
      accessibilityHint="Menekan tombol ini akan memverifikasi kode OTP yang dimasukkan"
    >
      <Text 
        className={textClasses}
        style={{ fontFamily: 'Inter' }}
      >
        {loading ? 'Verifikasi...' : 'Verifikasi OTP'}
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

const ManualLoginButton = React.memo(function ManualLoginButton({ 
  onPress 
}: { 
  onPress: () => void; 
}) {
  return (
    <Pressable
      className="h-12 border-2 border-primary-500 rounded-md items-center justify-center flex-row mb-8 bg-white dark:bg-neutral-950 active:bg-neutral-50 dark:active:bg-neutral-900"
      onPress={onPress}
      accessibilityLabel="Login manual"
      accessibilityHint="Login menggunakan username dan password"
    >
      <Ionicons name="person-outline" size={20} color="#f97316" style={{ marginRight: 8 }} />
      <Text 
        className="text-base font-semibold text-primary-500"
        style={{ fontFamily: 'Inter' }}
      >
        Login manual
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
                <PhoneInput phone={phone} setPhone={setPhone} />
                {showOtp && <OtpInput otp={otp} setOtp={setOtp} />}
              </View>
              
              {!showOtp && (
                <RequestOtpButton 
                  onPress={handleRequestOtp}
                  loading={loading}
                  phone={phone}
                />
              )}
              
              {showOtp && (
                <VerifyOtpButton 
                  onPress={handleVerifyOtp}
                  loading={loading}
                  otp={otp}
                />
              )}
              
              {!showOtp && (
                <>
                  <OrSeparator />
                  <ManualLoginButton onPress={handleManualLogin} />
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
