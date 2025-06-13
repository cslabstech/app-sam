import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOutletDetail } from '@/hooks/useOutletDetail';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_URL_STORAGE = process.env.EXPO_PUBLIC_BASE_URL_STORAGE;

export default function OutletViewPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { kode } = useLocalSearchParams<{ kode: string }>();
  const { outlet, loading, error, fetchOutlet } = useOutletDetail();
  const [activeTab, setActiveTab] = useState('info');

  // --- MEDIA TAB STATE ---
  type MediaImage = { label: string; uri: string };
  const imageList: MediaImage[] = [
    outlet?.potoShopSign ? { label: 'Shop Sign', uri: `${BASE_URL_STORAGE}/${outlet.potoShopSign}` } : null,
    outlet?.potoDepan ? { label: 'Depan', uri: `${BASE_URL_STORAGE}/${outlet.potoDepan}` } : null,
    outlet?.potoKiri ? { label: 'Kiri', uri: `${BASE_URL_STORAGE}/${outlet.potoKiri}` } : null,
    outlet?.potoKanan ? { label: 'Kanan', uri: `${BASE_URL_STORAGE}/${outlet.potoKanan}` } : null,
  ].filter((v): v is MediaImage => !!v);
  const [videoLoading, setVideoLoading] = useState(true);

  const videoPlayer = useVideoPlayer({ uri: outlet?.video ? `${BASE_URL_STORAGE}/${outlet.video}` : '' });

  useEffect(() => {
    if (kode) fetchOutlet(kode as string);
  }, [kode]);

  // Debug: log outlet setiap render
  useEffect(() => {
    console.log('OutletViewPage outlet:', outlet);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <IconSymbol name="exclamationmark.triangle" size={48} color={colors.danger} />
      <Text style={{ color: colors.danger, margin: 20, textAlign: 'center' }}>{error}</Text>
      <Button title="Go Back" variant="primary" onPress={() => router.back()} />
    </SafeAreaView>
  );

  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.text, marginTop: 16 }}>Loading outlet data...</Text>
    </SafeAreaView>
  );

  if (!outlet) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <IconSymbol name="exclamationmark.triangle" size={48} color={colors.danger} />
      <Text style={{ color: colors.danger, margin: 20, textAlign: 'center' }}>Data outlet tidak ditemukan.</Text>
      <Button title="Go Back" variant="primary" onPress={() => router.back()} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}> 
            {outlet?.namaOutlet || 'Outlet Detail'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/outlet/${outlet?.kodeOutlet}/edit`)}
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
            <Card style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Kode Outlet</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.kodeOutlet || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nama Outlet</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.namaOutlet || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nama Pemilik</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.namaPemilikOutlet || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nomor Telepon</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.nomerTlpOutlet || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Status</Text>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusColor(outlet!.statusOutlet || '') + '15' }
                ]}>
                  <Text style={[
                    styles.statusText, 
                    { color: getStatusColor(outlet!.statusOutlet || '') }
                  ]}>
                    {outlet!.statusOutlet ? outlet!.statusOutlet.charAt(0).toUpperCase() + outlet!.statusOutlet.slice(1) : '-'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Limit</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.limit?.toString() || '-'}</Text>
              </View>
            </Card>
          </View>
        )}
        {activeTab === 'location' && (
          <View style={styles.tabContent}>
            <Card style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Alamat</Text>
                <Text style={[styles.value, { color: colors.text, textAlign: 'right', flex: 1, maxWidth: '70%' }]}>{outlet!.alamatOutlet || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>District</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.distric || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>LatLong</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.latlong || '-'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Radius</Text>
                <Text style={[styles.value, { color: colors.text }]}>{outlet!.radius?.toString() || '-'}</Text>
              </View>
            </Card>
          </View>
        )}
        {activeTab === 'media' && (
          <View style={styles.tabContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.text, marginBottom: 12 }}>Foto Outlet</Text>
            {imageList.length > 0 ? (
              imageList.map((img) => (
                <Card key={img.label} style={{ marginBottom: 12, alignItems: 'center', padding: 12 }}>
                  <Text style={styles.mediaLabel}>{img.label}</Text>
                  <Image
                    source={{ uri: img.uri }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                </Card>
              ))
            ) : (
              <View style={styles.mediaEmptyState}>
                <IconSymbol name="photo" size={48} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Tidak ada foto outlet.</Text>
              </View>
            )}
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.text, marginTop: 20, marginBottom: 12 }}>Video Outlet</Text>
            <View style={styles.mediaVideoContainer}>
              {outlet!.video ? (
                <View style={{ position: 'relative' }}>
                  <VideoView
                    player={videoPlayer}
                    style={styles.mediaVideo}
                    nativeControls
                    contentFit="contain"
                  />
                </View>
              ) : (
                <View style={styles.mediaEmptyState}>
                  <IconSymbol name="video" size={48} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Tidak ada video outlet.</Text>
                </View>
              )}
            </View>
            {imageList.length === 0 && !outlet!.video && (
              <View style={styles.mediaEmptyState}>
                <IconSymbol name="photo" size={48} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Tidak ada media tersedia untuk outlet ini.</Text>
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  mediaItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  mediaLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontWeight: '600',
  },
  mediaImage: {
    width: 90,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginBottom: 2,
  },
  mediaPlaceholder: {
    width: 90,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 2,
  },
  mediaPlaceholderText: {
    color: '#bbb',
    fontSize: 22,
    fontWeight: 'bold',
  },
  mediaVideoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaVideo: {
    width: 220,
    height: 140,
    borderRadius: 10,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0, top: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 8,
    zIndex: 2,
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxImageWrap: {
    width: 320,
    height: 420,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  lightboxImage: {
    width: 300,
    height: 340,
    borderRadius: 16,
    backgroundColor: '#222',
  },
  lightboxLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  lightboxClose: {
    position: 'absolute',
    top: 32,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    padding: 4,
  },
  mediaEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
});
