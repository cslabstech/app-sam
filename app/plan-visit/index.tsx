import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { PlanVisit, usePlanVisit } from '@/hooks/data/usePlanVisit';
import { useThemeStyles } from '@/hooks/utils/useThemeStyles';

export default function PlanVisitListScreen() {
  const { planVisits, loading, error, fetchPlanVisits, deletePlanVisit } = usePlanVisit();
  const [refreshing, setRefreshing] = useState(false);
  const { colors, styles } = useThemeStyles();
  const insets = useSafeAreaInsets();

  const loadPlanVisits = useCallback(async () => {
    const result = await fetchPlanVisits();
    console.log('Fetch Plan Visits Result:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data) {
      console.log('Plan Visits Data:', JSON.stringify(result.data, null, 2));
      console.log('First Item:', result.data[0]);
      console.log('First Item ID:', result.data[0]?.id);
    }
    
    if (!result.success) {
      Alert.alert('Error', result.error || 'Gagal memuat data plan visit');
    }
  }, [fetchPlanVisits]);

  // Fetch data on mount
  useEffect(() => {
    loadPlanVisits();
  }, [loadPlanVisits]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPlanVisits();
    setRefreshing(false);
  }, [loadPlanVisits]);

  const handleDelete = async (item: PlanVisit) => {
    // Debug: Check the item structure and ID
    console.log('Plan Visit Item untuk delete:', JSON.stringify(item, null, 2));
    console.log('Item ID:', item.id);
    console.log('Type of ID:', typeof item.id);
    
    if (!item.id) {
      Alert.alert('Error', 'ID plan visit tidak ditemukan');
      console.log('Error: ID is null/undefined/empty');
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
            console.log('Deleting plan visit with ID:', item.id);
            console.log('Calling deletePlanVisit with:', item.id);
            const result = await deletePlanVisit(item.id);
            console.log('Delete result:', JSON.stringify(result, null, 2));
            
            if (result.success) {
              Alert.alert('Berhasil', 'Plan visit berhasil dihapus');
              loadPlanVisits(); // Refresh list
            } else {
              Alert.alert('Error', result.error || 'Gagal menghapus plan visit');
            }
          },
        },
      ]
    );
  };

  const handleCreate = () => {
    router.push('/plan-visit/create');
  };

  const renderPlanVisitItem = ({ item }: { item: PlanVisit }) => (
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
            📅 {new Date(item.plan_date).toLocaleDateString('id-ID')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: item.type === 'REGULAR' ? colors.info + '20' : colors.success + '20'
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: item.type === 'REGULAR' ? colors.info : colors.success
              }}>
                {item.type}
              </Text>
            </View>
          </View>
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
  );

  if (loading && !refreshing) {
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
            keyExtractor={(item, index) => {
              const key = item.id || `plan-visit-${index}`;
              console.log('Key for item:', key, 'Item ID:', item.id);
              return String(key);
            }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
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