// React & React Native
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { usePermissionWithModal } from '@/hooks/utils/usePermission';

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
  const imageList: MediaImage[] = useMemo(() => 
    outlet?.photos ? [
      { label: 'Shop Sign', uri: getImageUrl(outlet.photos.shop_sign) || '' },
      { label: 'Front View', uri: getImageUrl(outlet.photos.front) || '' },
      { label: 'Left View', uri: getImageUrl(outlet.photos.left) || '' },
      { label: 'Right View', uri: getImageUrl(outlet.photos.right) || '' },
      { label: 'ID Card', uri: getImageUrl(outlet.photos.id_card) || '' },
    ].filter(img => img.uri) : [],
    [outlet?.photos]
  );
  
  const videoUrl = useMemo(() => 
    outlet?.video ? getImageUrl(outlet.video) : null,
    [outlet?.video]
  );

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
  const badgeStyle = useMemo(() => ({ 
    backgroundColor: color + '15' 
  }), [color]);

  const textStyle = useMemo(() => ({ 
    fontFamily: 'Inter', 
    fontSize: 13, 
    fontWeight: '600' as const, 
    color 
  }), [color]);

  return (
    <View className="px-2 py-1 rounded-md" style={badgeStyle}>
      <Text style={textStyle}>
        {status}
      </Text>
    </View>
  );
});

