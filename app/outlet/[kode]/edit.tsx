import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOutletDetail } from '@/hooks/useOutletDetail';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OutletEditPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { kode } = useLocalSearchParams<{ kode: string }>();
  const { outlet, loading, error, fetchOutlet, updateOutlet } = useOutletDetail();
  const [form, setForm] = useState({
    kodeOutlet: '',
    namaPemilikOutlet: '',
    nomerTlpOutlet: '',
    latlong: '',
  });

  useEffect(() => {
    if (kode) fetchOutlet(kode as string);
  }, [kode]);

  useEffect(() => {
    if (outlet) {
      setForm({
        kodeOutlet: outlet.kodeOutlet || '',
        namaPemilikOutlet: outlet.namaPemilikOutlet || '',
        nomerTlpOutlet: outlet.nomerTlpOutlet || '',
        latlong: outlet.latlong || '',
      });
    }
  }, [outlet]);

  const handleChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleUpdate = async () => {
    const result = await updateOutlet(form);
    if (result.success) {
      Alert.alert('Success', 'Outlet updated successfully');
      router.back();
    } else {
      Alert.alert('Error', result.error || 'Failed to update outlet');
    }
  };

  if (error) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.danger, margin: 20, textAlign: 'center' }}>{error}</Text>
      <Button title="Go Back" variant="primary" onPress={() => router.back()} />
    </SafeAreaView>
  );

  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.text, marginTop: 16 }}>Loading outlet data...</Text>
    </SafeAreaView>
  );

  if (!outlet) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.danger, margin: 20, textAlign: 'center' }}>Data outlet tidak ditemukan.</Text>
      <Button title="Go Back" variant="primary" onPress={() => router.back()} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <Text style={[styles.formTitle, { color: colors.text }]}>Edit Outlet</Text>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Kode Outlet</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
            value={form.kodeOutlet}
            editable={false}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Nama Pemilik</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={form.namaPemilikOutlet}
            onChangeText={v => handleChange('namaPemilikOutlet', v)}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Nomor Telepon</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={form.nomerTlpOutlet}
            onChangeText={v => handleChange('nomerTlpOutlet', v)}
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>LatLong</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={form.latlong}
            onChangeText={v => handleChange('latlong', v)}
          />
        </View>
        <Button
          title={loading ? 'Updating...' : 'Update Outlet'}
          onPress={handleUpdate}
          disabled={loading}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
