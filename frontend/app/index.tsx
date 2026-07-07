/**
 * Landing Page — the first screen users see before logging in.
 *
 * Premium dark UI with:
 * - Gradient hero with animated glow
 * - Feature cards with icon accents
 * - How-it-works flow
 * - CTA buttons → navigate to (auth)/login or (auth)/signup
 *
 * Uses the existing Closira design system tokens from theme.ts.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import {
  fontFamily,
  fontSize,
  spacing,
  borderRadius,
  letterSpacing,
} from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LandingScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const s = makeStyles(colors);

  // ── Entry animations ──────────────────────────────────────────────────
  const fadeHero = useRef(new Animated.Value(0)).current;
  const slideHero = useRef(new Animated.Value(30)).current;
  const fadeFeatures = useRef(new Animated.Value(0)).current;
  const slideFeatures = useRef(new Animated.Value(40)).current;
  const fadeSteps = useRef(new Animated.Value(0)).current;
  const fadeCta = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Hero entrance
    Animated.parallel([
      Animated.timing(fadeHero, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideHero, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Features entrance (delayed)
    Animated.parallel([
      Animated.timing(fadeFeatures, {
        toValue: 1,
        duration: 700,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideFeatures, {
        toValue: 0,
        duration: 700,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Steps entrance
    Animated.timing(fadeSteps, {
      toValue: 1,
      duration: 700,
      delay: 700,
      useNativeDriver: true,
    }).start();

    // CTA entrance
    Animated.timing(fadeCta, {
      toValue: 1,
      duration: 700,
      delay: 900,
      useNativeDriver: true,
    }).start();

    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.7,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.4,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Navbar ─────────────────────────────────────────────── */}
        <View style={s.navbar}>
          <View style={s.navLogo}>
            <View style={s.logoIcon}>
              <Ionicons name="layers" size={20} color="#fff" />
            </View>
            <Text style={s.logoText}>Closira</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={({ pressed }) => [s.navLoginBtn, pressed && s.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Log in to your account"
          >
            <Text style={s.navLoginText}>Log In</Text>
          </Pressable>
        </View>

        {/* ─── Hero ───────────────────────────────────────────────── */}
        <Animated.View
          style={[
            s.heroSection,
            { opacity: fadeHero, transform: [{ translateY: slideHero }] },
          ]}
        >
          {/* Glow orbs */}
          <Animated.View style={[s.glowOrb, s.glowOrb1, { opacity: glowPulse }]} />
          <Animated.View style={[s.glowOrb, s.glowOrb2, { opacity: glowPulse }]} />

          <View style={s.heroBadge}>
            <View style={s.heroBadgeDot} />
            <Text style={s.heroBadgeText}>AI-Powered CRM Platform</Text>
          </View>

          <Text style={s.heroTitle}>
            <Text style={s.heroGradientText}>Smart </Text>
            Customer{'\n'}Communication
          </Text>

          <Text style={s.heroSubtitle}>
            Automate enquiries across WhatsApp, Email, and Phone. Qualify leads
            instantly with intelligent SOP matching.
          </Text>

          <View style={s.heroActions}>
            <Pressable
              onPress={() => router.push('/(auth)/signup')}
              style={({ pressed }) => [
                s.btnPrimary,
                pressed && s.btnPrimaryPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Get started with Closira"
            >
              <Text style={s.btnPrimaryText}>Get Started Free</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>

            <Pressable
              onPress={() => router.push('/(auth)/login')}
              style={({ pressed }) => [
                s.btnOutline,
                pressed && s.btnOutlinePressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sign in to your account"
            >
              <Text style={s.btnOutlineText}>Sign In</Text>
            </Pressable>
          </View>

          {/* ── Mini dashboard preview ──────────────────────────── */}
          <View style={[s.previewCard, shadows.md]}>
            <View style={s.previewHeader}>
              <View style={s.previewDotRow}>
                <View style={[s.previewDot, { backgroundColor: '#EF4444' }]} />
                <View style={[s.previewDot, { backgroundColor: '#F59E0B' }]} />
                <View style={[s.previewDot, { backgroundColor: '#22C55E' }]} />
              </View>
              <Text style={s.previewHeaderText}>Dashboard</Text>
            </View>
            <View style={s.previewStatsRow}>
              <View style={s.previewStat}>
                <Text style={[s.previewStatValue, { color: colors.primary }]}>1,284</Text>
                <Text style={s.previewStatLabel}>Leads</Text>
              </View>
              <View style={s.previewStat}>
                <Text style={[s.previewStatValue, { color: '#22C55E' }]}>892</Text>
                <Text style={s.previewStatLabel}>Qualified</Text>
              </View>
              <View style={s.previewStat}>
                <Text style={[s.previewStatValue, { color: '#F59E0B' }]}>47</Text>
                <Text style={s.previewStatLabel}>Escalations</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ─── Features ───────────────────────────────────────────── */}
        <Animated.View
          style={[
            s.featuresSection,
            { opacity: fadeFeatures, transform: [{ translateY: slideFeatures }] },
          ]}
        >
          <Text style={s.sectionLabel}>FEATURES</Text>
          <Text style={s.sectionTitle}>Everything You Need</Text>
          <Text style={s.sectionSubtitle}>
            Closira automates the tedious parts so you can focus on growing your
            business.
          </Text>

          <View style={s.featureCards}>
            {/* Feature 1 */}
            <View style={[s.featureCard, shadows.sm]}>
              <View style={[s.featureIconWrap, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                <Ionicons name="chatbubbles" size={24} color={colors.primary} />
              </View>
              <Text style={s.featureTitle}>Multi-Channel Inbox</Text>
              <Text style={s.featureDesc}>
                Manage enquiries from WhatsApp, Email, and Phone in a single
                unified dashboard.
              </Text>
            </View>

            {/* Feature 2 */}
            <View style={[s.featureCard, shadows.sm]}>
              <View style={[s.featureIconWrap, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                <Ionicons name="layers" size={24} color="#22C55E" />
              </View>
              <Text style={s.featureTitle}>AI SOP Matching</Text>
              <Text style={s.featureDesc}>
                8 pre-trained SOPs auto-qualify leads with confidence scoring and
                suggested responses.
              </Text>
            </View>

            {/* Feature 3 */}
            <View style={[s.featureCard, shadows.sm]}>
              <View style={[s.featureIconWrap, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
                <Ionicons name="alert-circle" size={24} color="#8B5CF6" />
              </View>
              <Text style={s.featureTitle}>Smart Escalations</Text>
              <Text style={s.featureDesc}>
                Unmatched enquiries auto-escalate with urgency tags and full
                conversation context.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── How It Works ───────────────────────────────────────── */}
        <Animated.View style={[s.stepsSection, { opacity: fadeSteps }]}>
          <Text style={s.sectionLabel}>HOW IT WORKS</Text>
          <Text style={s.sectionTitle}>Three Simple Steps</Text>

          <View style={s.stepsContainer}>
            <View style={s.stepItem}>
              <View style={s.stepNumber}>
                <Text style={s.stepNumberText}>1</Text>
              </View>
              <Text style={s.stepTitle}>Customer Reaches Out</Text>
              <Text style={s.stepDesc}>
                Via WhatsApp, Email, or Phone — captured instantly.
              </Text>
            </View>

            <View style={s.stepConnector} />

            <View style={s.stepItem}>
              <View style={s.stepNumber}>
                <Text style={s.stepNumberText}>2</Text>
              </View>
              <Text style={s.stepTitle}>AI Analyzes &amp; Matches</Text>
              <Text style={s.stepDesc}>
                SOP engine evaluates against 8 trained procedures.
              </Text>
            </View>

            <View style={s.stepConnector} />

            <View style={s.stepItem}>
              <View style={s.stepNumber}>
                <Text style={s.stepNumberText}>3</Text>
              </View>
              <Text style={s.stepTitle}>Respond or Escalate</Text>
              <Text style={s.stepDesc}>
                Instant responses for matches. Smart escalation for the rest.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── Stats Strip ────────────────────────────────────────── */}
        <View style={s.statsStrip}>
          <View style={s.statBlock}>
            <Text style={s.statValue}>10K+</Text>
            <Text style={s.statLabel}>Enquiries</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBlock}>
            <Text style={s.statValue}>8</Text>
            <Text style={s.statLabel}>SOPs</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBlock}>
            <Text style={s.statValue}>3</Text>
            <Text style={s.statLabel}>Channels</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBlock}>
            <Text style={s.statValue}>99%</Text>
            <Text style={s.statLabel}>Uptime</Text>
          </View>
        </View>

        {/* ─── Final CTA ──────────────────────────────────────────── */}
        <Animated.View style={[s.ctaSection, { opacity: fadeCta }]}>
          <View style={[s.ctaCard, shadows.lg]}>
            <Text style={s.ctaTitle}>
              Ready to Transform Your Customer Communication?
            </Text>
            <Text style={s.ctaSubtitle}>
              Join businesses using Closira to qualify leads faster and never
              miss an enquiry.
            </Text>
            <View style={s.ctaActions}>
              <Pressable
                onPress={() => router.push('/(auth)/signup')}
                style={({ pressed }) => [
                  s.btnPrimary,
                  pressed && s.btnPrimaryPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Start your free trial"
              >
                <Text style={s.btnPrimaryText}>Start Free Trial</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>

              <Pressable
                onPress={() => router.push('/(auth)/login')}
                style={({ pressed }) => [
                  s.btnOutline,
                  pressed && s.btnOutlinePressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sign in to your existing account"
              >
                <Text style={s.btnOutlineText}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* ─── Footer ─────────────────────────────────────────────── */}
        <View style={[s.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={s.footerLogo}>
            <View style={s.logoIconSmall}>
              <Ionicons name="layers" size={14} color="#fff" />
            </View>
            <Text style={s.footerLogoText}>Closira</Text>
          </View>
          <Text style={s.footerCopy}>
            © 2026 Closira. All rights reserved.
          </Text>
          <Text style={s.footerTagline}>
            AI-powered customer communication for SMBs.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      paddingHorizontal: spacing.lg,
    },

    // ── Navbar ─────────────────────────────────────────────────────────
    navbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    navLogo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    logoIcon: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xl,
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    navLoginBtn: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 44,
      justifyContent: 'center',
    },
    navLoginText: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },

    // ── Hero ──────────────────────────────────────────────────────────
    heroSection: {
      paddingTop: spacing['3xl'],
      paddingBottom: spacing['2xl'],
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    glowOrb: {
      position: 'absolute',
      borderRadius: 999,
    },
    glowOrb1: {
      width: 300,
      height: 300,
      top: -60,
      left: -80,
      backgroundColor: 'rgba(99,102,241,0.08)',
    },
    glowOrb2: {
      width: 250,
      height: 250,
      top: 40,
      right: -100,
      backgroundColor: 'rgba(139,92,246,0.06)',
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      backgroundColor: 'rgba(99,102,241,0.10)',
      borderWidth: 1,
      borderColor: 'rgba(99,102,241,0.25)',
      borderRadius: borderRadius.full,
      marginBottom: spacing['2xl'],
    },
    heroBadgeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#22C55E',
    },
    heroBadgeText: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: colors.primary,
      letterSpacing: 0.3,
    },
    heroTitle: {
      fontFamily: fontFamily.bold,
      fontSize: Platform.OS === 'web' ? 48 : 36,
      lineHeight: Platform.OS === 'web' ? 52 : 42,
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -1,
      marginBottom: spacing.lg,
    },
    heroGradientText: {
      color: colors.primary,
    },
    heroSubtitle: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.base,
      lineHeight: 26,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 400,
      marginBottom: spacing['2xl'],
    },
    heroActions: {
      flexDirection: 'row',
      gap: spacing.md,
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: spacing['3xl'],
    },

    // ── Buttons ───────────────────────────────────────────────────────
    btnPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 14,
      paddingHorizontal: spacing['2xl'],
      borderRadius: borderRadius.lg,
      backgroundColor: colors.primary,
      minHeight: 52,
    },
    btnPrimaryPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
    btnPrimaryText: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: '#FFFFFF',
    },
    btnOutline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 14,
      paddingHorizontal: spacing['2xl'],
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 52,
    },
    btnOutlinePressed: {
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    btnOutlineText: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: colors.textPrimary,
    },
    btnPressed: {
      opacity: 0.7,
    },

    // ── Preview Card ──────────────────────────────────────────────────
    previewCard: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      overflow: 'hidden',
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    previewDotRow: {
      flexDirection: 'row',
      gap: 6,
    },
    previewDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    previewHeaderText: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: colors.textTertiary,
      letterSpacing: 0.3,
    },
    previewStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    previewStat: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    previewStatValue: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize['2xl'],
      letterSpacing: -0.5,
    },
    previewStatLabel: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.xs,
      color: colors.textTertiary,
    },

    // ── Section headers ───────────────────────────────────────────────
    sectionLabel: {
      fontFamily: fontFamily.bold,
      fontSize: 10,
      color: colors.primary,
      letterSpacing: letterSpacing.badge,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    sectionTitle: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize['2xl'],
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.5,
      marginBottom: spacing.sm,
    },
    sectionSubtitle: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 360,
      alignSelf: 'center',
      marginBottom: spacing['2xl'],
    },

    // ── Features ──────────────────────────────────────────────────────
    featuresSection: {
      paddingVertical: spacing['2xl'],
    },
    featureCards: {
      gap: spacing.md,
    },
    featureCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      padding: spacing.lg,
      gap: spacing.md,
    },
    featureIconWrap: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.lg,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    featureDesc: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 22,
    },

    // ── Steps ─────────────────────────────────────────────────────────
    stepsSection: {
      paddingVertical: spacing['2xl'],
    },
    stepsContainer: {
      alignItems: 'center',
      gap: 0,
    },
    stepItem: {
      alignItems: 'center',
      maxWidth: 280,
    },
    stepNumber: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    stepNumberText: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.lg,
      color: '#FFFFFF',
    },
    stepTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    stepDesc: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    stepConnector: {
      width: 2,
      height: 28,
      backgroundColor: colors.border,
      marginVertical: spacing.sm,
    },

    // ── Stats ─────────────────────────────────────────────────────────
    statsStrip: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: spacing['2xl'],
      marginVertical: spacing.lg,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
    },
    statBlock: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    statValue: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xl,
      color: colors.primary,
      letterSpacing: -0.3,
    },
    statLabel: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.xs,
      color: colors.textTertiary,
    },
    statDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.borderSubtle,
    },

    // ── CTA ───────────────────────────────────────────────────────────
    ctaSection: {
      paddingVertical: spacing['2xl'],
    },
    ctaCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: 'rgba(99,102,241,0.20)',
      padding: spacing['2xl'],
      alignItems: 'center',
    },
    ctaTitle: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xl,
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.3,
      marginBottom: spacing.md,
    },
    ctaSubtitle: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 320,
      marginBottom: spacing['2xl'],
    },
    ctaActions: {
      flexDirection: 'row',
      gap: spacing.md,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },

    // ── Footer ────────────────────────────────────────────────────────
    footer: {
      alignItems: 'center',
      paddingTop: spacing['2xl'],
      gap: spacing.sm,
    },
    footerLogo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    logoIconSmall: {
      width: 24,
      height: 24,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerLogoText: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.base,
      color: colors.textPrimary,
    },
    footerCopy: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.xs,
      color: colors.textTertiary,
    },
    footerTagline: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.xs,
      color: colors.textTertiary,
      textAlign: 'center',
    },
  });
