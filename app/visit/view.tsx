import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useVisit, Visit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StatusBadgeProps {
  status: string;
  color: string;
}

const StatusBadge = memo(function StatusBadge({ status, color }: StatusBadgeProps) {
  const badgeStyle = useMemo(() => ({ 
    backgroundColor: color + '15' 
  }), [color]);

  const textStyle = useMemo(() => ({ 
    fontFamily: 'Inter_500Medium', 
    color 
  }), [color]);

  return (
    <View className="px-2 py-1 rounded-md" style={badgeStyle}>
      <Text className="text-xs font-medium" style={textStyle}>
        {status}
      </Text>
    </View>
  );
});

const ErrorScreen = memo(function ErrorScreen({ 
  colors, 
  error, 
  onBack 
}: {
  colors: any;
  error: string;
  onBack: () => void;
}) {
  const errorIconStyle = useMemo(() => ({ 
    backgroundColor: colors.danger + '20' 
  }), [colors.danger]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header
        colors={colors}
        visitName="Detail Visit"
        onBack={onBack}
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
        <Button title="Kembali" variant="primary" onPress={onBack} />
      </View>
    </View>
  );
});

const LoadingScreen = memo(function LoadingScreen({ 
  colors 
}: {
  colors: any;
}) {
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header
        colors={colors}
        visitName="Detail Visit"
        onBack={() => {}}
      />
      
      <View className="flex-1 justify-center items-center px-6">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-base" style={{ fontFamily: 'Inter_400Regular', color: colors.textSecondary }}>
          Memuat data kunjungan...
        </Text>
      </View>
    </View>
  );
});

const Header = memo(function Header({ 
  colors, 
  visitName, 
  onBack 
}: {
  colors: any;
  visitName: string;
  onBack: () => void;
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
            {visitName}
          </Text>
        </View>
        <View className="w-8 h-8" />
      </View>
    </View>
  );
});

