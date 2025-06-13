import { Button } from '@/components/ui/Button';
import { Input as FormInput } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOtpLogin } from '@/hooks/useOtpLogin';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginOtpScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const { loading, error, success, sendOtp, verifyOtp } = useOtpLogin();
  const auth = useAuth();

  const handleRequestOtp = async () => {
    const ok = await sendOtp(phone);
    if (ok) {
      setShowOtp(true);
      Alert.alert('OTP Terkirim', 'Kode OTP sudah dikirim ke WhatsApp Anda.');
    }
  };

  const handleVerifyOtp = async () => {
    const data = await verifyOtp(phone, otp);
    if (data && data.access_token) {
      await auth.loginWithToken(data.access_token, data.user);
      Alert.alert('Login Berhasil', 'Anda berhasil login dengan OTP WhatsApp!');
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <View style={{ width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 18, padding: spacing.xl }}>
        <Text style={{ fontSize: typography.fontSize2xl, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginBottom: spacing.xl }}>
          Login dengan WhatsApp
        </Text>
        <FormInput
          label="Nomor HP"
          placeholder="Masukkan nomor HP"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={{ marginBottom: spacing.lg }}
        />
        {!showOtp && (
          <Button
            title={loading ? 'Mengirim OTP...' : 'Kirim OTP ke WhatsApp'}
            variant="primary"
            loading={loading}
            onPress={handleRequestOtp}
            style={{ marginBottom: spacing.lg }}
          />
        )}
        {showOtp && (
          <>
            <FormInput
              label="OTP"
              placeholder="Masukkan kode OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              style={{ marginBottom: spacing.md }}
            />
            {error ? <Text style={{ color: colors.danger, marginBottom: spacing.md }}>{error}</Text> : null}
            <Button
              title={loading ? 'Verifikasi...' : 'Verifikasi OTP'}
              variant="primary"
              loading={loading}
              onPress={handleVerifyOtp}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
