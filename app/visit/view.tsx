import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useVisit, Visit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StatusBadgeProps {
  status: string;
  color: string;
}

const StatusBadge = React.memo(function StatusBadge({ status, color }: StatusBadgeProps) {
  return (
    <View className="px-2 py-1 rounded-md" style={{ backgroundColor: color + '15' }}>
      <Text className="text-xs font-medium" style={{ fontFamily: 'Inter_500Medium', color }}>
        {status}
      </Text>
    </View>
  );
});

const ErrorScreen = React.memo(function ErrorScreen({ 
  colors, 
  error, 
  onBack 
}: {
  colors: any;
  error: string;
  onBack: () => void;
}) {
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Header
        colors={colors}
        visitName="Detail Visit"
        onBack={onBack}
      />
      
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: colors.danger + '20' }}>
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

const LoadingScreen = React.memo(function LoadingScreen({ 
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

const Header = React.memo(function Header({ 
  colors, 
  visitName, 
  onBack 
}: {
  colors: any;
  visitName: string;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  
  return (
    <View className="px-4 pb-4" style={{ paddingTop: insets.top + 12, backgroundColor: colors.primary }}>
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

const InfoRow = React.memo(function InfoRow({ 
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
  return (
    <View className={`flex-row justify-between items-center py-3 ${!isLast ? 'border-b' : ''}`} style={{ borderBottomColor: !isLast ? colors.border + '40' : 'transparent' }}>
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

const VisitDetailsCard = React.memo(function VisitDetailsCard({ 
  visit, 
  colors, 
  getStatusColor 
}: {
  visit: Visit;
  colors: any;
  getStatusColor: (status?: string) => string;
}) {
  const outletDistrict = (visit?.outlet as any)?.district || visit?.outlet?.region?.name || '-';
  const outletStatus = (visit?.outlet as any)?.status || '-';
  const outletLocation = (visit?.outlet as any)?.location || visit?.outlet?.address || '-';
  const outletRadius = (visit?.outlet as any)?.radius || '-';

  return (
    <TouchableOpacity 
      className="rounded-lg border p-4 mb-4 shadow-sm"
      style={{ 
        backgroundColor: colors.card,
        borderColor: colors.border,
        minHeight: 48 
      }}
      activeOpacity={1}
    >
      <View className="flex-row items-center mb-4">
        <View className="w-9 h-9 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: colors.primary + '20' }}>
          <IconSymbol name="info.circle" size={18} color={colors.primary} />
        </View>
        <Text className="text-lg font-semibold" style={{ fontFamily: 'Inter_600SemiBold', color: colors.text }}>
          Detail Kunjungan
        </Text>
      </View>

      <InfoRow
        label="Tanggal Kunjungan"
        value={visit?.visit_date ? new Date(visit.visit_date).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : '-'}
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
        value={`${visit?.user?.name || '-'} (${visit?.user?.username || '-'})`}
        colors={colors}
      />
      <InfoRow
        label="Outlet"
        value={`${visit?.outlet?.name || '-'} (${visit?.outlet?.code || '-'})`}
        colors={colors}
      />
      <InfoRow
        label="District"
        value={outletDistrict}
        colors={colors}
      />
      <InfoRow
        label="Status Outlet"
        value={
          <StatusBadge 
            status={outletStatus !== '-' ? outletStatus.charAt(0).toUpperCase() + outletStatus.slice(1) : '-'} 
            color={getStatusColor(outletStatus)} 
          />
        }
        colors={colors}
      />
      <InfoRow
        label="Lokasi Outlet"
        value={outletLocation}
        colors={colors}
      />
      <InfoRow
        label="Radius Outlet"
        value={outletRadius !== '-' ? `${outletRadius} m` : '-'}
        colors={colors}
        isLast={true}
      />
    </TouchableOpacity>
  );
});

export default function VisitViewPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
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

  const getStatusColor = (status?: string) => {
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
  };

  const handleBack = () => {
    router.back();
  };

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
        visitName={visit?.outlet?.name || 'Detail Visit'}
        onBack={handleBack}
      />
      
      <ScrollView className="flex-1 px-4 pt-4">
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
}
