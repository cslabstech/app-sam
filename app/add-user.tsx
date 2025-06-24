import { IconSymbol } from '@/components/ui/IconSymbol';
import { Select } from '@/components/ui/Select';
import { useNetwork } from '@/context/network-context';
import { useAddUser } from '@/hooks/data/useAddUser';
import { useReference } from '@/hooks/data/useReference';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const Header = ({ 
  onBack, 
  colors 
}: { 
  onBack: () => void; 
  colors: any;
}) => (
  <View style={[styles.header, { backgroundColor: colors.background, shadowColor: colors.shadow }]}>
    <TouchableOpacity
      onPress={onBack}
      style={styles.backButton}
      accessibilityLabel="Kembali"
      accessibilityHint="Kembali ke halaman sebelumnya"
      accessibilityRole="button"
    >
      <IconSymbol name="chevron.left" size={26} color={colors.text} />
    </TouchableOpacity>
    <Text style={[styles.headerTitle, { color: colors.text }]}>
      Tambah User
    </Text>
  </View>
);

const LoadingScreen = ({ colors }: { colors: any }) => (
  <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={[styles.loadingText, { color: colors.text }]}>
      Menyimpan user...
    </Text>
  </SafeAreaView>
);

const ErrorScreen = ({ 
  error, 
  onBack, 
  colors 
}: { 
  error: string; 
  onBack: () => void; 
  colors: any;
}) => (
  <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
    <Ionicons name="alert-circle" size={24} color={colors.danger} style={styles.errorIcon} />
    <Text style={[styles.errorText, { color: colors.danger }]}>
      {error}
    </Text>
    <Pressable
      style={[styles.errorButton, { backgroundColor: colors.primary }]}
      onPress={onBack}
    >
      <Text style={[styles.errorButtonText, { color: colors.textInverse }]}>
        Kembali
      </Text>
    </Pressable>
  </SafeAreaView>
);

const FormField = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType, 
  autoCapitalize, 
  colors 
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  colors: any;
}) => (
  <View style={styles.fieldContainer}>
    <Text style={[styles.fieldLabel, { color: colors.text }]}>
      {label}
    </Text>
    <TextInput
      style={[
        styles.textInput,
        {
          backgroundColor: colors.inputBackground,
          color: colors.text,
          borderColor: colors.inputBorder,
        }
      ]}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      value={value}
      onChangeText={onChangeText}
      textAlignVertical="center"
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
    />
  </View>
);

const SelectField = ({ 
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
}) => (
  <View style={styles.fieldContainer}>
    <Text style={[styles.fieldLabel, { color: colors.text }]}>
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
    accessibilityLabel="Simpan User"
    accessibilityHint="Menambahkan user baru ke sistem"
  >
    <Text 
      style={[
        styles.submitButtonText, 
        { color: loading ? colors.textSecondary : colors.textInverse }
      ]}
    >
      {loading ? 'Menyimpan...' : 'Simpan User'}
    </Text>
  </Pressable>
);

export default function AddUserScreen() {
  const router = useRouter();
  const { isConnected } = useNetwork();
  const { loading, error, addUser } = useAddUser();
  
  const colors = {
    background: '#fafafa',
    text: '#171717',
    textSecondary: '#737373',
    textTertiary: '#a3a3a3',
    textInverse: '#ffffff',
    primary: '#f97316',
    danger: '#ef4444',
    disabled: '#d4d4d4',
    inputBackground: '#fafafa',
    inputBorder: '#d4d4d4',
    shadow: '#000000',
  };

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
    return <LoadingScreen colors={colors} />;
  }

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={isConnected ? ['top','left','right'] : ['left','right']}
    >
      <Header onBack={handleBack} colors={colors} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <View style={styles.fieldsContainer}>
                <FormField
                  label="Nama Lengkap"
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  placeholder="Masukkan nama lengkap"
                  colors={colors}
                />

                <FormField
                  label="Username"
                  value={formData.username}
                  onChangeText={(value) => updateField('username', value)}
                  placeholder="Masukkan username"
                  autoCapitalize="none"
                  colors={colors}
                />

                <FormField
                  label="No. HP"
                  value={formData.phone}
                  onChangeText={(value) => updateField('phone', value)}
                  placeholder="Masukkan nomor HP"
                  keyboardType="phone-pad"
                  colors={colors}
                />

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

              <SubmitButton
                onPress={handleSubmit}
                loading={loading}
                colors={colors}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  backButton: {
    marginRight: 16,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  errorButton: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  fieldsContainer: {
    gap: 24,
    marginBottom: 32,
    width: '100%',
  },
  fieldContainer: {
    width: '100%',
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    height: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  submitButton: {
    height: 48,
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
