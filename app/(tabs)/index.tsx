import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useVisits } from '@/hooks/useVisits';
import { shadow } from '@/styles/shadow';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { useUserData } from './_layout';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const user = useUserData?.() ?? null;
  const displayName = user?.nama_lengkap || user?.name || user?.username || '-';

  const { getVisits } = useVisits();
  const [todayVisits, setTodayVisits] = useState<any[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  useEffect(() => {
    setLoadingVisits(true);
    getVisits()
      .then(res => {
        // Perbaikan: tanggal_visit adalah timestamp (number), bukan string ISO
        const today = new Date();
        const isSameDay = (ts: number) => {
          const d = new Date(ts);
          return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
          );
        };
        const visits = (res.data || []).filter((v: any) => v.tanggal_visit && isSameDay(v.tanggal_visit));
        setTodayVisits(visits);
      })
      .finally(() => setLoadingVisits(false));
  }, []);

  // Tambahkan fungsi refresh
  const handleRefresh = async () => {
    setLoadingVisits(true);
    getVisits()
      .then(res => {
        const today = new Date();
        const isSameDay = (ts: number) => {
          const d = new Date(ts);
          return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
          );
        };
        const visits = (res.data || []).filter((v: any) => v.tanggal_visit && isSameDay(v.tanggal_visit));
        setTodayVisits(visits);
      })
      .finally(() => setLoadingVisits(false));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>{displayName}!</Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.notificationButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
          onPress={() => { }}
        >
          <IconSymbol size={20} name="bell.fill" color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => router.push('/livevisit/check-in')}
          >
            <IconSymbol size={24} name="checkmark.seal.fill" color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>Live Visit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => router.push('/register-outlet')}
          >
            <IconSymbol size={24} name="calendar.badge.plus" color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>Plan Visit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => router.push('/register-outlet')}
          >
            <IconSymbol size={24} name="plus.circle.fill" color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>Register</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Visits</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={handleRefresh} style={{ marginRight: 12 }}>
              <IconSymbol name="arrow.clockwise" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/visits')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loadingVisits ? (
          <Card><Text style={{ color: colors.textSecondary, textAlign: 'center' }}>Loading visits...</Text></Card>
        ) : todayVisits.length > 0 ? (
          todayVisits.map(visit => (
            <Card key={visit.id} style={{ marginBottom: 16, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...shadow }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <IconSymbol size={18} name="building.2.fill" color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.visitName, { color: colors.text, fontSize: 17 }]}>{visit.outlet?.kode_outlet}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 15, marginLeft: 8, fontWeight: '500' }}>• {visit.outlet?.nama_outlet}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <IconSymbol size={14} name="mappin.and.ellipse" color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.visitAddress, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{visit.outlet?.alamat_outlet}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <IconSymbol size={14} name="clock.fill" color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.visitTimeText, { color: colors.primary, fontWeight: '600' }]}> 
                    {visit.check_in_time ? `IN: ${new Date(visit.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'IN: -'}
                  </Text>
                  <Text style={[styles.visitTimeText, { color: colors.primary, marginLeft: 12, fontWeight: '600' }]}> 
                    {visit.check_out_time ? `OUT: ${new Date(visit.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'OUT: -'}
                  </Text>
                </View>
              </View>
              <View style={{ marginLeft: 12 }}>
                {(!visit.check_in_time && !visit.check_out_time) ? (
                  <Button
                    title="Start Visit"
                    size="small"
                    onPress={() => router.push({ pathname: '/livevisit/check-in', params: { id: visit.id } })}
                  />
                ) : (visit.check_in_time && !visit.check_out_time) ? (
                  <Button
                    title="Check Out"
                    size="small"
                    onPress={() => router.push({ pathname: '/livevisit/check-out', params: { id: visit.id } })}
                  />
                ) : null}
              </View>
            </Card>
          ))
        ) : (
          <Card>
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
              No visits scheduled for today
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: typography.fontSize2xl,
    fontWeight: 'bold',
    fontFamily: typography.fontFamily,
  },
  date: {
    fontSize: typography.fontSizeSm,
    marginTop: spacing.sm,
    fontFamily: typography.fontFamily,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginTop: spacing.lg,
  },
  statsCard: {
    width: '46%',
    margin: '2%',
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsCount: {
    fontSize: typography.fontSize2xl,
    fontWeight: 'bold',
    marginVertical: 4,
    fontFamily: typography.fontFamily,
  },
  statsTitle: {
    fontSize: typography.fontSizeXs,
    fontFamily: typography.fontFamily,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizeLg,
    fontWeight: '600',
    fontFamily: typography.fontFamily,
  },
  seeAll: {
    fontSize: typography.fontSizeSm,
    fontWeight: '500',
    fontFamily: typography.fontFamily,
  },
  visitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow,
  },
  visitInfo: {
    flex: 1,
  },
  visitName: {
    fontSize: typography.fontSizeMd,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: typography.fontFamily,
  },
  visitAddress: {
    fontSize: typography.fontSizeSm,
    marginBottom: spacing.md,
    fontFamily: typography.fontFamily,
  },
  visitTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitTimeText: {
    fontSize: typography.fontSizeSm,
    fontWeight: '500',
    marginLeft: 4,
    fontFamily: typography.fontFamily,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginHorizontal: -4,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: spacing.lg,
    borderRadius: 6,
    alignItems: 'center',
    ...shadow,
  },
  actionText: {
    fontSize: typography.fontSizeSm,
    fontWeight: '500',
    marginTop: spacing.sm,
    fontFamily: typography.fontFamily,
  },
});
