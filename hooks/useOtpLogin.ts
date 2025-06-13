import logger from '@/utils/logger';
import { useState } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export function useOtpLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Kirim OTP ke WhatsApp
  const sendOtp = async (phone: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    logger.log('[useOtpLogin] Request sendOtp:', { phone });
    try {
      const res = await fetch(`${BASE_URL}/user/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      logger.log('[useOtpLogin] sendOtp status:', res.status);
      const data = await res.json();
      if (!res.ok || data?.meta?.code !== 200) {
        logger.error('[useOtpLogin] sendOtp error:', data);
        throw new Error(data?.meta?.message || 'Gagal mengirim OTP');
      }
      setSuccess(true);
      logger.log('[useOtpLogin] OTP sent successfully');
      return true;
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim OTP');
      logger.error('[useOtpLogin] sendOtp exception:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Verifikasi OTP & Login
  const verifyOtp = async (phone: string, otp: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    logger.log('[useOtpLogin] Request verifyOtp:', { phone, otp });
    try {
      const res = await fetch(`${BASE_URL}/user/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      logger.log('[useOtpLogin] verifyOtp status:', res.status);
      const data = await res.json();
      if (!res.ok || data?.meta?.code !== 200) {
        logger.error('[useOtpLogin] verifyOtp error:', data);
        throw new Error(data?.meta?.message || 'OTP salah atau login gagal');
      }
      setSuccess(true);
      setToken(data.data?.access_token || null);
      setUser(data.data?.user || null);
      logger.log('[useOtpLogin] OTP verified & login success:', data.data);
      return data.data;
    } catch (err: any) {
      setError(err.message || 'OTP salah atau login gagal');
      logger.error('[useOtpLogin] verifyOtp exception:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, success, token, user, sendOtp, verifyOtp };
}
