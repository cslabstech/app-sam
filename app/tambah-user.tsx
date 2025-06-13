import { Colors } from '@/constants/Colors';
import { useAddUser } from '@/hooks/useAddUser';
import { useColorScheme } from '@/hooks/useColorScheme';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TambahUserScreen() {
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
    setTimeout(() => {
      if (success && !error) {
        Alert.alert('Sukses', 'User berhasil ditambahkan!');
        router.back();
      } else if (error) {
        Alert.alert('Gagal', error);
      }
    }, 100);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>  
      <View style={styles.card}>
        <Text style={[styles.title, { color: colors.primary }]}>Tambah User Baru</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Nama Lengkap"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Username"
          placeholderTextColor={colors.textSecondary}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="No. HP"
          placeholderTextColor={colors.textSecondary}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Role"
          placeholderTextColor={colors.textSecondary}
          value={role}
          onChangeText={setRole}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Badan Usaha"
          placeholderTextColor={colors.textSecondary}
          value={badanusaha}
          onChangeText={setBadanusaha}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Divisi"
          placeholderTextColor={colors.textSecondary}
          value={divisi}
          onChangeText={setDivisi}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Region"
          placeholderTextColor={colors.textSecondary}
          value={region}
          onChangeText={setRegion}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Cluster"
          placeholderTextColor={colors.textSecondary}
          value={cluster}
          onChangeText={setCluster}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Menyimpan...' : 'Simpan User'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: typography.fontSize2xl,
    fontWeight: 'bold',
    marginBottom: spacing.xl,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.fontSizeMd,
    backgroundColor: '#f9f9f9',
    fontFamily: typography.fontFamily,
  },
  button: {
    padding: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: typography.fontSizeMd,
    fontFamily: typography.fontFamily,
  },
  error: {
    color: Colors.light.danger,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});
