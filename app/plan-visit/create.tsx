import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OutletDropdown } from '@/components/OutletDropdown';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useOutlet } from '@/hooks/data/useOutlet';
import { CreatePlanVisitData, usePlanVisit } from '@/hooks/data/usePlanVisit';
import { useThemeStyles } from '@/hooks/utils/useThemeStyles';

interface FormErrors {
  outlet_id?: string[];
  visit_date?: string[];
}

interface OutletData {
  id: string;
  name: string;
  code: string;
}

const useCreatePlanVisitForm = () => {
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');
  const [planDate, setPlanDate] = useState(new Date());
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const clearFieldError = useCallback((field: keyof FormErrors) => {
    setFieldErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const setErrors = useCallback((errors: FormErrors) => {
    if (mounted.current) {
      setFieldErrors(errors);
    }
  }, []);

  const resetForm = useCallback(() => {
    setSelectedOutletId('');
    setPlanDate(new Date());
    setFieldErrors({});
  }, []);

  return {
    selectedOutletId,
    setSelectedOutletId,
    planDate,
    setPlanDate,
    fieldErrors,
    clearFieldError,
    setErrors,
    resetForm,
    mounted,
  };
};

const useOutletManagement = () => {
  const { outlets, loading: outletsLoading, fetchOutlets } = useOutlet('');
  const [showDropdown, setShowDropdown] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  const loadOutlets = useCallback(async () => {
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();
    
    try {
      await fetchOutlets();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Outlet fetch aborted');
        return;
      }
      console.error('Error loading outlets:', error);
    }
  }, [fetchOutlets]);

  useEffect(() => {
    loadOutlets();
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [loadOutlets]);

  const formattedOutlets: OutletData[] = outlets.map(outlet => ({
    id: outlet.id.toString(),
    name: outlet.name,
    code: outlet.code,
  }));

  const handleDropdownToggle = useCallback((show: boolean) => {
    setShowDropdown(show);
  }, []);

  const closeDropdown = useCallback(() => {
    setShowDropdown(false);
  }, []);

  return {
    outlets: formattedOutlets,
    outletsLoading,
    showDropdown,
    handleDropdownToggle,
    closeDropdown,
  };
};

const useDateManager = () => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const handleDateChange = useCallback((event: any, selectedDate?: Date, onDateSelect?: (date: Date) => void, onClearError?: () => void) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate && onDateSelect) {
      onDateSelect(selectedDate);
      onClearError?.();
    }
  }, []);

  const openDatePicker = useCallback(() => {
    setShowDatePicker(true);
  }, []);

  const closeDatePicker = useCallback(() => {
    setShowDatePicker(false);
  }, []);

  return {
    showDatePicker,
    formatDate,
    handleDateChange,
    openDatePicker,
    closeDatePicker,
  };
};

const Header = React.memo(function Header({ 
  colors, 
  insets, 
  onBack 
}: { 
  colors: any; 
  insets: any; 
  onBack: () => void;
}) {
  return (
    <View className="bg-primary-500 px-4 pb-4" style={{ paddingTop: insets.top + 8 }} >
      <View className="flex-row items-center justify-between">
        <Pressable onPress={onBack} className="p-1" accessibilityRole="button">
          <IconSymbol name="chevron.left" size={24} color={colors.textInverse} />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="text-white text-xl font-bold">
            Buat Plan Visit
          </Text>
        </View>
        <View className="w-6 h-6" />
      </View>
    </View>
  );
});

