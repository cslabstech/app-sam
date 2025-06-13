import { Button } from '@/components/ui/Button';
import { Input as FormInput } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useAddUser } from '@/hooks/useAddUser';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReferenceDropdowns } from '@/hooks/useReferenceDropdowns';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [multiDivisi, setMultiDivisi] = useState<string[]>([]);
  const [multiRegion, setMultiRegion] = useState<string[]>([]);
  const [multiCluster, setMultiCluster] = useState<string[]>([]);
  const [multiBadanUsaha, setMultiBadanUsaha] = useState<string[]>([]);

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={[styles.scrollContainer, keyboardVisible && { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
            <View style={styles.formContainer}>
              <Text style={[styles.title, { color: colors.text }]}>Tambah User Baru</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Isi data user dengan lengkap</Text>
              {error ? (
                <View style={styles.errorContainer} accessible accessibilityLabel={`Error: ${error}`} accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              ) : null}
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
                <Text style={[styles.label, { color: colors.text }]}>Role *</Text>
                <View style={[styles.pickerWrapper, { borderColor: colors.border }]}> 
                  <Picker
                    selectedValue={role}
                    onValueChange={(itemValue) => {
                      setRole(itemValue);
                      onRoleChange(Number(itemValue));
                    }}
                    style={{ width: '100%', color: colors.text }}
                  >
                    <Picker.Item label="Pilih Role" value="" />
                    {roles.map((r) => (
                      <Picker.Item key={r.id} label={r.name} value={r.id} />
                    ))}
                  </Picker>
                </View>
              </View>
              {/* Badan Usaha Dropdown */}
              {roleScope.required.includes('badan_usaha_id') && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Badan Usaha *</Text>
                  <View style={[styles.pickerWrapper, { borderColor: colors.border }]}> 
                    <Picker
                      selectedValue={badanusaha}
                      onValueChange={(itemValue) => {
                        setBadanusaha(itemValue);
                        fetchDivisions(itemValue);
                      }}
                      style={{ width: '100%', color: colors.text }}
                    >
                      <Picker.Item label="Pilih Badan Usaha" value="" />
                      {Object.entries(badanUsaha).map(([id, name]) => (
                        <Picker.Item key={id} label={name} value={id} />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}
              {/* Division Dropdown */}
              {roleScope.required.includes('division_id') && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Divisi *</Text>
                  <View style={[styles.pickerWrapper, { borderColor: colors.border }]}> 
                    <Picker
                      selectedValue={divisi}
                      onValueChange={(itemValue) => {
                        setDivisi(itemValue);
                        fetchRegions(itemValue);
                      }}
                      style={{ width: '100%', color: colors.text }}
                    >
                      <Picker.Item label="Pilih Divisi" value="" />
                      {Object.entries(divisions).map(([id, name]) => (
                        <Picker.Item key={id} label={name} value={id} />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}
              {/* Region Dropdown */}
              {roleScope.required.includes('region_id') && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Region *</Text>
                  <View style={[styles.pickerWrapper, { borderColor: colors.border }]}> 
                    <Picker
                      selectedValue={region}
                      onValueChange={(itemValue) => {
                        setRegion(itemValue);
                        fetchClusters(itemValue);
                      }}
                      style={{ width: '100%', color: colors.text }}
                    >
                      <Picker.Item label="Pilih Region" value="" />
                      {Object.entries(regions).map(([id, name]) => (
                        <Picker.Item key={id} label={name} value={id} />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}
              {/* Cluster Dropdown */}
              {roleScope.required.includes('cluster_id') && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Cluster *</Text>
                  <View style={[styles.pickerWrapper, { borderColor: colors.border }]}> 
                    <Picker
                      selectedValue={cluster}
                      onValueChange={(itemValue) => setCluster(itemValue)}
                      style={{ width: '100%', color: colors.text }}
                    >
                      <Picker.Item label="Pilih Cluster" value="" />
                      {Object.entries(clusters).map(([id, name]) => (
                        <Picker.Item key={id} label={name} value={id} />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}
              {/* Division Multi-Select */}
              {roleScope.multiple.includes('division_id') && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Pilih Divisi (bisa lebih dari satu):</Text>
                  <View style={[styles.pickerWrapper, { borderColor: colors.border }]}> 
                    {Object.entries(divisions).map(([id, name]) => (
                      <TouchableWithoutFeedback
                        key={id}
                        onPress={() => {
                          setMultiDivisi((prev) =>
                            prev.includes(id)
                              ? prev.filter((v) => v !== id)
                              : [...prev, id]
                          );
                          fetchRegions(id);
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 0, backgroundColor: multiDivisi.includes(id) ? colors.primary : '#f9f9f9' }}>
                          <View style={{ width: 18, height: 18, borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: multiDivisi.includes(id) ? colors.primary : '#fff' }} />
                          <Text style={{ color: colors.text }}>{name}</Text>
                        </View>
                      </TouchableWithoutFeedback>
                    ))}
                  </View>
                </View>
              )}
              {/* Region Multi-Select */}
              {roleScope.multiple.includes('region_id') && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Pilih Region (bisa lebih dari satu):</Text>
                  <View style={[styles.pickerWrapper, { borderColor: colors.border }]}> 
                    {Object.entries(regions).map(([id, name]) => (
                      <TouchableWithoutFeedback
                        key={id}
                        onPress={() => {
                          setMultiRegion((prev) =>
                            prev.includes(id)
                              ? prev.filter((v) => v !== id)
                              : [...prev, id]
                          );
                          fetchClusters(id);
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 0, backgroundColor: multiRegion.includes(id) ? colors.primary : '#f9f9f9' }}>
                          <View style={{ width: 18, height: 18, borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: multiRegion.includes(id) ? colors.primary : '#fff' }} />
                          <Text style={{ color: colors.text }}>{name}</Text>
                        </View>
                      </TouchableWithoutFeedback>
                    ))}
                  </View>
                </View>
              )}
              {/* Cluster Multi-Select */}
              {roleScope.multiple.includes('cluster_id') && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Pilih Cluster (bisa lebih dari satu):</Text>
                  <View style={[styles.pickerWrapper, { borderColor: colors.border }]}> 
                    {Object.entries(clusters).map(([id, name]) => (
                      <TouchableWithoutFeedback
                        key={id}
                        onPress={() => {
                          setMultiCluster((prev) =>
                            prev.includes(id)
                              ? prev.filter((v) => v !== id)
                              : [...prev, id]
                          );
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 0, backgroundColor: multiCluster.includes(id) ? colors.primary : '#f9f9f9' }}>
                          <View style={{ width: 18, height: 18, borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: multiCluster.includes(id) ? colors.primary : '#fff' }} />
                          <Text style={{ color: colors.text }}>{name}</Text>
                        </View>
                      </TouchableWithoutFeedback>
                    ))}
                  </View>
                </View>
              )}
              {/* Badan Usaha Multi-Select */}
              {roleScope.multiple.includes('badan_usaha_id') && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Pilih Badan Usaha (bisa lebih dari satu):</Text>
                  <View style={[styles.pickerWrapper, { borderColor: colors.border }]}> 
                    {Object.entries(badanUsaha).map(([id, name]) => (
                      <TouchableWithoutFeedback
                        key={id}
                        onPress={() => {
                          setMultiBadanUsaha((prev) =>
                            prev.includes(id)
                              ? prev.filter((v) => v !== id)
                              : [...prev, id]
                          );
                          fetchDivisions(id);
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 0, backgroundColor: multiBadanUsaha.includes(id) ? colors.primary : '#f9f9f9' }}>
                          <View style={{ width: 18, height: 18, borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: multiBadanUsaha.includes(id) ? colors.primary : '#fff' }} />
                          <Text style={{ color: colors.text }}>{name}</Text>
                        </View>
                      </TouchableWithoutFeedback>
                    ))}
                  </View>
                </View>
              )}
              <Button
                title={loading ? 'Menyimpan...' : 'Simpan User'}
                variant="primary"
                loading={loading}
                onPress={handleSubmit}
                disabled={loading}
                style={styles.saveButton}
                accessibilityLabel="Simpan User"
                accessibilityHint="Menambahkan user baru ke sistem"
                accessibilityRole="button"
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: spacing.md },
  logoContainer: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg },
  logo: { width: 120, height: 64 },
  logoText: { fontSize: typography.fontSizeLg, fontWeight: '600', fontFamily: typography.fontFamily, marginTop: spacing.sm, letterSpacing: 1 },
  formContainer: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  title: { fontSize: typography.fontSize2xl, fontWeight: '700', fontFamily: typography.fontFamily, marginBottom: 4 },
  subtitle: { fontSize: typography.fontSizeMd, fontFamily: typography.fontFamily, marginBottom: spacing.xl },
  formGroup: { marginBottom: spacing.lg },
  customInput: { height: 50, fontSize: typography.fontSizeMd, fontFamily: typography.fontFamily },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: spacing.lg, borderRadius: 4, marginBottom: spacing.lg },
  errorText: { fontSize: typography.fontSizeSm, marginLeft: 4, flex: 1, fontFamily: typography.fontFamily },
  saveButton: { height: 52, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
  label: { fontSize: typography.fontSizeMd, fontWeight: '600', marginBottom: 4, fontFamily: typography.fontFamily },
  pickerWrapper: { borderWidth: 1, borderRadius: 8, marginBottom: spacing.lg, backgroundColor: '#f9f9f9' },
});
