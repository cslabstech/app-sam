import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, ScrollView } from 'react-native';

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
        setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      } else {
        let errorMessage = e?.message || 'Login gagal';
        
        if (e?.code === 401) {
          errorMessage = 'Username atau password salah';
        } else if (e?.code === 422) {
          errorMessage = e?.message || 'Data yang dimasukkan tidak valid';
        } else if (e?.code === 429) {
          errorMessage = 'Terlalu banyak percobaan login. Silakan coba lagi nanti.';
        } else if (e?.code >= 500) {
          errorMessage = 'Terjadi kesalahan pada server. Silakan coba lagi.';
        }
        
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

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
