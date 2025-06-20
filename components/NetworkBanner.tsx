import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
import { useNetwork } from '@/context/network-context';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const NetworkBanner = () => {
  const { isConnected } = useNetwork();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (isConnected) return null;

  return (
    <View style={[styles.banner, { 
      backgroundColor: colors.danger, 
      borderBottomColor: colors.white 
    }]}>
      <Text style={[styles.text, { color: colors.white }]}>
        Tidak dapat terhubung ke server. Periksa koneksi internet Anda.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 10,
    borderBottomWidth: 2,
  },
  text: {
    fontWeight: '700' as any,
    fontSize: 16,
    fontFamily: typography.fontFamily,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
