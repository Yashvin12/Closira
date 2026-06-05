/**
 * UrgencyDot — visual urgency indicator for escalations.
 *
 * For HIGH urgency: a coloured dot with a continuously expanding/fading
 * outer ring (Animated.loop) — a "live indicator" that communicates
 * urgency without relying on colour alone (§1 color-not-only).
 * For MEDIUM urgency: a static amber dot.
 *
 * §7 motion-meaning: animation expresses urgency, not decoration.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface UrgencyDotProps {
  /** Urgency level */
  urgency: 'high' | 'medium';
  /** Dot size in dp (default: 10) */
  size?: number;
}

/**
 * Renders a coloured urgency dot. High urgency gets a pulsing outer ring.
 */
export function UrgencyDot({ urgency, size = 10 }: UrgencyDotProps): React.JSX.Element {
  const { colors } = useTheme();
  const dotColor = urgency === 'high' ? colors.danger : colors.warning;

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (urgency !== 'high') return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 2.2,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [urgency, pulseScale, pulseOpacity]);

  return (
    <View style={[styles.wrapper, { width: size * 2.4, height: size * 2.4 }]}>
      {urgency === 'high' && (
        <Animated.View
          style={[
            styles.pulse,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: dotColor,
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: dotColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
  },
  dot: {
    // Base styles — overridden by inline props
  },
});
