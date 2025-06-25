import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/context/network-context';
import { useVisit, Visit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StatusBadgeProps {
  status: string;
  color: string;
}

const StatusBadge = React.memo(function StatusBadge({ status, color }: StatusBadgeProps) {
  return (
    <View 
      className="px-2 py-1 rounded-md" 
      style={{ backgroundColor: color + '15' }}
    >
      <Text 
        className="text-[13px] font-semibold" 
        style={{ fontFamily: 'Inter', color }}
      >
        {status}
      </Text>
    </View>
  );
});

const ErrorScreen = React.memo(function ErrorScreen({ 
  colors, 
  isConnected, 
  error, 
  onBack 
}: {
  colors: any;
  isConnected: boolean;
  error: string;
  onBack: () => void;
}) {
  return (
    <SafeAreaView 
      className="flex-1 justify-center items-center" 
      style={{ backgroundColor: colors.background }} 
      edges={isConnected ? ['top','left','right'] : ['left','right']}
    >
      <IconSymbol name="exclamationmark.triangle" size={48} color={colors.danger} />
      <Text 
        className="my-5 text-center" 
        style={{ fontFamily: 'Inter', color: colors.danger }}
      >
        {error}
      </Text>
      <Button title="Kembali" variant="primary" onPress={onBack} />
    </SafeAreaView>
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
      className="flex-1" 
      style={{ backgroundColor: colors.background }} 
      edges={isConnected ? ['top','left','right'] : ['left','right']}
    >
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text 
          className="mt-4 text-base" 
          style={{ fontFamily: 'Inter', color: colors.textSecondary }}
        >
          Memuat...
        </Text>
      </View>
    </SafeAreaView>
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
  return (
    <View 
      className="flex-row items-center justify-between border-b px-4 py-3" 
      style={{ borderBottomColor: colors.border }}
    >
      <View className="flex-row items-center">
        <TouchableOpacity onPress={onBack} className="mr-2">
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text 
          className="text-xl font-bold" 
          style={{ fontFamily: 'Inter', color: colors.text }}
        >
          {visitName}
        </Text>
      </View>
      <View className="w-8" />
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
  const baseClasses = "flex-row justify-between items-center py-2";
  const borderClasses = !isLast ? "border-b border-b-[0.5px]" : "";
  const containerClasses = `${baseClasses} ${borderClasses}`.trim();

  return (
    <View 
      className={containerClasses}
      style={{ borderBottomColor: 'rgba(150,150,150,0.2)' }}
    >
      <Text 
        className="text-sm flex-1" 
        style={{ fontFamily: 'Inter', color: colors.textSecondary }}
      >
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text 
          className="text-[15px] font-medium text-right" 
          style={{ fontFamily: 'Inter', color: colors.text }}
        >
          {value}
        </Text>
      ) : (
        value
      )}
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
    <Card className="p-4 mb-4 rounded-xl">
      <InfoRow
        label="Tanggal Kunjungan"
        value={visit?.visit_date || '-'}
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
        value={outletRadius}
        colors={colors}
        isLast={true}
      />
    </Card>
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
  const { isConnected } = useNetwork();

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
        isConnected={isConnected}
        error={error}
        onBack={handleBack}
      />
    );
  }

  if (loading || fetching) {
    return (
      <LoadingScreen
        colors={colors}
        isConnected={isConnected}
      />
    );
  }

  if (!visit) {
    return (
      <ErrorScreen
        colors={colors}
        isConnected={isConnected}
        error="Data visit tidak ditemukan."
        onBack={handleBack}
      />
    );
  }

  return (
    <SafeAreaView 
      className="flex-1" 
      style={{ backgroundColor: colors.background }} 
      edges={isConnected ? ['top','left','right'] : ['left','right']}
    >
      <Header
        colors={colors}
        visitName={visit?.outlet?.name || 'Detail Visit'}
        onBack={handleBack}
      />
      
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <View className="pt-4">
          <VisitDetailsCard
            visit={visit}
            colors={colors}
            getStatusColor={getStatusColor}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
