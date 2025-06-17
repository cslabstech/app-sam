import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import OutletItem from '@/components/OutletItem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { OutletAPI } from '@/hooks/useOutlet';

/**
 * NOTE: This file uses old mock data structure and needs to be updated
 * to match the new OutletAPI interface. The mock data should be updated
 * to use the new fields: code, name, district, status, location, etc.
 * instead of the old fields: kodeOutlet, namaOutlet, alamatOutlet, etc.
 * 
 * This is a mock file for demonstration purposes.
 */

// Mock data - in a real app, you'd fetch this from your API
// FIXME: Update this mock data to match new OutletAPI structure
const MOCK_OUTLETS: any[] = [ // Using any[] to suppress type errors for now
  {
    id: '1',
    kodeOutlet: 'OUT001',
    namaOutlet: 'Toko Sejahtera',
    alamatOutlet: 'Jl. Raya Pasar Minggu No. 123, Jakarta Selatan',
    latlong: '-6.2607573,106.8231398',
    statusOutlet: 'not_visited',
    namaPemilikOutlet: '',
    nomerTlpOutlet: '',
    potoShopSign: '',
    potoDepan: '',
    potoKiri: '',
    potoKanan: '',
    potoKtp: '',
    distric: '',
    video: '',
    limit: 0,
    region: '',
    cluster: '',
    divisi: '',
    radius: 0,
  },
  {
    id: '2',
    kodeOutlet: 'OUT002',
    namaOutlet: 'Toko Makmur',
    alamatOutlet: 'Jl. Raya Bogor No. 456, Jakarta Timur',
    latlong: '-6.3000005,106.8700009',
    statusOutlet: 'checked_in',
    namaPemilikOutlet: '',
    nomerTlpOutlet: '',
    potoShopSign: '',
    potoDepan: '',
    potoKiri: '',
    potoKanan: '',
    potoKtp: '',
    distric: '',
    video: '',
    limit: 0,
    region: '',
    cluster: '',
    divisi: '',
    radius: 0,
  },
  {
    id: '3',
    kodeOutlet: 'OUT003',
    namaOutlet: 'Toko Berkah',
    alamatOutlet: 'Jl. Raya Serpong No. 789, Tangerang Selatan',
    latlong: '-6.2400007,106.6200003',
    statusOutlet: 'completed',
    namaPemilikOutlet: '',
    nomerTlpOutlet: '',
    potoShopSign: '',
    potoDepan: '',
    potoKiri: '',
    potoKanan: '',
    potoKtp: '',
    distric: '',
    video: '',
    limit: 0,
    region: '',
    cluster: '',
    divisi: '',
    radius: 0,
  },
  {
    id: '4',
    kodeOutlet: 'OUT004',
    namaOutlet: 'Toko Jaya',
    alamatOutlet: 'Jl. Raya Bekasi No. 101, Bekasi',
    latlong: '-6.2100002,106.9800005',
    statusOutlet: 'not_visited',
    namaPemilikOutlet: '',
    nomerTlpOutlet: '',
    potoShopSign: '',
    potoDepan: '',
    potoKiri: '',
    potoKanan: '',
    potoKtp: '',
    distric: '',
    video: '',
    limit: 0,
    region: '',
    cluster: '',
    divisi: '',
    radius: 0,
  },
  {
    id: '5',
    kodeOutlet: 'OUT005',
    namaOutlet: 'Toko Barokah',
    alamatOutlet: 'Jl. Raya Depok No. 202, Depok',
    latlong: '-6.3900006,106.8200007',
    statusOutlet: 'not_visited',
    namaPemilikOutlet: '',
    nomerTlpOutlet: '',
    potoShopSign: '',
    potoDepan: '',
    potoKiri: '',
    potoKanan: '',
    potoKtp: '',
    distric: '',
    video: '',
    limit: 0,
    region: '',
    cluster: '',
    divisi: '',
    radius: 0,
  },
];

// Mock data for today's visits recap
const MOCK_RECAP = {
  totalOutlets: 5,
  visited: 1,
  checkedIn: 1,
  remaining: 3,
  completionRate: '40%'
};

