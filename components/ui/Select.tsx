import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
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

  return (
    <View style={{ marginBottom: error ? 20 : 0 }}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <TouchableOpacity
        style={[
          styles.selectBox, 
          { borderColor: isFocused ? colors.primary : colors.border },
          disabled && { backgroundColor: '#f0f0f0' },
          modalVisible && { borderColor: colors.primary },
          error && { borderColor: colors.danger }
        ]}
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
          style={[
            styles.selectText, 
            !value && { color: '#aaa' },
            { color: value ? colors.text : '#999' }
          ]}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} style={{ marginLeft: 8, transform: [{ rotate: modalVisible ? '180deg' : '0deg' }] }} />
      </TouchableOpacity>
      
      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
      
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
              <View style={[styles.searchContainer, { borderColor: colors.border }]}>
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
    marginBottom: 6,
    fontSize: 15,
  },
  selectBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  selectText: {
    fontSize: 16,
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    marginTop: 6,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContentContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '30%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
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
    borderRadius: 8,
    borderColor: '#eee',
    margin: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fafafa',
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 15,
    marginLeft: 8,
    paddingVertical: 0,
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  noResultsText: {
    marginLeft: 8,
    fontSize: 15,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
});
