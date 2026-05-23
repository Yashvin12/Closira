/**
 * LeadCard — displays a single lead/enquiry in the Leads list.
 *
 * Premium UI features:
 * - Customer initials avatar (coloured based on name hash) — humanises data
 * - Animated spring scale on press (0.97×) — tactile native feel
 * - Status-based left accent border (escalated=red, new=blue, transparent otherwise)
 * - Time display paired with clock icon
 * - Subtle card border for depth on dark surface
 *
 * §2 scale-feedback: scale 0.97 on press, restored on release via spring
 * §7 spring-physics: spring animation for natural, platform-native feel
 * §4 state-clarity: visual differentiation for escalated vs new vs qualified
 */

import React, { useRef, useCallback } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ChannelBadge } from '../ui/ChannelBadge';
import { StatusPill } from '../ui/StatusPill';
import {
  colors,
  fontSize,
  fontFamily,
  spacing,
  borderRadius,
  shadows,
  iconSize,
} from '../../constants/theme';
import type { Enquiry } from '../../hooks/useMockData';

interface LeadCardProps {
  enquiry: Enquiry;
}

/** Generate 2-character initials from a full name. */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Deterministic avatar background colour from name hash. */
function getAvatarBg(name: string): string {
  const palette = [
    '#6366F1', '#8B5CF6', '#EC4899',
    '#14B8A6', '#F59E0B', '#22C55E', '#3B82F6',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

/** Format timestamp as relative time string. */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

/** Left border color based on enquiry status. */
function getAccentBorderColor(status: Enquiry['status']): string {
  if (status === 'escalated') return colors.danger;
  if (status === 'new') return colors.primary;
  return 'transparent';
}

export function LeadCard({ enquiry }: LeadCardProps): React.JSX.Element {
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 25,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 25,
    }).start();
  }, [scale]);

  const handlePress = () => {
    router.push(`/conversation/${enquiry.id}`);
  };

  const accentBorderColor = getAccentBorderColor(enquiry.status);
  const avatarBg = getAvatarBg(enquiry.customer_name);
  const initials = getInitials(enquiry.customer_name);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`View enquiry from ${enquiry.customer_name}`}
    >
      <Animated.View
        style={[
          styles.card,
          {
            borderLeftColor: accentBorderColor,
            borderLeftWidth: accentBorderColor !== 'transparent' ? 3 : 0,
            transform: [{ scale }],
          },
          shadows.sm,
        ]}
      >
        {/* Top row: avatar + channel badge + time */}
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.customerName} numberOfLines={1}>
                {enquiry.customer_name}
              </Text>
              <ChannelBadge channel={enquiry.channel} size="sm" />
            </View>
          </View>
          <View style={styles.topRight}>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={10} color={colors.textTertiary} />
              <Text style={styles.time}>{formatRelativeTime(enquiry.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Message preview */}
        <Text style={styles.messagePreview} numberOfLines={2}>
          {enquiry.message}
        </Text>

        {/* Bottom row: status pill */}
        <View style={styles.bottomRow}>
          <StatusPill status={enquiry.status} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  topRight: {
    alignItems: 'flex-end',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.white,
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    maxWidth: 160,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontFamily: fontFamily.semibold,
  },
  messagePreview: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
