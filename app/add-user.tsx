import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { useNetwork } from '@/context/network-context';
import { useAddUser } from '@/hooks/data/useAddUser';
import { useReference } from '@/hooks/data/useReference';
import { useThemeStyles } from '@/hooks/utils/useThemeStyles';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FormData {
  name: string;
  username: string;
  phone: string;
  role: string;
  badanusaha: string | string[]; // Support multiple for badan_usaha
  divisi: string | string[]; // Support multiple for divisi
  region: string | string[]; // Support multiple for region
  cluster: string | string[]; // Support multiple for cluster
}

interface SelectOption {
  label: string;
  value: string;
}

const useAddUserForm = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    username: '',
    phone: '',
    role: '',
    badanusaha: '',
    divisi: '',
    region: '',
    cluster: '',
  });

  const updateField = useCallback((field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetDependentFields = useCallback((fields: (keyof FormData)[]) => {
    setFormData(prev => {
      const updated = { ...prev };
      fields.forEach(field => {
        updated[field] = ''; // Reset all dependent fields to empty string
      });
      return updated;
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      username: '',
      phone: '',
      role: '',
      badanusaha: '',
      divisi: '',
      region: '',
      cluster: '',
    });
  }, []);

  return {
    formData,
    updateField,
    resetDependentFields,
    resetForm,
  };
};

const useFieldDependencies = (
  formData: FormData,
  updateField: (field: keyof FormData, value: string | string[]) => void,
  resetDependentFields: (fields: (keyof FormData)[]) => void
) => {
  const {
    roles,
    badanUsaha,
    divisions,
    regions,
    clusters,
    fetchDivisions,
    fetchRegions,
    fetchClusters,
    onRoleChange,
    roleScope,
  } = useReference();

  const handleRoleChange = useCallback((value: string) => {
    updateField('role', value);
    resetDependentFields(['badanusaha', 'divisi', 'region', 'cluster']);
    onRoleChange(Number(value));
  }, [updateField, resetDependentFields, onRoleChange]);

  const handleBadanUsahaChange = useCallback((value: string | string[]) => {
    updateField('badanusaha', value);
    resetDependentFields(['divisi', 'region', 'cluster']);
    // For API call, use first value if array
    const apiValue = Array.isArray(value) ? value[0] : value;
    if (apiValue) {
      fetchDivisions(apiValue);
    }
  }, [updateField, resetDependentFields, fetchDivisions]);

  const handleDivisiChange = useCallback((value: string | string[]) => {
    updateField('divisi', value);
    resetDependentFields(['region', 'cluster']);
    // For API call, use first value if array
    const apiValue = Array.isArray(value) ? value[0] : value;
    if (apiValue) {
      fetchRegions(apiValue);
    }
  }, [updateField, resetDependentFields, fetchRegions]);

  const handleRegionChange = useCallback((value: string | string[]) => {
    updateField('region', value);
    resetDependentFields(['cluster']);
    // For API call, use first value if array
    const apiValue = Array.isArray(value) ? value[0] : value;
    if (apiValue) {
      fetchClusters(apiValue);
    }
  }, [updateField, resetDependentFields, fetchClusters]);

  const handleClusterChange = useCallback((value: string | string[]) => {
    updateField('cluster', value);
  }, [updateField]);

  // Get current selected role data
  const selectedRole = useMemo(() => {
    return roles.find(r => String(r.id) === formData.role);
  }, [roles, formData.role]);

  // Check which fields support multiple selection based on API response
  const getIsMultipleField = useCallback((fieldName: string) => {
    if (!selectedRole?.scope_multiple_fields) return false;
    return selectedRole.scope_multiple_fields.includes(fieldName);
  }, [selectedRole]);

  return {
    roles,
    badanUsaha,
    divisions,
    regions,
    clusters,
    roleScope,
    selectedRole,
    getIsMultipleField,
    handleRoleChange,
    handleBadanUsahaChange,
    handleDivisiChange,
    handleRegionChange,
    handleClusterChange,
  };
};

// BottomSheet Select Component
const BottomSheetSelect = memo(function BottomSheetSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  colors,
  multipleSelection = false
}: {
  label: string;
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  options: SelectOption[];
  placeholder: string;
  colors: any;
  multipleSelection?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%'], []);

  // Handle both single and multiple values
  const selectedValues = useMemo(() => {
    if (multipleSelection) {
      return Array.isArray(value) ? value : (value ? [value] : []);
    }
    return typeof value === 'string' ? value : '';
  }, [value, multipleSelection]);

  const selectedOptions = useMemo(() => {
    if (multipleSelection) {
      const values = Array.isArray(selectedValues) ? selectedValues : [];
      return options.filter(option => values.includes(option.value));
    }
    const singleValue = typeof selectedValues === 'string' ? selectedValues : '';
    return options.filter(option => option.value === singleValue);
  }, [options, selectedValues, multipleSelection]);

  const displayText = useMemo(() => {
    if (selectedOptions.length === 0) return placeholder;
    if (multipleSelection) {
      if (selectedOptions.length === 1) return selectedOptions[0].label;
      return `${selectedOptions.length} item dipilih`;
    }
    return selectedOptions[0]?.label || placeholder;
  }, [selectedOptions, placeholder, multipleSelection]);

  const handleOpen = useCallback(() => {
    setIsVisible(true);
    setTimeout(() => {
      bottomSheetRef.current?.expand();
    }, 100);
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      setIsVisible(false);
    }, 200);
  }, []);

  const handleSelect = useCallback((selectedValue: string) => {
    if (multipleSelection) {
      const currentValues = Array.isArray(selectedValues) ? selectedValues : [];
      const isSelected = currentValues.includes(selectedValue);
      
      let newValues: string[];
      if (isSelected) {
        // Remove from selection
        newValues = currentValues.filter(v => v !== selectedValue);
      } else {
        // Add to selection
        newValues = [...currentValues, selectedValue];
      }
      
      onValueChange(newValues);
    } else {
      onValueChange(selectedValue);
      handleClose();
    }
  }, [multipleSelection, selectedValues, onValueChange, handleClose]);

  const isOptionSelected = useCallback((optionValue: string) => {
    if (multipleSelection) {
      const values = Array.isArray(selectedValues) ? selectedValues : [];
      return values.includes(optionValue);
    }
    return selectedValues === optionValue;
  }, [selectedValues, multipleSelection]);

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

  return (
    <>
      <View className="w-full">
        {/* Label with improved styling */}
        <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200" style={{ fontFamily: 'Inter' }}>
          {label}
          {multipleSelection && <Text className="text-neutral-500 dark:text-neutral-400"> (Multiple)</Text>}
        </Text>
        
        {/* Custom dropdown button with better styling */}
        <TouchableOpacity
          onPress={handleOpen}
          className="flex-row items-center rounded-md border h-12 bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
          activeOpacity={0.7}
        >
          <View className="flex-1 px-4 justify-center">
            <Text 
              className="text-base"
              style={{ 
                fontFamily: 'Inter',
                color: selectedOptions.length > 0 ? '#0f172a' : '#94a3b8',
              }}
              numberOfLines={1}
            >
              {displayText}
            </Text>
          </View>
          <View className="px-4 justify-center">
            <IconSymbol 
              name="chevron.down" 
              size={16} 
              color="#6b7280" 
            />
          </View>
        </TouchableOpacity>
        
        {/* Show selected items for multiple selection */}
        {multipleSelection && selectedOptions.length > 0 && (
          <View className="mt-3 gap-2">
            {selectedOptions.map((option) => (
              <View 
                key={option.value}
                className="flex-row items-center justify-between px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
              >
                <Text 
                  className="text-orange-700 dark:text-orange-300 text-sm flex-1"
                  style={{ fontFamily: 'Inter' }}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
                <TouchableOpacity 
                  onPress={() => handleSelect(option.value)}
                  className="w-6 h-6 rounded-full items-center justify-center bg-red-100 dark:bg-red-900/30"
                >
                  <IconSymbol name="xmark" size={12} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <Modal
        visible={isVisible}
        transparent={true}
        statusBarTranslucent={true}
        animationType="none"
        onRequestClose={handleClose}
      >
        <View style={{ flex: 1 }}>
          <BottomSheet
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={handleClose}
            backdropComponent={renderBackdrop}
            handleIndicatorStyle={{ 
              backgroundColor: '#9ca3af',
              width: 32, 
              height: 3 
            }}
            backgroundStyle={{ 
              backgroundColor: '#ffffff',
              borderTopLeftRadius: 16, 
              borderTopRightRadius: 16,
            }}
          >
            <BottomSheetView style={{ flex: 1 }}>
              {/* Header */}
              <View 
                className="flex-row items-center justify-between px-4 py-4 border-b border-neutral-200"
              >
                <View>
                  <Text 
                    className="text-lg font-semibold text-neutral-900"
                    style={{ fontFamily: 'Inter' }}
                  >
                    {label}
                  </Text>
                  {multipleSelection && (
                    <Text 
                      className="text-sm text-neutral-500"
                      style={{ fontFamily: 'Inter' }}
                    >
                      Pilih beberapa item
                    </Text>
                  )}
                </View>
                
                <TouchableOpacity
                  onPress={handleClose}
                  className="w-8 h-8 rounded-full items-center justify-center bg-neutral-100"
                >
                  <IconSymbol name="xmark" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Options List */}
              <ScrollView 
                className="flex-1"
                showsVerticalScrollIndicator={false}
              >
                {options.map((option) => {
                  const isSelected = isOptionSelected(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => handleSelect(option.value)}
                      className="px-4 py-4 border-b border-neutral-100"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text 
                          className="text-neutral-900 text-base flex-1"
                          style={{ fontFamily: 'Inter' }}
                        >
                          {option.label}
                        </Text>
                        {multipleSelection ? (
                          <View 
                            className="w-6 h-6 rounded border-2 items-center justify-center ml-3"
                            style={{ 
                              borderColor: isSelected ? '#f97316' : '#d1d5db',
                              backgroundColor: isSelected ? '#f97316' : 'transparent'
                            }}
                          >
                            {isSelected && (
                              <IconSymbol 
                                name="checkmark" 
                                size={14} 
                                color="#fff" 
                              />
                            )}
                          </View>
                        ) : (
                          isSelected && (
                            <IconSymbol 
                              name="checkmark" 
                              size={18} 
                              color="#f97316" 
                            />
                          )
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Done button for multiple selection */}
              {multipleSelection && (
                <View className="px-4 py-3 border-t border-neutral-200">
                  <Button
                    title="Selesai"
                    variant="primary"
                    size="lg"
                    fullWidth={true}
                    onPress={handleClose}
                  />
                </View>
              )}
            </BottomSheetView>
          </BottomSheet>
        </View>
      </Modal>
    </>
  );
});

const Header = memo(function Header({ 
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
            Tambah User
          </Text>
        </View>
        <View className="w-8 h-8" />
      </View>
    </View>
  );
});

const LoadingScreen = memo(function LoadingScreen({ 
  colors, 
  onBack 
}: { 
  colors: any; 
  onBack: () => void;
}) {
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header onBack={onBack} colors={colors} />
      <View className="flex-1 justify-center items-center px-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-base" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
          Menyimpan user baru...
        </Text>
      </View>
    </View>
  );
});

export default memo(function AddUserScreen() {
  const router = useRouter();
  const { isConnected } = useNetwork();
  const { loading, error, addUser } = useAddUser();
  const { colors } = useThemeStyles();

  const { formData, updateField, resetDependentFields, resetForm } = useAddUserForm();
  const {
    roles,
    badanUsaha,
    divisions,
    regions,
    clusters,
    roleScope,
    selectedRole,
    getIsMultipleField,
    handleRoleChange,
    handleBadanUsahaChange,
    handleDivisiChange,
    handleRegionChange,
    handleClusterChange,
  } = useFieldDependencies(formData, updateField, resetDependentFields);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleSubmit = useCallback(async () => {
    // Convert all potentially multiple fields to strings for API submission
    const convertToString = (value: string | string[]) => {
      return Array.isArray(value) ? value.join(',') : value;
    };

    const result = await addUser({
      name: formData.name,
      username: formData.username,
      phone: formData.phone,
      role: formData.role,
      badanusaha: convertToString(formData.badanusaha),
      divisi: convertToString(formData.divisi),
      region: convertToString(formData.region),
      cluster: convertToString(formData.cluster),
    });
    
    if (result.success) {
      Alert.alert('Sukses', 'User berhasil ditambahkan!', [
        { text: 'OK', onPress: handleBack }
      ]);
    }
  }, [addUser, formData, handleBack]);

  useEffect(() => {
    if (error) {
      Alert.alert('Gagal', error);
    }
  }, [error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetForm();
    };
  }, [resetForm]);

  // Transform data to options
  const roleOptions = useMemo(() => 
    roles.map((r) => ({ label: r.name, value: String(r.id) })),
    [roles]
  );

  const badanUsahaOptions = useMemo(() => 
    badanUsaha.map((item) => ({ label: item.name, value: String(item.id) })),
    [badanUsaha]
  );

  const divisionOptions = useMemo(() => 
    divisions.map((item) => ({ label: item.name, value: String(item.id) })),
    [divisions]
  );

  const regionOptions = useMemo(() => 
    regions.map((item) => ({ label: item.name, value: String(item.id) })),
    [regions]
  );

  const clusterOptions = useMemo(() => 
    clusters.map((item) => ({ label: item.name, value: String(item.id) })),
    [clusters]
  );

  // Wrapper handler for role change (role is always single selection)
  const handleRoleChangeWrapper = useCallback((value: string | string[]) => {
    handleRoleChange(typeof value === 'string' ? value : value[0] || '');
  }, [handleRoleChange]);

  // Check if form is valid (all required fields filled)
  const isFormValid = useMemo(() => {
    return formData.name.trim() !== '' && 
           formData.username.trim() !== '' && 
           formData.phone.trim() !== '' &&
           formData.role.trim() !== '';
  }, [formData.name, formData.username, formData.phone, formData.role]);

  if (loading) {
    return <LoadingScreen colors={colors} onBack={handleBack} />;
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <Header onBack={handleBack} colors={colors} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            <View className="px-4 pt-6">
              {/* Personal Information - Following login screen pattern */}
              <View className="space-y-6 mb-8 w-full gap-5">
                <Input
                  label="Nama Lengkap"
                  placeholder="Masukkan nama lengkap"
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  size="lg"
                  textContentType="name"
                  autoComplete="name"
                  maxLength={50}
                />

                <Input
                  label="Username"
                  placeholder="Masukkan username"
                  value={formData.username}
                  onChangeText={(value) => updateField('username', value)}
                  size="lg"
                  textContentType="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  maxLength={30}
                />

                <Input
                  label="No. HP"
                  placeholder="Masukkan nomor HP"
                  value={formData.phone}
                  onChangeText={(value) => updateField('phone', value)}
                  size="lg"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  maxLength={15}
                />
              </View>

              {/* Role & Organization - Following login screen pattern */}
              <View className="space-y-6 mb-8 w-full gap-5">
                <BottomSheetSelect
                  label="Role"
                  value={formData.role}
                  onValueChange={handleRoleChangeWrapper}
                  options={roleOptions}
                  placeholder="Pilih Role"
                  colors={colors}
                />

                {roleScope.required.includes('badan_usaha_id') && (
                  <BottomSheetSelect
                    label="Badan Usaha"
                    value={formData.badanusaha}
                    onValueChange={handleBadanUsahaChange}
                    options={badanUsahaOptions}
                    placeholder="Pilih Badan Usaha"
                    colors={colors}
                    multipleSelection={getIsMultipleField('badan_usaha_id')}
                  />
                )}

                {roleScope.required.includes('division_id') && (
                  <BottomSheetSelect
                    label="Divisi"
                    value={formData.divisi}
                    onValueChange={handleDivisiChange}
                    options={divisionOptions}
                    placeholder="Pilih Divisi"
                    colors={colors}
                    multipleSelection={getIsMultipleField('division_id')}
                  />
                )}

                {roleScope.required.includes('region_id') && (
                  <BottomSheetSelect
                    label="Region"
                    value={formData.region}
                    onValueChange={handleRegionChange}
                    options={regionOptions}
                    placeholder="Pilih Region"
                    colors={colors}
                    multipleSelection={getIsMultipleField('region_id')}
                  />
                )}

                {roleScope.required.includes('cluster_id') && (
                  <BottomSheetSelect
                    label="Cluster"
                    value={formData.cluster}
                    onValueChange={handleClusterChange}
                    options={clusterOptions}
                    placeholder="Pilih Cluster"
                    colors={colors}
                    multipleSelection={getIsMultipleField('cluster_id')}
                  />
                )}
              </View>

              {/* Submit Button - Following login screen pattern */}
              <View className="mb-4">
                <Button
                  title={loading ? 'Menyimpan...' : 'Simpan User'}
                  variant="primary"
                  size="lg"
                  fullWidth={true}
                  onPress={handleSubmit}
                  disabled={!isFormValid || loading}
                  loading={loading}
                />
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
});
