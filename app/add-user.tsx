import { Button } from '@/components/ui/Button';
import { Input as FormInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Colors } from '@/constants/Colors';
import { useAddUser } from '@/hooks/data/useAddUser';
import { useReferenceDropdowns } from '@/hooks/data/useReferenceDropdowns';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddUserScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [badanusaha, setBadanusaha] = useState('');
  const [divisi, setDivisi] = useState('');
  const [region, setRegion] = useState('');
  const [cluster, setCluster] = useState('');
  const { loading, error, success, addUser } = useAddUser();
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
  } = useReferenceDropdowns();

  React.useEffect(() => {
    if (success && !error) {
      Alert.alert('Sukses', 'User berhasil ditambahkan!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else if (error) {
      Alert.alert('Gagal', error);
    }
  }, [success, error]);

  const handleSubmit = async () => {
    await addUser({
      name,
      username,
      phone,
      role,
      badanusaha,
      divisi,
      region,
      cluster,
    });
  };

  if (error) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="alert-circle" size={24} color={colors.danger} style={{ marginBottom: 8 }} />
      <Text style={{ color: colors.danger, margin: 20, textAlign: 'center' }}>{error}</Text>
      <Button title="Kembali" variant="primary" onPress={() => router.back()} />
    </SafeAreaView>
  );

  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.text, marginTop: 16 }}>Menyimpan user...</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.formTitle, { color: colors.text }]}>Tambah User Baru</Text>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Nama Lengkap *</Text>
          <FormInput
            placeholder="Masukkan nama lengkap"
            value={name}
            onChangeText={setName}
            style={styles.input}
            accessibilityLabel="Input nama lengkap"
            accessibilityHint="Masukkan nama lengkap user"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Username *</Text>
          <FormInput
            placeholder="Masukkan username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            accessibilityLabel="Input username"
            accessibilityHint="Masukkan username user"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>No. HP *</Text>
          <FormInput
            placeholder="Masukkan nomor HP"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            accessibilityLabel="Input nomor HP"
            accessibilityHint="Masukkan nomor HP user"
            keyboardType="phone-pad"
          />
        </View>
        {/* Role Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Role *</Text>
          <Select
            value={role}
            onValueChange={(itemValue) => {
              setRole(itemValue);
              setBadanusaha('');
              setDivisi('');
              setRegion('');
              setCluster('');
              onRoleChange(Number(itemValue));
            }}
            options={roles.map((r) => ({ label: r.name, value: String(r.id) }))}
            placeholder="Pilih Role"
          />
        </View>
        {/* Badan Usaha Dropdown */}
        {roleScope.required.includes('badan_usaha_id') && (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Badan Usaha *</Text>
            <Select
              value={badanusaha}
              onValueChange={(itemValue) => {
                setBadanusaha(itemValue);
                setDivisi('');
                setRegion('');
                setCluster('');
                fetchDivisions(itemValue);
              }}
              options={Object.entries(badanUsaha).map(([id, name]) => ({ label: name, value: id }))}
              placeholder="Pilih Badan Usaha"
            />
          </View>
        )}
        {/* Division Dropdown */}
        {roleScope.required.includes('division_id') && (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Divisi *</Text>
            <Select
              value={divisi}
              onValueChange={(itemValue) => {
                setDivisi(itemValue);
                setRegion('');
                setCluster('');
                fetchRegions(itemValue);
              }}
              options={Object.entries(divisions).map(([id, name]) => ({ label: name, value: id }))}
              placeholder="Pilih Divisi"
            />
          </View>
        )}
        {/* Region Dropdown */}
        {roleScope.required.includes('region_id') && (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Region *</Text>
            <Select
              value={region}
              onValueChange={(itemValue) => {
                setRegion(itemValue);
                setCluster('');
                fetchClusters(itemValue);
              }}
              options={Object.entries(regions).map(([id, name]) => ({ label: name, value: id }))}
              placeholder="Pilih Region"
            />
          </View>
        )}
        {/* Cluster Dropdown */}
        {roleScope.required.includes('cluster_id') && (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Cluster *</Text>
            <Select
              value={cluster}
              onValueChange={setCluster}
              options={Object.entries(clusters).map(([id, name]) => ({ label: name, value: id }))}
              placeholder="Pilih Cluster"
            />
          </View>
        )}
        <Button
          title={loading ? 'Menyimpan...' : 'Simpan User'}
          onPress={handleSubmit}
          disabled={loading}
          style={{ marginTop: 24 }}
          accessibilityLabel="Simpan User"
          accessibilityHint="Menambahkan user baru ke sistem"
          accessibilityRole="button"
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
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 0,
  },
});
