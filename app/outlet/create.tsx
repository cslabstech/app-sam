import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/auth-context';
import { useOutlet } from '@/hooks/data/useOutlet';
import { useOutletLevelFields } from '@/hooks/data/useReference';
import { useCurrentLocation } from '@/hooks/utils/useCurrentLocation';
import { useThemeStyles } from '@/hooks/utils/useThemeStyles';

const Header = React.memo(function Header({ 
  onBack, 
  colors
}: {
  onBack: () => void;
  colors: any;
}) {
  const insets = useSafeAreaInsets();
  
  const headerStyle = useMemo(() => ({ 
    paddingTop: insets.top + 12, 
    backgroundColor: colors.primary 
  }), [insets.top, colors.primary]);

  return (
    <View className="px-4 pb-4" style={headerStyle}>
      <View className="flex-row justify-between items-center">
        <TouchableOpacity 
          onPress={onBack}
          className="w-8 h-8 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1 items-center mx-4">
          <Text className="text-white text-xl font-semibold" style={{ fontFamily: 'Inter_600SemiBold' }}>
            Register Outlet
          </Text>
        </View>
        <View className="w-8 h-8" />
      </View>
    </View>
  );
});

// Komponen Tab LEAD/NOO dengan nativewind
const LeadNooTabs = React.memo(function LeadNooTabs({ 
  activeTab, 
  onTabChange
}: { 
  activeTab: 'LEAD' | 'NOO'; 
  onTabChange: (tab: 'LEAD' | 'NOO') => void;
}) {
  const handleLeadPress = useCallback(() => {
    onTabChange('LEAD');
  }, [onTabChange]);

  const handleNooPress = useCallback(() => {
    onTabChange('NOO');
  }, [onTabChange]);

  return (
    <View className="px-4 mb-4">
      <View className="flex-row rounded-lg p-1 bg-neutral-100 dark:bg-neutral-800">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg items-center ${
            activeTab === 'LEAD' ? 'bg-orange-500' : 'bg-transparent'
          }`}
          onPress={handleLeadPress}
          accessibilityRole="button"
          accessibilityLabel="Tab LEAD"
          activeOpacity={0.7}
        >
          <Text 
            className={`font-semibold ${
              activeTab === 'LEAD' ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'
            }`}
            style={{ fontFamily: 'Inter' }}
          >
            LEAD
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg items-center ${
            activeTab === 'NOO' ? 'bg-orange-500' : 'bg-transparent'
          }`}
          onPress={handleNooPress}
          accessibilityRole="button"
          accessibilityLabel="Tab NOO"
          activeOpacity={0.7}
        >
          <Text 
            className={`font-semibold ${
              activeTab === 'NOO' ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'
            }`}
            style={{ fontFamily: 'Inter' }}
          >
            NOO
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Komponen untuk render field dinamis
const DynamicField = React.memo(function DynamicField({ 
  field, 
  value, 
  onChange, 
  error 
}: {
  field: any;
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  const textareaStyle = useMemo(() => ({ 
    height: 80, 
    textAlignVertical: 'top' as const 
  }), []);

  const handleInputChange = useCallback((val: string) => {
    onChange(val);
  }, [onChange]);

  // Handle Select/Dropdown field
  if (field.type === 'select') {
    return (
      <View className="mb-6">
        <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200" style={{ fontFamily: 'Inter' }}>
          {field.name}{field.required && <Text className="text-red-500"> *</Text>}
        </Text>
        <TouchableOpacity className="flex-row items-center rounded-md border h-12 bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700">
          <View className="flex-1 px-4 justify-center">
            <Text className="text-base text-neutral-500 dark:text-neutral-400" style={{ fontFamily: 'Inter' }}>
              {value || `Pilih ${field.name}`}
            </Text>
          </View>
          <View className="px-4 justify-center">
            <IconSymbol name="chevron.down" size={16} color="#6b7280" />
          </View>
        </TouchableOpacity>
        {error && (
          <Text className="text-red-600 dark:text-red-400 text-sm mt-2" style={{ fontFamily: 'Inter' }}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  // Handle Textarea field
  if (field.type === 'textarea') {
    return (
      <View className="mb-6">
        <Input
          label={field.name + (field.required ? ' *' : '')}
          placeholder={`Masukkan ${field.name.toLowerCase()}`}
          value={value}
          onChangeText={handleInputChange}
          error={error}
          size="lg"
          multiline
          numberOfLines={3}
          style={textareaStyle}
          maxLength={500}
        />
      </View>
    );
  }

  // Determine input props based on field type
  const getInputProps = () => {
    switch (field.type) {
      case 'number':
        return {
          keyboardType: 'numeric' as const,
          maxLength: 15
        };
      case 'phone':
        return {
          keyboardType: 'phone-pad' as const,
          maxLength: 15
        };
      case 'email':
        return {
          keyboardType: 'email-address' as const,
          maxLength: 100,
          autoCapitalize: 'none' as const
        };
      default:
        return {
          keyboardType: 'default' as const,
          maxLength: 100
        };
    }
  };

  const inputProps = getInputProps();

  return (
    <View className="mb-6">
      <Input
        label={field.name + (field.required ? ' *' : '')}
        placeholder={`Masukkan ${field.name.toLowerCase()}`}
        value={value}
        onChangeText={handleInputChange}
        error={error}
        size="lg"
        {...inputProps}
      />
    </View>
  );
});

// Komponen untuk render section dinamis
const DynamicFormSection = React.memo(function DynamicFormSection({ 
  section, 
  formData, 
  onFieldChange,
  errors 
}: {
  section: any;
  formData: Record<string, string>;
  onFieldChange: (fieldCode: string, value: string) => void;
  errors: Record<string, string>;
}) {
  const handleFieldChange = useCallback((fieldCode: string) => (val: string) => {
    onFieldChange(fieldCode, val);
  }, [onFieldChange]);

  return (
    <View className="mb-6">
      <View className="mb-6">
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4" style={{ fontFamily: 'Inter' }}>
          {section.name}
        </Text>
        {section.description && (
          <Text className="text-sm text-neutral-600 dark:text-neutral-400 mb-4" style={{ fontFamily: 'Inter' }}>
            {section.description}
          </Text>
        )}
      </View>
      {section.custom_fields.map((field: any) => (
        <DynamicField
          key={field.code}
          field={field}
          value={formData[field.code] || ''}
          onChange={handleFieldChange(field.code)}
          error={errors[field.code]}
        />
      ))}
    </View>
  );
});

const ActionButtons = React.memo(function ActionButtons({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <View className="mt-2 mb-6">
      <Button
        title={isSubmitting ? 'Menyimpan...' : 'Submit Outlet'}
        variant="primary"
        size="lg"
        fullWidth={true}
        loading={isSubmitting}
        disabled={isSubmitting}
        onPress={onSubmit}
      />
    </View>
  );
});

/**
 * Register Outlet Screen - Form dinamis berdasarkan API
 * Semua field diambil dari endpoint outlet-level-fields
 */
export default React.memo(function RegisterOutletScreen() {
  const { colors } = useThemeStyles();
  const { token } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'LEAD' | 'NOO'>('LEAD');
  
  // State untuk dynamic form - semua field dari API
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Location hook untuk mendapatkan koordinat saat ini
  const { 
    location, 
    loading: locationLoading, 
    error: locationError, 
    permissionStatus,
    getLocation, 
    requestPermission 
  } = useCurrentLocation();
  
  // Outlet hook untuk API calls
  const { createOutlet } = useOutlet('');
  
  // Fetch dynamic form structure
  const { data: sections, loading, error } = useOutletLevelFields(activeTab);

  // Auto-request location saat component mount
  useEffect(() => {
    const initLocation = async () => {
      if (permissionStatus === null) {
        await requestPermission();
      } else if (permissionStatus === 'granted' && !location) {
        await getLocation();
      }
    };
    
    initLocation();
  }, [permissionStatus, location, requestPermission, getLocation]);

  // Handle field change dengan error clearing
  const handleFieldChange = useCallback((fieldCode: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldCode]: value
    }));
    
    // Clear error untuk field ini
    if (errors[fieldCode]) {
      setErrors(prev => ({
        ...prev,
        [fieldCode]: ''
      }));
    }
  }, [errors]);

  // Validasi form berdasarkan field requirements
  const validateForm = useCallback((): boolean => {
    if (!sections) return false;
    
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    // Check if location is available
    if (!location) {
      Alert.alert(
        'Lokasi Diperlukan',
        'Mohon aktifkan GPS dan berikan izin akses lokasi untuk melanjutkan',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Coba Lagi', onPress: () => getLocation() }
        ]
      );
      return false;
    }

    sections.forEach(section => {
      section.custom_fields.forEach(field => {
        const value = formData[field.code] || '';
        
        // Check required fields
        if (field.required && !value.trim()) {
          newErrors[field.code] = `${field.name} wajib diisi`;
          hasErrors = true;
        }
        
        // Check validation rules
        if (value && field.validation_rules && field.validation_rules.length > 0) {
          field.validation_rules.forEach((rule: any) => {
            // Implementasi validation rules sesuai dengan rule dari API
            if (rule.type === 'min_length' && value.length < rule.value) {
              newErrors[field.code] = `${field.name} minimal ${rule.value} karakter`;
              hasErrors = true;
            }
            if (rule.type === 'max_length' && value.length > rule.value) {
              newErrors[field.code] = `${field.name} maksimal ${rule.value} karakter`;
              hasErrors = true;
            }
            if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              newErrors[field.code] = `${field.name} format email tidak valid`;
              hasErrors = true;
            }
            if (rule.type === 'phone' && !/^[0-9]{10,15}$/.test(value.replace(/[^0-9]/g, ''))) {
              newErrors[field.code] = `${field.name} format nomor telepon tidak valid`;
              hasErrors = true;
            }
          });
        }
      });
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [sections, formData, location, getLocation]);

  // Handle submit dengan API call yang sesungguhnya
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare payload dengan struktur yang sesuai API backend
      const apiPayload = {
        // Convert dynamic form data to API format
        ...formData,
        // Add location coordinates
        latitude: location?.latitude,
        longitude: location?.longitude,
        location_accuracy: location?.accuracy,
        // Add level info
        level: activeTab,
        // Ensure proper location format for backend
        location: `${location?.latitude},${location?.longitude}`
      };
      
      console.log('Submitting outlet data to API:', apiPayload);
      
      // Call actual API endpoint
      const result = await createOutlet(apiPayload);
      
      setIsSubmitting(false);
      
      if (result.success) {
        Alert.alert(
          'Berhasil', 
          'Outlet berhasil didaftarkan dengan lokasi tersimpan',
          [
            { 
              text: 'OK', 
              onPress: () => router.push('/(tabs)/outlets') 
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Gagal mendaftarkan outlet');
      }
      
    } catch (error: any) {
      setIsSubmitting(false);
      console.error('Create outlet error:', error);
      Alert.alert('Error', error.message || 'Gagal mendaftarkan outlet');
    }
  }, [validateForm, activeTab, formData, location, createOutlet, router]);

  // Handle tab change
  const handleTabChange = useCallback((tab: 'LEAD' | 'NOO') => {
    setActiveTab(tab);
    // Reset form data when switching tabs
    setFormData({});
    setErrors({});
  }, []);

  // Optimized callbacks
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Status indicator untuk location
  const locationStatus = useMemo(() => {
    if (locationLoading) return 'Mengambil lokasi...';
    if (locationError) return `Error: ${locationError}`;
    if (location) return `📍 Lokasi tersimpan (${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)})`;
    if (permissionStatus === 'denied') return '❌ Izin lokasi ditolak';
    return '⏳ Menunggu lokasi...';
  }, [locationLoading, locationError, location, permissionStatus]);

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <Header onBack={handleBack} colors={colors} />
      
      {/* Tabs LEAD/NOO */}
      <LeadNooTabs activeTab={activeTab} onTabChange={handleTabChange} />
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="px-4 pt-4 pb-8 space-y-6">
          {/* Location Status Indicator */}
          <View className="mb-4 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <Text className="text-sm text-neutral-600 dark:text-neutral-400" style={{ fontFamily: 'Inter' }}>
              {locationStatus}
            </Text>
            {permissionStatus === 'denied' && (
              <TouchableOpacity 
                className="mt-2"
                onPress={requestPermission}
                activeOpacity={0.7}
              >
                <Text className="text-sm text-orange-600 dark:text-orange-400 font-medium" style={{ fontFamily: 'Inter' }}>
                  Coba minta izin lagi
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loading && (
            <Text className="text-center text-base my-8 text-neutral-600 dark:text-neutral-400" style={{ fontFamily: 'Inter' }}>
              Memuat form...
            </Text>
          )}
          
          {error && (
            <Text className="text-center text-base my-8 text-red-600 dark:text-red-400" style={{ fontFamily: 'Inter' }}>
              {error}
            </Text>
          )}

          {sections && sections.map(section => (
            <DynamicFormSection
              key={section.code}
              section={section}
              formData={formData}
              onFieldChange={handleFieldChange}
              errors={errors}
            />
          ))}

          {sections && sections.length > 0 && (
            <ActionButtons
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
});

