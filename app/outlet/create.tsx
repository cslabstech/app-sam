import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { useOutletLevelFields } from '@/hooks/data/useReference';
import { useRegisterOutletForm } from '@/hooks/data/useRegisterOutletForm';
import { useThemeStyles } from '@/hooks/utils/useThemeStyles';

type FormField = 'name' | 'address' | 'contactName' | 'contactPhone' | 'notes' | 'type';

interface FormData {
  name: string;
  address: string;
  contactName: string;
  contactPhone: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  type?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
}

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

const FormSection = React.memo(function FormSection({ 
  title, 
  icon, 
  children, 
  styles, 
  colors 
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  styles: any;
  colors: any;
}) {
  const cardStyle = useMemo(() => ({ 
    backgroundColor: colors.card,
    borderColor: colors.border,
    minHeight: 48 
  }), [colors.card, colors.border]);

  const iconBackgroundStyle = useMemo(() => ({ 
    backgroundColor: colors.primary + '20' 
  }), [colors.primary]);

  return (
    <TouchableOpacity 
      className="rounded-lg border p-4 mb-4 shadow-sm"
      style={cardStyle}
      activeOpacity={1}
    >
      <View className="flex-row items-center mb-4">
        <View className="w-9 h-9 rounded-lg items-center justify-center mr-3" style={iconBackgroundStyle}>
          <IconSymbol name={icon} size={18} color={colors.primary} />
        </View>
        <Text className="text-lg font-semibold" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
          {title}
        </Text>
      </View>
      {children}
    </TouchableOpacity>
  );
});

