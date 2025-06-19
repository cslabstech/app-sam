import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface LocationStatusProps {
  locationValidated: boolean;
  distance: number | null;
  outletRadius: number;
  onUpdateOutlet: () => void;
  colors: any;
}

export const LocationStatus: React.FC<LocationStatusProps> = ({
  locationValidated,
  distance,
  outletRadius,
  onUpdateOutlet,
  colors,
}) => {
  return (
    <View style={{
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }}>
      {outletRadius === 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
          <Text style={{ marginLeft: 8, color: '#22C55E', fontWeight: '500' }}>
            Validasi lokasi dilewati (radius tidak dibatasi)
          </Text>
        </View>
      ) : (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons 
              name={locationValidated ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={locationValidated ? "#22C55E" : "#EF4444"} 
            />
            <Text style={{ 
              marginLeft: 8, 
              color: locationValidated ? "#22C55E" : "#EF4444", 
              fontWeight: '500' 
            }}>
              {locationValidated ? 'Lokasi valid' : 'Lokasi terlalu jauh'}
            </Text>
          </View>
          {distance !== null && (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
              Jarak: {Math.round(distance)}m (Max: {outletRadius}m)
            </Text>
          )}
          {!locationValidated && (
            <TouchableOpacity
              style={{
                backgroundColor: '#FF8800',
                borderRadius: 6,
                paddingVertical: 8,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-start',
              }}
              onPress={onUpdateOutlet}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500', marginLeft: 4 }}>
                Update Lokasi Outlet
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}; 