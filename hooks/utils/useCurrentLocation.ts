import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export function useCurrentLocation() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  const getLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status !== 'granted') {
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? undefined,
      });
    } catch (e: any) {
      setError(e?.message || 'Gagal mendapatkan lokasi');
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === 'granted') {
        await getLocation();
      }
    } catch (e: any) {
      setError(e?.message || 'Gagal meminta izin lokasi');
    } finally {
      setLoading(false);
    }
  }, [getLocation]);

  return { location, loading, error, permissionStatus, getLocation, requestPermission };
} 