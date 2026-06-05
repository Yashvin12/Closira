/**
 * EmptyState — shown when a list has no items.
 *
 * Features a double-ring pulsing icon container, bold title, and subtitle.
 * The pulse animation (Animated.loop sequence) draws the eye without being
 * distracting (§7 motion-meaning: animation expresses cause-effect).
 * §8 empty-states: helpful message and action when no content.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  fontSize,
  fontFamily,
  spacing,
  iconSize,
  borderRadius,
} from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface EmptyStateProps {
  /** Ionicons icon name */
  icon: keyof typeof Ionicons.glyphMap;
  /** Primary message */
  title: string;
  /** Secondary explanatory text */
  subtitle?: string;
}

/**
 * Renders a centered empty state with pulsing double-ring icon, title, and subtitle.
 */
export function EmptyState({ icon, title, subtitle }: EmptyStateProps): React.JSX.Element {
  const { colors } = useTheme();
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;
  const styles = makeStyles(colors);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.15,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseScale, pulseOpacity]);

  return (
    <View style={styles.container}>
      {/* Double-ring with pulse */}
      <View style={styles.ringOuter}>
        <Animated.View
          style={[
            styles.ringPulse,
            { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
          ]}
        />
        <View style={styles.ringInner}>
          <Ionicons name={icon} size={iconSize['3xl']} color={colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing['3xl'],
      paddingVertical: spacing['3xl'],
    },
    ringOuter: {
      width: 96,
      height: 96,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing['2xl'],
    },
    ringPulse: {
      position: 'absolute',
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: 'rgba(99,102,241,0.08)',
    },
    ringInner: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(99,102,241,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(99,102,241,0.25)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
