
/**
 * Custom hook untuk inisialisasi dan akses OneSignal secara aman.
 * Di Expo Go: return null (tidak error).
 * Di Native/Development Build: return instance OneSignal.
 */
export function useOneSignal() {
  let OneSignal: any = null;
  
  // Jangan blokir berdasarkan appOwnership - biarkan OneSignal menentukan sendiri
  try {
    // Untuk react-native-onesignal v5.x, import tanpa .default
    OneSignal = require('react-native-onesignal').OneSignal;
    console.log('[useOneSignal] Successfully imported OneSignal (v5):', !!OneSignal);
    
    // Fallback ke cara lama jika tidak berhasil
    if (!OneSignal) {
      OneSignal = require('react-native-onesignal').default;
      console.log('[useOneSignal] Successfully imported OneSignal (fallback):', !!OneSignal);
    }
    
    // Fallback ke import seluruh module
    if (!OneSignal) {
      OneSignal = require('react-native-onesignal');
      console.log('[useOneSignal] Successfully imported OneSignal (module):', !!OneSignal);
    }
  } catch (e) {
    console.log('[useOneSignal] Failed to import OneSignal:', e);
    OneSignal = null;
  }
  
  return OneSignal;
} 