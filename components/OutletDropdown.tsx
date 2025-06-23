import { useThemeStyles } from '@/hooks/utils/useThemeStyles';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

interface Outlet {
  id: string;
  name: string;
  code: string;
}

interface OutletDropdownProps {
  outlets: Outlet[];
  selectedOutletId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
  loading?: boolean;
  showDropdown: boolean;
  setShowDropdown: (v: boolean) => void;
}

export const OutletDropdown: React.FC<OutletDropdownProps> = ({
  outlets,
  selectedOutletId,
  onSelect,
  disabled,
  loading,
  showDropdown,
  setShowDropdown,
}) => {
  const selectedOutlet = outlets.find(o => o.id === selectedOutletId) || null;
  const { colors, styles } = useThemeStyles();

  return (
    <View style={[
      { 
        borderWidth: 1, 
        borderRadius: 8, 
        marginBottom: 8, 
        opacity: disabled ? 0.6 : 1 
      },
      styles.border.default,
      styles.background.input
    ]}>
      <TouchableOpacity
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          padding: 12, 
          justifyContent: 'space-between' 
        }}
        onPress={() => { if (!disabled) setShowDropdown(!showDropdown); }}
        disabled={disabled}
      >
        <Text style={[{ fontSize: 16 }, styles.text.primary]}>
          {selectedOutlet ? `${selectedOutlet.name} (${selectedOutlet.code})` : 'Pilih outlet...'}
        </Text>
        <Ionicons 
          name={showDropdown ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>
      {showDropdown && !disabled && (
        <View style={[
          { 
            maxHeight: 320, 
            borderTopWidth: 1,
          },
          styles.background.input,
          styles.border.default
        ]}>
          {loading ? (
            <Text style={[{ padding: 16 }, styles.text.secondary]}>Memuat outlet...</Text>
          ) : (
            <Animated.ScrollView persistentScrollbar>
              {outlets.map(outlet => (
                <TouchableOpacity
                  key={outlet.id}
                  style={[
                    { 
                      padding: 12, 
                      borderBottomWidth: 1,
                    },
                    styles.border.default
                  ]}
                  onPress={() => {
                    onSelect(outlet.id);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={styles.text.primary}>{outlet.name} ({outlet.code})</Text>
                </TouchableOpacity>
              ))}
            </Animated.ScrollView>
          )}
        </View>
      )}
    </View>
  );
}; 