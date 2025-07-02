import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useNetwork } from '@/context/network-context';
import { useAddUser } from '@/hooks/data/useAddUser';
import { useReference } from '@/hooks/data/useReference';
import { useThemeStyles } from '@/hooks/utils/useThemeStyles';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FormData {
  name: string;
  username: string;
  phone: string;
  role: string;
  badanusaha: string;
  divisi: string;
  region: string;
  cluster: string;
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

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetDependentFields = useCallback((fields: (keyof FormData)[]) => {
    setFormData(prev => {
      const updated = { ...prev };
      fields.forEach(field => {
        updated[field] = '';
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
  updateField: (field: keyof FormData, value: string) => void,
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

  const handleBadanUsahaChange = useCallback((value: string) => {
    updateField('badanusaha', value);
    resetDependentFields(['divisi', 'region', 'cluster']);
    fetchDivisions(value);
  }, [updateField, resetDependentFields, fetchDivisions]);

  const handleDivisiChange = useCallback((value: string) => {
    updateField('divisi', value);
    resetDependentFields(['region', 'cluster']);
    fetchRegions(value);
  }, [updateField, resetDependentFields, fetchRegions]);

  const handleRegionChange = useCallback((value: string) => {
    updateField('region', value);
    resetDependentFields(['cluster']);
    fetchClusters(value);
  }, [updateField, resetDependentFields, fetchClusters]);

  const handleClusterChange = useCallback((value: string) => {
    updateField('cluster', value);
  }, [updateField]);

  return {
    roles,
    badanUsaha,
    divisions,
    regions,
    clusters,
    roleScope,
    handleRoleChange,
    handleBadanUsahaChange,
    handleDivisiChange,
    handleRegionChange,
    handleClusterChange,
  };
};

const Header = React.memo(function Header({ 
  onBack, 
  colors 
}: { 
  onBack: () => void; 
  colors: any;
}) {
  const insets = useSafeAreaInsets();
  
  return (
    <View className="px-4 pb-4" style={{ paddingTop: insets.top + 12, backgroundColor: colors.primary }}>
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

const LoadingScreen = React.memo(function LoadingScreen({ 
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

const ErrorScreen = React.memo(function ErrorScreen({ 
  error, 
  onBack, 
  colors 
}: { 
  error: string; 
  onBack: () => void; 
  colors: any;
}) {
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header onBack={onBack} colors={colors} />
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: colors.danger + '20' }}>
          <IconSymbol name="exclamationmark.triangle" size={32} color={colors.danger} />
        </View>
        <Text className="text-lg font-semibold text-center mb-2" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
          Gagal Menambah User
        </Text>
        <Text className="text-sm text-center mb-6" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
          {error}
        </Text>
        <Button
          title="Kembali"
          variant="primary"
          onPress={onBack}
        />
      </View>
    </View>
  );
});

const SelectField = React.memo(function SelectField({ 
  label, 
  value, 
  onValueChange, 
  options, 
  placeholder, 
  colors 
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  colors: any;
}) {
  return (
    <View className="w-full">
      <Text className="mb-3 text-base font-medium" style={{ fontFamily: 'Inter_500Medium', color: colors.text }}>
        {label}
      </Text>
      <Select
        value={value}
        onValueChange={onValueChange}
        options={options}
        placeholder={placeholder}
      />
    </View>
  );
});

export default function AddUserScreen() {
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
    const result = await addUser({
      name: formData.name,
      username: formData.username,
      phone: formData.phone,
      role: formData.role,
      badanusaha: formData.badanusaha,
      divisi: formData.divisi,
      region: formData.region,
      cluster: formData.cluster,
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

  if (error) {
    return (
      <ErrorScreen 
        error={error} 
        onBack={handleBack} 
        colors={colors} 
      />
    );
  }

  if (loading) {
    return <LoadingScreen colors={colors} onBack={handleBack} />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header onBack={handleBack} colors={colors} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
          >
            <View className="pt-4 pb-8">
              {/* Personal Information Card */}
              <TouchableOpacity 
                className="rounded-lg border p-4 mb-4 shadow-sm"
                style={{ 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  minHeight: 48 
                }}
                activeOpacity={1}
              >
                <View className="flex-row items-center mb-4">
                  <View className="w-9 h-9 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '20' }}>
                    <IconSymbol name="person.fill" size={18} color={colors.primary} />
                  </View>
                  <Text className="text-lg font-semibold" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
                    Informasi Personal
                  </Text>
                </View>
                
                <View className="gap-4">
                  <Input
                    label="Nama Lengkap"
                    value={formData.name}
                    onChangeText={(value) => updateField('name', value)}
                    placeholder="Masukkan nama lengkap"
                  />

                  <Input
                    label="Username"
                    value={formData.username}
                    onChangeText={(value) => updateField('username', value)}
                    placeholder="Masukkan username"
                    autoCapitalize="none"
                  />

                  <Input
                    label="No. HP"
                    value={formData.phone}
                    onChangeText={(value) => updateField('phone', value)}
                    placeholder="Masukkan nomor HP"
                    keyboardType="phone-pad"
                  />
                </View>
              </TouchableOpacity>

              {/* Role & Organization Card */}
              <TouchableOpacity 
                className="rounded-lg border p-4 mb-4 shadow-sm"
                style={{ 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  minHeight: 48 
                }}
                activeOpacity={1}
              >
                <View className="flex-row items-center mb-4">
                  <View className="w-9 h-9 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '20' }}>
                    <IconSymbol name="building.2" size={18} color={colors.primary} />
                  </View>
                  <Text className="text-lg font-semibold" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
                    Role & Organisasi
                  </Text>
                </View>
                
                <View className="gap-4">
                  <SelectField
                    label="Role"
                    value={formData.role}
                    onValueChange={handleRoleChange}
                    options={roles.map((r) => ({ label: r.name, value: String(r.id) }))}
                    placeholder="Pilih Role"
                    colors={colors}
                  />

                  {roleScope.required.includes('badan_usaha_id') && (
                    <SelectField
                      label="Badan Usaha"
                      value={formData.badanusaha}
                      onValueChange={handleBadanUsahaChange}
                      options={badanUsaha.map((item) => ({ label: item.name, value: String(item.id) }))}
                      placeholder="Pilih Badan Usaha"
                      colors={colors}
                    />
                  )}

                  {roleScope.required.includes('division_id') && (
                    <SelectField
                      label="Divisi"
                      value={formData.divisi}
                      onValueChange={handleDivisiChange}
                      options={divisions.map((item) => ({ label: item.name, value: String(item.id) }))}
                      placeholder="Pilih Divisi"
                      colors={colors}
                    />
                  )}

                  {roleScope.required.includes('region_id') && (
                    <SelectField
                      label="Region"
                      value={formData.region}
                      onValueChange={handleRegionChange}
                      options={regions.map((item) => ({ label: item.name, value: String(item.id) }))}
                      placeholder="Pilih Region"
                      colors={colors}
                    />
                  )}

                  {roleScope.required.includes('cluster_id') && (
                    <SelectField
                      label="Cluster"
                      value={formData.cluster}
                      onValueChange={handleClusterChange}
                      options={clusters.map((item) => ({ label: item.name, value: String(item.id) }))}
                      placeholder="Pilih Cluster"
                      colors={colors}
                    />
                  )}
                </View>
              </TouchableOpacity>

              <Button
                title={loading ? 'Menyimpan...' : 'Simpan User'}
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onPress={handleSubmit}
                disabled={loading}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}
