import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input as FormInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Colors } from '@/constants/Colors';
import { shadow } from '@/constants/Shadows';
import { spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
import { useNetwork } from '@/context/network-context';
import { useAddUser } from '@/hooks/data/useAddUser';
import { useReferenceDropdowns } from '@/hooks/data/useReferenceDropdowns';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddUserScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { isConnected } = useNetwork();
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={isConnected ? ['top','left','right'] : ['left','right']}>
      <View style={[{
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.background,
        ...shadow.header,
        zIndex: 10,
      }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 0, marginRight: spacing.lg, minWidth: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
          accessibilityLabel="Kembali"
          accessibilityHint="Kembali ke halaman sebelumnya"
          accessibilityRole="button"
        >
          <IconSymbol name="chevron.left" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Tambah User</Text>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scrollContainer]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <Text style={styles.subtitle}>Isi data user baru di bawah ini</Text>
          <View style={styles.formGroup}>
            <FormInput
              label="Nama Lengkap *"
              placeholder="Masukkan nama lengkap"
              value={name}
              onChangeText={setName}
              style={styles.customInput}
              accessibilityLabel="Input nama lengkap"
              accessibilityHint="Masukkan nama lengkap user"
            />
          </View>
          <View style={styles.formGroup}>
            <FormInput
              label="Username *"
              placeholder="Masukkan username"
              value={username}
              onChangeText={setUsername}
              style={styles.customInput}
              accessibilityLabel="Input username"
              accessibilityHint="Masukkan username user"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.formGroup}>
            <FormInput
              label="No. HP *"
              placeholder="Masukkan nomor HP"
              value={phone}
              onChangeText={setPhone}
              style={styles.customInput}
              accessibilityLabel="Input nomor HP"
              accessibilityHint="Masukkan nomor HP user"
              keyboardType="phone-pad"
            />
          </View>
          {/* Role Dropdown */}
          <View style={styles.formGroup}>
            <Select
              label="Role *"
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
            <View style={styles.formGroup}>
              <Select
                label="Badan Usaha *"
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
            <View style={styles.formGroup}>
              <Select
                label="Divisi *"
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
            <View style={styles.formGroup}>
              <Select
                label="Region *"
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
            <View style={styles.formGroup}>
              <Select
                label="Cluster *"
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
            style={{ minHeight: 52, marginTop: spacing.lg }}
            accessibilityLabel="Simpan User"
            accessibilityHint="Menambahkan user baru ke sistem"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: spacing.md },
  formContainer: { paddingHorizontal: spacing.lg, marginTop: spacing['2xl'] },
  title: { fontSize: typography.fontSize2xl, fontWeight: '700', fontFamily: typography.fontFamily, flex: 1 },
  subtitle: { fontSize: typography.fontSizeMd, fontFamily: typography.fontFamily, marginBottom: spacing.xl },
  formGroup: { marginBottom: spacing.lg },
  customInput: { height: 50, fontSize: typography.fontSizeMd, fontFamily: typography.fontFamily },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
});
