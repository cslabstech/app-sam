import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type VisitStatus = 'planned' | 'completed' | 'cancelled';
type FilterType = 'All' | 'Today';

interface Visit {
  id: string;
  outletName: string;
  outletAddress: string;
  date: string;
  time: string;
  status: VisitStatus;
}

export default function VisitsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');

  // Mock data
  const visits: Visit[] = [];
  
  const filterTabs: FilterType[] = ['All', 'Today'];

  const filteredVisits = visits.filter(visit => {
    switch (selectedFilter) {
      case 'Today':
        return visit.date === 'Today';
      default:
        return true;
    }
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Visits</Text>
        <Button
          title="Plan Visit" 
          size="small"
          onPress={() => router.push('/plan-visit')}
        />
      </View>

      <View style={[styles.filterContainer, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterTabs}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                selectedFilter === item && { 
                  backgroundColor: colors.primary + '20',
                  borderWidth: selectedFilter === item ? 1 : 0,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: selectedFilter === item ? colors.primary : colors.textSecondary },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <FlatList
        data={filteredVisits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/visit-detail', params: { id: item.id } })}
            activeOpacity={0.7}
          >
            <Card style={[styles.visitCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <View style={styles.visitInfo}>
                <View style={styles.visitHeader}>
                  <Text style={[styles.visitOutletName, { color: colors.text }]}>{item.outletName}</Text>
                </View>
                <View style={styles.visitAddressContainer}>
                  <IconSymbol name="location.fill" size={14} color={colors.textSecondary} />
                  <Text style={[styles.visitAddress, { color: colors.textSecondary }]}>{item.outletAddress}</Text>
                </View>
                <View style={styles.visitDetailsContainer}>
                  <View style={styles.visitDetail}>
                    <IconSymbol name="calendar" size={14} color={colors.textSecondary} />
                    <Text style={[styles.visitDetailText, { color: colors.textSecondary }]}>{item.date}</Text>
                  </View>
                  <View style={styles.visitDetail}>
                    <IconSymbol name="clock.fill" size={14} color={colors.textSecondary} />
                    <Text style={[styles.visitDetailText, { color: colors.textSecondary }]}>{item.time}</Text>
                  </View>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} style={styles.viewButtonAccessory} />
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Card>
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
              No visits found
            </Text>
          </Card>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterContainer: {
    marginBottom: 8,
    paddingBottom: 8,
  },
  filterList: {
    paddingHorizontal: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  visitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitInfo: {
    flex: 1,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  visitOutletName: {
    fontSize: 16,
    fontWeight: '600',
  },
  visitAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  visitAddress: {
    fontSize: 14,
    marginLeft: 4,
  },
  visitDetailsContainer: {
    flexDirection: 'row',
  },
  visitDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  visitDetailText: {
    fontSize: 14,
    marginLeft: 4,
  },
  viewButtonAccessory: {
    marginLeft: 8,
  },
});