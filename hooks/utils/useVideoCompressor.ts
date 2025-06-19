import Constants from 'expo-constants';

// Tipe untuk opsi kompresi video
export interface CompressOptions {
  compressionMethod?: string;
  preset?: string;
  quality?: string;
}

/**
 * Custom hook untuk kompresi video yang aman untuk Expo Go & Native.
 * Di Expo Go: return uri asli (tidak kompres).
 * Di Native: gunakan react-native-compressor.
 */
export function useVideoCompressor() {
  let VideoCompressor: any = null;
  if (Constants.appOwnership !== 'expo') {
    try {
      // @ts-ignore
      VideoCompressor = require('react-native-compressor').Video;
    } catch (e) {
      VideoCompressor = null;
    }
  }

  /**
   * Kompres video jika di native, jika di Expo Go return uri asli.
   * @param uri string
   * @param options CompressOptions
   * @returns Promise<string>
   */
  const compress = async (uri: string, options?: CompressOptions): Promise<string> => {
    if (VideoCompressor && typeof VideoCompressor.compress === 'function') {
      return await VideoCompressor.compress(uri, options || {});
    }
    // Expo Go: return uri asli
    return uri;
  };

  return { compress };
} 