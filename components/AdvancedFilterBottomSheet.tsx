import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Select } from '@/components/ui/Select';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

interface FilterOption {
  label: string;
  value: string | number;
  count?: number;
}

interface FilterSection {
  title: string;
  key: string;
  type?: 'options' | 'dropdown' | 'date'; // Added type field
  options?: FilterOption[];
  selectedValue?: string | number;
  multiSelect?: boolean;
  placeholder?: string; // For dropdown
}

interface AdvancedFilterBottomSheetProps {
  sections: FilterSection[];
  onFilterChange: (sectionKey: string, value: string | number | string[]) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export interface AdvancedFilterBottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

export const AdvancedFilterBottomSheet = forwardRef<
  AdvancedFilterBottomSheetRef,
  AdvancedFilterBottomSheetProps
>(function AdvancedFilterBottomSheet(
  { sections, onFilterChange, onApplyFilters, onClearFilters, hasActiveFilters },
  ref
) {
  const colorScheme = useColorScheme();
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);

  const colors = {
    background: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
    surface: colorScheme === 'dark' ? '#262626' : '#f8f9fa',
    border: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    text: colorScheme === 'dark' ? '#ffffff' : '#1f2937',
    textSecondary: colorScheme === 'dark' ? '#9ca3af' : '#6b7280',
    primary: '#f97316',
    success: '#10b981',
    danger: '#ef4444',
    selected: colorScheme === 'dark' ? '#f97316' : '#f97316',
  };

  const snapPoints = useMemo(() => ['60%'], []);

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.expand(),
    dismiss: () => bottomSheetRef.current?.close(),
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleFilterOption = useCallback((sectionKey: string, value: string | number) => {
    onFilterChange(sectionKey, value);
  }, [onFilterChange]);

  const handleDateChange = useCallback((sectionKey: string, event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
    }
    
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      onFilterChange(sectionKey, dateString);
    }
    
    if (Platform.OS === 'ios') {
      setShowDatePicker(null);
    }
  }, [onFilterChange]);

  const handleApply = useCallback(() => {
    onApplyFilters();
    bottomSheetRef.current?.close();
  }, [onApplyFilters]);

  const handleClear = useCallback(() => {
    onClearFilters();
  }, [onClearFilters]);

  const renderSection = useCallback((section: FilterSection, sectionIndex: number) => {
    const sectionType = section.type || 'options';

    return (
      <View key={section.key} className={`px-4 ${sectionIndex === 0 ? 'pt-3 pb-4' : 'py-4'}`}>
        <Text 
          className="text-sm font-semibold mb-3"
          style={{ 
            fontFamily: 'Inter',
            color: colors.text,
          }}
        >
          {section.title}
        </Text>
        
        {/* Dropdown Type */}
        {sectionType === 'dropdown' && section.options && (
          <Select
            value={String(section.selectedValue || '')}
            options={section.options.map(opt => ({ 
              label: opt.label, 
              value: String(opt.value) 
            }))}
            onValueChange={(value) => handleFilterOption(section.key, value)}
            placeholder={section.placeholder || 'Pilih'}
          />
        )}

        {/* Date Picker Type */}
        {sectionType === 'date' && (
          <View>
            <TouchableOpacity
              onPress={() => setShowDatePicker(section.key)}
              className="flex-row items-center justify-between py-3 px-4 rounded-lg border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <Text 
                className="text-base"
                style={{ 
                  fontFamily: 'Inter',
                  color: colors.text,
                }}
              >
                {section.selectedValue 
                  ? new Date(section.selectedValue).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Pilih tanggal'
                }
              </Text>
              <IconSymbol name="calendar" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {showDatePicker === section.key && (
              <DateTimePicker
                value={section.selectedValue ? new Date(section.selectedValue) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => handleDateChange(section.key, event, date)}
              />
            )}
          </View>
        )}

        {/* Options Type (existing radio buttons) */}
        {sectionType === 'options' && section.options && (
          <>
            {/* Layout khusus untuk section dengan 4 items atau kurang - gunakan grid 2 kolom */}
            {section.options.length <= 4 ? (
              <View className="flex-row flex-wrap -mx-1">
                {section.options.map((option) => {
                  const isSelected = section.selectedValue === option.value;
                  return (
                    <View key={`${section.key}-${option.value}`} className="w-1/2 px-1 mb-2">
                      <TouchableOpacity
                        onPress={() => handleFilterOption(section.key, option.value)}
                        className="flex-row items-center py-3 px-3 rounded-lg border"
                        style={{
                          backgroundColor: isSelected ? colors.selected + '10' : colors.surface,
                          borderColor: isSelected ? colors.selected : colors.border,
                        }}
                      >
                        <View 
                          className="w-3 h-3 rounded-full border-2 mr-2 items-center justify-center"
                          style={{
                            borderColor: isSelected ? colors.selected : colors.border,
                            backgroundColor: isSelected ? colors.selected : 'transparent',
                          }}
                        >
                          {isSelected && (
                            <View 
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: '#ffffff' }}
                            />
                          )}
                        </View>
                        
                        <Text 
                          className="text-sm flex-1"
                          style={{ 
                            fontFamily: 'Inter',
                            color: isSelected ? colors.selected : colors.text,
                            fontWeight: isSelected ? '600' : '400',
                          }}
                          numberOfLines={1}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : (
              /* Layout vertikal untuk section dengan banyak items */
              <View className="space-y-2">
                {section.options.map((option) => {
                  const isSelected = section.selectedValue === option.value;
                  return (
                    <TouchableOpacity
                      key={`${section.key}-${option.value}`}
                      onPress={() => handleFilterOption(section.key, option.value)}
                      className="flex-row items-center justify-between py-3 px-3 rounded-lg border"
                      style={{
                        backgroundColor: isSelected ? colors.selected + '10' : colors.surface,
                        borderColor: isSelected ? colors.selected : colors.border,
                      }}
                    >
                      <View className="flex-row items-center flex-1">
                        <View 
                          className="w-3 h-3 rounded-full border-2 mr-3 items-center justify-center"
                          style={{
                            borderColor: isSelected ? colors.selected : colors.border,
                            backgroundColor: isSelected ? colors.selected : 'transparent',
                          }}
                        >
                          {isSelected && (
                            <View 
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: '#ffffff' }}
                            />
                          )}
                        </View>
                        
                        <Text 
                          className="text-sm flex-1"
                          style={{ 
                            fontFamily: 'Inter',
                            color: isSelected ? colors.selected : colors.text,
                            fontWeight: isSelected ? '600' : '400',
                          }}
                        >
                          {option.label}
                        </Text>
                      </View>
                      
                      {option.count !== undefined && (
                        <View 
                          className="px-2 py-1 rounded-full"
                          style={{ backgroundColor: colors.border }}
                        >
                          <Text 
                            className="text-xs font-medium"
                            style={{ 
                              fontFamily: 'Inter',
                              color: colors.textSecondary,
                            }}
                          >
                            {option.count}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>
    );
  }, [colors, handleFilterOption, handleDateChange, showDatePicker]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        {/* Header */}
        <View 
          className="flex-row items-center justify-between px-4 py-2.5 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          <View>
            <Text 
              className="text-base font-semibold"
              style={{ 
                fontFamily: 'Inter',
                color: colors.text,
              }}
            >
              Filter Lanjutan
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.close()}
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.surface }}
          >
            <IconSymbol name="xmark" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Filter Content */}
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {sections.map(renderSection)}
        </ScrollView>

                {/* Action Buttons */}
        <View 
          className="px-4 py-3 border-t bg-white dark:bg-neutral-950"
          style={{ 
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={handleClear}
              className="flex-1 py-2.5 px-4 rounded-lg border items-center"
              style={{
                borderColor: colors.danger,
                backgroundColor: 'transparent',
              }}
              disabled={!hasActiveFilters}
            >
              <Text 
                className="text-sm font-semibold"
                style={{ 
                  fontFamily: 'Inter',
                  color: hasActiveFilters ? colors.danger : colors.textSecondary,
                }}
              >
                Hapus Filter
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleApply}
              className="flex-1 py-2.5 px-4 rounded-lg items-center"
              style={{
                backgroundColor: colors.primary,
              }}
            >
              <Text 
                className="text-sm font-semibold"
                style={{ 
                  fontFamily: 'Inter',
                  color: '#ffffff',
                }}
              >
                Terapkan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}); 