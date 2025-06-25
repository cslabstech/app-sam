// React & React Native
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Third-party libraries
import { useLocalSearchParams, useRouter } from 'expo-router';

// Local components
import { MediaPreview } from '@/components/MediaPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Constants & utilities
import { Colors } from '@/constants/Colors';

// Hooks & contexts
import { useNetwork } from '@/context/network-context';
import { useOutlet } from '@/hooks/data/useOutlet';
import { useColorScheme } from '@/hooks/utils/useColorScheme';

// Constants
const BASE_URL_STORAGE = process.env.EXPO_PUBLIC_BASE_URL_STORAGE;

// Types
type ActiveTab = 'info' | 'location' | 'media';
type MediaImage = { label: string; uri: string };

// Custom hooks for separation of concerns
const useOutletView = (id: string | undefined) => {
  const { outlet, loading, error, fetchOutlet } = useOutlet('');

  useEffect(() => {
    if (id) fetchOutlet(id as string);
  }, [id]);

  // Debug: log outlet setiap render, hanya jika outlet sudah ada
  useEffect(() => {
    if (outlet) {
      console.log('OutletViewPage outlet:', outlet);
    }
  }, [outlet]);

  return { outlet, loading, error };
};

const useMediaData = (outlet: any) => {
  const imageList: MediaImage[] = outlet?.photos ? [
    { label: 'Shop Sign', uri: getImageUrl(outlet.photos.shop_sign) || '' },
    { label: 'Front View', uri: getImageUrl(outlet.photos.front) || '' },
    { label: 'Left View', uri: getImageUrl(outlet.photos.left) || '' },
    { label: 'Right View', uri: getImageUrl(outlet.photos.right) || '' },
    { label: 'ID Card', uri: getImageUrl(outlet.photos.id_card) || '' },
  ].filter(img => img.uri) : [];
  
  const videoUrl = outlet?.video ? getImageUrl(outlet.video) : null;

  return { imageList, videoUrl };
};

