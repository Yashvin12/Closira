/**
 * SkeletonCard — shimmer placeholder while content loads.
 *
 * Animated opacity pulse between 0.35 and 0.75 simulates shimmer.
 * Matches the LeadCard dimensions for layout-stable transitions.
 * Follows UI/UX Pro Max §3: progressive-loading — shimmer instead
 * of a blocking spinner for >300ms operations.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { spacing, borderRadius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

/**
 * Renders a shimmering skeleton card matching LeadCard dimensions.
 */
export function SkeletonCard(): React.JSX.Element {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.35)).current;
  const styles = makeStyles(colors);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.topRow}>
        <View style={styles.badge} />
        <View style={styles.time} />
      </View>
      <View style={styles.nameLine} />
      <View style={styles.messageLine} />
      <View style={[styles.messageLine, styles.messageLineShort]} />
    </Animated.View>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    badge: {
      width: 72,
      height: 20,
      borderRadius: borderRadius.full,
      backgroundColor: colors.border,
    },
    time: {
      width: 44,
      height: 12,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.border,
    },
    nameLine: {
      width: '55%',
      height: 16,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.border,
      marginBottom: spacing.sm,
    },
    messageLine: {
      width: '100%',
      height: 12,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.border,
      marginBottom: spacing.xs,
    },
    messageLineShort: {
      width: '68%',
    },
  });
