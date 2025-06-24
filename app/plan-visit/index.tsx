import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { PlanVisit, usePlanVisit } from '@/hooks/data/usePlanVisit';
import { useThemeStyles } from '@/hooks/utils/useThemeStyles';

export default function PlanVisitListScreen() {
  const { planVisits, loading, error, meta, fetchPlanVisits, deletePlanVisit } = usePlanVisit();
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const { colors, styles } = useThemeStyles();
  const insets = useSafeAreaInsets();

  // Fetch with params - seperti di outlets/visits tabs
  const fetchPage = useCallback((newPage: number) => {
    setPage(newPage);
    fetchPlanVisits({
      page: newPage,
      per_page: perPage,
      sort_column: 'visit_date',
      sort_direction: 'desc',
    });
  }, [fetchPlanVisits, perPage]);

  // Fetch on mount and when params change - pattern dari tabs
  useEffect(() => {
    fetchPlanVisits({
      page,
      per_page: perPage,
      sort_column: 'visit_date',
      sort_direction: 'desc',
    });
  }, [page, perPage, fetchPlanVisits]);

  // Refresh data setiap kali halaman di-focus (ketika kembali dari halaman lain)
  useFocusEffect(
    useCallback(() => {
      // Reset ke page 1 dan fetch ulang saat kembali ke halaman
      if (page !== 1) {
        setPage(1);
      } else {
        fetchPlanVisits({
          page: 1,
          per_page: perPage,
          sort_column: 'visit_date',
          sort_direction: 'desc',
        });
      }
    }, [fetchPlanVisits, perPage, page])
  );

  // Handle pull-to-refresh - pattern dari tabs
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    fetchPage(1);
    setRefreshing(false);
  }, [fetchPage]);

  const handleDelete = useCallback(async (item: PlanVisit) => {
    if (!item.id) {
      Alert.alert('Error', 'ID plan visit tidak ditemukan');
      return;
    }

    Alert.alert(
      'Hapus Plan Visit',
      `Yakin ingin menghapus plan visit untuk ${item.outlet?.name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const result = await deletePlanVisit(item.id);
            
            if (result.success) {
              Alert.alert('Berhasil', 'Plan visit berhasil dihapus');
              // Refresh current page setelah delete
              fetchPage(page);
            } else {
              Alert.alert('Error', result.error || 'Gagal menghapus plan visit');
            }
          },
        },
      ]
    );
  }, [deletePlanVisit, fetchPage, page]);

  const handleCreate = () => {
    router.push('/plan-visit/create');
  };

  const renderPlanVisitItem = useCallback(({ item }: { item: PlanVisit }) => (
    <View style={[
      {
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
        borderWidth: 1,
      },
      styles.card.default
    ]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={[{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }, styles.text.primary]}>
            {item.outlet?.name || 'Unknown Outlet'}
          </Text>
          <Text style={[{ fontSize: 14, marginBottom: 4 }, styles.text.secondary]}>
            {item.outlet?.code} • {item.outlet?.district}
          </Text>
          <Text style={[{ fontSize: 16, marginBottom: 8 }, styles.text.primary]}>
            📅 {new Date(item.visit_date).toLocaleDateString('id-ID')}
          </Text>
        </View>
        <Pressable
          style={{ padding: 8 }}
          onPress={() => handleDelete(item)}
          accessibilityRole="button"
        >
          <IconSymbol name="trash" size={20} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  ), [styles, colors, handleDelete]);

  if (loading && !refreshing && planVisits.length === 0) {
    return (
      <View style={[{ flex: 1 }, styles.background.primary]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[{ fontSize: 18, fontWeight: '600' }, styles.text.primary]}>
            Memuat plan visit...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1 }, styles.background.primary]}>
      {/* Header */}
      <View style={[styles.header.primary, { paddingHorizontal: 16, paddingBottom: 16, paddingTop: insets.top + 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }} accessibilityRole="button">
            <IconSymbol name="chevron.left" size={24} color={colors.textInverse} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[{ fontSize: 20, fontWeight: 'bold' }, styles.text.inverse]}>Plan Visit</Text>
          </View>
          <Pressable onPress={handleCreate} style={{ padding: 4 }} accessibilityRole="button">
            <IconSymbol name="plus" size={24} color={colors.textInverse} />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        {error && (
          <View style={{
            backgroundColor: colors.danger + '10',
            borderColor: colors.danger + '30',
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16
          }}>
            <Text style={[styles.text.error]}>{error}</Text>
          </View>
        )}

        {planVisits && planVisits.length > 0 ? (
          <FlatList
            data={planVisits}
            renderItem={renderPlanVisitItem}
            keyExtractor={(item, index) => String(item.id || `plan-visit-${index}`)}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <IconSymbol name="calendar" size={60} color={colors.textSecondary} />
            <Text style={[{ fontSize: 18, fontWeight: '600', marginTop: 16 }, styles.text.secondary]}>
              Belum ada plan visit
            </Text>
            <Text style={[{ fontSize: 16, marginTop: 8, textAlign: 'center' }, styles.text.tertiary]}>
              Tap tombol + untuk menambah plan visit baru
            </Text>
          </View>
        )}
      </View>
    </View>
  );
} 