// Helper functions
const getImageUrl = (path: string | null) => {
  if (!path || path === '-') return null;
  if (path.startsWith('http')) return path;
  // Pastikan BASE_URL_STORAGE diakhiri dengan '/' dan path tidak dimulai dengan '/'
  const baseUrl = BASE_URL_STORAGE?.endsWith('/') ? BASE_URL_STORAGE : `${BASE_URL_STORAGE}/`;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${baseUrl}${cleanPath}`;
};

const getStatusColor = (status: string, colors: any) => {
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

// Memoized components for performance
const StatusBadge = React.memo(function StatusBadge({ 
  status, 
  color 
}: { 
  status: string; 
  color: string; 
}) {
  return (
    <View className="px-2 py-1 rounded-md" style={{ backgroundColor: color + '15' }}>
      <Text style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: '600', color }}>
        {status}
      </Text>
    </View>
  );
});

const LoadingScreen = React.memo(function LoadingScreen({ 
  colors, 
  isConnected 
}: { 
  colors: any; 
  isConnected: boolean; 
}) {
  return (
    <SafeAreaView 
      className="flex-1 bg-neutral-50 dark:bg-neutral-900" 
      edges={isConnected ? ['top','left','right'] : ['left','right']}
    >
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontFamily: 'Inter', color: colors.textSecondary }} className="mt-4 text-base">
          Memuat...
        </Text>
      </View>
    </SafeAreaView>
  );
});

const ErrorScreen = React.memo(function ErrorScreen({ 
  error, 
  colors, 
  isConnected, 
  onGoBack 
}: { 
  error: string; 
  colors: any; 
  isConnected: boolean; 
  onGoBack: () => void; 
}) {
  return (
    <SafeAreaView 
      className="flex-1 bg-neutral-50 dark:bg-neutral-900 justify-center items-center" 
      edges={isConnected ? ['top','left','right'] : ['left','right']}
    >
      <IconSymbol name="exclamationmark.triangle" size={48} color={colors.danger} />
      <Text style={{ fontFamily: 'Inter', color: colors.danger }} className="mx-5 my-5 text-center">
        {error}
      </Text>
      <Button title="Go Back" variant="primary" onPress={onGoBack} />
    </SafeAreaView>
  );
});

const Header = React.memo(function Header({ 
  title, 
  colors, 
  onBack, 
  onEdit 
}: { 
  title: string; 
  colors: any; 
  onBack: () => void; 
  onEdit: () => void; 
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800"> 
      <View className="flex-row items-center">
        <TouchableOpacity onPress={onBack} className="mr-2 p-2">
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Inter', color: colors.text }} className="text-xl font-bold"> 
          {title}
        </Text>
      </View>
      <TouchableOpacity onPress={onEdit} className="p-2 mr-1">
        <IconSymbol name="pencil" size={22} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
});

const TabNavigation = React.memo(function TabNavigation({ 
  activeTab, 
  onTabChange, 
  colors 
}: { 
  activeTab: ActiveTab; 
  onTabChange: (tab: ActiveTab) => void; 
  colors: any; 
}) {
  const tabs = [
    { id: 'info' as ActiveTab, label: 'Info' },
    { id: 'location' as ActiveTab, label: 'Lokasi' },
    { id: 'media' as ActiveTab, label: 'Media' },
  ];

  return (
    <View className="flex-row mt-2 border-b border-neutral-200 dark:border-neutral-800">
      {tabs.map((tab) => (
        <TouchableOpacity 
          key={tab.id}
          className={`py-3 px-4 flex-1 items-center ${
            activeTab === tab.id ? 'border-b-2' : ''
          }`}
          style={{
            borderBottomColor: activeTab === tab.id ? colors.primary : 'transparent'
          }}
          onPress={() => onTabChange(tab.id)}
        >
          <Text 
            style={{ 
              fontFamily: 'Inter',
              color: activeTab === tab.id ? colors.primary : colors.textSecondary 
            }}
            className="text-base font-semibold"
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

const InfoCard = React.memo(function InfoCard({ 
  title, 
  children, 
  colors 
}: { 
  title: string; 
  children: React.ReactNode; 
  colors: any; 
}) {
  return (
    <Card className="p-4 mb-4 rounded-xl">
      <Text style={{ fontFamily: 'Inter', color: colors.text }} className="text-base font-bold mb-3">
        {title}
      </Text>
      {children}
    </Card>
  );
});

const InfoRow = React.memo(function InfoRow({ 
  label, 
  value, 
  colors,
  isLast = false 
}: { 
  label: string; 
  value: React.ReactNode; 
  colors: any;
  isLast?: boolean;
}) {
  return (
    <View className={`flex-row justify-between items-center py-2 ${!isLast ? 'border-b border-neutral-100 dark:border-neutral-800' : ''}`}>
      <Text style={{ fontFamily: 'Inter', color: colors.textSecondary }} className="text-sm flex-1">
        {label}
      </Text>
      <View className="text-right">
        {typeof value === 'string' ? (
          <Text style={{ fontFamily: 'Inter', color: colors.text }} className="text-base font-medium text-right">
            {value}
          </Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
});

const AddressCard = React.memo(function AddressCard({ 
  address, 
  colors 
}: { 
  address: string; 
  colors: any; 
}) {
  return (
    <InfoCard title="Alamat" colors={colors}>
      <Text style={{ fontFamily: 'Inter', color: colors.text }} className="text-base leading-6">
        {address}
      </Text>
    </InfoCard>
  );
});

const MediaSection = React.memo(function MediaSection({ 
  title, 
  items, 
  emptyIcon, 
  emptyMessage, 
  colors 
}: { 
  title: string; 
  items: any[]; 
  emptyIcon: string; 
  emptyMessage: string; 
  colors: any; 
}) {
  return (
    <View>
      <Text style={{ fontFamily: 'Inter', color: colors.text }} className="font-bold text-base mb-3">
        {title}
      </Text>
      {items.length > 0 ? (
        items.map((item, index) => (
          <Card key={item.label || index} className="mb-3 items-center p-3">
            <Text style={{ fontFamily: 'Inter', color: colors.text }} className="text-sm mb-2 font-semibold">
              {item.label}
            </Text>
            <MediaPreview uri={item.uri} type={title.includes('Video') ? 'video' : 'image'} />
          </Card>
        ))
      ) : (
        <View className="items-center justify-center my-4">
          <IconSymbol name={emptyIcon} size={48} color={colors.textSecondary} />
          <Text style={{ fontFamily: 'Inter', color: colors.textSecondary }} className="mt-2">
            {emptyMessage}
          </Text>
        </View>
      )}
    </View>
  );
});

export default function OutletViewPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<ActiveTab>('info');
  const { isConnected } = useNetwork();

  const { outlet, loading, error } = useOutletView(id);
  const { imageList, videoUrl } = useMediaData(outlet);

  const handleGoBack = () => router.back();
  const handleEdit = () => router.push(`/outlet/${outlet?.id}/edit`);

  if (error) {
    return <ErrorScreen error={error} colors={colors} isConnected={isConnected} onGoBack={handleGoBack} />;
  }

  if (loading) {
    return <LoadingScreen colors={colors} isConnected={isConnected} />;
  }

  if (!outlet && !loading) {
    return <ErrorScreen error="Data outlet tidak ditemukan." colors={colors} isConnected={isConnected} onGoBack={handleGoBack} />;
  }

  return (
    <SafeAreaView 
      className="flex-1 bg-neutral-50 dark:bg-neutral-900" 
      edges={isConnected ? ['top','left','right'] : ['left','right']}
    >
      <Header 
        title={outlet?.name || 'Outlet Detail'}
        colors={colors}
        onBack={handleGoBack}
        onEdit={handleEdit}
      />

      <TabNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colors={colors}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {activeTab === 'info' && (
          <View className="pt-4">
            {/* Basic Info Card */}
            <InfoCard title="Informasi Outlet" colors={colors}>
              <InfoRow label="Kode Outlet" value={outlet!.code || '-'} colors={colors} />
              <InfoRow label="Nama Outlet" value={outlet!.name || '-'} colors={colors} />
              <InfoRow label="District" value={outlet!.district || '-'} colors={colors} />
              <InfoRow 
                label="Status" 
                value={
                  <StatusBadge
                    status={outlet!.status ? outlet!.status.charAt(0).toUpperCase() + outlet!.status.slice(1) : '-'}
                    color={getStatusColor(outlet!.status || '', colors)}
                  />
                } 
                colors={colors} 
              />
              {(outlet!.radius !== undefined && outlet!.radius !== null) && (
                <InfoRow label="Radius" value={`${outlet!.radius} m`} colors={colors} isLast />
              )}
            </InfoCard>

            {/* Owner Info Card */}
            {(outlet!.owner_name || outlet!.owner_phone) && (
              <InfoCard title="Informasi Pemilik" colors={colors}>
                {outlet!.owner_name && (
                  <InfoRow label="Nama Pemilik" value={outlet!.owner_name} colors={colors} />
                )}
                {outlet!.owner_phone && (
                  <InfoRow label="No. Telepon" value={outlet!.owner_phone} colors={colors} isLast />
                )}
              </InfoCard>
            )}

            {/* Address Card */}
            {outlet!.address && (
              <AddressCard address={outlet!.address} colors={colors} />
            )}

            {/* Organization Info Card */}
            <InfoCard title="Informasi Organisasi" colors={colors}>
              <InfoRow label="Badan Usaha" value={outlet!.badan_usaha?.name || '-'} colors={colors} />
              <InfoRow label="Division" value={outlet!.division?.name || '-'} colors={colors} />
              <InfoRow label="Region" value={outlet!.region?.name || '-'} colors={colors} />
              <InfoRow label="Cluster" value={outlet!.cluster?.name || '-'} colors={colors} isLast />
            </InfoCard>
          </View>
        )}

        {activeTab === 'location' && (
          <View className="pt-4">
            <InfoCard title="Informasi Lokasi" colors={colors}>
              <InfoRow label="District" value={outlet!.district || '-'} colors={colors} />
              <InfoRow label="Region" value={outlet!.region?.name || '-'} colors={colors} />
              <InfoRow label="Cluster" value={outlet!.cluster?.name || '-'} colors={colors} />
              <InfoRow label="Koordinat" value={outlet!.location || '-'} colors={colors} />
              {(outlet!.radius !== undefined && outlet!.radius !== null) && (
                <InfoRow label="Radius" value={`${outlet!.radius} m`} colors={colors} isLast />
              )}
            </InfoCard>
            
            {/* Address Card */}
            {outlet!.address && (
              <InfoCard title="Alamat Lengkap" colors={colors}>
                <Text style={{ fontFamily: 'Inter', color: colors.text }} className="text-base leading-6">
                  {outlet!.address}
                </Text>
              </InfoCard>
            )}
          </View>
        )}

        {activeTab === 'media' && (
          <View className="pt-4">
            <MediaSection
              title="Foto Outlet"
              items={imageList}
              emptyIcon="photo"
              emptyMessage="Tidak ada foto outlet."
              colors={colors}
            />
            
            <View className="mt-5">
              <MediaSection
                title="Video Outlet"
                items={videoUrl ? [{ label: 'Video Outlet', uri: videoUrl }] : []}
                emptyIcon="video"
                emptyMessage="Tidak ada video outlet."
                colors={colors}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

