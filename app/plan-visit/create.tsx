import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [searchQuery, setSearchQuery] = useState(''); // Tambah state untuk search query
  const { outlets, loading: outletsLoading, fetchOutlets } = useOutlet(searchQuery); // Pass searchQuery ke useOutlet
  const [showDropdown, setShowDropdown] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  // Remove loadOutlets function karena sekarang auto fetch berdasarkan searchQuery
  // useEffect sudah di-handle di useOutlet hook

  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const formattedOutlets: OutletData[] = useMemo(() => 
    outlets.map(outlet => ({
      id: outlet.id.toString(),
      name: outlet.name,
      code: outlet.code,
    })),
    [outlets]
  );

  const handleDropdownToggle = useCallback((show: boolean) => {
    setShowDropdown(show);
  }, []);

  const closeDropdown = useCallback(() => {
    setShowDropdown(false);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return {
    outlets: formattedOutlets,
    outletsLoading,
    showDropdown,
    handleDropdownToggle,
    closeDropdown,
    handleSearchChange,
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
  const headerStyle = useMemo(() => ({ 
    paddingTop: insets.top + 12, 
    backgroundColor: colors.primary 
  }), [insets.top, colors.primary]);

  return (
    <View className="px-4 pb-4" style={headerStyle}>
      <View className="flex-row items-center justify-between">
        <Pressable 
          onPress={onBack} 
          className="w-8 h-8 items-center justify-center" 
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </Pressable>
        <View className="flex-1 items-center mx-4">
          <Text className="text-white text-xl font-semibold" style={{ fontFamily: 'Inter_600SemiBold' }}>
            Buat Plan Visit
          </Text>
        </View>
        <View className="w-8 h-8" />
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
  onSearchChange,
  loading, 
  fieldErrors, 
  colors 
}: {
  outlets: OutletData[];
  selectedOutletId: string;
  onSelect: (id: string) => void;
  showDropdown: boolean;
  onToggleDropdown: (show: boolean) => void;
  onSearchChange: (query: string) => void;
  loading: boolean;
  fieldErrors: FormErrors;
  colors: any;
}) {
  return (
    <View className="mb-6">
      <Text className="text-base font-medium mb-3" style={{ fontFamily: 'Inter_500Medium', color: colors.text }}>
        Outlet <Text style={{ color: colors.danger }}>*</Text>
      </Text>
      <OutletDropdown
        outlets={outlets}
        selectedOutletId={selectedOutletId || null}
        onSelect={onSelect}
        onSearchChange={onSearchChange}
        showDropdown={showDropdown}
        setShowDropdown={onToggleDropdown}
        loading={loading}
        disabled={loading}
      />
      {fieldErrors.outlet_id && (
        <View className="mt-2">
          {fieldErrors.outlet_id.map((error, index) => (
            <Text key={index} className="text-sm" style={{ fontFamily: 'Inter_400Regular', color: colors.danger }}>
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
  const inputStyle = useMemo(() => ({ 
    borderColor: fieldErrors.visit_date ? colors.danger : colors.border,
    backgroundColor: colors.background,
  }), [fieldErrors.visit_date, colors.danger, colors.border, colors.background]);

  const formattedDateText = useMemo(() => 
    formatDate(planDate),
    [formatDate, planDate]
  );

  return (
    <View className="mb-6">
      <Text className="text-base font-medium mb-3" style={{ fontFamily: 'Inter_500Medium', color: colors.text }}>
        Tanggal Kunjungan <Text style={{ color: colors.danger }}>*</Text>
      </Text>
      <Pressable
        className="rounded-lg border px-4 py-3 flex-row items-center justify-between"
        style={inputStyle}
        onPress={onPress}
        accessibilityRole="button"
      >
        <Text className="text-base flex-1" style={{ fontFamily: 'Inter_400Regular', color: colors.text }}>
          {formattedDateText}
        </Text>
        <IconSymbol name="calendar" size={20} color={colors.textSecondary} />
      </Pressable>
      {fieldErrors.visit_date && (
        <View className="mt-2">
          {fieldErrors.visit_date.map((error, index) => (
            <Text key={index} className="text-sm" style={{ fontFamily: 'Inter_400Regular', color: colors.danger }}>
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
        <View className="flex-row justify-end mt-4 gap-3">
          <Pressable
            className="px-4 py-2 rounded-lg border"
            style={{ borderColor: colors.border, backgroundColor: colors.background }}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text className="font-medium" style={{ fontFamily: 'Inter_500Medium', color: colors.textSecondary }}>
              Batal
            </Text>
          </Pressable>
          <Pressable
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: colors.primary }}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text className="font-medium text-white" style={{ fontFamily: 'Inter_500Medium' }}>
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
  const buttonStyle = useMemo(() => ({ 
    backgroundColor: loading ? colors.textSecondary + '40' : colors.primary 
  }), [loading, colors.textSecondary, colors.primary]);

  const buttonText = useMemo(() => 
    loading ? 'Menyimpan...' : 'Buat Plan Visit',
    [loading]
  );

  return (
    <Pressable
      className="w-full py-4 rounded-lg items-center justify-center"
      style={buttonStyle}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
    >
      <Text className="text-base font-semibold text-white" style={{ fontFamily: 'Inter_600SemiBold' }}>
        {buttonText}
      </Text>
    </Pressable>
  );
});

export default React.memo(function CreatePlanVisitScreen() {
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
    handleSearchChange,
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header colors={colors} insets={insets} onBack={handleBack} />

      <ScrollView 
        className="flex-1 px-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 32 }}
      >
        <OutletSection
          outlets={outlets}
          selectedOutletId={selectedOutletId}
          onSelect={handleOutletSelect}
          showDropdown={showDropdown}
          onToggleDropdown={handleDropdownToggle}
          onSearchChange={handleSearchChange}
          loading={outletsLoading}
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
}); 