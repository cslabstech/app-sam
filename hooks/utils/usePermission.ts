// Custom hook untuk pengecekan permission berbasis context
// Ikuti pola atomic & context pada copilot-instruction.md
import { AuthContext } from '@/context/auth-context';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useCallback, useContext, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

/**
 * Hook untuk cek apakah user punya permission tertentu
 * @param permission string permission, contoh: 'create_user'
 * @returns boolean
 */
export function usePermission(permission: string): boolean {
  const ctx = useContext(AuthContext);
  if (!ctx) return false;
  return Array.isArray(ctx.permissions) && ctx.permissions.includes(permission);
}

/**
 * Hook untuk menangani permission dengan modal bottom sheet
 */
export function usePermissionWithModal() {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'location' | 'camera'>('location');
  const [hasCameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const openAppSettings = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening settings:', error);
      Alert.alert('Kesalahan', 'Tidak dapat membuka pengaturan secara otomatis.');
    }
  }, []);

  const isPermissionPermanentlyDenied = useCallback((type: 'location' | 'camera') => {
    if (type === 'location') {
      return locationStatus === 'denied';
    } else if (type === 'camera') {
      return hasCameraPermission?.status === 'denied';
    }
    return false;
  }, [hasCameraPermission, locationStatus]);

  const requestLocationWithModal = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationStatus(status);
      if (status === 'granted') {
        return { granted: true };
      }

      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      setLocationStatus(newStatus);
      if (newStatus === 'granted') {
        return { granted: true };
      }

      // Show modal for location permission
      setModalType('location');
      setShowModal(true);
      return { granted: false };
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return { granted: false };
    }
  }, []);

  const requestCameraWithModal = useCallback(async () => {
    try {
      if (hasCameraPermission?.status === 'granted') {
        return { granted: true };
      }

      const { status } = await requestCameraPermission();
      if (status === 'granted') {
        return { granted: true };
      }

      // Show modal for camera permission
      setModalType('camera');
      setShowModal(true);
      return { granted: false };
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return { granted: false };
    }
  }, [hasCameraPermission, requestCameraPermission]);

  const handleModalRequestPermission = useCallback(async () => {
    if (modalType === 'location') {
      const result = await requestLocationWithModal();
      if (result.granted) {
        setShowModal(false);
      }
    } else if (modalType === 'camera') {
      const result = await requestCameraWithModal();
      if (result.granted) {
        setShowModal(false);
      }
    }
  }, [modalType, requestLocationWithModal, requestCameraWithModal]);

  const handleModalOpenSettings = useCallback(() => {
    openAppSettings();
    setShowModal(false);
  }, [openAppSettings]);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  return {
    showModal,
    modalType,
    requestLocationWithModal,
    requestCameraWithModal,
    handleModalRequestPermission,
    handleModalOpenSettings,
    closeModal,
    isPermissionPermanentlyDenied,
  };
}
