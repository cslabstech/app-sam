import { Button } from '@/components/ui/Button';
import { Input as FormInput } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
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
  ScrollView,
  StyleSheet,
  Text,
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={isConnected ? ['top','left','right'] : ['left','right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[styles.scrollContainer, keyboardVisible && { paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <Text style={[styles.title, { color: colors.text }]}>Login</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Masukkan username dan password untuk masuk</Text>
              {error ? (
                <View style={styles.errorContainer} accessible accessibilityLabel={`Error: ${error}`} accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              ) : null}
              <View style={styles.formGroup}>
                <FormInput
                  label="Username *"
                  placeholder="Masukkan username"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="default"
                  style={styles.customInput}
                  accessibilityLabel="Input username"
                  accessibilityHint="Masukkan username Anda untuk login"
                  textContentType="username"
                  importantForAutofill="yes"
                  autoComplete="username"
                  onBlur={() => handleBlur('email')}
                  error={touched.email ? formErrors.email : ''}
                />
              </View>
              <View style={styles.formGroup}>
                <FormInput
                  label="Kata Sandi *"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.customInput}
                  accessibilityLabel="Input kata sandi"
                  accessibilityHint="Masukkan kata sandi Anda untuk login"
                  textContentType="password"
                  importantForAutofill="yes"
                  autoComplete="password"
                  onBlur={() => handleBlur('password')}
                  error={touched.password ? formErrors.password : ''}
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
              </View>
              <Button
                title={loading ? 'Masuk...' : 'Masuk'}
                variant="primary"
                loading={loading}
                onPress={handleLogin}
                style={{ minHeight: 52, marginTop: spacing.lg }}
                disabled={loading || !isFormValid}
                accessibilityLabel="Login manual"
                accessibilityHint="Login menggunakan username dan password"
              />
              <View style={styles.separatorContainer}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>atau</Text>
                <View style={styles.separatorLine} />
              </View>
              <Button
                title="Login dengan WhatsApp"
                variant="outline"
                onPress={() => router.replace('/login-otp')}
                style={{ marginTop: 0, borderColor: colors.primary, backgroundColor: 'transparent', minHeight: 52 }}
                textStyle={{ color: colors.primary, fontWeight: '600' }}
                accessibilityLabel="Login dengan WhatsApp"
                accessibilityHint="Login menggunakan OTP WhatsApp"
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
  formContainer: { paddingHorizontal: spacing.lg, marginTop: spacing['2xl'] },
  title: { fontSize: typography.fontSize2xl, fontWeight: '700', fontFamily: typography.fontFamily, marginBottom: 4 },
  subtitle: { fontSize: typography.fontSizeMd, fontFamily: typography.fontFamily, marginBottom: spacing.xl },
  formGroup: { marginBottom: spacing.lg },
  customInput: { height: 50, fontSize: typography.fontSizeMd, fontFamily: typography.fontFamily },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: spacing.lg, borderRadius: 4, marginBottom: spacing.lg },
  errorText: { fontSize: typography.fontSizeSm, marginLeft: 4, flex: 1, fontFamily: typography.fontFamily },
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