// Mock data for today's visit log
const MOCK_VISIT_LOG = [
  {
    id: '101',
    kodeOutlet: 'OUT002',
    namaOutlet: 'Toko Makmur',
    checkInTime: '10:30',
    status: 'ongoing', // ongoing, completed
  },
  {
    id: '102',
    kodeOutlet: 'OUT003',
    namaOutlet: 'Toko Berkah',
    checkInTime: '08:15',
    checkOutTime: '09:45',
    status: 'completed',
  },
];

export default function LiveVisitScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [outlets, setOutlets] = useState(MOCK_OUTLETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [recapData, setRecapData] = useState(MOCK_RECAP);
  const [selectedOutlet, setSelectedOutlet] = useState<OutletAPI | null>(null);
  const [visitLog, setVisitLog] = useState(MOCK_VISIT_LOG);
  const [activeTab, setActiveTab] = useState('outlets'); // outlets or visits

  // Filter outlets based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setOutlets(MOCK_OUTLETS);
    } else {
      const filteredOutlets = MOCK_OUTLETS.filter(outlet => 
        outlet.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        outlet.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        outlet.district?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setOutlets(filteredOutlets);
    }
  }, [searchQuery]);

  // Handle outlet selection 
  const handleOutletSelection = (outlet: OutletAPI) => {
    setSelectedOutlet(outlet);
  };
  
  // Handle check-in action
  const handleCheckIn = () => {
    if (!selectedOutlet) {
      Alert.alert('No Outlet Selected', 'Please select an outlet first.');
      return;
    }
    
    if (selectedOutlet.status === 'completed') {
      Alert.alert('Visit Completed', 'This outlet has already been visited today.');
      return;
    }
    
    // Navigate to check-in screen
    router.push(`/livevisit/check-in?id=${selectedOutlet.id}`);
  };
  
  // Handle check-out action
  const handleCheckOut = (visitId: string) => {
    // Navigate to check-out screen
    router.push(`/livevisit/check-out?id=${visitId}`);
  };
  
  // Get status badge for an outlet
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return { 
          color: colors.warning,
          backgroundColor: `${colors.warning}20`,
          text: 'CHECKED IN'
        };
      case 'completed':
        return { 
          color: colors.success,
          backgroundColor: `${colors.success}20`,
          text: 'COMPLETED'
        };
      default:
        return { 
          color: colors.textSecondary,
          backgroundColor: `${colors.border}50`,
          text: 'NOT VISITED'
        };
    }
  };
  
  // Render a visit log item
  const renderVisitLogItem = ({ item }: { item: typeof MOCK_VISIT_LOG[0] }) => {
    return (
      <Card style={styles.visitLogCard}>
        <View style={styles.visitLogHeader}>
          <Text style={[styles.visitLogOutletCode, { color: colors.primary }]}>{item.kodeOutlet}</Text>
          <Text style={[styles.visitLogTime, { color: colors.textSecondary }]}>
            {item.checkInTime}{item.checkOutTime ? ` - ${item.checkOutTime}` : ''}
          </Text>
        </View>
        
        <Text style={[styles.visitLogOutletName, { color: colors.text }]}>{item.namaOutlet}</Text>
        
        <View style={styles.visitLogStatusContainer}>
          {item.status === 'ongoing' ? (
            <>
              <View style={styles.visitLogStatus}>
                <IconSymbol name="clock" size={16} color={colors.warning} />
                <Text style={[styles.visitLogStatusText, { color: colors.warning }]}>Check-in completed</Text>
              </View>
              <TouchableOpacity 
                style={[styles.checkOutButton, { backgroundColor: colors.warning }]}
                onPress={() => handleCheckOut(item.id)}
              >
                <Text style={styles.checkOutButtonText}>Check Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.visitLogStatus}>
              <IconSymbol name="checkmark.circle" size={16} color={colors.success} />
              <Text style={[styles.visitLogStatusText, { color: colors.success }]}>Visit completed</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Today's Visits</Text>
      </View>
      
      <View style={styles.content}>
        {/* Tab selection */}
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'outlets' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab('outlets')}
          >
            <Text 
              style={[
                styles.tabText, 
                { color: activeTab === 'outlets' ? colors.primary : colors.textSecondary }
              ]}
            >
              Outlets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tab, 
              activeTab === 'visits' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab('visits')}
          >
            <Text 
              style={[
                styles.tabText, 
                { color: activeTab === 'visits' ? colors.primary : colors.textSecondary }
              ]}
            >
              Today's Visit Log
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'outlets' ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Today's recap card */}
            <Card style={styles.recapCard}>
              <Text style={[styles.recapTitle, { color: colors.text }]}>Today's Progress</Text>
              
              <View style={styles.recapStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{recapData.totalOutlets}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.success }]}>{recapData.visited}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.warning }]}>{recapData.checkedIn}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>In Progress</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.textSecondary }]}>{recapData.remaining}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Remaining</Text>
                </View>
              </View>
              
              <View style={[styles.progressBar, { backgroundColor: `${colors.primary}20` }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${parseInt(recapData.completionRate)}%`, backgroundColor: colors.primary }
                  ]} 
                />
              </View>
              
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {recapData.completionRate} Completed
              </Text>
            </Card>
            
            {/* Selected Outlet and Check In Button */}
            <Card style={styles.selectedOutletCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Selected Outlet</Text>
              
              {selectedOutlet ? (
                <View style={styles.selectedOutletInfo}>
                  <Text style={[styles.selectedOutletName, { color: colors.text }]}>
                    {selectedOutlet.name} ({selectedOutlet.code})
                  </Text>
                  <Text style={[styles.selectedOutletAddress, { color: colors.textSecondary }]}>
                    {selectedOutlet.district}
                  </Text>
                  <Button 
                    onPress={handleCheckIn}
                    title={selectedOutlet.status === 'checked_in' ? 'Check Out' : 'Check In'}
                    style={styles.checkInButton}
                    disabled={selectedOutlet.status === 'completed'}
                  />
                </View>
              ) : (
                <Text style={[styles.noSelectionText, { color: colors.textSecondary }]}>
                  Select an outlet from the list below
                </Text>
              )}
            </Card>
            
            {/* Search bar */}
            <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search outlets..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <IconSymbol name="xmark.circle.fill" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Outlets list */}
            {outlets.map((item: OutletAPI) => (
              <OutletItem key={item.id} outlet={item} />
            ))}
            
            {outlets.length === 0 && (
              <View style={styles.emptyContainer}>
                <IconSymbol name="exclamationmark.circle" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No outlets found matching your search.
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          // Visit Log Tab Content
          <>
            <Text style={[styles.visitLogTitle, { color: colors.text }]}>Today's Check-Ins</Text>
            
            {visitLog.length > 0 ? (
              <FlatList
                data={visitLog}
                renderItem={renderVisitLogItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.visitLogList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <IconSymbol name="clipboard" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No check-ins recorded for today.
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  recapCard: {
    padding: 16,
    marginBottom: 16,
  },
  recapTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  recapStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  selectedOutletCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedOutletInfo: {
    alignItems: 'center',
  },
  selectedOutletName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedOutletAddress: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  noSelectionText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  checkInButton: {
    width: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  list: {
    paddingBottom: 16,
  },
  outletCard: {
    padding: 16,
    marginBottom: 12,
  },
  outletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  outletCode: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  outletName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  outletAddress: {
    fontSize: 14,
    marginBottom: 8,
  },
  visitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  visitTimeText: {
    fontSize: 12,
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  visitLogTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  visitLogList: {
    flexGrow: 1,
  },
  visitLogCard: {
    padding: 16,
    marginBottom: 12,
  },
  visitLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  visitLogOutletCode: {
    fontSize: 14,
    fontWeight: '500',
  },
  visitLogTime: {
    fontSize: 12,
  },
  visitLogOutletName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  visitLogStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visitLogStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitLogStatusText: {
    marginLeft: 6,
    fontSize: 14,
  },
  checkOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  checkOutButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
});