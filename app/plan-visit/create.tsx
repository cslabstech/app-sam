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

export default function CreatePlanVisitScreen() {
  const { createPlanVisit, loading } = usePlanVisit();
  const { outlets, loading: outletsLoading, fetchOutlets } = useOutlet('');
  
  // State dengan better typing
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [planDate, setPlanDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Field errors state
  const [fieldErrors, setFieldErrors] = useState<{
    outlet_id?: string[];
    visit_date?: string[];
  }>({});
  
  const { colors, styles } = useThemeStyles();
  const insets = useSafeAreaInsets();

  // Refs untuk cleanup dan tracking
  const mounted = useRef(true);
  const abortController = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const loadOutlets = useCallback(async () => {
    // Abort previous request if exists
    if (abortController.current) {
      abortController.current.abort();
    }
    
    // Create new abort controller
    abortController.current = new AbortController();
    
    try {
      await fetchOutlets();
    } catch (error) {
      // Handle abort errors gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Outlet fetch aborted');
        return;
      }
      console.error('Error loading outlets:', error);
    }
  }, [fetchOutlets]);

  useEffect(() => {
    if (mounted.current) {
      loadOutlets();
    }
  }, [loadOutlets]);

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate && mounted.current) {
      setPlanDate(selectedDate);
      // Clear date error when user selects a date
      if (fieldErrors.visit_date) {
        setFieldErrors(prev => ({ ...prev, visit_date: undefined }));
      }
    }
  }, [fieldErrors.visit_date]);

  const handleOutletSelect = useCallback((outletId: string) => {
    if (!mounted.current) return;
    
    setSelectedOutletId(outletId);
    setShowDropdown(false); // Auto close dropdown
    
    // Clear outlet error when user selects an outlet
    if (fieldErrors.outlet_id) {
      setFieldErrors(prev => ({ ...prev, outlet_id: undefined }));
    }
  }, [fieldErrors.outlet_id]);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!mounted.current) return;

    // Clear previous errors
    setFieldErrors({});

    // Validation
    if (!selectedOutletId) {
      Alert.alert('Error', 'Mohon pilih outlet');
      return;
    }

    // Convert Date to YYYY-MM-DD format for API
    const dateString = planDate.toISOString().split('T')[0];

    const data: CreatePlanVisitData = {
      outlet_id: parseInt(selectedOutletId, 10),
      visit_date: dateString,
    };

    try {
      const result = await createPlanVisit(data);
      
      if (!mounted.current) return; // Check if component is still mounted
      
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
        
        // Check if field errors are available directly from result
        if ((result as any).fieldErrors) {
          setFieldErrors((result as any).fieldErrors);
          Alert.alert('Error Validasi', 'Silakan periksa dan perbaiki field yang bermasalah');
        } 
        // Fallback: Parse field errors from error message for backward compatibility
        else if (errorMessage.includes('visit_date:') || errorMessage.includes('outlet_id:') || 
                 errorMessage.includes('Tanggal kunjungan') || errorMessage.includes('Outlet')) {
          
          const newFieldErrors: any = {};
          
          // Parse specific field errors from error message
          if (errorMessage.includes('visit_date:') || errorMessage.includes('Tanggal kunjungan')) {
            newFieldErrors.visit_date = ['Tanggal kunjungan wajib diisi.'];
          }
          if (errorMessage.includes('outlet_id:') || errorMessage.includes('Outlet')) {
            newFieldErrors.outlet_id = ['Outlet wajib dipilih.'];
          }
          
          setFieldErrors(newFieldErrors);
          Alert.alert('Error Validasi', 'Silakan periksa dan perbaiki field yang bermasalah');
        } else {
          // General error for non-validation errors
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error) {
      if (mounted.current) {
        console.error('Submit error:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat menyimpan data');
      }
    }
  }, [selectedOutletId, planDate, createPlanVisit]);

  // Handle dropdown state dengan better control
  const handleDropdownToggle = useCallback((show: boolean) => {
    setShowDropdown(show);
  }, []);

  // Close dropdown when component loses focus
  const handleScreenPress = useCallback(() => {
    if (showDropdown) {
      setShowDropdown(false);
    }
  }, [showDropdown]);

  return (
    <View style={[{ flex: 1 }, styles.background.primary]}>
      {/* Header */}
      <View style={[styles.header.primary, { paddingHorizontal: 16, paddingBottom: 16, paddingTop: insets.top + 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }} accessibilityRole="button">
            <IconSymbol name="chevron.left" size={24} color={colors.textInverse} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[{ fontSize: 20, fontWeight: 'bold' }, styles.text.inverse]}>Buat Plan Visit</Text>
          </View>
          <View style={{ width: 22, height: 22 }} />
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }}
        onTouchStart={handleScreenPress}
        keyboardShouldPersistTaps="handled"
      >
        {/* Outlet Selection */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[{ fontSize: 16, marginBottom: 12 }, styles.form.label]}>
            Pilih Outlet <Text style={styles.text.error}>*</Text>
          </Text>
          <View style={fieldErrors.outlet_id ? { borderWidth: 1, borderRadius: 8, ...styles.border.error } : {}}>
            <OutletDropdown
              outlets={outlets.map(outlet => ({
                id: outlet.id.toString(), // Ensure string type
                name: outlet.name,
                code: outlet.code,
              }))}
              selectedOutletId={selectedOutletId || null}
              onSelect={handleOutletSelect}
              showDropdown={showDropdown}
              setShowDropdown={handleDropdownToggle}
              loading={outletsLoading}
              disabled={loading}
            />
          </View>
          {fieldErrors.outlet_id && (
            <View style={{ marginTop: 8 }}>
              {fieldErrors.outlet_id.map((error, index) => (
                <Text key={index} style={styles.form.errorText}>
                  {error}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Plan Date */}
        <View style={{ marginBottom: 32 }}>
          <Text style={[{ fontSize: 16, marginBottom: 12 }, styles.form.label]}>
            Tanggal Plan Visit <Text style={styles.text.error}>*</Text>
          </Text>
          
          <Pressable
            style={[
              {
                borderRadius: 8,
                borderWidth: 1,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              },
              fieldErrors.visit_date ? styles.form.inputError : styles.form.input,
              { borderColor: fieldErrors.visit_date ? colors.danger : colors.inputBorder }
            ]}
            onPress={() => setShowDatePicker(true)}
            accessibilityRole="button"
            disabled={loading}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconSymbol name="calendar" size={20} color={colors.primary} />
              <Text style={[{ marginLeft: 12, fontSize: 16 }, styles.text.primary]}>
                {formatDate(planDate)}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </Pressable>

          {fieldErrors.visit_date && (
            <View style={{ marginTop: 8 }}>
              {fieldErrors.visit_date.map((error, index) => (
                <Text key={index} style={styles.form.errorText}>
                  {error}
                </Text>
              ))}
            </View>
          )}

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={planDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {Platform.OS === 'ios' && showDatePicker && (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 12 }}>
              <Pressable
                style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }, styles.button.secondary]}
                onPress={() => setShowDatePicker(false)}
                accessibilityRole="button"
              >
                <Text style={[{ fontWeight: '600' }, styles.text.primary]}>Batal</Text>
              </Pressable>
              <Pressable
                style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }, styles.button.primary]}
                onPress={() => setShowDatePicker(false)}
                accessibilityRole="button"
              >
                <Text style={[{ fontWeight: '600' }, styles.text.inverse]}>Selesai</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <Pressable
          style={[
            {
              width: '100%',
              paddingVertical: 16,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center'
            },
            loading ? styles.button.disabled : styles.button.primary
          ]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
        >
          <Text style={[{ fontSize: 16, fontWeight: '600' }, styles.text.inverse]}>
            {loading ? 'Menyimpan...' : 'Buat Plan Visit'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
} 