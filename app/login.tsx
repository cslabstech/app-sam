import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input as FormInput } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { shadowPresets } from '@/constants/Shadows';
import { borderRadius, componentSpacing, spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableWithoutFeedback,
  View,
  ViewStyle
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
      setError(e?.response?.data?.message || e?.message || 'Periksa email/kata sandi Anda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[styles.scrollContainer, keyboardVisible && { paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.logoText, { color: colors.textInverse }]}>SAM</Text>
                </View>
              </View>
              
              <View style={styles.welcomeContainer}>
                <Text style={[styles.title, { color: colors.text }]}>Selamat datang</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Silakan masuk untuk melanjutkan ke aplikasi SAM
                </Text>
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <Card variant="elevated" style={styles.formCard}>
                <CardContent>
                  {/* Error Message */}
                  {error ? (
                    <View style={[styles.errorContainer, { backgroundColor: colors.dangerLight + '15' }]} 
                          accessible 
                          accessibilityLabel={`Error: ${error}`} 
                          accessibilityRole="alert">
                      <Ionicons name="alert-circle" size={20} color={colors.danger} />
                      <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                    </View>
                  ) : null}

                  {/* Username Field */}
                  <FormInput
                    label="Username"
                    placeholder="Masukkan username anda"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="default"
                    autoCapitalize="none"
                    error={touched.email ? formErrors.email : ''}
                    onBlur={() => handleBlur('email')}
                    required
                    accessibilityLabel="Input username"
                    accessibilityHint="Masukkan username Anda untuk login"
                    textContentType="username"
                    autoComplete="username"
                    leftIcon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
                  />

                  {/* Password Field */}
                  <FormInput
                    label="Kata Sandi"
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    error={touched.password ? formErrors.password : ''}
                    onBlur={() => handleBlur('password')}
                    required
                    accessibilityLabel="Input kata sandi"
                    accessibilityHint="Masukkan kata sandi Anda untuk login"
                    textContentType="password"
                    autoComplete="password"
                    leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                    rightIcon={
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.textSecondary}
                        onPress={() => setShowPassword((v) => !v)}
                        accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                        accessibilityRole="button"
                      />
                    }
                  />

                  {/* Login Button */}
                  <Button
                    title={loading ? 'Masuk...' : 'Masuk'}
                    variant="primary"
                    size="lg"
                    loading={loading}
                    onPress={handleLogin}
                    disabled={!isFormValid || loading}
                    style={styles.loginButton}
                    fullWidth
                    accessibilityLabel="Masuk ke akun"
                    accessibilityHint="Menekan tombol ini akan melakukan proses login dengan username dan kata sandi yang dimasukkan"
                  />

                  {/* Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    <Text style={[styles.dividerText, { color: colors.textSecondary }]}>atau</Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  </View>

                  {/* WhatsApp Login Button */}
                  <Button
                    title="Masuk dengan WhatsApp"
                    variant="secondary"
                    size="lg"
                    onPress={() => router.replace('/login-otp')}
                    style={styles.whatsappButton}
                    fullWidth
                    accessibilityLabel="Masuk dengan WhatsApp"
                    accessibilityHint="Login menggunakan OTP WhatsApp"
                    leftIcon={<Ionicons name="logo-whatsapp" size={20} color={colors.textInverse} />}
                  />
                </CardContent>
              </Card>
            </View>

            {/* Footer */}
            <View style={styles.footerSection}>
              <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                Aplikasi Sales Activity Management
              </Text>
              <Text style={[styles.versionText, { color: colors.textTertiary }]}>
                Version 1.0.0
              </Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Separate styles into ViewStyle and TextStyle for proper typing
const viewStyles = StyleSheet.create({
  safeArea: { 
    flex: 1 
  } as ViewStyle,
  keyboardView: { 
    flex: 1 
  } as ViewStyle,
  scrollContainer: { 
    flexGrow: 1, 
    paddingHorizontal: componentSpacing.screen.padding,
    paddingBottom: spacing.xl,
  } as ViewStyle,
  headerSection: {
    alignItems: 'center',
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
  } as ViewStyle,
  logoContainer: {
    marginBottom: spacing.xl,
  } as ViewStyle,
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadowPresets.surface,
  } as ViewStyle,
  welcomeContainer: {
    alignItems: 'center',
  } as ViewStyle,
  formSection: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  } as ViewStyle,
  formCard: {
    marginVertical: 0,
  } as ViewStyle,
  errorContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: spacing.lg, 
    borderRadius: borderRadius.md, 
    marginBottom: spacing.lg,
  } as ViewStyle,
  loginButton: { 
    marginTop: spacing.lg,
  } as ViewStyle,
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  } as ViewStyle,
  dividerLine: {
    flex: 1,
    height: 1,
  } as ViewStyle,
  whatsappButton: {
    marginBottom: spacing.md,
  } as ViewStyle,
  footerSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  } as ViewStyle,
});

const textStyles = StyleSheet.create({
  logoText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 700 as any,
    fontFamily: typography.fontFamily,
  } as TextStyle,
  title: { 
    fontSize: typography.fontSize['3xl'], 
    fontWeight: 700 as any, 
    fontFamily: typography.fontFamily, 
    marginBottom: spacing.sm,
    textAlign: 'center',
  } as TextStyle,
  subtitle: { 
    fontSize: typography.fontSize.base, 
    fontFamily: typography.fontFamily, 
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  } as TextStyle,
  errorText: { 
    fontSize: typography.fontSize.sm, 
    marginLeft: spacing.sm, 
    flex: 1, 
    fontFamily: typography.fontFamily,
  } as TextStyle,
  dividerText: {
    marginHorizontal: spacing.lg,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily,
  } as TextStyle,
  footerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
    marginBottom: spacing.sm,
  } as TextStyle,
  versionText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
  } as TextStyle,
});

// Combine styles
const styles = { ...viewStyles, ...textStyles };