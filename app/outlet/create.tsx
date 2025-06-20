import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useRegisterOutletForm } from '@/hooks/data/useRegisterOutletForm';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

export default function RegisterOutletScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const {
    formData,
    setFormData,
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.backButton, { borderWidth: 1, borderColor: colors.border }]} 
          onPress={() => router.back()}
        >
          <IconSymbol name="arrow.left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Register New Outlet</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Outlet Information</Text>
          <Input
            label="Outlet Name"
            placeholder="Enter outlet name"
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            error={errors.name}
            leftIcon={<IconSymbol name="building.2.fill" size={18} color={colors.textSecondary} />}
          />
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Outlet Type</Text>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                { 
                  borderColor: errors.type ? colors.danger : colors.border,
                  borderWidth: 1,
                  backgroundColor: colors.card,
                },
              ]}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <View style={styles.dropdownButtonContent}>
                <IconSymbol name="tag.fill" size={18} color={colors.textSecondary} />
                <Text style={[
                  styles.dropdownButtonText,
                  { color: selectedType ? colors.text : colors.textSecondary },
                ]}>
                  {selectedType || 'Select outlet type'}
                </Text>
              </View>
              <IconSymbol
                name={showTypeDropdown ? 'chevron.up' : 'chevron.down'}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {showTypeDropdown && (
              <Card style={styles.dropdown} noPadding>
                {outletTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.dropdownItem,
                      selectedType === type && { backgroundColor: colors.primary + '20' },
                    ]}
                    onPress={() => handleTypeSelect(type)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        { color: selectedType === type ? colors.primary : colors.text },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Card>
            )}
            {errors.type && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{errors.type}</Text>
            )}
          </View>
          <Input
            label="Address"
            placeholder="Enter outlet address"
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            error={errors.address}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
            leftIcon={<IconSymbol name="mappin.and.ellipse" size={18} color={colors.textSecondary} />}
          />
        </Card>
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
          <Input
            label="Contact Person Name"
            placeholder="Enter contact person name"
            value={formData.contactName}
            onChangeText={(value) => handleInputChange('contactName', value)}
            error={errors.contactName}
            leftIcon={<IconSymbol name="person.fill" size={18} color={colors.textSecondary} />}
          />
          <Input
            label="Contact Phone Number"
            placeholder="Enter contact phone number"
            value={formData.contactPhone}
            onChangeText={(value) => handleInputChange('contactPhone', value)}
            error={errors.contactPhone}
            keyboardType="phone-pad"
            leftIcon={<IconSymbol name="phone.fill" size={18} color={colors.textSecondary} />}
          />
          <Input
            label="Notes (Optional)"
            placeholder="Enter additional notes"
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
            leftIcon={<IconSymbol name="text.alignleft" size={18} color={colors.textSecondary} />}
          />
        </Card>
        <View style={styles.footer}>
          <Button
            title="Set Location"
            variant="outline"
            style={styles.locationButton}
            onPress={() => router.push('/map-picker')}
          />
          <Button
            title={isSubmitting ? 'Submitting...' : 'Submit'}
            onPress={handleSubmit}
            disabled={isSubmitting}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  formGroup: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownButtonText: {
    marginLeft: 8,
    fontSize: 16,
  },
  dropdown: {
    marginTop: 4,
    borderRadius: 6,
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    marginTop: 24,
    marginBottom: 16,
    gap: 16,
  },
  locationButton: {
    marginBottom: 8,
  },
});