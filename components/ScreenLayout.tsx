import { useRouter } from 'expo-router';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import { shadowPresets } from '@/constants/Shadows';
import { componentSpacing, spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from './ui/IconSymbol';

interface ScreenLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  headerRight?: React.ReactNode;
  backgroundColor?: string;
  scrollable?: boolean;
  safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
  onBackPress?: () => void;
}

export function ScreenLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
  headerRight,
  backgroundColor,
  scrollable = false,
  safeAreaEdges = ['top', 'left', 'right'],
  onBackPress,
}: ScreenLayoutProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const bgColor = backgroundColor || colors.background;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={safeAreaEdges}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />
      
      {/* Header */}
      {(title || showBackButton || headerRight) && (
        <View style={[styles.header, { backgroundColor: bgColor, borderBottomColor: colors.divider }]}>
          <View style={styles.headerContent}>
            {/* Left Section */}
            <View style={styles.headerLeft}>
              {showBackButton && (
                <TouchableOpacity
                  style={[styles.backButton, { backgroundColor: colors.surface }]}
                  onPress={handleBackPress}
                  accessibilityLabel="Kembali"
                  accessibilityRole="button"
                >
                  <IconSymbol name="chevron.left" size={20} color={colors.text} />
                </TouchableOpacity>
              )}
              
              {title && (
                <View style={[styles.titleContainer, showBackButton && styles.titleWithBack]}>
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                    {title}
                  </Text>
                  {subtitle && (
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Right Section */}
            {headerRight && (
              <View style={styles.headerRight}>
                {headerRight}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
}

// Wrapper untuk halaman yang membutuhkan scroll
export function ScrollableScreenLayout(props: ScreenLayoutProps) {
  return <ScreenLayout {...props} scrollable />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    ...shadowPresets.navigation,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: componentSpacing.screen.padding,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  titleWithBack: {
    marginLeft: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    fontFamily: typography.fontFamily,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily,
    marginTop: 4,
    lineHeight: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
}); 