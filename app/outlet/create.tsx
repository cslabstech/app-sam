import React, { useCallback, useState } from 'react';
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
            Register Outlet
          </Text>
        </View>
        <View className="w-6 h-6" />
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
  return (
    <View 
      className="rounded-xl p-4 mb-4 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
    >
      <View className="flex-row items-center mb-4">
        <IconSymbol name={icon} size={18} color={colors.primary} />
        <Text style={{ fontFamily: 'Inter', color: colors.text }} className="text-base font-semibold ml-2">
          {title}
        </Text>
      </View>
      {children}
    </View>
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
  return (
    <View className="mb-4 relative z-10">
      <Text style={{ fontFamily: 'Inter', color: colors.text }} className="text-sm font-medium mb-1.5">
        Tipe Outlet
      </Text>
      <TouchableOpacity
        className={`flex-row justify-between items-center h-11 rounded-lg px-3 border ${
          errors.type ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'
        }`}
        style={{ borderColor: errors.type ? colors.danger : colors.inputBorder }}
        onPress={onToggle}
      >
        <View className="flex-row items-center">
          <IconSymbol name="tag.fill" size={18} color={colors.textSecondary} />
          <Text style={{
            fontFamily: 'Inter',
            color: selectedType ? colors.text : colors.textSecondary
          }} className="ml-2 text-base">
            {selectedType || 'Pilih tipe outlet'}
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
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
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
          onChangeText={(value) => onInputChange('name', value)}
          error={errors.name}
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
          onChangeText={(value) => onInputChange('address', value)}
          error={errors.address}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
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
          onChangeText={(value) => onInputChange('contactName', value)}
          error={errors.contactName}
          leftIcon={<IconSymbol name="person.fill" size={18} color={colors.textSecondary} />}
        />
      </View>

      <View className="mb-4">
        <Input
          label="Nomor Telepon"
          placeholder="Masukkan nomor telepon"
          value={formData.contactPhone}
          onChangeText={(value) => onInputChange('contactPhone', value)}
          error={errors.contactPhone}
          keyboardType="phone-pad"
          leftIcon={<IconSymbol name="phone.fill" size={18} color={colors.textSecondary} />}
        />
      </View>

      <View>
        <Input
          label="Catatan (Opsional)"
          placeholder="Masukkan catatan tambahan"
          value={formData.notes}
          onChangeText={(value) => onInputChange('notes', value)}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
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
  return (
    <View className="gap-3 mt-2 mb-6">
      <TouchableOpacity
        className="flex-row items-center justify-center py-3 rounded-lg border border-primary-500"
        style={{ borderColor: colors.primary }}
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
  return (
    <View className="px-4 mb-4">
      <View className="flex-row bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
        <TouchableOpacity
          className={`flex-1 py-2 rounded-md items-center ${activeTab === 'LEAD' ? 'bg-primary-500' : ''}`}
          onPress={() => onTabChange('LEAD')}
        >
          <Text 
            className={`font-semibold ${activeTab === 'LEAD' ? 'text-white' : 'text-neutral-500 dark:text-neutral-300'}`}
            style={{ fontFamily: 'Inter' }}
          >
            LEAD
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 rounded-md items-center ${activeTab === 'NOO' ? 'bg-primary-500' : ''}`}
          onPress={() => onTabChange('NOO')}
        >
          <Text 
            className={`font-semibold ${activeTab === 'NOO' ? 'text-white' : 'text-neutral-500 dark:text-neutral-300'}`}
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
const DynamicField = React.memo(function DynamicField({ field, value, onChange, colors }: {
  field: any;
  value: string;
  onChange: (val: string) => void;
  colors: any;
}) {
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
          onChangeText={onChange}
          placeholder={field.name}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
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
        onChangeText={onChange}
        placeholder={field.name}
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
  return (
    <View 
      className="rounded-xl p-4 mb-4 border" 
      style={{ 
        backgroundColor: colors.cardBackground || colors.background, 
        borderColor: colors.border + '40' 
      }}
    >
      <View className="flex-row items-center mb-4">
        <IconSymbol name="building.2.fill" size={18} color={colors.primary} />
        <Text style={{ fontFamily: 'Inter', color: colors.text }} className="text-base font-semibold ml-2">
          {section.name}
        </Text>
      </View>
      {section.custom_fields.map((field: any) => (
        <DynamicField
          key={field.code}
          field={field}
          value={form[field.code] || ''}
          onChange={val => setForm({ ...form, [field.code]: val })}
          colors={colors}
        />
      ))}
    </View>
  );
});

/**
 * Register Outlet Screen - Form untuk mendaftarkan outlet baru
 * Mengikuti best practice: UI-only components, custom hooks untuk logic
 */
export default function RegisterOutletScreen() {
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

  return (
    <View 
      className="flex-1 bg-white" 
      style={{ backgroundColor: colors.background }}
    >
      <Header 
        onBack={handleBack}
        colors={colors}
      />
      
      {/* Tabs LEAD/NOO */}
      <LeadNooTabs activeTab={activeTab} onTabChange={setActiveTab} colors={colors} />
      
      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-4 pb-8">
          {loading && (
            <Text 
              className="text-center text-base my-8" 
              style={{ fontFamily: 'Inter', color: colors.textSecondary }}
            >
              Memuat form...
            </Text>
          )}
          {error && (
            <Text 
              className="text-center text-base my-8 text-red-500"
              style={{ fontFamily: 'Inter' }}
            >
              {error}
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
}

