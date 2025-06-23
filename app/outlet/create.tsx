import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { useRegisterOutletForm } from '@/hooks/data/useRegisterOutletForm';
import { useThemeStyles } from '@/hooks/utils/useThemeStyles';

export default function RegisterOutletScreen() {
  const { colors, styles } = useThemeStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const handleLocationSet = () => {
    Alert.alert(
      'Set Location',
      'Location picker akan diimplementasikan di versi selanjutnya',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[{ flex: 1 }, styles.background.primary]}>
      {/* Header */}
      <View style={[
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingBottom: 16,
          paddingTop: insets.top + 8,
          borderBottomWidth: 1,
        },
        styles.background.primary,
        styles.border.default
      ]}>
        <TouchableOpacity 
          style={[
            {
              width: 40,
              height: 40,
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
            },
            styles.background.surface,
            styles.border.default
          ]} 
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[{ fontSize: 18, fontWeight: 'bold' }, styles.text.primary]}>
          Register Outlet
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Outlet Information Section */}
        <View style={[
          {
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
          },
          styles.card.default
        ]}>
          <Text style={[
            { 
              fontSize: 16, 
              fontWeight: '600', 
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }, 
            styles.text.primary
          ]}>
            <IconSymbol name="building.2.fill" size={18} color={colors.primary} />
            {'  '}Informasi Outlet
          </Text>
          
          <View style={{ marginBottom: 16 }}>
            <Input
              label="Nama Outlet"
              placeholder="Masukkan nama outlet"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              error={errors.name}
              leftIcon={<IconSymbol name="building.2.fill" size={18} color={colors.textSecondary} />}
            />
          </View>

          {/* Outlet Type Dropdown */}
          <View style={{ marginBottom: 16, position: 'relative', zIndex: 10 }}>
            <Text style={[{ fontSize: 14, fontWeight: '500', marginBottom: 6 }, styles.text.primary]}>
              Tipe Outlet
            </Text>
            <TouchableOpacity
              style={[
                {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  height: 44,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                },
                errors.type ? styles.border.error : styles.form.input,
                { borderColor: errors.type ? colors.danger : colors.inputBorder }
              ]}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <IconSymbol name="tag.fill" size={18} color={colors.textSecondary} />
                <Text style={[
                  { marginLeft: 8, fontSize: 16 },
                  selectedType ? styles.text.primary : styles.text.secondary
                ]}>
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
              <View style={[
                {
                  marginTop: 4,
                  borderRadius: 8,
                  position: 'absolute',
                  top: 72,
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  borderWidth: 1,
                },
                styles.card.elevated
              ]}>
                {outletTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      {
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderBottomWidth: 1,
                      },
                      styles.border.light,
                      selectedType === type && { backgroundColor: colors.primary + '20' }
                    ]}
                    onPress={() => handleTypeSelect(type)}
                  >
                    <Text style={[
                      { fontSize: 16 },
                      selectedType === type ? { color: colors.primary, fontWeight: '500' } : styles.text.primary
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.type && (
              <Text style={[{ fontSize: 12, marginTop: 4 }, styles.text.error]}>
                {errors.type}
              </Text>
            )}
          </View>

          <View style={{ marginBottom: 16 }}>
            <Input
              label="Alamat"
              placeholder="Masukkan alamat outlet"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              error={errors.address}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
              leftIcon={<IconSymbol name="mappin.and.ellipse" size={18} color={colors.textSecondary} />}
            />
          </View>
        </View>

        {/* Contact Information Section */}
        <View style={[
          {
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
          },
          styles.card.default
        ]}>
          <Text style={[
            { 
              fontSize: 16, 
              fontWeight: '600', 
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }, 
            styles.text.primary
          ]}>
            <IconSymbol name="person.fill" size={18} color={colors.primary} />
            {'  '}Informasi Kontak
          </Text>
          
          <View style={{ marginBottom: 16 }}>
            <Input
              label="Nama Contact Person"
              placeholder="Masukkan nama contact person"
              value={formData.contactName}
              onChangeText={(value) => handleInputChange('contactName', value)}
              error={errors.contactName}
              leftIcon={<IconSymbol name="person.fill" size={18} color={colors.textSecondary} />}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Input
              label="Nomor Telepon"
              placeholder="Masukkan nomor telepon"
              value={formData.contactPhone}
              onChangeText={(value) => handleInputChange('contactPhone', value)}
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
              onChangeText={(value) => handleInputChange('notes', value)}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
              leftIcon={<IconSymbol name="text.alignleft" size={18} color={colors.textSecondary} />}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ gap: 12, marginTop: 8, marginBottom: 24 }}>
          <TouchableOpacity
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 12,
                borderRadius: 8,
                borderWidth: 1,
              },
              styles.button.secondary
            ]}
            onPress={handleLocationSet}
          >
            <IconSymbol name="mappin.and.ellipse" size={20} color={colors.primary} />
            <Text style={[{ marginLeft: 8, fontSize: 16, fontWeight: '500' }, { color: colors.primary }]}>
              Set Lokasi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              {
                paddingVertical: 16,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
              },
              isSubmitting ? styles.button.disabled : styles.button.primary
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={[{ fontSize: 16, fontWeight: '600' }, styles.text.inverse]}>
              {isSubmitting ? 'Menyimpan...' : 'Submit Outlet'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}