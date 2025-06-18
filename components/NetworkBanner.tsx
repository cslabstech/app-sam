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
    backgroundColor: '#FF2D55', // warna merah terang agar lebih menyala
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
