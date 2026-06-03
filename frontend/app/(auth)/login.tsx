/**
 * Login screen — email + password + forgot password + signup link.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { fontFamily, fontSize, spacing, borderRadius } from '../../constants/theme';

export default function LoginScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(result.error ?? 'Login failed');
    }
  };

  const s = makeStyles(colors);

  return (
    <KeyboardAvoidingView
      style={[s.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Logo / Brand */}
        <View style={s.brandRow}>
          <View style={s.logoCircle}>
            <Ionicons name="briefcase" size={28} color={colors.primary} />
          </View>
          <Text style={[s.brand, { color: colors.textPrimary }]}>Closira</Text>
        </View>

        <Text style={[s.title, { color: colors.textPrimary }]}>Welcome back</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          Sign in to your account to continue
        </Text>

        {/* Error */}
        {error && (
          <View style={[s.errorBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
            <Text style={[s.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        {/* Email */}
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Email</Text>
          <View style={[s.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={18} color={colors.textTertiary} style={s.inputIcon} />
            <TextInput
              style={[s.input, { color: colors.textPrimary }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Password */}
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Password</Text>
          <View style={[s.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={s.inputIcon} />
            <TextInput
              style={[s.input, { color: colors.textPrimary }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} style={s.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textTertiary}
              />
            </Pressable>
          </View>
        </View>

        {/* Forgot */}
        <Link href="/(auth)/forgot-password" style={[s.forgotLink, { color: colors.primary }]}>
          Forgot password?
        </Link>

        {/* Sign in button */}
        <Pressable
          style={[s.btn, { backgroundColor: colors.primary }, loading && s.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnText}>Sign In</Text>
          )}
        </Pressable>

        {/* Sign up link */}
        <View style={s.footer}>
          <Text style={[s.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <Link href="/(auth)/signup" style={[s.footerLink, { color: colors.primary }]}>
            Sign up
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing['2xl'],
      paddingVertical: spacing['3xl'],
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing['3xl'],
    },
    logoCircle: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    brand: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize['2xl'],
    },
    title: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize['2xl'],
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.sm,
      marginBottom: spacing['2xl'],
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      marginBottom: spacing.lg,
    },
    errorText: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.sm,
      flex: 1,
    },
    fieldGroup: { marginBottom: spacing.lg },
    label: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.sm,
      marginBottom: spacing.xs,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
    },
    inputIcon: { marginRight: spacing.sm },
    input: {
      flex: 1,
      fontFamily: fontFamily.regular,
      fontSize: fontSize.base,
      paddingVertical: 14,
    },
    eyeBtn: { padding: spacing.sm },
    forgotLink: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.sm,
      textAlign: 'right',
      marginBottom: spacing['2xl'],
    },
    btn: {
      height: 52,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: '#fff',
    },
    footer: { flexDirection: 'row', justifyContent: 'center' },
    footerText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm },
    footerLink: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm },
  });
