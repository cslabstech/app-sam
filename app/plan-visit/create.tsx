import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

const Header = ({ 
  colors, 
  insets, 
  onBack 
}: { 
  colors: any; 
  insets: any; 
  onBack: () => void;
}) => (
  <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
    <View style={styles.headerContent}>
      <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button">
        <IconSymbol name="chevron.left" size={24} color={colors.textInverse} />
      </Pressable>
      <View style={styles.headerTitleContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Buat Plan Visit
        </Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  </View>
);

const OutletSection = ({ 
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
}) => (
  <View style={styles.section}>
    <Text style={[styles.sectionLabel, { color: colors.text }]}>
      Pilih Outlet <Text style={styles.required}>*</Text>
    </Text>
    <View style={fieldErrors.outlet_id ? [styles.errorBorder, { borderColor: colors.danger }] : undefined}>
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
      <View style={styles.errorContainer}>
        {fieldErrors.outlet_id.map((error, index) => (
          <Text key={index} style={[styles.errorText, { color: colors.danger }]}>
            {error}
          </Text>
        ))}
      </View>
    )}
  </View>
);

const DateSection = ({ 
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
}) => (
  <View style={styles.section}>
    <Text style={[styles.sectionLabel, { color: colors.text }]}>
      Tanggal Plan Visit <Text style={styles.required}>*</Text>
    </Text>
    <Pressable
      style={[
        styles.dateSelector,
        { 
          borderColor: fieldErrors.visit_date ? colors.danger : colors.border,
          backgroundColor: colors.card,
        }
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.dateSelectorContent}>
        <IconSymbol name="calendar" size={20} color={colors.primary} />
        <Text style={[styles.dateText, { color: colors.text }]}>
          {formatDate(planDate)}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
    </Pressable>
    {fieldErrors.visit_date && (
      <View style={styles.errorContainer}>
        {fieldErrors.visit_date.map((error, index) => (
          <Text key={index} style={[styles.errorText, { color: colors.danger }]}>
            {error}
          </Text>
        ))}
      </View>
    )}
  </View>
);

const DatePickerModal = ({ 
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
}) => {
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
        <View style={styles.datePickerActions}>
          <Pressable
            style={[styles.datePickerButton, { backgroundColor: colors.secondary }]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={[styles.datePickerButtonText, { color: colors.text }]}>
              Batal
            </Text>
          </Pressable>
          <Pressable
            style={[styles.datePickerButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={[styles.datePickerButtonText, { color: colors.textInverse }]}>
              Selesai
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );
};

const SubmitButton = ({ 
  onPress, 
  loading, 
  colors 
}: { 
  onPress: () => void; 
  loading: boolean; 
  colors: any;
}) => (
  <Pressable
    style={[
      styles.submitButton,
      { backgroundColor: loading ? colors.disabled : colors.primary }
    ]}
    onPress={onPress}
    disabled={loading}
    accessibilityRole="button"
  >
    <Text style={[styles.submitButtonText, { color: colors.textInverse }]}>
      {loading ? 'Menyimpan...' : 'Buat Plan Visit'}
    </Text>
  </Pressable>
);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header colors={colors} insets={insets} onBack={handleBack} />

      <ScrollView 
        style={styles.content}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 22,
    height: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  required: {
    color: '#ef4444',
  },
  errorBorder: {
    borderWidth: 1,
    borderRadius: 8,
  },
  errorContainer: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
  },
  dateSelector: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 12,
  },
  datePickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  datePickerButtonText: {
    fontWeight: '600',
  },
  submitButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 