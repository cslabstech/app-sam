import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/context/network-context';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const NetworkBanner = () => {
  const { isConnected } = useNetwork();
  if (isConnected) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Tidak dapat terhubung ke server. Periksa koneksi internet Anda.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.light.danger,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
