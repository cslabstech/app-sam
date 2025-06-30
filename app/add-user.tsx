import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
    <View className="bg-primary-500 px-4 pb-4" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row justify-between items-center">
        <TouchableOpacity onPress={onBack}>
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text 
            className="text-white text-2xl font-bold"
            style={{ fontFamily: 'Inter' }}
          >
            Tambah User
          </Text>
        </View>
        <View className="w-6 h-6" />
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
    <View className="flex-1 bg-white dark:bg-gray-900">
      <Header onBack={onBack} colors={colors} />
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text 
          className="text-base mt-4 text-gray-600 dark:text-gray-400"
          style={{ fontFamily: 'Inter' }}
        >
          Menyimpan user...
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
    <View className="flex-1 bg-white dark:bg-gray-900">
      <Header onBack={onBack} colors={colors} />
      <View className="flex-1 justify-center items-center px-4">
        <IconSymbol name="exclamationmark.triangle" size={48} color={colors.danger} />
        <Text 
          className="text-center mb-4 text-red-600 dark:text-red-400"
          style={{ fontFamily: 'Inter' }}
        >
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
      <Text 
        className="mb-2 text-sm font-medium text-gray-900 dark:text-white"
        style={{ fontFamily: 'Inter' }}
      >
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
    <View className="flex-1 bg-white dark:bg-gray-900">
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
              <Card className="p-4 mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <Text className="text-base font-bold mb-3 text-gray-900 dark:text-white" style={{ fontFamily: 'Inter' }}>
                  Informasi Personal
                </Text>
                
                <View className="gap-4">
                  <Input
                    label="Nama Lengkap"
                    value={formData.name}
                    onChangeText={(value) => updateField('name', value)}
                    placeholder="Masukkan nama lengkap"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />

                  <Input
                    label="Username"
                    value={formData.username}
                    onChangeText={(value) => updateField('username', value)}
                    placeholder="Masukkan username"
                    autoCapitalize="none"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />

                  <Input
                    label="No. HP"
                    value={formData.phone}
                    onChangeText={(value) => updateField('phone', value)}
                    placeholder="Masukkan nomor HP"
                    keyboardType="phone-pad"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </View>
              </Card>

              {/* Role & Organization Card */}
              <Card className="p-4 mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <Text className="text-base font-bold mb-3 text-gray-900 dark:text-white" style={{ fontFamily: 'Inter' }}>
                  Role & Organisasi
                </Text>
                
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
              </Card>

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
