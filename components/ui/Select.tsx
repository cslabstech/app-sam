import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useColorScheme } from '@/hooks/utils/useColorScheme';

// 1. Types first
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

// 2. Custom hook for component logic
const useSelectLogic = ({ 
  options, 
  value, 
  onValueChange, 
  disabled,
  searchable 
}: {
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  disabled: boolean;
  searchable?: boolean;
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Memoized values
  const selectedLabel = useMemo(() => {
    return options.find(opt => opt.value === value)?.label || '';
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(option => 
      option.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const shouldShowSearch = useMemo(() => {
    return searchable && options.length > 5;
  }, [searchable, options.length]);

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

  return {
    modalVisible,
    searchQuery,
    selectedLabel,
    filteredOptions,
    shouldShowSearch,
    handleOpenModal,
    handleCloseModal,
    handleSelectOption,
    handleSearchChange,
  };
};

// 3. Main component
export const Select = React.memo(function Select({
  label,
  value,
  options,
  onValueChange,
  placeholder = 'Pilih',
  disabled = false,
  error,
  searchable = options.length > 8,
}: SelectProps) {
  const colorScheme = useColorScheme();
  const {
    modalVisible,
    searchQuery,
    selectedLabel,
    filteredOptions,
    shouldShowSearch,
    handleOpenModal,
    handleCloseModal,
    handleSelectOption,
    handleSearchChange,
  } = useSelectLogic({ options, value, onValueChange, disabled, searchable });

  // ✅ PRIMARY - NativeWind classes
  const getContainerClasses = () => {
    return error ? 'mb-4' : 'mb-0';
  };

  const getLabelClasses = () => {
    return 'text-sm font-medium font-sans mb-1.5 text-neutral-700 dark:text-neutral-200';
  };

  const getSelectButtonClasses = () => {
    const baseClasses = [
      'flex-row items-center h-12 px-4 rounded-lg border',
      'active:opacity-70',
    ];

    const stateClasses = (() => {
      if (disabled) return 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 opacity-60';
      if (error) return 'bg-white dark:bg-neutral-900 border-danger-500';
      return 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-600';
    })();

    return [...baseClasses, stateClasses].join(' ');
  };

  const getSelectTextClasses = () => {
    const baseClasses = 'flex-1 text-base font-sans';
    const colorClasses = value 
      ? 'text-neutral-900 dark:text-white' 
      : 'text-neutral-500 dark:text-neutral-400';
    
    return `${baseClasses} ${colorClasses}`;
  };

  const getErrorTextClasses = () => {
    return 'text-xs font-sans mt-1 ml-1 text-danger-600 dark:text-danger-400';
  };

  const getModalContentClasses = () => {
    return 'bg-white dark:bg-neutral-900 rounded-t-xl max-h-[80%]';
  };

  const getModalHeaderClasses = () => {
    return 'flex-row items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700';
  };

  const getSearchContainerClasses = () => {
    return 'flex-row items-center border border-neutral-200 dark:border-neutral-600 rounded-lg m-4 px-3 h-11 bg-neutral-50 dark:bg-neutral-800';
  };

  const getSearchInputClasses = () => {
    return 'flex-1 text-base font-sans ml-2 h-11 text-neutral-900 dark:text-white';
  };

  const getOptionItemClasses = (isSelected: boolean) => {
    const baseClasses = 'flex-row items-center py-4 px-3 rounded-lg my-0.5';
    const selectedClasses = isSelected 
      ? 'bg-primary-50 dark:bg-primary-950 border-l-2 border-l-primary-500' 
      : '';
    
    return `${baseClasses} ${selectedClasses}`.trim();
  };

  const getOptionTextClasses = (isSelected: boolean) => {
    const baseClasses = 'flex-1 text-base font-sans';
    const styleClasses = isSelected 
      ? 'font-semibold text-neutral-900 dark:text-white' 
      : 'font-normal text-neutral-900 dark:text-white';
    
    return `${baseClasses} ${styleClasses}`;
  };

  return (
    <View className={getContainerClasses()}>
      {label && (
        <Text className={getLabelClasses()}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        className={getSelectButtonClasses()}
        onPress={handleOpenModal}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text
          className={getSelectTextClasses()}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={colorScheme === 'dark' ? '#a3a3a3' : '#737373'} 
        />
      </TouchableOpacity>
      
      {error && (
        <Text className={getErrorTextClasses()}>
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
        <View className="flex-1 justify-end">
          <TouchableOpacity 
            className="flex-1 bg-black/50"
            onPress={handleCloseModal}
            activeOpacity={1}
          />
          
          <View 
            className={getModalContentClasses()}
            style={{
              // ⚠️ SECONDARY - Complex shadow for modal
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
            }}
          >
            {/* Header */}
            <View className={getModalHeaderClasses()}>
              <Text className="text-lg font-semibold font-sans text-neutral-900 dark:text-white">
                {label || 'Pilih Opsi'}
              </Text>
              <TouchableOpacity 
                onPress={handleCloseModal} 
                className="p-1"
              >
                <Ionicons 
                  name="close" 
                  size={24} 
                  color={colorScheme === 'dark' ? '#a3a3a3' : '#737373'} 
                />
              </TouchableOpacity>
            </View>
            
            {/* Search */}
            {shouldShowSearch && (
              <View className={getSearchContainerClasses()}>
                <Ionicons 
                  name="search" 
                  size={20} 
                  color={colorScheme === 'dark' ? '#a3a3a3' : '#737373'} 
                />
                <TextInput
                  className={getSearchInputClasses()}
                  placeholder="Cari..."
                  placeholderTextColor={colorScheme === 'dark' ? '#a3a3a3' : '#737373'}
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
              <View className="p-8 items-center justify-center flex-row">
                <Ionicons 
                  name="alert-circle-outline" 
                  size={22} 
                  color={colorScheme === 'dark' ? '#a3a3a3' : '#737373'} 
                />
                <Text className="ml-2 text-base font-sans text-neutral-600 dark:text-neutral-400">
                  Tidak ada pilihan yang sesuai
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => `${item.value}-${item.label}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className={getOptionItemClasses(item.value === value)}
                    onPress={() => handleSelectOption(item.value)}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <Text className={getOptionTextClasses(item.value === value)}>
                      {item.label}
                    </Text>
                    {item.value === value && (
                      <Ionicons 
                        name="checkmark" 
                        size={20} 
                        color="#FF6B35" 
                      />
                    )}
                  </TouchableOpacity>
                )}
                className="px-4 pb-4"
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

// 4. Export types for reuse
export type { Option, SelectProps };
