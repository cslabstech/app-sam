import { Button } from '@/components/ui/Button';
import { Input as FormInput } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/useColorScheme';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const auth = useAuth();

  const handleRequestOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/user/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || data?.meta?.code !== 200) {
        throw new Error(data?.meta?.message || 'Gagal mengirim OTP');
      }
      setSuccess(true);
      setShowOtp(true);
      Alert.alert('OTP Terkirim', 'Kode OTP sudah dikirim ke WhatsApp Anda.');
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/user/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok || data?.meta?.code !== 200) {
        throw new Error(data?.meta?.message || 'OTP salah atau login gagal');
      }
      setSuccess(true);
      await auth.loginWithToken(data.data.access_token, data.data.user);
      Alert.alert('Login Berhasil', 'Anda berhasil login dengan OTP WhatsApp!');
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'OTP salah atau login gagal');
    } finally {
      setLoading(false);
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