const OutletTypeDropdown = React.memo(function OutletTypeDropdown({
  selectedType,
  showTypeDropdown,
  errors,
  outletTypes,
  onToggle,
  onSelect,
  styles,
  colors,
}: {
  selectedType: string | null;
  showTypeDropdown: boolean;
  errors: FormErrors;
  outletTypes: string[];
  onToggle: () => void;
  onSelect: (type: string) => void;
  styles: any;
  colors: any;
}) {
  const inputStyle = useMemo(() => ({
    borderColor: errors.type ? colors.danger : colors.inputBorder
  }), [errors.type, colors.danger, colors.inputBorder]);

  const dropdownStyle = useMemo(() => ({ 
    backgroundColor: colors.card, 
    borderColor: colors.border 
  }), [colors.card, colors.border]);

  const placeholderText = useMemo(() => 
    selectedType || 'Pilih tipe outlet',
    [selectedType]
  );

  return (
    <View className="mb-4 relative z-10">
      <Text style={{ fontFamily: 'Inter', color: colors.text }} className="text-sm font-medium mb-1.5">
        Tipe Outlet
      </Text>
      <TouchableOpacity
        className={`flex-row justify-between items-center h-11 rounded-lg px-3 border ${
          errors.type ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
        }`}
        style={inputStyle}
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <IconSymbol name="tag.fill" size={18} color={colors.textSecondary} />
          <Text style={{
            fontFamily: 'Inter',
            color: selectedType ? colors.text : colors.textSecondary
          }} className="ml-2 text-base">
            {placeholderText}
          </Text>
        </View>
        <IconSymbol
          name={showTypeDropdown ? 'chevron.up' : 'chevron.down'}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      
      {showTypeDropdown && (
        <View 
          className="mt-1 rounded-lg absolute top-18 left-0 right-0 z-20 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950"
          style={dropdownStyle}
        >
          {outletTypes.map((type, index) => (
            <TouchableOpacity
              key={type}
              className={`py-3 px-4 ${index < outletTypes.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-800' : ''}`}
              style={{
                borderBottomColor: colors.border,
                backgroundColor: selectedType === type ? colors.primary + '20' : 'transparent'
              }}
              onPress={() => onSelect(type)}
            >
              <Text style={{
                fontFamily: 'Inter',
                color: selectedType === type ? colors.primary : colors.text,
                fontWeight: selectedType === type ? '500' : '400'
              }} className="text-base">
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {errors.type && (
        <Text style={{ fontFamily: 'Inter', color: colors.danger }} className="text-xs mt-1">
          {errors.type}
        </Text>
      )}
    </View>
  );
});

const OutletInformationSection = React.memo(function OutletInformationSection({
  formData,
  errors,
  selectedType,
  showTypeDropdown,
  outletTypes,
  onInputChange,
  onToggleDropdown,
  onTypeSelect,
  styles,
  colors,
}: {
  formData: FormData;
  errors: FormErrors;
  selectedType: string | null;
  showTypeDropdown: boolean;
  outletTypes: string[];
  onInputChange: (field: keyof FormData, value: string) => void;
  onToggleDropdown: () => void;
  onTypeSelect: (type: any) => void;
  styles: any;
  colors: any;
}) {
  const nameInputStyle = useMemo(() => ({ height: 80, textAlignVertical: 'top' as const }), []);

  const handleNameChange = useCallback((value: string) => {
    onInputChange('name', value);
  }, [onInputChange]);

  const handleAddressChange = useCallback((value: string) => {
    onInputChange('address', value);
  }, [onInputChange]);

  return (
    <FormSection 
      title="Informasi Outlet" 
      icon="building.2.fill" 
      styles={styles} 
      colors={colors}
    >
      <View className="mb-4">
        <Input
          label="Nama Outlet"
          placeholder="Masukkan nama outlet"
          value={formData.name}
          onChangeText={handleNameChange}
          error={errors.name}
          maxLength={100}
          leftIcon={<IconSymbol name="building.2.fill" size={18} color={colors.textSecondary} />}
        />
      </View>

      <OutletTypeDropdown
        selectedType={selectedType}
        showTypeDropdown={showTypeDropdown}
        errors={errors}
        outletTypes={outletTypes}
        onToggle={onToggleDropdown}
        onSelect={onTypeSelect}
        styles={styles}
        colors={colors}
      />

      <View className="mb-4">
        <Input
          label="Alamat"
          placeholder="Masukkan alamat outlet"
          value={formData.address}
          onChangeText={handleAddressChange}
          error={errors.address}
          multiline
          numberOfLines={3}
          style={nameInputStyle}
          maxLength={500}
          leftIcon={<IconSymbol name="mappin.and.ellipse" size={18} color={colors.textSecondary} />}
        />
      </View>
    </FormSection>
  );
});

const ContactInformationSection = React.memo(function ContactInformationSection({
  formData,
  errors,
  onInputChange,
  styles,
  colors,
}: {
  formData: FormData;
  errors: FormErrors;
  onInputChange: (field: keyof FormData, value: string) => void;
  styles: any;
  colors: any;
}) {
  const notesInputStyle = useMemo(() => ({ height: 80, textAlignVertical: 'top' as const }), []);

  const handleContactNameChange = useCallback((value: string) => {
    onInputChange('contactName', value);
  }, [onInputChange]);

  const handleContactPhoneChange = useCallback((value: string) => {
    onInputChange('contactPhone', value);
  }, [onInputChange]);

  const handleNotesChange = useCallback((value: string) => {
    onInputChange('notes', value);
  }, [onInputChange]);

  return (
    <FormSection 
      title="Informasi Kontak" 
      icon="person.fill" 
      styles={styles} 
      colors={colors}
    >
      <View className="mb-4">
        <Input
          label="Nama Contact Person"
          placeholder="Masukkan nama contact person"
          value={formData.contactName}
          onChangeText={handleContactNameChange}
          error={errors.contactName}
          maxLength={50}
          leftIcon={<IconSymbol name="person.fill" size={18} color={colors.textSecondary} />}
        />
      </View>

      <View className="mb-4">
        <Input
          label="Nomor Telepon"
          placeholder="Masukkan nomor telepon"
          value={formData.contactPhone}
          onChangeText={handleContactPhoneChange}
          error={errors.contactPhone}
          keyboardType="phone-pad"
          maxLength={15}
          leftIcon={<IconSymbol name="phone.fill" size={18} color={colors.textSecondary} />}
        />
      </View>

      <View>
        <Input
          label="Catatan (Opsional)"
          placeholder="Masukkan catatan tambahan"
          value={formData.notes}
          onChangeText={handleNotesChange}
          multiline
          numberOfLines={3}
          style={notesInputStyle}
          maxLength={300}
          leftIcon={<IconSymbol name="text.alignleft" size={18} color={colors.textSecondary} />}
        />
      </View>
    </FormSection>
  );
});

const ActionButtons = React.memo(function ActionButtons({
  isSubmitting,
  onLocationSet,
  onSubmit,
  colors,
}: {
  isSubmitting: boolean;
  onLocationSet: () => void;
  onSubmit: () => void;
  colors: any;
}) {
  const locationButtonStyle = useMemo(() => ({ 
    borderColor: colors.primary 
  }), [colors.primary]);

  return (
    <View className="gap-3 mt-2 mb-6">
      <TouchableOpacity
        className="flex-row items-center justify-center py-3 rounded-lg border border-primary-500"
        style={locationButtonStyle}
        onPress={onLocationSet}
      >
        <IconSymbol name="mappin.and.ellipse" size={20} color={colors.primary} />
        <Text style={{ fontFamily: 'Inter', color: colors.primary }} className="ml-2 text-base font-medium">
          Set Lokasi
        </Text>
      </TouchableOpacity>

      <Button
        title={isSubmitting ? 'Menyimpan...' : 'Submit Outlet'}
        variant="primary"
        size="lg"
        fullWidth
        loading={isSubmitting}
        disabled={isSubmitting}
        onPress={onSubmit}
      />
    </View>
  );
});

// Komponen Tab LEAD/NOO dengan nativewind
const LeadNooTabs = React.memo(function LeadNooTabs({ 
  activeTab, 
  onTabChange,
  colors 
}: { 
  activeTab: 'LEAD' | 'NOO'; 
  onTabChange: (tab: 'LEAD' | 'NOO') => void;
  colors: any;
}) {
  const tabContainerStyle = useMemo(() => ({ 
    backgroundColor: colors.inputBackground 
  }), [colors.inputBackground]);

  const leadTabStyle = useMemo(() => ({ 
    backgroundColor: activeTab === 'LEAD' ? colors.primary : 'transparent' 
  }), [activeTab, colors.primary]);

  const nooTabStyle = useMemo(() => ({ 
    backgroundColor: activeTab === 'NOO' ? colors.primary : 'transparent' 
  }), [activeTab, colors.primary]);

  const leadTextColor = useMemo(() => 
    activeTab === 'LEAD' ? '#fff' : colors.textSecondary,
    [activeTab, colors.textSecondary]
  );

  const nooTextColor = useMemo(() => 
    activeTab === 'NOO' ? '#fff' : colors.textSecondary,
    [activeTab, colors.textSecondary]
  );

  const handleLeadPress = useCallback(() => {
    onTabChange('LEAD');
  }, [onTabChange]);

  const handleNooPress = useCallback(() => {
    onTabChange('NOO');
  }, [onTabChange]);

  return (
    <View className="px-4 mb-4">
      <View className="flex-row rounded-lg p-1" style={tabContainerStyle}>
        <TouchableOpacity
          className="flex-1 py-3 rounded-lg items-center"
          style={leadTabStyle}
          onPress={handleLeadPress}
          accessibilityRole="button"
          accessibilityLabel="Tab LEAD"
        >
          <Text 
            className="font-semibold"
            style={{ 
              fontFamily: 'Inter_600SemiBold',
              color: leadTextColor
            }}
          >
            LEAD
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 rounded-lg items-center"
          style={nooTabStyle}
          onPress={handleNooPress}
          accessibilityRole="button"
          accessibilityLabel="Tab NOO"
        >
          <Text 
            className="font-semibold"
            style={{ 
              fontFamily: 'Inter_600SemiBold',
              color: nooTextColor
            }}
          >
            NOO
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Komponen untuk render field dinamis
const DynamicField = React.memo(function DynamicField({ field, value, onChange, colors }: {
  field: any;
  value: string;
  onChange: (val: string) => void;
  colors: any;
}) {
  const textareaStyle = useMemo(() => ({ 
    height: 80, 
    textAlignVertical: 'top' as const 
  }), []);

  const handleInputChange = useCallback((val: string) => {
    onChange(val);
  }, [onChange]);

  // Tentukan komponen input berdasarkan type
  if (field.type === 'textarea') {
    return (
      <View className="mb-4">
        <Text 
          className="mb-2 text-sm font-medium" 
          style={{ fontFamily: 'Inter', color: colors.text }}
        >
          {field.name}{field.required && <Text className="text-red-500">*</Text>}
        </Text>
        <Input
          value={value}
          onChangeText={handleInputChange}
          placeholder={field.name}
          multiline
          numberOfLines={3}
          style={textareaStyle}
          maxLength={500}
        />
      </View>
    );
  }
  if (field.type === 'select') {
    return (
      <View className="mb-4">
        <Text 
          className="mb-2 text-sm font-medium" 
          style={{ fontFamily: 'Inter', color: colors.text }}
        >
          {field.name}{field.required && <Text className="text-red-500">*</Text>}
        </Text>
        <View className="border rounded-lg px-2">
          <TouchableOpacity>
            {/* TODO: Implement Select Dropdown */}
            <Text 
              className="py-3 text-base text-neutral-500"
              style={{ fontFamily: 'Inter' }}
            >
              {value || `Pilih ${field.name}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const maxLength = useMemo(() => {
    if (field.type === 'number') return 15;
    if (field.type === 'phone') return 15;
    return 100;
  }, [field.type]);

  return (
    <View className="mb-4">
      <Text 
        className="mb-2 text-sm font-medium" 
        style={{ fontFamily: 'Inter', color: colors.text }}
      >
        {field.name}{field.required && <Text className="text-red-500">*</Text>}
      </Text>
      <Input
        value={value}
        onChangeText={handleInputChange}
        placeholder={field.name}
        maxLength={maxLength}
        keyboardType={field.type === 'number' ? 'numeric' : (field.type === 'phone' ? 'phone-pad' : 'default')}
      />
    </View>
  );
});

// Komponen untuk render section dinamis
const DynamicFormSection = React.memo(function DynamicFormSection({ section, form, setForm, colors }: {
  section: any;
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  colors: any;
}) {
  const cardStyle = useMemo(() => ({ 
    backgroundColor: colors.card,
    borderColor: colors.border,
    minHeight: 48 
  }), [colors.card, colors.border]);

  const iconBackgroundStyle = useMemo(() => ({ 
    backgroundColor: colors.primary + '20' 
  }), [colors.primary]);

  const handleFieldChange = useCallback((fieldCode: string) => (val: string) => {
    setForm({ ...form, [fieldCode]: val });
  }, [form, setForm]);

  return (
    <TouchableOpacity 
      className="rounded-lg border p-4 mb-4 shadow-sm"
      style={cardStyle}
      activeOpacity={1}
    >
      <View className="flex-row items-center mb-4">
        <View className="w-9 h-9 rounded-lg items-center justify-center mr-3" style={iconBackgroundStyle}>
          <IconSymbol name="building.2.fill" size={18} color={colors.primary} />
        </View>
        <Text className="text-lg font-semibold" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
          {section.name}
        </Text>
      </View>
      {section.custom_fields.map((field: any) => (
        <DynamicField
          key={field.code}
          field={field}
          value={form[field.code] || ''}
          onChange={handleFieldChange(field.code)}
          colors={colors}
        />
      ))}
    </TouchableOpacity>
  );
});

/**
 * Register Outlet Screen - Form untuk mendaftarkan outlet baru
 * Mengikuti best practice: UI-only components, custom hooks untuk logic
 */
export default React.memo(function RegisterOutletScreen() {
  const { colors, styles } = useThemeStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'LEAD' | 'NOO'>('LEAD');
  // State untuk dynamic form
  const [form, setForm] = useState<Record<string, string>>({});
  const { data: sections, loading, error } = useOutletLevelFields(activeTab);
  
  const {
    formData,
    errors,
    isSubmitting,
    selectedType,
    setSelectedType,
    showTypeDropdown,
    setShowTypeDropdown,
    outletTypes,
    handleInputChange,
    handleTypeSelect,
    handleSubmit,
  } = useRegisterOutletForm();

  // Optimized callbacks
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleLocationSet = useCallback(() => {
    Alert.alert(
      'Set Location',
      'Location picker akan diimplementasikan di versi selanjutnya',
      [{ text: 'OK' }]
    );
  }, []);

  const handleToggleDropdown = useCallback(() => {
    setShowTypeDropdown(!showTypeDropdown);
  }, [showTypeDropdown, setShowTypeDropdown]);

  const handleTabChange = useCallback((tab: 'LEAD' | 'NOO') => {
    setActiveTab(tab);
  }, []);

  // Memoized loading and error states
  const loadingText = useMemo(() => 
    loading ? 'Memuat form...' : null,
    [loading]
  );

  const errorText = useMemo(() => 
    error ? error : null,
    [error]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      setForm({});
    };
  }, []);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header 
        onBack={handleBack}
        colors={colors}
      />
      
      {/* Tabs LEAD/NOO */}
      <LeadNooTabs activeTab={activeTab} onTabChange={handleTabChange} colors={colors} />
      
      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-4 pb-8">
          {loadingText && (
            <Text 
              className="text-center text-base my-8" 
              style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}
            >
              {loadingText}
            </Text>
          )}
          {errorText && (
            <Text 
              className="text-center text-base my-8"
              style={{ fontFamily: 'Inter_400Regular', color: colors.danger }}
            >
              {errorText}
            </Text>
          )}
          {sections && sections.map(section => (
            <DynamicFormSection
              key={section.code}
              section={section}
              form={form}
              setForm={setForm}
              colors={colors}
            />
          ))}
          <ActionButtons
            isSubmitting={isSubmitting}
            onLocationSet={handleLocationSet}
            onSubmit={handleSubmit}
            colors={colors}
          />
        </View>
      </ScrollView>
    </View>
  );
});

