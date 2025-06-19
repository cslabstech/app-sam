import { router } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { shadowPresets } from '@/constants/Shadows';
import { componentSpacing, spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
import { useHomeData } from '@/hooks/data/useHomeData';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useUserData } from './_layout';

/**
 * Modern Home Screen - Halaman utama aplikasi SAM dengan design yang diperbaiki
 * Mengikuti best practice: UI-only, menggunakan custom hooks untuk logic
 */
export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const user = useUserData?.() ?? null;
  const displayName = user?.name || user?.username || 'User';

  // Menggunakan custom hook untuk data dan logic
  const { todayVisits, loadingVisits, error, refreshData } = useHomeData();

  const formatDate = () => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {displayName}
            </Text>
            <Text style={[styles.date, { color: colors.textTertiary }]}>
              {formatDate()}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={() => { }}
            accessibilityLabel="Notifikasi"
          >
            <IconSymbol size={20} name="bell.fill" color={colors.primary} />
            {/* Badge for unread notifications */}
            <View style={[styles.notificationBadge, { backgroundColor: colors.danger }]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={loadingVisits} 
            onRefresh={refreshData}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Aksi Cepat</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => router.push('/livevisit/check-in')}
              accessibilityLabel="Mulai Live Visit"
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.primaryLight + '20' }]}>
                <IconSymbol size={24} name="checkmark.seal.fill" color={colors.primary} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Live Visit</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Mulai kunjungan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => router.push('/register-outlet')}
              accessibilityLabel="Rencanakan kunjungan"
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.secondary + '20' }]}>
                <IconSymbol size={24} name="calendar.badge.plus" color={colors.secondary} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Plan Visit</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Rencanakan kunjungan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => router.push('/register-outlet')}
              accessibilityLabel="Daftarkan outlet baru"
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.success + '20' }]}>
                <IconSymbol size={24} name="plus.circle.fill" color={colors.success} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Register</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Outlet baru</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Visits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Kunjungan Hari Ini</Text>
            <View style={styles.sectionHeaderActions}>
              <TouchableOpacity 
                onPress={refreshData} 
                style={styles.refreshButton}
                accessibilityLabel="Refresh data"
              >
                <IconSymbol name="arrow.clockwise" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push('/visits')}
                accessibilityLabel="Lihat semua kunjungan"
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <Card variant="outlined" style={{ backgroundColor: colors.danger + '10' }}>
              <CardContent>
                <View style={styles.errorContainer}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    Gagal memuat data kunjungan
                  </Text>
                </View>
              </CardContent>
            </Card>
          ) : loadingVisits ? (
            <Card>
              <CardContent>
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Memuat kunjungan...
                </Text>
              </CardContent>
            </Card>
          ) : todayVisits.length > 0 ? (
            todayVisits.map(visit => (
              <Card 
                key={visit.id} 
                variant="elevated"
                style={styles.visitCard}
              >
                <CardContent>
                  <View style={styles.visitCardContent}>
                    <View style={styles.visitInfo}>
                      <View style={styles.visitHeader}>
                        <View style={styles.outletInfo}>
                          <IconSymbol size={18} name="building.2.fill" color={colors.primary} />
                          <Text style={[styles.outletCode, { color: colors.text }]}>
                            {visit.outlet?.code}
                          </Text>
                        </View>
                        <Text style={[styles.outletName, { color: colors.textSecondary }]}>
                          {visit.outlet?.name}
                        </Text>
                      </View>
                      
                      <View style={styles.visitTimes}>
                        <View style={styles.timeItem}>
                          <IconSymbol size={14} name="clock.fill" color={colors.success} />
                          <Text style={[styles.timeText, { color: colors.success }]}>
                            IN: {visit.checkin_time 
                              ? new Date(visit.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '-'
                            }
                          </Text>
                        </View>
                        <View style={styles.timeItem}>
                          <IconSymbol size={14} name="clock.fill" color={colors.warning} />
                          <Text style={[styles.timeText, { color: colors.warning }]}>
                            OUT: {visit.checkout_time 
                              ? new Date(visit.checkout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '-'
                            }
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.visitAction}>
                      {(!visit.checkin_time && !visit.checkout_time) ? (
                        <Button
                          title="Mulai Kunjungan"
                          size="sm"
                          variant="primary"
                          onPress={() => router.push({ pathname: '/livevisit/check-in', params: { id: visit.id } })}
                          leftIcon={<IconSymbol name="play.fill" size={16} color={colors.textInverse} />}
                        />
                      ) : (visit.checkin_time && !visit.checkout_time) ? (
                        <Button
                          title="Check Out"
                          size="sm"
                          variant="secondary"
                          onPress={() => router.push({ pathname: '/livevisit/check-out', params: { id: visit.id } })}
                          leftIcon={<IconSymbol name="stop.fill" size={16} color={colors.textInverse} />}
                        />
                      ) : (
                        <View style={[styles.completedBadge, { backgroundColor: colors.successLight + '20' }]}>
                          <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                          <Text style={[styles.completedText, { color: colors.success }]}>Selesai</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent>
                <View style={styles.emptyState}>
                  <IconSymbol name="calendar" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                    Tidak ada kunjungan hari ini
                  </Text>
                  <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                    Kunjungan yang dijadwalkan akan muncul di sini
                  </Text>
                </View>
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Separate styles into ViewStyle and TextStyle for proper typing
const viewStyles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  header: {
    borderBottomWidth: 1,
    ...shadowPresets.navigation,
  } as ViewStyle,
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: componentSpacing.screen.padding,
    paddingTop: spacing.sm,
  } as ViewStyle,
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  } as ViewStyle,
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,
  contentContainer: {
    paddingBottom: spacing['2xl'],
  } as ViewStyle,
  section: {
    marginTop: componentSpacing.section.marginVertical,
    paddingHorizontal: componentSpacing.screen.padding,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  } as ViewStyle,
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  refreshButton: {
    marginRight: spacing.md,
    padding: spacing.sm,
  } as ViewStyle,
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  } as ViewStyle,
  actionCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: componentSpacing.card.borderRadius,
    borderWidth: 1,
    alignItems: 'center',
    ...shadowPresets.surface,
  } as ViewStyle,
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  } as ViewStyle,
  visitCard: {
    marginBottom: spacing.md,
  } as ViewStyle,
  visitCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  } as ViewStyle,
  visitInfo: {
    flex: 1,
  } as ViewStyle,
  visitHeader: {
    marginBottom: spacing.md,
  } as ViewStyle,
  outletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  } as ViewStyle,
  visitTimes: {
    flexDirection: 'row',
    gap: spacing.lg,
  } as ViewStyle,
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  visitAction: {
    marginLeft: spacing.md,
  } as ViewStyle,
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.lg,
  } as ViewStyle,
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  } as ViewStyle,
});

