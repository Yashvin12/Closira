/**
 * ChannelBadge — displays a communication channel indicator.
 *
 * Solid brand-colour background, white text, uppercase label.
 * Design spec:
 *   WhatsApp #25D366 bg | Email #3B82F6 bg | Call #F59E0B bg
 *   text: white, rounded-full, uppercase, text-xs, font-semibold
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  channelConfig,
  fontSize,
  fontFamily,
  borderRadius,
  spacing,
  letterSpacing,
} from '../../constants/theme';

interface ChannelBadgeProps {
  /** The communication channel type */
  channel: 'whatsapp' | 'email' | 'call';
  /** Whether to show the text label (default: true) */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
}

/**
 * Renders a solid-background badge with channel icon and uppercase label.
 *
 * @param props - Channel type, label visibility, and size variant.
 * @returns A styled badge component.
 */
export function ChannelBadge({
  channel,
  showLabel = true,
  size = 'sm',
}: ChannelBadgeProps): React.JSX.Element {
  const config = channelConfig[channel];
  const iconSz = size === 'sm' ? 12 : 14;

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <Ionicons name={config.icon} size={iconSz} color={config.color} />
      {showLabel && (
        <Text style={[styles.label, { color: config.color }]}>
          {config.label.toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.badge,
  },
});
