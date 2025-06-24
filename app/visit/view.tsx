import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/context/network-context';
import { useVisit, Visit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const StatusBadge = ({ status, color }: { status: string; color: string }) => (
  <View className="px-2 py-1 rounded-md" style={{ backgroundColor: color + '15' }}>
    <Text className="text-[13px] font-semibold" style={{ color }}>{status}</Text>
  </View>
);

export default function VisitViewPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading, error, fetchVisit } = useVisit();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [fetching, setFetching] = useState(false);
  const { isConnected } = useNetwork();

  useEffect(() => {
    if (id) {
      setFetching(true);
      fetchVisit(id as string).then(res => {
        if (res.success) setVisit(res.data);
        setFetching(false);
      });
    }
  }, [id]);

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }} edges={isConnected ? ['top','left','right'] : ['left','right']}>
        <IconSymbol name="exclamationmark.triangle" size={48} color={colors.danger} />
        <Text className="my-5 text-center" style={{ color: colors.danger }}>{error}</Text>
        <Button title="Kembali" variant="primary" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (loading || fetching) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={isConnected ? ['top','left','right'] : ['left','right']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary, fontSize: 16 }}>Memuat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!visit) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }} edges={isConnected ? ['top','left','right'] : ['left','right']}>
        <IconSymbol name="exclamationmark.triangle" size={48} color={colors.danger} />
        <Text className="my-5 text-center" style={{ color: colors.danger }}>Data visit tidak ditemukan.</Text>
        <Button title="Kembali" variant="primary" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const getStatusColor = (status?: string) => {
    if (!status) return colors.textSecondary;
    switch (status.toLowerCase()) {
      case 'maintain':
        return colors.success;
      case 'unproductive':
        return colors.danger;
      case 'unmaintain':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={isConnected ? ['top','left','right'] : ['left','right']}>
      <View className="flex-row items-center justify-between border-b" style={{ borderBottomColor: colors.border, paddingHorizontal: 16, paddingVertical: 12 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-2">
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-[20px] font-bold" style={{ color: colors.text }}> {visit?.outlet?.name || 'Detail Visit'} </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="pt-4">
          <Card style={{ padding: 16, marginBottom: 16, borderRadius: 12 }}>
            <View className="flex-row justify-between items-center py-2 border-b border-b-[0.5px] border-b-[rgba(150,150,150,0.2)]">
              <Text className="text-[14px] flex-1" style={{ color: colors.textSecondary }}>Tanggal Kunjungan</Text>
              <Text className="text-[15px] font-medium text-right" style={{ color: colors.text }}>{visit?.visit_date || '-'}</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-b-[0.5px] border-b-[rgba(150,150,150,0.2)]">
              <Text className="text-[14px] flex-1" style={{ color: colors.textSecondary }}>Check-in</Text>
              <Text className="text-[15px] font-medium text-right" style={{ color: colors.text }}>{visit?.checkin_time || '-'}</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-b-[0.5px] border-b-[rgba(150,150,150,0.2)]">
              <Text className="text-[14px] flex-1" style={{ color: colors.textSecondary }}>Check-out</Text>
              <Text className="text-[15px] font-medium text-right" style={{ color: colors.text }}>{visit?.checkout_time || '-'}</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-b-[0.5px] border-b-[rgba(150,150,150,0.2)]">
              <Text className="text-[14px] flex-1" style={{ color: colors.textSecondary }}>User</Text>
              <Text className="text-[15px] font-medium text-right" style={{ color: colors.text }}>{visit?.user?.name} ({visit?.user?.username})</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-b-[0.5px] border-b-[rgba(150,150,150,0.2)]">
              <Text className="text-[14px] flex-1" style={{ color: colors.textSecondary }}>Outlet</Text>
              <Text className="text-[15px] font-medium text-right" style={{ color: colors.text }}>{visit?.outlet?.name} ({visit?.outlet?.code})</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-b-[0.5px] border-b-[rgba(150,150,150,0.2)]">
              <Text className="text-[14px] flex-1" style={{ color: colors.textSecondary }}>District</Text>
              <Text className="text-[15px] font-medium text-right" style={{ color: colors.text }}>{visit?.outlet?.district}</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-b-[0.5px] border-b-[rgba(150,150,150,0.2)]">
              <Text className="text-[14px] flex-1" style={{ color: colors.textSecondary }}>Status Outlet</Text>
              <StatusBadge status={visit?.outlet?.status ? visit.outlet.status.charAt(0).toUpperCase() + visit.outlet.status.slice(1) : '-'} color={getStatusColor(visit?.outlet?.status)} />
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-b-[0.5px] border-b-[rgba(150,150,150,0.2)]">
              <Text className="text-[14px] flex-1" style={{ color: colors.textSecondary }}>Lokasi Outlet</Text>
              <Text className="text-[15px] font-medium text-right" style={{ color: colors.text }}>{visit?.outlet?.location}</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-b-[0.5px] border-b-[rgba(150,150,150,0.2)]">
              <Text className="text-[14px] flex-1" style={{ color: colors.textSecondary }}>Radius Outlet</Text>
              <Text className="text-[15px] font-medium text-right" style={{ color: colors.text }}>{visit?.outlet?.radius}</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
