import { useEffect, useState } from 'react';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface Outlet {
  id: string | number;
  name: string;
  location: string;
  radius: number;
}

export function useOutletDistanceValidation(outlet: Outlet | null, currentLocation: LocationCoords | null) {
  const [distance, setDistance] = useState<number | null>(null);
  const [locationValidated, setLocationValidated] = useState(false);
  const MAX_DISTANCE = 100;

  function parseLatLong(latlong: string): { latitude: number; longitude: number } | null {
    if (!latlong) return null;
    const [lat, lng] = latlong.split(',').map(Number);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { latitude: lat, longitude: lng };
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  useEffect(() => {
    const outletCoords = outlet ? parseLatLong(outlet.location) : null;
    if (outlet && currentLocation && outletCoords) {
      const calculatedDistance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        outletCoords.latitude,
        outletCoords.longitude
      );
      setDistance(calculatedDistance);
      if (outlet.radius === 0) {
        setLocationValidated(true);
      } else {
        const maxAllowedDistance = outlet.radius || MAX_DISTANCE;
        setLocationValidated(calculatedDistance <= maxAllowedDistance);
      }
    } else {
      setLocationValidated(false);
      setDistance(null);
    }
  }, [outlet, currentLocation]);

  return { distance, locationValidated };
} 