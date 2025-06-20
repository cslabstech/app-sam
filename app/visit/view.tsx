import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useVisit, Visit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Komponen atomic untuk badge status outlet
const StatusBadge = ({ status, color }: { status: string; color: string }) => (
  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: color + '15' }}>
    <Text style={{ fontSize: 13, fontWeight: '600', color }}>{status}</Text>
  </View>
);

export default function LiveVisitViewPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading, error, fetchVisit } = useVisit();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [fetching, setFetching] = useState(false);

  // Ambil data visit saat mount
  useEffect(() => {
    if (id) {
      setFetching(true);
      fetchVisit(id as string).then(res => {
        if (res.success) setVisit(res.data);
        setFetching(false);
      });
    }
  }, [id]);

  if (loading || fetching) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 16 }}>Memuat data visit...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.danger, margin: 20, textAlign: 'center' }}>{error}</Text>
        <Button title="Kembali" variant="primary" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (!visit) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <IconSymbol name="exclamationmark.triangle" size={48} color={colors.danger} />
        <Text style={{ color: colors.danger, margin: 20, textAlign: 'center' }}>Data visit tidak ditemukan.</Text>
        <Button title="Kembali" variant="primary" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  // Helper untuk warna status
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

  // UI utama
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}> 
        <Button
          title="Kembali"
          variant="secondary"
          onPress={() => router.back()}
          style={{ marginRight: 12, paddingVertical: 4 }}
        />
        <Text style={[styles.title, { color: colors.text, flex: 1 }]}>Detail Visit</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Tanggal Kunjungan</Text>
            <Text style={[styles.value, { color: colors.text }]}>{visit.visit_date}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Check-in</Text>
            <Text style={[styles.value, { color: colors.text }]}>{visit.checkin_time || '-'}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Check-out</Text>
            <Text style={[styles.value, { color: colors.text }]}>{visit.checkout_time || '-'}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>User</Text>
            <Text style={[styles.value, { color: colors.text }]}>{visit.user?.name} ({visit.user?.username})</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Outlet</Text>
            <Text style={[styles.value, { color: colors.text }]}>{visit.outlet?.name} ({visit.outlet?.code})</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>District</Text>
            <Text style={[styles.value, { color: colors.text }]}>{visit.outlet?.district}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Status Outlet</Text>
            <StatusBadge status={visit.outlet?.status ? visit.outlet.status.charAt(0).toUpperCase() + visit.outlet.status.slice(1) : '-'} color={getStatusColor(visit.outlet?.status)} />
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Lokasi Outlet</Text>
            <Text style={[styles.value, { color: colors.text }]}>{visit.outlet?.location}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Radius Outlet</Text>
            <Text style={[styles.value, { color: colors.text }]}>{visit.outlet?.radius}</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
});
