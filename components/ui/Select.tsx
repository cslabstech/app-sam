import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
 * Select Component - Versi yang robust tanpa animasi kompleks
 * Menghindari useInsertionEffect errors dan lebih stabil
 */
export const Select: React.FC<SelectProps> = React.memo(({
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

  // Memoized values
  const selectedLabel = React.useMemo(() => {
    return options.find(opt => opt.value === value)?.label || '';
  }, [options, value]);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(option => 
      option.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Handlers
  const handleOpenModal = useCallback(() => {
    if (!disabled) {
      setSearchQuery('');
      setModalVisible(true);
    }
  }, [disabled]);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSearchQuery('');
  }, []);

  const handleSelectOption = useCallback((optionValue: string) => {
    onValueChange(optionValue);
    handleCloseModal();
  }, [onValueChange, handleCloseModal]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Styles
  const containerStyle = {
    backgroundColor: disabled ? colors.backgroundAlt : colors.input,
    borderColor: disabled ? colors.border : error ? colors.danger : colors.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  };

  return (
    <View style={{ marginBottom: error ? spacing.lg : 0 }}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        style={containerStyle}
        onPress={handleOpenModal}
        activeOpacity={0.7}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text
          style={[
            styles.selectText,
            { 
              color: value ? colors.text : colors.textSecondary,
              flex: 1 
            }
          ]}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>
      
      {error && (
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {error}
        </Text>
      )}
      
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            onPress={handleCloseModal}
            activeOpacity={1}
          />
          
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {label || 'Pilih Opsi'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Search */}
            {searchable && options.length > 5 && (
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
                  onChangeText={handleSearchChange}
                  autoCorrect={false}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
              </View>
            )}
            
            {/* Options List */}
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
                keyExtractor={(item) => `${item.value}-${item.label}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      item.value === value && { 
                        backgroundColor: `${colors.primary}15`,
                        borderLeftWidth: 3,
                        borderLeftColor: colors.primary
                      }
                    ]}
                    onPress={() => handleSelectOption(item.value)}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <Text style={[
                      styles.optionText, 
                      { 
                        color: colors.text,
                        fontWeight: item.value === value ? '600' : '400'
                      }
                    ]}>
                      {item.label}
                    </Text>
                    {item.value === value && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                style={styles.optionsList}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews={true}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={21}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
});

Select.displayName = 'Select';

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: typography.fontFamily,
    marginBottom: 6,
  },
  selectText: {
    fontSize: typography.fontSizeMd,
    fontFamily: typography.fontFamily,
  },
  errorText: {
    fontSize: 12,
    fontFamily: typography.fontFamily,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: -2 },
        shadowRadius: 10,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: typography.fontFamily,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    margin: spacing.lg,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizeMd,
    fontFamily: typography.fontFamily,
    marginLeft: spacing.sm,
    height: 44,
  },
  noResults: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  noResultsText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSizeMd,
    fontFamily: typography.fontFamily,
  },
  optionsList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  optionText: {
    fontSize: typography.fontSizeMd,
    fontFamily: typography.fontFamily,
    flex: 1,
  },
}); 