const textStyles = StyleSheet.create({
  greeting: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.xs,
  } as TextStyle,
  userName: {
    fontSize: typography.fontSize.xl,
    fontWeight: 700 as any,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.xs,
  } as TextStyle,
  date: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily,
  } as TextStyle,
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 600 as any,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.lg,
  } as TextStyle,
  seeAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: 500 as any,
    fontFamily: typography.fontFamily,
  } as TextStyle,
  actionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: 600 as any,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.xs,
  } as TextStyle,
  actionSubtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
  } as TextStyle,
  outletCode: {
    fontSize: typography.fontSize.md,
    fontWeight: 600 as any,
    fontFamily: typography.fontFamily,
    marginLeft: spacing.sm,
  } as TextStyle,
  outletName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily,
  } as TextStyle,
  timeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: 500 as any,
    fontFamily: typography.fontFamily,
    marginLeft: spacing.xs,
  } as TextStyle,
  completedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: 500 as any,
    fontFamily: typography.fontFamily,
    marginLeft: spacing.xs,
  } as TextStyle,
  errorText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily,
    marginLeft: spacing.sm,
  } as TextStyle,
  loadingText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
  } as TextStyle,
  emptyStateTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: 600 as any,
    fontFamily: typography.fontFamily,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  } as TextStyle,
  emptyStateSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
  } as TextStyle,
});

// Combine styles
const styles = { ...viewStyles, ...textStyles };
