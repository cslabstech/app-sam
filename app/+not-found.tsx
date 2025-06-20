import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { Link, Stack } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen options={{ title: 'Halaman Tidak Ditemukan' }} />
      <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900">
        <View className="flex-1 items-center justify-center px-6">
          <IconSymbol 
            name="exclamationmark.triangle.fill" 
            size={64} 
            color={colors.warning} 
            style={{ marginBottom: 32 }}
          />
          <Text style={{ fontFamily: 'Inter' }} className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 text-center mb-4">
            Halaman Tidak Ditemukan
          </Text>
          <Text style={{ fontFamily: 'Inter' }} className="text-base text-slate-600 dark:text-slate-300 text-center mb-8 leading-7">
            Maaf, halaman yang Anda cari tidak tersedia.
          </Text>
          <Link href="/" asChild>
            <Button 
              title="Kembali ke Beranda"
              variant="primary"
              style={{ minWidth: 200 }}
            />
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}
