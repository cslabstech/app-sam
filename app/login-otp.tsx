import { Button } from '@/components/ui/Button';
import { Input as FormInput } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { shadow } from '@/styles/shadow';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const auth = useAuth();

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleRequestOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await auth.requestOtp(phone);
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
      const data = await auth.verifyOtp(phone, otp);
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

  const otpButtonStyle = Platform.OS === 'android'
    ? Object.assign({}, styles.otpButton, styles.otpButtonAndroid)
    : styles.otpButton;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[styles.scrollContainer, keyboardVisible && { paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo dan judul - disembunyikan saat keyboard muncul
            {!keyboardVisible && (
              <View style={styles.logoContainer}>
                <Image source={require('@/assets/images/icon.png')} style={styles.logo} resizeMode="contain" accessible accessibilityLabel="Logo aplikasi Audit Mobile" />
                <Text style={[styles.logoText, { color: colors.primary }]}>SAM</Text>
              </View>
            )} */}
            <View style={styles.formContainer}>
              <Text style={[styles.title, { color: colors.text }]}>Login dengan WhatsApp</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Masukkan nomor HP untuk menerima OTP via WhatsApp</Text>
              {error ? (
                <View style={styles.errorContainer} accessible accessibilityLabel={`Error: ${error}`} accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              ) : null}
              <View style={styles.formGroup}>
                <FormInput
                  label="Nomor HP *"
                  placeholder="Masukkan nomor HP"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  style={styles.customInput}
                  accessibilityLabel="Input nomor HP"
                  accessibilityHint="Masukkan nomor HP Anda untuk menerima OTP"
                  textContentType="telephoneNumber"
                  importantForAutofill="yes"
                  autoComplete="tel"
                />
              </View>
              {showOtp && (
                <View style={styles.formGroup}>
                  <FormInput
                    label="OTP *"
                    placeholder="Masukkan kode OTP"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    style={styles.customInput}
                    accessibilityLabel="Input kode OTP"
                    accessibilityHint="Masukkan kode OTP yang dikirim ke WhatsApp"
                  />
                </View>
              )}
              {!showOtp && (
                <Button
                  title={loading ? 'Mengirim OTP...' : 'Kirim OTP ke WhatsApp'}
                  variant="primary"
                  loading={loading}
                  onPress={handleRequestOtp}
                  style={{ ...otpButtonStyle, minHeight: 52 }}
                  disabled={loading || phone.trim() === ''}
                  accessibilityLabel="Kirim OTP ke WhatsApp"
                  accessibilityHint="Menekan tombol ini akan mengirim kode OTP ke WhatsApp Anda"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: loading || phone.trim() === '', busy: loading }}
                />
              )}
              {showOtp && (
                <Button
                  title={loading ? 'Verifikasi...' : 'Verifikasi OTP'}
                  variant="primary"
                  loading={loading}
                  onPress={handleVerifyOtp}
                  style={{ ...otpButtonStyle, minHeight: 52 }}
                  accessibilityLabel="Verifikasi OTP"
                  accessibilityHint="Menekan tombol ini akan memverifikasi kode OTP yang dimasukkan"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: loading, busy: loading }}
                />
              )}
              {/* Separator ala login */}
              {!showOtp && (
                <View style={styles.separatorContainer}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>atau</Text>
                  <View style={styles.separatorLine} />
                </View>
              )}
              {!showOtp && (
                <Button
                  title="Login manual"
                  variant="outline"
                  onPress={() => router.replace('/login')}
                  style={{ marginTop: 0, borderColor: colors.primary, backgroundColor: 'transparent', minHeight: 52 }}
                  textStyle={{ color: colors.primary, fontWeight: '600' }}
                  accessibilityLabel="Login manual"
                  accessibilityHint="Login menggunakan username dan password"
                  accessibilityRole="button"
                />
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: spacing.md },
  logoContainer: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg },
  logo: { width: 120, height: 64 },
  logoText: { fontSize: typography.fontSizeLg, fontWeight: '600', fontFamily: typography.fontFamily, marginTop: spacing.sm, letterSpacing: 1 },
  formContainer: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  title: { fontSize: typography.fontSize2xl, fontWeight: '700', fontFamily: typography.fontFamily, marginBottom: 4 },
  subtitle: { fontSize: typography.fontSizeMd, fontFamily: typography.fontFamily, marginBottom: spacing.xl },
  formGroup: { marginBottom: spacing.lg },
  customInput: { height: 50, fontSize: typography.fontSizeMd, fontFamily: typography.fontFamily },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: spacing.lg, borderRadius: 4, marginBottom: spacing.lg },
  errorText: { fontSize: typography.fontSizeSm, marginLeft: 4, flex: 1, fontFamily: typography.fontFamily },
  otpButton: { height: 52, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg, ...shadow },
  otpButtonAndroid: { height: 54, marginTop: spacing.xl, elevation: 4, margin: 0 },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  separatorText: {
    marginHorizontal: 12,
    color: '#888',
    fontSize: typography.fontSizeMd,
    fontFamily: typography.fontFamily,
  },
});