const InfoRow = memo(function InfoRow({ 
  label, 
  value, 
  colors, 
  isLast = false 
}: {
  label: string;
  value: string | React.ReactNode;
  colors: any;
  isLast?: boolean;
}) {
  const borderStyle = useMemo(() => ({ 
    borderBottomColor: !isLast ? colors.border + '40' : 'transparent' 
  }), [isLast, colors.border]);

  const labelStyle = useMemo(() => ({ 
    fontFamily: 'Inter_400Regular', 
    color: colors.textSecondary 
  }), [colors.textSecondary]);

  const valueStyle = useMemo(() => ({ 
    fontFamily: 'Inter_500Medium', 
    color: colors.text 
  }), [colors.text]);

  return (
    <View className={`flex-row justify-between items-center py-3 ${!isLast ? 'border-b' : ''}`} style={borderStyle}>
      <Text className="text-sm flex-1" style={labelStyle}>
        {label}
      </Text>
      <View className="text-right">
        {typeof value === 'string' ? (
          <Text className="text-base font-medium text-right" style={valueStyle}>
            {value}
          </Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
});

const VisitDetailsCard = memo(function VisitDetailsCard({ 
  visit, 
  colors, 
  getStatusColor 
}: {
  visit: Visit;
  colors: any;
  getStatusColor: (status?: string) => string;
}) {
  const cardStyle = useMemo(() => ({ 
    backgroundColor: colors.card,
    borderColor: colors.border,
    minHeight: 48 
  }), [colors.card, colors.border]);

  const iconBackgroundStyle = useMemo(() => ({ 
    backgroundColor: colors.primary + '20' 
  }), [colors.primary]);

  const outletDistrict = useMemo(() => 
    (visit?.outlet as any)?.district || visit?.outlet?.region?.name || '-',
    [visit?.outlet]
  );

  const outletStatus = useMemo(() => 
    (visit?.outlet as any)?.status || '-',
    [visit?.outlet]
  );

  const outletLocation = useMemo(() => 
    (visit?.outlet as any)?.location || visit?.outlet?.address || '-',
    [visit?.outlet]
  );

  const outletRadius = useMemo(() => 
    (visit?.outlet as any)?.radius || '-',
    [visit?.outlet]
  );

  const visitDate = useMemo(() => 
    visit?.visit_date ? new Date(visit.visit_date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '-',
    [visit?.visit_date]
  );

  const userInfo = useMemo(() => 
    `${visit?.user?.name || '-'} (${visit?.user?.username || '-'})`,
    [visit?.user]
  );

  const outletInfo = useMemo(() => 
    `${visit?.outlet?.name || '-'} (${visit?.outlet?.code || '-'})`,
    [visit?.outlet]
  );

  const outletRadiusText = useMemo(() => 
    outletRadius !== '-' ? `${outletRadius} m` : '-',
    [outletRadius]
  );

  const statusBadge = useMemo(() => 
    <StatusBadge 
      status={outletStatus !== '-' ? outletStatus.charAt(0).toUpperCase() + outletStatus.slice(1) : '-'} 
      color={getStatusColor(outletStatus)} 
    />,
    [outletStatus, getStatusColor]
  );

  return (
    <TouchableOpacity 
      className="rounded-lg border p-4 mb-4 shadow-sm"
      style={cardStyle}
      activeOpacity={1}
    >
      <View className="flex-row items-center mb-4">
        <View className="w-9 h-9 rounded-lg items-center justify-center mr-3" style={iconBackgroundStyle}>
          <IconSymbol name="info.circle" size={18} color={colors.primary} />
        </View>
        <Text className="text-lg font-semibold" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
          Detail Kunjungan
        </Text>
      </View>

      <InfoRow
        label="Tanggal Kunjungan"
        value={visitDate}
        colors={colors}
      />
      <InfoRow
        label="Check-in"
        value={visit?.checkin_time || '-'}
        colors={colors}
      />
      <InfoRow
        label="Check-out"
        value={visit?.checkout_time || '-'}
        colors={colors}
      />
      <InfoRow
        label="User"
        value={userInfo}
        colors={colors}
      />
      <InfoRow
        label="Outlet"
        value={outletInfo}
        colors={colors}
      />
      <InfoRow
        label="District"
        value={outletDistrict}
        colors={colors}
      />
      <InfoRow
        label="Status Outlet"
        value={statusBadge}
        colors={colors}
      />
      <InfoRow
        label="Lokasi Outlet"
        value={outletLocation}
        colors={colors}
      />
      <InfoRow
        label="Radius Outlet"
        value={outletRadiusText}
        colors={colors}
        isLast={true}
      />
    </TouchableOpacity>
  );
});

export default memo(function VisitViewPage() {
  const colorScheme = useColorScheme();
  const colors = useMemo(() => Colors[colorScheme ?? 'light'], [colorScheme]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading, error, fetchVisit } = useVisit();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (id) {
      setFetching(true);
      fetchVisit(id as string).then(res => {
        if (res.success && res.data) {
          setVisit(res.data);
        }
        setFetching(false);
      });
    }
  }, [id, fetchVisit]);

  const getStatusColor = useCallback((status?: string) => {
    if (!status || status === '-') return colors.textSecondary;
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
  }, [colors]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const visitName = useMemo(() => 
    visit?.outlet?.name || 'Detail Visit',
    [visit?.outlet?.name]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setVisit(null);
    };
  }, []);

  if (error) {
    return (
      <ErrorScreen
        colors={colors}
        error={error}
        onBack={handleBack}
      />
    );
  }

  if (loading || fetching) {
    return (
      <LoadingScreen
        colors={colors}
      />
    );
  }

  if (!visit) {
    return (
      <ErrorScreen
        colors={colors}
        error="Data visit tidak ditemukan."
        onBack={handleBack}
      />
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header
        colors={colors}
        visitName={visitName}
        onBack={handleBack}
      />
      
      <ScrollView 
        className="flex-1 px-4 pt-4"
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="pb-8">
          <VisitDetailsCard
            visit={visit}
            colors={colors}
            getStatusColor={getStatusColor}
          />
        </View>
      </ScrollView>
    </View>
  );
});
