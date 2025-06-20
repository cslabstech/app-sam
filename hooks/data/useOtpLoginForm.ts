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
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'OTP salah atau login gagal');
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