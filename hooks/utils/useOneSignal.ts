import Constants from 'expo-constants';

/**
 * Custom hook untuk inisialisasi dan akses OneSignal secara aman.
 * Di Expo Go: return null (tidak error).
 * Di Native: return instance OneSignal.
 */
export function useOneSignal() {
  let OneSignal: any = null;
  if (Constants.appOwnership !== 'expo') {
    try {
      // @ts-ignore
      OneSignal = require('react-native-onesignal').default;
    } catch (e) {
      OneSignal = null;
    }
  }
  return OneSignal;
} 