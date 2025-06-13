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
type FilterType = 'All' | 'Today' | 'Upcoming' | 'Completed' | 'Cancelled';

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
  const visits: Visit[] = [
    { 
      id: '1', 
      outletName: 'Toko Sejahtera', 
      outletAddress: 'Jl. Raya No. 123, Jakarta', 
      date: 'Today', 
      time: '09:30', 
      status: 'planned' 
    },
    { 
      id: '2', 
      outletName: 'Warung Barokah', 
      outletAddress: 'Jl. Melati No. 45, Jakarta', 
      date: 'Today', 
      time: '11:00', 
      status: 'planned' 
    },
    { 
      id: '3', 
      outletName: 'Toko Makmur', 
      outletAddress: 'Jl. Anggrek No. 67, Jakarta', 
      date: 'Tomorrow', 
      time: '10:30', 
      status: 'planned' 
    },
    { 
      id: '4', 
      outletName: 'Duta Cell', 
      outletAddress: 'Jl. Kenanga No. 89, Jakarta', 
      date: 'May 5, 2025', 
      time: '14:00', 
      status: 'planned' 
    },
    { 
      id: '5', 
      outletName: 'Jaya Cell', 
      outletAddress: 'Jl. Ahmad Yani No. 45, Jakarta', 
      date: 'May 2, 2025', 
      time: '09:15', 
      status: 'completed' 
    },
    { 
      id: '6', 
      outletName: 'Toko ABC', 
      outletAddress: 'Jl. Sudirman No. 87, Jakarta', 
      date: 'Apr 28, 2025', 
      time: '13:00', 
      status: 'completed' 
    },
    { 
      id: '7', 
      outletName: 'Toko XYZ', 
      outletAddress: 'Jl. Gatot Subroto No. 12, Jakarta', 
      date: 'Apr 25, 2025', 
      time: '11:30', 
      status: 'cancelled' 
    },
  ];

  const filterTabs: FilterType[] = ['All', 'Today', 'Upcoming', 'Completed', 'Cancelled'];

  const filteredVisits = visits.filter(visit => {
    switch (selectedFilter) {
      case 'Today':
        return visit.date === 'Today';
      case 'Upcoming':
        return visit.status === 'planned' && visit.date !== 'Today';
      case 'Completed':
        return visit.status === 'completed';
      case 'Cancelled':
        return visit.status === 'cancelled';
      default:
        return true;
    }
  });

  const getStatusColor = (status: VisitStatus) => {
    switch (status) {
      case 'planned':
        return colors.primary;
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: VisitStatus) => {
    switch (status) {
      case 'planned':
        return 'Planned';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

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
            onPress={() => router.push({
              pathname: '/visit/[id]',
              params: { id: item.id },
            })}
          >
            <Card style={styles.visitCard}>
              <View style={styles.visitInfo}>
                <View style={styles.visitHeader}>
                  <Text style={[styles.visitOutletName, { color: colors.text }]}>{item.outletName}</Text>
                  <View style={[styles.visitBadge, { 
                    backgroundColor: getStatusColor(item.status) + '20',
                    borderWidth: 1,
                    borderColor: getStatusColor(item.status),
                  }]}>
                    <Text style={[styles.visitBadgeText, { color: getStatusColor(item.status) }]}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.visitAddressContainer}>
                  <IconSymbol name="mappin.and.ellipse" size={14} color={colors.textSecondary} />
                  <Text style={[styles.visitAddress, { color: colors.textSecondary }]}>{item.outletAddress}</Text>
                </View>
                
                <View style={styles.visitDetailsContainer}>
                  <View style={styles.visitDetail}>
                    <IconSymbol name="calendar" size={14} color={colors.textSecondary} />
                    <Text style={[styles.visitDetailText, { color: colors.textSecondary }]}>
                      {item.date}
                    </Text>
                  </View>
                  
                  <View style={styles.visitDetail}>
                    <IconSymbol name="clock.fill" size={14} color={colors.textSecondary} />
                    <Text style={[styles.visitDetailText, { color: colors.textSecondary }]}>
                      {item.time}
                    </Text>
                  </View>
                </View>
              </View>
              
              {item.status === 'planned' && (
                <Button 
                  title={item.date === 'Today' ? "Start Visit" : "View"}
                  variant={item.date === 'Today' ? "primary" : "secondary"}
                  size="small" 
                  onPress={() => router.push({
                    pathname: item.date === 'Today' ? '/live-visit/[id]' : '/visit/[id]',
                    params: { id: item.id },
                  })}
                />
              )}
              
              {(item.status === 'completed' || item.status === 'cancelled') && (
                <TouchableOpacity 
                  style={[styles.viewButton, { 
                    borderWidth: 1, 
                    borderColor: colors.border,
                    backgroundColor: colors.white,
                  }]}
                >
                  <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
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
  visitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  visitBadgeText: {
    fontSize: 12,
    fontWeight: '500',
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
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});