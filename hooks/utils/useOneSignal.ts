import Constants from 'expo-constants';

/**
 * Custom hook untuk inisialisasi dan akses OneSignal secara aman.
 * - Di Expo Go: return null dan tidak error
 * - Di Native/Development Build: return instance OneSignal jika tersedia
 * - Automatic fallback dengan detection yang lebih robust
 */
export function useOneSignal() {
  let OneSignal: any = null;
  
  // Cek apakah sedang di Expo Go
  const appOwnership = Constants.appOwnership as string | null;
  const isExpoGo = appOwnership === 'expo';
  const isStandalone = appOwnership === 'standalone';
  const isDevelopmentBuild = appOwnership === null; // Development build
  
  console.log('[useOneSignal] Environment detection:', {
    appOwnership: Constants.appOwnership,
    isExpoGo,
    isStandalone,
    isDevelopmentBuild,
    executionEnvironment: Constants.executionEnvironment
  });
  
  // Jika di Expo Go, langsung return null tanpa mencoba import
  if (isExpoGo) {
    console.log('[useOneSignal] Running in Expo Go - OneSignal not available');
    return null;
  }
  
  // Untuk standalone dan development build, coba import OneSignal
  try {
    // Method 1: Import OneSignal dari react-native-onesignal v5.x
    OneSignal = require('react-native-onesignal')?.OneSignal;
    if (OneSignal) {
      console.log('[useOneSignal] Successfully imported OneSignal (v5 method)');
      return OneSignal;
    }
    
    // Method 2: Import dengan .default (fallback untuk versi lama)
    OneSignal = require('react-native-onesignal')?.default;
    if (OneSignal) {
      console.log('[useOneSignal] Successfully imported OneSignal (default method)');
      return OneSignal;
    }
    
    // Method 3: Import seluruh module
    const OneSignalModule = require('react-native-onesignal');
    if (OneSignalModule && typeof OneSignalModule === 'object') {
      OneSignal = OneSignalModule.OneSignal || OneSignalModule.default || OneSignalModule;
      if (OneSignal) {
        console.log('[useOneSignal] Successfully imported OneSignal (module method)');
        return OneSignal;
      }
    }
    
    // Jika sampai sini berarti OneSignal tidak ditemukan
    console.log('[useOneSignal] OneSignal module not found or not properly exported');
    return null;
    
  } catch (error) {
    // Log error tapi jangan crash aplikasi
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('[useOneSignal] Failed to import OneSignal (expected in some environments):', {
      error: errorMessage,
      isExpoGo,
      isStandalone,
      isDevelopmentBuild
    });
    return null;
  }
}

/**
 * Utility untuk mengecek apakah OneSignal tersedia dan bisa digunakan
 */
export function isOneSignalAvailable(): boolean {
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo) return false;
  
  try {
    const OneSignal = require('react-native-onesignal')?.OneSignal;
    return !!OneSignal;
  } catch {
    return false;
  }
}

/**
 * Utility untuk generate fallback notif_id berdasarkan environment
 */
export function generateFallbackNotifId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const appOwnership = Constants.appOwnership || 'unknown';
  
  return `fallback-${appOwnership}-${timestamp}-${random}`;
} 