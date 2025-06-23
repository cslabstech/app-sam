import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

export function useOtpLoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
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
    } catch (err: any) {
      let errorMessage = err?.message || 'Gagal mengirim OTP';
      
      // Handle berbagai kode error dari backend
      if (err?.code === 422) {
        errorMessage = err?.message || 'Nomor telepon tidak valid';
      } else if (err?.code === 429) {
        errorMessage = 'Terlalu banyak permintaan OTP. Silakan tunggu beberapa saat.';
      } else if (err?.code >= 500) {
        errorMessage = 'Terjadi kesalahan pada server. Silakan coba lagi.';
      }
      
      setError(errorMessage);
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
      // loginWithToken sudah ditangani di dalam verifyOtp method
      router.replace('/(tabs)');
    } catch (err: any) {
      let errorMessage = err?.message || 'OTP salah atau login gagal';
      
      // Handle berbagai kode error dari backend
      if (err?.code === 401) {
        errorMessage = 'OTP salah atau sudah kedaluwarsa';
      } else if (err?.code === 422) {
        errorMessage = err?.message || 'OTP tidak valid';
      } else if (err?.code === 429) {
        errorMessage = 'Terlalu banyak percobaan verifikasi OTP. Silakan tunggu beberapa saat.';
      } else if (err?.code >= 500) {
        errorMessage = 'Terjadi kesalahan pada server. Silakan coba lagi.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    phone,
    setPhone,
    otp,
    setOtp,
    showOtp,
    setShowOtp,
    loading,
    error,
    success,
    keyboardVisible,
    handleRequestOtp,
    handleVerifyOtp,
  };
} 