const OutletSection = React.memo(function OutletSection({ 
  outlets, 
  selectedOutletId, 
  onSelect, 
  showDropdown, 
  onToggleDropdown, 
  outletsLoading, 
  loading, 
  fieldErrors, 
  colors 
}: {
  outlets: OutletData[];
  selectedOutletId: string;
  onSelect: (id: string) => void;
  showDropdown: boolean;
  onToggleDropdown: (show: boolean) => void;
  outletsLoading: boolean;
  loading: boolean;
  fieldErrors: FormErrors;
  colors: any;
}) {
  return (
    <View className="mb-6">
      <Text style={{ fontFamily: 'Inter', color: colors.text }} className="text-base mb-3 font-medium">
        Pilih Outlet <Text className="text-red-500">*</Text>
      </Text>
      <View className={fieldErrors.outlet_id ? 'border border-red-500 rounded-lg' : ''}>
        <OutletDropdown
          outlets={outlets}
          selectedOutletId={selectedOutletId || null}
          onSelect={onSelect}
          showDropdown={showDropdown}
          setShowDropdown={onToggleDropdown}
          loading={outletsLoading}
          disabled={loading}
        />
      </View>
      {fieldErrors.outlet_id && (
        <View className="mt-2">
          {fieldErrors.outlet_id.map((error, index) => (
            <Text key={index} style={{ fontFamily: 'Inter', color: colors.danger }} className="text-xs">
              {error}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
});

const DateSection = React.memo(function DateSection({ 
  planDate, 
  onPress, 
  fieldErrors, 
  colors, 
  formatDate 
}: {
  planDate: Date;
  onPress: () => void;
  fieldErrors: FormErrors;
  colors: any;
  formatDate: (date: Date) => string;
}) {
  return (
    <View className="mb-6">
      <Text style={{ fontFamily: 'Inter', color: colors.text }} className="text-base mb-3 font-medium">
        Tanggal Plan Visit <Text className="text-red-500">*</Text>
      </Text>
      <Pressable
        className={`rounded-lg border px-3 py-3 flex-row items-center justify-between ${
          fieldErrors.visit_date ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'
        }`}
        style={{ 
          borderColor: fieldErrors.visit_date ? colors.danger : colors.border,
          backgroundColor: colors.card,
        }}
        onPress={onPress}
        accessibilityRole="button"
      >
        <View className="flex-row items-center">
          <IconSymbol name="calendar" size={20} color={colors.primary} />
          <Text style={{ fontFamily: 'Inter', color: colors.text }} className="ml-3 text-base">
            {formatDate(planDate)}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
      </Pressable>
      {fieldErrors.visit_date && (
        <View className="mt-2">
          {fieldErrors.visit_date.map((error, index) => (
            <Text key={index} style={{ fontFamily: 'Inter', color: colors.danger }} className="text-xs">
              {error}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
});

const DatePickerModal = React.memo(function DatePickerModal({ 
  show, 
  date, 
  onChange, 
  onClose, 
  colors 
}: {
  show: boolean;
  date: Date;
  onChange: (event: any, selectedDate?: Date) => void;
  onClose: () => void;
  colors: any;
}) {
  if (!show) return null;

  return (
    <>
      <DateTimePicker
        value={date}
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={onChange}
        minimumDate={new Date()}
      />
      {Platform.OS === 'ios' && (
        <View className="flex-row justify-end mt-3 gap-3">
          <Pressable
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: colors.secondary }}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={{ fontFamily: 'Inter', color: colors.text }} className="font-semibold">
              Batal
            </Text>
          </Pressable>
          <Pressable
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: colors.primary }}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={{ fontFamily: 'Inter', color: colors.textInverse }} className="font-semibold">
              Selesai
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );
});

const SubmitButton = React.memo(function SubmitButton({ 
  onPress, 
  loading, 
  colors 
}: { 
  onPress: () => void; 
  loading: boolean; 
  colors: any;
}) {
  return (
    <Pressable
      className="w-full py-4 rounded-lg items-center justify-center mb-8"
      style={{ backgroundColor: loading ? colors.disabled : colors.primary }}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
    >
      <Text style={{ fontFamily: 'Inter', color: colors.textInverse }} className="text-base font-semibold">
        {loading ? 'Menyimpan...' : 'Buat Plan Visit'}
      </Text>
    </Pressable>
  );
});

export default function CreatePlanVisitScreen() {
  const { createPlanVisit, loading } = usePlanVisit();
  const { colors } = useThemeStyles();
  const insets = useSafeAreaInsets();

  const {
    selectedOutletId,
    setSelectedOutletId,
    planDate,
    setPlanDate,
    fieldErrors,
    clearFieldError,
    setErrors,
    mounted,
  } = useCreatePlanVisitForm();

  const {
    outlets,
    outletsLoading,
    showDropdown,
    handleDropdownToggle,
    closeDropdown,
  } = useOutletManagement();

  const {
    showDatePicker,
    formatDate,
    handleDateChange,
    openDatePicker,
    closeDatePicker,
  } = useDateManager();

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleOutletSelect = useCallback((outletId: string) => {
    if (!mounted.current) return;
    
    setSelectedOutletId(outletId);
    closeDropdown();
    
    if (fieldErrors.outlet_id) {
      clearFieldError('outlet_id');
    }
  }, [mounted, setSelectedOutletId, closeDropdown, fieldErrors.outlet_id, clearFieldError]);

  const handleDateSelect = useCallback((selectedDate: Date) => {
    if (mounted.current) {
      setPlanDate(selectedDate);
      if (fieldErrors.visit_date) {
        clearFieldError('visit_date');
      }
    }
  }, [mounted, setPlanDate, fieldErrors.visit_date, clearFieldError]);

  const handleDatePickerChange = useCallback((event: any, selectedDate?: Date) => {
    handleDateChange(event, selectedDate, handleDateSelect, () => clearFieldError('visit_date'));
  }, [handleDateChange, handleDateSelect, clearFieldError]);

  const handleScreenPress = useCallback(() => {
    if (showDropdown) {
      closeDropdown();
    }
  }, [showDropdown, closeDropdown]);

  const handleSubmit = useCallback(async () => {
    if (!mounted.current) return;

    setErrors({});

    if (!selectedOutletId) {
      Alert.alert('Error', 'Mohon pilih outlet');
      return;
    }

    const dateString = planDate.toISOString().split('T')[0];
    const data: CreatePlanVisitData = {
      outlet_id: parseInt(selectedOutletId, 10),
      visit_date: dateString,
    };

    try {
      const result = await createPlanVisit(data);
      
      if (!mounted.current) return;
      
      if (result.success) {
        Alert.alert('Berhasil', 'Plan visit berhasil dibuat', [
          {
            text: 'OK',
            onPress: () => {
              if (mounted.current) {
                router.back();
              }
            },
          },
        ]);
      } else {
        const errorMessage = result.error || 'Gagal membuat plan visit';
        
        if ((result as any).fieldErrors) {
          setErrors((result as any).fieldErrors);
          Alert.alert('Error Validasi', 'Silakan periksa dan perbaiki field yang bermasalah');
        } else if (errorMessage.includes('visit_date:') || errorMessage.includes('outlet_id:') || 
                   errorMessage.includes('Tanggal kunjungan') || errorMessage.includes('Outlet')) {
          
          const newFieldErrors: FormErrors = {};
          
          if (errorMessage.includes('visit_date:') || errorMessage.includes('Tanggal kunjungan')) {
            newFieldErrors.visit_date = ['Tanggal kunjungan wajib diisi.'];
          }
          if (errorMessage.includes('outlet_id:') || errorMessage.includes('Outlet')) {
            newFieldErrors.outlet_id = ['Outlet wajib dipilih.'];
          }
          
          setErrors(newFieldErrors);
          Alert.alert('Error Validasi', 'Silakan periksa dan perbaiki field yang bermasalah');
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error) {
      if (mounted.current) {
        console.error('Submit error:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat menyimpan data');
      }
    }
  }, [mounted, setErrors, selectedOutletId, planDate, createPlanVisit]);

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900" style={{ backgroundColor: colors.background }}>
      <Header colors={colors} insets={insets} onBack={handleBack} />

      <ScrollView 
        className="flex-1 px-4 pt-6"
        onTouchStart={handleScreenPress}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <OutletSection
          outlets={outlets}
          selectedOutletId={selectedOutletId}
          onSelect={handleOutletSelect}
          showDropdown={showDropdown}
          onToggleDropdown={handleDropdownToggle}
          outletsLoading={outletsLoading}
          loading={loading}
          fieldErrors={fieldErrors}
          colors={colors}
        />

        <DateSection
          planDate={planDate}
          onPress={openDatePicker}
          fieldErrors={fieldErrors}
          colors={colors}
          formatDate={formatDate}
        />

        <DatePickerModal
          show={showDatePicker}
          date={planDate}
          onChange={handleDatePickerChange}
          onClose={closeDatePicker}
          colors={colors}
        />

        <SubmitButton
          onPress={handleSubmit}
          loading={loading}
          colors={colors}
        />
      </ScrollView>
    </View>
  );
} 