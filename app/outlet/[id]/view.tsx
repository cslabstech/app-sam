import { MediaPreview } from '@/components/MediaPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/context/network-context';
import { useOutlet } from '@/hooks/data/useOutlet';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_URL_STORAGE = process.env.EXPO_PUBLIC_BASE_URL_STORAGE;

// Komponen atomic untuk badge status outlet
const StatusBadge = ({ status, color }: { status: string; color: string }) => (
  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: color + '15' }}>
    <Text style={{ fontSize: 13, fontWeight: '600', color }}>{status}</Text>
  </View>
);

// Helper untuk mendapatkan URL gambar yang benar
const getImageUrl = (path: string | null) => {
  if (!path || path === '-') return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL_STORAGE}${path}`;
};

export default function OutletViewPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { outlet, loading, error, fetchOutlet } = useOutlet('');
  const [activeTab, setActiveTab] = useState('info');
  const { isConnected } = useNetwork();

  // --- MEDIA TAB STATE ---
  type MediaImage = { label: string; uri: string };
  const imageList: MediaImage[] = outlet?.photos ? [
    { label: 'Shop Sign', uri: getImageUrl(outlet.photos.shop_sign) || '' },
    { label: 'Front View', uri: getImageUrl(outlet.photos.front) || '' },
    { label: 'Left View', uri: getImageUrl(outlet.photos.left) || '' },
    { label: 'Right View', uri: getImageUrl(outlet.photos.right) || '' },
    { label: 'ID Card', uri: getImageUrl(outlet.photos.id_card) || '' },
  ].filter(img => img.uri) : [];
  
  const [videoLoading, setVideoLoading] = useState(true);
  const videoUrl = outlet?.video ? getImageUrl(outlet.video) : null;
  const videoPlayer = useVideoPlayer({ uri: videoUrl || '' });

  useEffect(() => {
    if (id) fetchOutlet(id as string);
  }, [id]);

  // Debug: log outlet setiap render, hanya jika outlet sudah ada
  useEffect(() => {
    if (outlet) {
      console.log('OutletViewPage outlet:', outlet);
    }
  }, [outlet]);

  const getStatusColor = (status: string) => {
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

  if (error) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }} edges={isConnected ? ['top','left','right'] : ['left','right']}>
      <IconSymbol name="exclamationmark.triangle" size={48} color={colors.danger} />
      <Text style={{ color: colors.danger, margin: 20, textAlign: 'center' }}>{error}</Text>
      <Button title="Go Back" variant="primary" onPress={() => router.back()} />
    </SafeAreaView>
  );

  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }} edges={isConnected ? ['top','left','right'] : ['left','right']}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.text, marginTop: 16 }}>Loading outlet data...</Text>
    </SafeAreaView>
  );

  // Jangan render "Data outlet tidak ditemukan" jika masih loading
  if (!outlet && !loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }} edges={isConnected ? ['top','left','right'] : ['left','right']}>
      <IconSymbol name="exclamationmark.triangle" size={48} color={colors.danger} />
      <Text style={{ color: colors.danger, margin: 20, textAlign: 'center' }}>Data outlet tidak ditemukan.</Text>
      <Button title="Go Back" variant="primary" onPress={() => router.back()} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={isConnected ? ['top','left','right'] : ['left','right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}> 
            {outlet?.name || 'Outlet Detail'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/outlet/${outlet?.id}/edit`)}
          style={{ padding: 8, marginRight: 4 }}
        >
          <IconSymbol name="pencil" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'info' && [styles.activeTab, { borderColor: colors.primary }]
          ]} 
          onPress={() => setActiveTab('info')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'info' ? colors.primary : colors.textSecondary }
          ]}>Info</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'location' && [styles.activeTab, { borderColor: colors.primary }]
          ]} 
          onPress={() => setActiveTab('location')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'location' ? colors.primary : colors.textSecondary }
          ]}>Lokasi</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'media' && [styles.activeTab, { borderColor: colors.primary }]
          ]} 
          onPress={() => setActiveTab('media')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'media' ? colors.primary : colors.textSecondary }
          ]}>Media</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        {/* Tab Content */}
        {activeTab === 'info' && (
          <View style={styles.tabContent}>
            {/* Basic Info Card */}
            <Card style={styles.card}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Informasi Outlet</Text>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Kode Outlet</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.code || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nama Outlet</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.name || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>District</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.district || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Status</Text>
                <StatusBadge
                  status={outlet!.status ? outlet!.status.charAt(0).toUpperCase() + outlet!.status.slice(1) : '-'}
                  color={getStatusColor(outlet!.status || '')}
                />
              </View>
              {outlet!.radius && (
                <View style={styles.cardRow}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Radius</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{outlet!.radius?.toString() + ' m' || '-'}</Text>
                </View>
              )}
            </Card>

            {/* Owner Info Card */}
            {(outlet!.owner_name || outlet!.owner_phone) && (
              <Card style={styles.card}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Informasi Pemilik</Text>
                {outlet!.owner_name && (
                  <View style={styles.cardRow}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Nama Pemilik</Text>
                    <Text style={[styles.value, { color: colors.text }]}>{outlet!.owner_name}</Text>
                  </View>
                )}
                {outlet!.owner_phone && (
                  <View style={styles.cardRow}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>No. Telepon</Text>
                    <Text style={[styles.value, { color: colors.text }]}>{outlet!.owner_phone}</Text>
                  </View>
                )}
              </Card>
            )}

            {/* Address Card */}
            {outlet!.address && (
              <Card style={styles.card}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Alamat</Text>
                <Text style={[styles.addressText, { color: colors.text }]}>{outlet!.address}</Text>
              </Card>
            )}

            {/* Organization Info Card */}
            <Card style={styles.card}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Informasi Organisasi</Text>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Badan Usaha</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.badan_usaha?.name || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Division</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.division?.name || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Region</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.region?.name || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Cluster</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.cluster?.name || '-'}</Text>
              </View>
            </Card>
          </View>
        )}
        {activeTab === 'location' && (
          <View style={styles.tabContent}>
            <Card style={styles.card}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Informasi Lokasi</Text>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>District</Text>
                <Text style={[styles.value, { color: colors.text, textAlign: 'right', flex: 1, maxWidth: '70%' }]}>{outlet!.district || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Region</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.region?.name || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Cluster</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.cluster?.name || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Koordinat</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.location || '-'}</Text>
              </View>
              {outlet!.radius && (
                <View style={styles.cardRow}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Radius</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{outlet!.radius?.toString() + ' m' || '-'}</Text>
                </View>
              )}
            </Card>
            
            {/* Address Card */}
            {outlet!.address && (
              <Card style={styles.card}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Alamat Lengkap</Text>
                <Text style={[styles.addressText, { color: colors.text }]}>{outlet!.address}</Text>
              </Card>
            )}
          </View>
        )}
        {activeTab === 'media' && (
          <View style={styles.tabContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.text, marginBottom: 12 }}>Foto Outlet</Text>
            {imageList.length > 0 ? (
              imageList.map((img) => (
                <Card key={img.label} style={{ marginBottom: 12, alignItems: 'center', padding: 12 }}>
                  <Text style={[styles.mediaLabel, { color: colors.text }]}>{img.label}</Text>
                  <MediaPreview uri={img.uri} type="image" />
                </Card>
              ))
            ) : (
              <View style={styles.mediaEmptyState}>
                <IconSymbol name="photo" size={48} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Tidak ada foto outlet.</Text>
              </View>
            )}
            
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.text, marginTop: 20, marginBottom: 12 }}>Video Outlet</Text>
            {videoUrl ? (
              <Card style={{ marginBottom: 12, alignItems: 'center', padding: 12 }}>
                <Text style={[styles.mediaLabel, { color: colors.text }]}>Video Outlet</Text>
                <MediaPreview uri={videoUrl} type="video" />
              </Card>
            ) : (
              <View style={styles.mediaEmptyState}>
                <IconSymbol name="video" size={48} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Tidak ada video outlet.</Text>
              </View>
            )}
          </View>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 8,
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabContent: {
    paddingTop: 16,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
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
  },
  addressText: {
    fontSize: 15,
    lineHeight: 22,
  },
  mediaLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  mediaEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
});