const LoadingScreen = React.memo(function LoadingScreen({ 
  colors, 
  isConnected,
  onBack 
}: { 
  colors: any; 
  isConnected: boolean;
  onBack: () => void;
}) {
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header 
        title="Detail Outlet"
        colors={colors}
        onBack={onBack}
        onEdit={() => {}}
      />
      <View className="flex-1 justify-center items-center px-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-base" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
          Memuat data outlet...
        </Text>
      </View>
    </View>
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
  const errorIconStyle = useMemo(() => ({ 
    backgroundColor: colors.danger + '20' 
  }), [colors.danger]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header 
        title="Detail Outlet"
        colors={colors}
        onBack={onGoBack}
        onEdit={() => {}}
      />
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={errorIconStyle}>
          <IconSymbol name="exclamationmark.triangle" size={32} color={colors.danger} />
        </View>
        <Text className="text-lg font-semibold text-center mb-2" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
          Data Tidak Ditemukan
        </Text>
        <Text className="text-sm text-center mb-6" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
          {error}
        </Text>
        <Button title="Kembali" variant="primary" onPress={onGoBack} />
      </View>
    </View>
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
  const insets = useSafeAreaInsets();
  
  const headerStyle = useMemo(() => ({ 
    paddingTop: insets.top + 12, 
    backgroundColor: colors.primary 
  }), [insets.top, colors.primary]);

  return (
    <View className="px-4 pb-4" style={headerStyle}>
      <View className="flex-row justify-between items-center">
        <TouchableOpacity 
          onPress={onBack}
          className="w-8 h-8 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1 items-center mx-4">
          <Text className="text-white text-xl font-semibold" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {title}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onEdit} 
          className="w-8 h-8 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Edit outlet"
        >
          <IconSymbol name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
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
  const tabs = useMemo(() => [
    { id: 'info' as ActiveTab, label: 'Info' },
    { id: 'location' as ActiveTab, label: 'Lokasi' },
    { id: 'media' as ActiveTab, label: 'Media' },
  ], []);

  const borderBottomStyle = useMemo(() => ({ 
    borderBottomColor: colors.border 
  }), [colors.border]);

  const handleTabPress = useCallback((tabId: ActiveTab) => () => {
    onTabChange(tabId);
  }, [onTabChange]);

  return (
    <View className="flex-row mt-2 border-b" style={borderBottomStyle}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const tabStyle = useMemo(() => ({
          borderBottomColor: isActive ? colors.primary : 'transparent'
        }), [isActive, colors.primary]);

        const textStyle = useMemo(() => ({ 
          fontFamily: 'Inter_600SemiBold',
          color: isActive ? colors.primary : colors.textSecondary
        }), [isActive, colors.primary, colors.textSecondary]);

        return (
          <TouchableOpacity 
            key={tab.id}
            className={`py-3 px-4 flex-1 items-center ${
              isActive ? 'border-b-2' : ''
            }`}
            style={tabStyle}
            onPress={handleTabPress(tab.id)}
            accessibilityRole="button"
            accessibilityLabel={`Tab ${tab.label}`}
          >
            <Text 
              style={textStyle}
              className="text-base"
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
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
  const cardStyle = useMemo(() => ({ 
    backgroundColor: colors.card,
    borderColor: colors.border,
    minHeight: 48 
  }), [colors.card, colors.border]);

  return (
    <TouchableOpacity 
      className="rounded-lg border p-4 mb-4 shadow-sm"
      style={cardStyle}
      activeOpacity={1}
    >
      <Text className="text-lg font-semibold mb-3" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
        {title}
      </Text>
      {children}
    </TouchableOpacity>
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
  const borderStyle = useMemo(() => ({ 
    borderBottomColor: !isLast ? colors.border + '40' : 'transparent' 
  }), [isLast, colors.border]);

  return (
    <View className={`flex-row justify-between items-center py-2 ${!isLast ? 'border-b' : ''}`} style={borderStyle}>
      <Text className="text-sm flex-1" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
        {label}
      </Text>
      <View className="text-right">
        {typeof value === 'string' ? (
          <Text className="text-base font-medium text-right" style={{ fontFamily: 'Inter_500Medium', color: colors.text }}>
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
  const hasItems = useMemo(() => items.length > 0, [items.length]);

  return (
    <View>
      <Text style={{ fontFamily: 'Inter', color: colors.text }} className="font-bold text-base mb-3">
        {title}
      </Text>
      {hasItems ? (
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

export default React.memo(function OutletViewPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<ActiveTab>('info');
  const { isConnected } = useNetwork();

  // Permission modal hook
  const {
    requestLocationWithModal,
    requestCameraWithModal,
  } = usePermissionWithModal();

  const { outlet, loading, error } = useOutletView(id);
  const { imageList, videoUrl } = useMediaData(outlet);

  const handleGoBack = useCallback(() => router.back(), [router]);
  
  // Permission-aware edit handler
  const handleEdit = useCallback(async () => {
    // Check location permission first
    const locationRes = await requestLocationWithModal();
    if (!locationRes.granted) {
      Alert.alert(
        'Izin Lokasi Diperlukan',
        'Untuk mengedit outlet, aplikasi memerlukan izin akses lokasi.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check camera permission
    const cameraRes = await requestCameraWithModal();
    if (!cameraRes.granted) {
      Alert.alert(
        'Izin Kamera Diperlukan', 
        'Untuk mengedit outlet, aplikasi memerlukan izin akses kamera.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Both permissions granted, proceed to edit
    router.push(`/outlet/${outlet?.id}/edit`);
  }, [router, outlet?.id, requestLocationWithModal, requestCameraWithModal]);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
  }, []);

  // Memoized status badge
  const statusBadge = useMemo(() => {
    if (!outlet?.status) return null;
    const statusText = outlet.status.charAt(0).toUpperCase() + outlet.status.slice(1);
    const statusColor = getStatusColor(outlet.status, colors);
    return <StatusBadge status={statusText} color={statusColor} />;
  }, [outlet?.status, colors]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setActiveTab('info');
    };
  }, []);

  if (error) {
    return <ErrorScreen error={error} colors={colors} isConnected={isConnected} onGoBack={handleGoBack} />;
  }

  if (loading) {
    return <LoadingScreen colors={colors} isConnected={isConnected} onBack={handleGoBack} />;
  }

  if (!outlet && !loading) {
    return <ErrorScreen error="Data outlet tidak ditemukan." colors={colors} isConnected={isConnected} onGoBack={handleGoBack} />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header 
        title={outlet?.name || 'Detail Outlet'}
        colors={colors}
        onBack={handleGoBack}
        onEdit={handleEdit}
      />

      <TabNavigation 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        colors={colors}
      />

      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-4 pb-8">
          {activeTab === 'info' && (
            <View>
              {/* Basic Info Card */}
              <InfoCard title="Informasi Outlet" colors={colors}>
                <InfoRow label="Kode Outlet" value={outlet!.code || '-'} colors={colors} />
                <InfoRow label="Nama Outlet" value={outlet!.name || '-'} colors={colors} />
                <InfoRow label="District" value={outlet!.district || '-'} colors={colors} />
                <InfoRow 
                  label="Status" 
                  value={statusBadge} 
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
            <View>
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
            <View>
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
        </View>
      </ScrollView>
    </View>
  );
});

