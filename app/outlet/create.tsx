import React, { useCallback } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
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
  styles, 
  colors, 
  insets 
}: {
  onBack: () => void;
  styles: any;
  colors: any;
  insets: any;
}) {
  return (
    <View 
      className="flex-row justify-between items-center px-4 pb-4 border-b border-neutral-200 dark:border-neutral-800"
      style={{
        paddingTop: insets.top + 8,
        backgroundColor: colors.background,
        borderBottomColor: colors.border
      }}
    >
      <TouchableOpacity 
        className="w-10 h-10 rounded-lg justify-center items-center border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950"
        style={{ borderColor: colors.border }}
        onPress={onBack}
      >
        <IconSymbol name="chevron.left" size={20} color={colors.text} />
      </TouchableOpacity>
      <Text style={{ fontFamily: 'Inter', color: colors.text }} className="text-lg font-bold">
        Register Outlet
      </Text>
      <View className="w-10" />
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
  styles,
  colors,
}: {
  isSubmitting: boolean;
  onLocationSet: () => void;
  onSubmit: () => void;
  styles: any;
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

      <TouchableOpacity
        className={`py-4 rounded-lg items-center justify-center ${
          isSubmitting ? 'opacity-50' : ''
        }`}
        style={{ backgroundColor: isSubmitting ? colors.textSecondary : colors.primary }}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        <Text style={{ fontFamily: 'Inter', color: colors.textInverse }} className="text-base font-semibold">
          {isSubmitting ? 'Menyimpan...' : 'Submit Outlet'}
        </Text>
      </TouchableOpacity>
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
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-900" style={{ backgroundColor: colors.background }}>
      <Header 
        onBack={handleBack}
        styles={styles}
        colors={colors}
        insets={insets}
      />

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <OutletInformationSection
          formData={formData}
          errors={errors}
          selectedType={selectedType}
          showTypeDropdown={showTypeDropdown}
          outletTypes={outletTypes}
          onInputChange={handleInputChange}
          onToggleDropdown={handleToggleDropdown}
          onTypeSelect={handleTypeSelect}
          styles={styles}
          colors={colors}
        />

        <ContactInformationSection
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
          styles={styles}
          colors={colors}
        />

        <ActionButtons
          isSubmitting={isSubmitting}
          onLocationSet={handleLocationSet}
          onSubmit={handleSubmit}
          styles={styles}
          colors={colors}
        />
      </ScrollView>
    </View>
  );
}

