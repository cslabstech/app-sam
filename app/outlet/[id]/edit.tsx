import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOutlet } from '@/hooks/useOutlet';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OutletEditPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { outlet, loading, error, fetchOutlet, updateOutlet } = useOutlet('');
  const [form, setForm] = useState({
    code: '',
    name: '',
    district: '',
    status: '',
    location: '',
    radius: 0,
    owner_name: '',
    owner_phone: '',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (id) fetchOutlet(id as string);
  }, [id]);

  // Log hanya jika outlet sudah ada dan bukan null
  useEffect(() => {
    if (outlet) {
      console.log('OutletEditPage outlet:', outlet);
    }
  }, [outlet]);

  useEffect(() => {
    if (outlet) {
      setForm({
        code: outlet.code || '',
        name: outlet.name || '',
        district: outlet.district || '',
        status: outlet.status || '',
        location: outlet.location || '',
        radius: outlet.radius || 0,
        owner_name: outlet.owner_name || '',
        owner_phone: outlet.owner_phone || '',
      });
    }
  }, [outlet]);

  // Ambil lokasi user saat mount (sekali saja)
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin lokasi ditolak', 'Aplikasi tidak bisa mengambil lokasi.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (loc && loc.coords) {
        const latlong = `${loc.coords.latitude},${loc.coords.longitude}`;
        setForm(f => ({ ...f, location: latlong }));
      }
    })();
  }, []);

  const handleChange = (field: string, value: string | number) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!outlet) return;
    // Validasi required
    const errors: { [key: string]: string } = {};
    if (!form.owner_name) errors.owner_name = 'Nama pemilik wajib diisi';
    if (!form.owner_phone) errors.owner_phone = 'Nomor HP pemilik wajib diisi';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    // Payload sesuai dengan struktur API baru
    const payload = {
      code: form.code,
      name: form.name,
      district: form.district,
      status: form.status,
      location: form.location,
      radius: form.radius,
      owner_name: form.owner_name,
      owner_phone: form.owner_phone,
    };
    const result = await updateOutlet(outlet.id, payload);
    if (result.success) {
      Alert.alert('Success', 'Outlet updated successfully');
      router.back();
    } else {
      Alert.alert('Error', result.error || 'Failed to update outlet');
    }
  };

  // Handler untuk ambil lokasi manual
  const handleGetLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin lokasi ditolak', 'Aplikasi tidak bisa mengambil lokasi.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    if (loc && loc.coords) {
      const latlong = `${loc.coords.latitude},${loc.coords.longitude}`;
      setForm(f => ({ ...f, location: latlong }));
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

  // Jangan render "Data outlet tidak ditemukan" jika masih loading
  if (!outlet && !loading) return (
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
            value={form.code}
            editable={false}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Nama</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={form.name}
            onChangeText={v => handleChange('name', v)}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>District</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={form.district}
            onChangeText={v => handleChange('district', v)}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Status</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={form.status}
            onChangeText={v => handleChange('status', v)}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Location</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]} 
            value={form.location}
            onChangeText={v => handleChange('location', v)}
            placeholder="latitude,longitude"
          />
          <Button title="Ambil Lokasi Sekarang" onPress={handleGetLocation} style={{ marginTop: 8 }} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Radius</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={String(form.radius)}
            onChangeText={v => handleChange('radius', Number(v) || 0)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Nama Pemilik</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={form.owner_name}
            onChangeText={v => handleChange('owner_name', v)}
            placeholder="Nama Pemilik"
          />
          {!!formErrors.owner_name && (
            <Text style={{ color: colors.danger, marginTop: 4 }}>{formErrors.owner_name}</Text>
          )}
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Nomor HP Pemilik</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={form.owner_phone}
            onChangeText={v => handleChange('owner_phone', v)}
            placeholder="08xxxxxxxxxx"
            keyboardType="phone-pad"
          />
          {!!formErrors.owner_phone && (
            <Text style={{ color: colors.danger, marginTop: 4 }}>{formErrors.owner_phone}</Text>
          )}
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
