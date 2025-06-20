import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen options={{ title: 'Halaman Tidak Ditemukan' }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <IconSymbol 
            name="exclamationmark.triangle.fill" 
            size={64} 
            color={colors.warning} 
            style={styles.icon}
          />
          <Text style={[styles.title, { color: colors.text }]}>
            Halaman Tidak Ditemukan
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Maaf, halaman yang Anda cari tidak tersedia.
          </Text>
          <Link href="/" asChild>
            <Button 
              title="Kembali ke Beranda"
              variant="primary"
              style={styles.button}
            />
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  icon: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700' as any,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.md,
  },
  button: {
    minWidth: 200,
  },
});
