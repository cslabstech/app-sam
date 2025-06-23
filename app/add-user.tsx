import { IconSymbol } from '@/components/ui/IconSymbol';
import { Select } from '@/components/ui/Select';
import { useNetwork } from '@/context/network-context';
import { useAddUser } from '@/hooks/data/useAddUser';
import { useReferenceDropdowns } from '@/hooks/data/useReferenceDropdowns';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddUserScreen() {
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
  const { loading, error, addUser } = useAddUser();
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
    if (error) {
      Alert.alert('Gagal', error);
    }
  }, [error]);

  const handleSubmit = async () => {
    const result = await addUser({
      name,
      username,
      phone,
      role,
      badanusaha,
      divisi,
      region,
      cluster,
    });
    
    if (result.success) {
      Alert.alert('Sukses', 'User berhasil ditambahkan!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  if (error) return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900 justify-center items-center">
      <Ionicons name="alert-circle" size={24} color="#ef4444" style={{ marginBottom: 8 }} />
      <Text style={{ fontFamily: 'Inter' }} className="text-danger-600 mb-4 text-center">{error}</Text>
      <Pressable
        className="h-12 rounded-md items-center justify-center mb-8 bg-primary-500 active:bg-primary-600 px-8"
        onPress={() => router.back()}
      >
        <Text style={{ fontFamily: 'Inter' }} className="text-base font-semibold text-white">Kembali</Text>
      </Pressable>
    </SafeAreaView>
  );

  if (loading) return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900 justify-center items-center">
      <ActivityIndicator size="large" color="#f97316" />
      <Text style={{ fontFamily: 'Inter' }} className="text-base text-neutral-900 dark:text-neutral-100 mt-4">Menyimpan user...</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900" edges={isConnected ? ['top','left','right'] : ['left','right']}>
      {/* Header */}
      <View className="flex-row items-center h-14 px-4 bg-neutral-50 dark:bg-neutral-900 shadow-sm z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 min-w-[36px] flex-row items-center justify-center"
          accessibilityLabel="Kembali"
          accessibilityHint="Kembali ke halaman sebelumnya"
          accessibilityRole="button"
        >
          <IconSymbol name="chevron.left" size={26} color="#222" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Inter' }} className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Tambah User</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1" keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <View className="px-4 pt-4 pb-8">
              <View className="space-y-6 mb-8 w-full gap-5">
                {/* Input Nama */}
                <View className="space-y-2 w-full">
                  <Text style={{ fontFamily: 'Inter' }} className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">Nama Lengkap</Text>
                  <TextInput
                    style={{ flex: 1, fontFamily: 'Inter', fontSize: 16, height: 48, paddingVertical: 12, paddingHorizontal: 16 }}
                    className="pr-12 border rounded-md bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 text-base"
                    placeholder="Masukkan nama lengkap"
                    placeholderTextColor="#a3a3a3"
                    value={name}
                    onChangeText={setName}
                    textAlignVertical="center"
                  />
                </View>
                {/* Input Username */}
                <View className="space-y-2 w-full">
                  <Text style={{ fontFamily: 'Inter' }} className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">Username</Text>
                  <TextInput
                    style={{ flex: 1, fontFamily: 'Inter', fontSize: 16, height: 48, paddingVertical: 12, paddingHorizontal: 16 }}
                    className="pr-12 border rounded-md bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 text-base"
                    placeholder="Masukkan username"
                    placeholderTextColor="#a3a3a3"
                    value={username}
                    onChangeText={setUsername}
                    textAlignVertical="center"
                    autoCapitalize="none"
                  />
                </View>
                {/* Input No HP */}
                <View className="space-y-2 w-full">
                  <Text style={{ fontFamily: 'Inter' }} className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">No. HP</Text>
                  <TextInput
                    style={{ flex: 1, fontFamily: 'Inter', fontSize: 16, height: 48, paddingVertical: 12, paddingHorizontal: 16 }}
                    className="pr-12 border rounded-md bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 focus:border-primary-500 text-base"
                    placeholder="Masukkan nomor HP"
                    placeholderTextColor="#a3a3a3"
                    value={phone}
                    onChangeText={setPhone}
                    textAlignVertical="center"
                    keyboardType="phone-pad"
                  />
                </View>
                {/* Role Dropdown */}
                <View className="space-y-2 w-full">
                  <Text style={{ fontFamily: 'Inter' }} className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">Role</Text>
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
                  <View className="space-y-2 w-full">
                    <Text style={{ fontFamily: 'Inter' }} className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">Badan Usaha</Text>
                    <Select
                      value={badanusaha}
                      onValueChange={(itemValue) => {
                        setBadanusaha(itemValue);
                        setDivisi('');
                        setRegion('');
                        setCluster('');
                        fetchDivisions(itemValue);
                      }}
                      options={badanUsaha.map((item) => ({ label: item.name, value: String(item.id) }))}
                      placeholder="Pilih Badan Usaha"
                    />
                  </View>
                )}
                {/* Division Dropdown */}
                {roleScope.required.includes('division_id') && (
                  <View className="space-y-2 w-full">
                    <Text style={{ fontFamily: 'Inter' }} className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">Divisi</Text>
                    <Select
                      value={divisi}
                      onValueChange={(itemValue) => {
                        setDivisi(itemValue);
                        setRegion('');
                        setCluster('');
                        fetchRegions(itemValue);
                      }}
                      options={divisions.map((item) => ({ label: item.name, value: String(item.id) }))}
                      placeholder="Pilih Divisi"
                    />
                  </View>
                )}
                {/* Region Dropdown */}
                {roleScope.required.includes('region_id') && (
                  <View className="space-y-2 w-full">
                    <Text style={{ fontFamily: 'Inter' }} className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">Region</Text>
                    <Select
                      value={region}
                      onValueChange={(itemValue) => {
                        setRegion(itemValue);
                        setCluster('');
                        fetchClusters(itemValue);
                      }}
                      options={regions.map((item) => ({ label: item.name, value: String(item.id) }))}
                      placeholder="Pilih Region"
                    />
                  </View>
                )}
                {/* Cluster Dropdown */}
                {roleScope.required.includes('cluster_id') && (
                  <View className="space-y-2 w-full">
                    <Text style={{ fontFamily: 'Inter' }} className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">Cluster</Text>
                    <Select
                      value={cluster}
                      onValueChange={setCluster}
                      options={clusters.map((item) => ({ label: item.name, value: String(item.id) }))}
                      placeholder="Pilih Cluster"
                    />
                  </View>
                )}
              </View>
              <Pressable
                className={`h-12 rounded-md items-center justify-center mb-8 ${loading ? 'bg-neutral-300 dark:bg-neutral-700' : 'bg-primary-500 active:bg-primary-600'}`}
                onPress={handleSubmit}
                disabled={loading}
                accessibilityLabel="Simpan User"
                accessibilityHint="Menambahkan user baru ke sistem"
              >
                <Text style={{ fontFamily: 'Inter' }} className={`text-base font-semibold ${loading ? 'text-neutral-500 dark:text-neutral-400' : 'text-white'}`}>
                  {loading ? 'Menyimpan...' : 'Simpan User'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}