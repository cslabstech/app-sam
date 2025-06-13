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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [formErrors, setFormErrors] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const isFormValid = useMemo(() => {
    return !formErrors.email && !formErrors.password && email.trim() !== '' && password.trim() !== '';
  }, [email, password, formErrors]);

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    const errors = { email: '', password: '' };
    if (!email) {
      errors.email = 'Username tidak boleh kosong';
    }
    if (!password) {
      errors.password = 'Kata sandi tidak boleh kosong';
    }
    setFormErrors(errors);
    return !errors.email && !errors.password;
  };

  const handleLogin = async () => {
    setError('');
    setTouched({ email: true, password: true });
    if (!validateForm()) return;
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e.message?.includes('Network') || e.code === 'ECONNABORTED') {
        Alert.alert('Tidak dapat terhubung ke server', 'Periksa koneksi internet Anda.');
      } else {
        setError(e?.response?.data?.message || 'Periksa email/kata sandi Anda');
        Alert.alert('Login Gagal', e?.response?.data?.message || 'Periksa email/kata sandi Anda');
      }
    } finally {
      setLoading(false);
    }
  };

  const loginButtonStyle = Platform.OS === 'android'
    ? Object.assign({}, styles.loginButton, styles.loginButtonAndroid)
    : styles.loginButton;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[styles.scrollContainer, keyboardVisible && { paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo dan judul - disembunyikan saat keyboard muncul */}
            {!keyboardVisible && (
              <View style={styles.logoContainer}>
                <Image source={require('@/assets/images/icon.png')} style={styles.logo} resizeMode="contain" accessible accessibilityLabel="Logo aplikasi Audit Mobile" />
                <Text style={[styles.logoText, { color: colors.primary }]}>SAM</Text>
              </View>
            )}
            <View style={styles.formContainer}>
              <Text style={[styles.title, { color: colors.text }]}>Login</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Silakan login untuk masuk aplikasi</Text>
              {error ? (
                <View style={styles.errorContainer} accessible accessibilityLabel={`Error: ${error}`} accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              ) : null}
              <View style={styles.formGroup}>
                <FormInput
                  label="Username *"
                  placeholder="Masukkan username anda"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="default"
                  autoCapitalize="none"
                  error={formErrors.email}
                  onBlur={() => handleBlur('email')}
                  style={styles.customInput}
                  accessibilityLabel="Input username"
                  accessibilityHint="Masukkan username Anda untuk login"
                  textContentType="username"
                  importantForAutofill="yes"
                  autoComplete="username"
                />
              </View>
              <View style={styles.formGroup}>
                <FormInput
                  label="Kata Sandi *"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  error={formErrors.password}
                  onBlur={() => handleBlur('password')}
                  style={styles.customInput}
                  accessibilityLabel="Input kata sandi"
                  accessibilityHint="Masukkan kata sandi Anda untuk login"
                  textContentType="password"
                  importantForAutofill="yes"
                  autoComplete="password"
                  rightIcon={
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textSecondary}
                      onPress={() => setShowPassword((v) => !v)}
                      accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      accessibilityRole="button"
                    />
                  }
                />
              </View>
              <Button
                title={loading ? 'Loading...' : 'Login'}
                variant="primary"
                loading={loading}
                onPress={handleLogin}
                disabled={!isFormValid || loading}
                style={loginButtonStyle}
                accessibilityLabel="Login ke akun"
                accessibilityHint="Menekan tombol ini akan melakukan proses login dengan email dan kata sandi yang dimasukkan"
                accessibilityRole="button"
                accessibilityState={{ disabled: !isFormValid || loading, busy: loading }}
              />
              <Button
                title="Login dengan WhatsApp"
                variant="secondary"
                onPress={() => router.push('/login-otp')}
                style={{ marginTop: 8, backgroundColor: '#25D366' }}
                accessibilityLabel="Login dengan WhatsApp"
                accessibilityHint="Login menggunakan OTP yang dikirim ke WhatsApp"
                accessibilityRole="button"
              />
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
  loginButton: { height: 52, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg, ...shadow },
  loginButtonAndroid: { height: 54, marginTop: spacing.xl, elevation: 4, margin: 0 },
});