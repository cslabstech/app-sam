import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, ScrollView } from 'react-native';
import { useDebounce } from 'use-debounce';

export function useLoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [formErrors, setFormErrors] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Debounce form values untuk validation
  const [debouncedEmail] = useDebounce(email, 300);
  const [debouncedPassword] = useDebounce(password, 300);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Memoized validation function
  const validateField = useCallback((field: 'email' | 'password', value: string) => {
    switch (field) {
      case 'email':
        return !value ? 'Username tidak boleh kosong' : '';
      case 'password':
        return !value ? 'Kata sandi tidak boleh kosong' : '';
      default:
        return '';
    }
  }, []);

  // Auto-validate dengan debounced values
  useEffect(() => {
    if (touched.email) {
      const emailError = validateField('email', debouncedEmail);
      setFormErrors(prev => ({ ...prev, email: emailError }));
    }
  }, [debouncedEmail, touched.email, validateField]);

  useEffect(() => {
    if (touched.password) {
      const passwordError = validateField('password', debouncedPassword);
      setFormErrors(prev => ({ ...prev, password: passwordError }));
    }
  }, [debouncedPassword, touched.password, validateField]);

  // Memoized form validation state
  const isFormValid = useMemo(() => {
    return !formErrors.email && !formErrors.password && 
           email.trim() !== '' && password.trim() !== '';
  }, [email, password, formErrors]);

  // Memoized handlers untuk menghindari re-creation
  const handleBlur = useCallback((field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = { 
      email: validateField('email', email),
      password: validateField('password', password)
    };
    setFormErrors(errors);
    return !errors.email && !errors.password;
  }, [email, password, validateField]);

  // Parse error response sesuai StandardResponse format
  const parseLoginError = useCallback((e: any): string => {
    // Check for StandardResponse format (response.data.meta)
    if (e?.response?.data?.meta) {
      const meta = e.response.data.meta;
      switch (meta.code) {
        case 401:
          return 'Username atau password salah';
        case 422:
          return meta.message || 'Data yang dimasukkan tidak valid';
        case 429:
          return 'Terlalu banyak percobaan login. Silakan coba lagi nanti.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Terjadi kesalahan pada server. Silakan coba lagi.';
        default:
          return meta.message || 'Login gagal';
      }
    }

    // Check for direct meta object (from apiRequest)
    if (e?.meta) {
      switch (e.meta.code) {
        case 401:
          return 'Username atau password salah';
        case 422:
          return e.meta.message || 'Data yang dimasukkan tidak valid';
        case 429:
          return 'Terlalu banyak percobaan login. Silakan coba lagi nanti.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Terjadi kesalahan pada server. Silakan coba lagi.';
        default:
          return e.meta.message || 'Login gagal';
      }
    }

    // Handle network errors
    if (e?.code === 'NETWORK_ERROR' || 
        e?.message?.includes('Network') || 
        e?.code === 'ECONNABORTED' ||
        e?.message?.includes('fetch')) {
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    }

    // Fallback untuk error yang tidak mengikuti format standard
    return 'Login gagal. Silakan coba lagi.';
  }, []);

  const handleLogin = useCallback(async () => {
    setError('');
    setTouched({ email: true, password: true });
    if (!validateForm()) return;
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      const errorMessage = parseLoginError(e);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [email, password, validateForm, login, router, parseLoginError]);

  return {
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
    scrollViewRef,
  };
}
