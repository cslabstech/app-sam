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

  // Parse error response sesuai StandardResponse format untuk OTP request
  const parseOtpError = (err: any): string => {
    // Check for StandardResponse format (response.data.meta)
    if (err?.response?.data?.meta) {
      const meta = err.response.data.meta;
      switch (meta.code) {
        case 404:
          return 'Nomor handphone tidak terdaftar';
        case 422:
          return meta.message || 'Nomor telepon tidak valid';
        case 429:
          return 'Terlalu banyak permintaan OTP. Silakan tunggu beberapa saat.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Terjadi kesalahan pada server. Silakan coba lagi.';
        default:
          return meta.message || 'Gagal mengirim OTP';
      }
    }

    // Check for direct meta object (from apiRequest)
    if (err?.meta) {
      switch (err.meta.code) {
        case 404:
          return 'Nomor handphone tidak terdaftar';
        case 422:
          return err.meta.message || 'Nomor telepon tidak valid';
        case 429:
          return 'Terlalu banyak permintaan OTP. Silakan tunggu beberapa saat.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Terjadi kesalahan pada server. Silakan coba lagi.';
        default:
          return err.meta.message || 'Gagal mengirim OTP';
      }
    }

    // Handle network errors
    if (err?.code === 'NETWORK_ERROR' || 
        err?.message?.includes('Network') || 
        err?.message?.includes('fetch')) {
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    }

    // Fallback untuk error yang tidak mengikuti format standard
    return 'Gagal mengirim OTP. Silakan coba lagi.';
  };

  const handleRequestOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await auth.requestOtp(phone);
      setSuccess(true);
      setShowOtp(true);
    } catch (err: any) {
      const errorMessage = parseOtpError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Parse verify OTP error response sesuai StandardResponse format
  const parseVerifyOtpError = (err: any): string => {
    // Check for StandardResponse format (response.data.meta)
    if (err?.response?.data?.meta) {
      const meta = err.response.data.meta;
      switch (meta.code) {
        case 401:
          return 'OTP salah atau sudah kedaluwarsa';
        case 404:
          return 'Nomor handphone tidak terdaftar';
        case 422:
          return meta.message || 'OTP tidak valid';
        case 429:
          return 'Terlalu banyak percobaan verifikasi OTP. Silakan tunggu beberapa saat.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Terjadi kesalahan pada server. Silakan coba lagi.';
        default:
          return meta.message || 'OTP salah atau login gagal';
      }
    }

    // Check for direct meta object (from apiRequest)
    if (err?.meta) {
      switch (err.meta.code) {
        case 401:
          return 'OTP salah atau sudah kedaluwarsa';
        case 404:
          return 'Nomor handphone tidak terdaftar';
        case 422:
          return err.meta.message || 'OTP tidak valid';
        case 429:
          return 'Terlalu banyak percobaan verifikasi OTP. Silakan tunggu beberapa saat.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Terjadi kesalahan pada server. Silakan coba lagi.';
        default:
          return err.meta.message || 'OTP salah atau login gagal';
      }
    }

    // Handle network errors
    if (err?.code === 'NETWORK_ERROR' || 
        err?.message?.includes('Network') || 
        err?.message?.includes('fetch')) {
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    }

    // Fallback untuk error yang tidak mengikuti format standard
    return 'OTP salah atau login gagal. Silakan coba lagi.';
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
      const errorMessage = parseVerifyOtpError(err);
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