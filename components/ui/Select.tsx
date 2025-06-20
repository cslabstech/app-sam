import { Colors } from '@/constants/Colors';
import { shadow } from '@/constants/Shadows';
import { spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: Option[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  searchable?: boolean;
}

/**
 * Select Component - Dropdown dengan search dan animasi
 * Mengikuti best practice: menggunakan constants untuk colors, spacing, typography
 */
export const Select: React.FC<SelectProps> = ({
  label,
  value,
  options,
  onValueChange,
  placeholder = 'Pilih',
  disabled = false,
  error,
  searchable = options.length > 8,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const selectedLabel = options.find(opt => opt.value === value)?.label || '';
  
  const filteredOptions = searchQuery 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const windowHeight = Dimensions.get('window').height;
  const modalPosition = windowHeight * 0.3;
  
  useEffect(() => {
    if (modalVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      setSearchQuery('');
    }
  }, [modalVisible]);
  
  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  // Konsistensi style dengan Input
  const getBackgroundColor = () => {
    if (disabled) return colors.backgroundAlt;
    return colors.input;
  };
  const getBorderColor = () => {
    if (disabled) return colors.border;
    if (error) return colors.danger;
    if (isFocused || modalVisible) return colors.inputFocus;
    return colors.inputBorder;
  };
  const getBorderWidth = () => (isFocused || modalVisible ? 2 : 1);
  const getHeight = () => 50;
  const getFontSize = () => typography.fontSizeMd;
  const getPadding = () => 16;
  const getBorderRadius = () => 8;

  return (
    <View style={{ marginBottom: error ? spacing.lg : 0 }}>
      {label ? (
        <Text style={{
          fontSize: 14,
          fontWeight: '500',
          fontFamily: typography.fontFamily,
          marginBottom: 6,
          color: colors.text,
        }}>{label}</Text>
      ) : null}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: getBorderWidth(),
          borderRadius: getBorderRadius(),
          paddingHorizontal: getPadding(),
          height: getHeight(),
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          marginBottom: 0,
        }}
        onPress={() => {
          if (!disabled) {
            setIsFocused(true);
            setModalVisible(true);
          }
        }}
        activeOpacity={0.7}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text
          style={{
            fontSize: getFontSize(),
            fontFamily: typography.fontFamily,
            color: value ? colors.text : colors.textSecondary,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} style={{ marginLeft: spacing.sm, transform: [{ rotate: modalVisible ? '180deg' : '0deg' }] }} />
      </TouchableOpacity>
      {error && <Text style={{ fontSize: 12, fontFamily: typography.fontFamily, marginTop: spacing.xs, marginLeft: spacing.xs, color: colors.danger }}>{error}</Text>}
      
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={closeModal}
          activeOpacity={1}
        />
        <Animated.View 
          style={[
            styles.modalContentContainer,
            { 
              opacity: slideAnim,
              transform: [
                { translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })},
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {searchable && (
              <View style={[styles.searchContainer, { 
                borderColor: colors.border,
                backgroundColor: colors.background 
              }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Cari..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
              </View>
            )}
            
            {filteredOptions.length === 0 ? (
              <View style={styles.noResults}>
                <Ionicons name="alert-circle-outline" size={22} color={colors.textSecondary} />
                <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                  Tidak ada pilihan yang sesuai
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredOptions}
                keyExtractor={item => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem, 
                      item.value === value && { backgroundColor: `${colors.primary}10` }
                    ]}
                    onPress={() => {
                      onValueChange(item.value);
                      closeModal();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <Text style={[
                      styles.optionText, 
                      { color: colors.text }
                    ]}>
                      {item.label}
                    </Text>
                    {item.value === value && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 300 }}
              />
            )}
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontWeight: '600',
    fontFamily: typography.fontFamily,
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.md,
  },
  selectBox: {
    borderWidth: 1,
    borderRadius: spacing.sm + 2,
    padding: spacing.sm + 2,
    fontSize: typography.fontSize.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow,
  },
  selectText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily,
    flex: 1,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContentContainer: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '30%',
  },
  modalContent: {
    borderRadius: spacing.md,
    padding: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: spacing.sm,
    margin: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  noResults: {
    padding: spacing.lg + 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  noResultsText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: spacing.sm,
    marginHorizontal: spacing.xs,
    marginVertical: spacing.px,
  },
  optionText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily,
    flex: 1,
  },
});
