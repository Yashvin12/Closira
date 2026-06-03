/**
 * Signup screen — full name (optional), email, password, confirm password.
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

export default function SignupScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const { signup } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await signup(email.trim().toLowerCase(), password, fullName.trim() || undefined);
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(result.error ?? 'Signup failed');
    }
  };

  const s = makeStyles(colors);

  return (
    <KeyboardAvoidingView
      style={[s.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>

        <Text style={[s.title, { color: colors.textPrimary }]}>Create account</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          Join Closira and start managing your CRM
        </Text>

        {error && (
          <View style={[s.errorBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
            <Text style={[s.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        {/* Full name */}
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Full Name (optional)</Text>
          <View style={[s.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={18} color={colors.textTertiary} style={s.icon} />
            <TextInput
              style={[s.input, { color: colors.textPrimary }]}
              placeholder="Jane Smith"
              placeholderTextColor={colors.textTertiary}
              value={fullName}
              onChangeText={setFullName}
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Email */}
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Email</Text>
          <View style={[s.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={18} color={colors.textTertiary} style={s.icon} />
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
            <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={s.icon} />
            <TextInput
              style={[s.input, { color: colors.textPrimary }]}
              placeholder="Min 8 characters"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
            />
            <Pressable onPress={() => setShowPw((v) => !v)} style={s.eyeBtn}>
              <Ionicons
                name={showPw ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textTertiary}
              />
            </Pressable>
          </View>
        </View>

        {/* Confirm */}
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.textSecondary }]}>Confirm Password</Text>
          <View style={[s.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={s.icon} />
            <TextInput
              style={[s.input, { color: colors.textPrimary }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textTertiary}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPw}
            />
          </View>
        </View>

        <Pressable
          style={[s.btn, { backgroundColor: colors.primary }, loading && s.btnDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnText}>Create Account</Text>
          )}
        </Pressable>

        <View style={s.footer}>
          <Text style={[s.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <Link href="/(auth)/login" style={[s.footerLink, { color: colors.primary }]}>
            Sign in
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
      paddingHorizontal: spacing['2xl'],
      paddingTop: 60,
      paddingBottom: spacing['3xl'],
    },
    backBtn: { marginBottom: spacing['2xl'] },
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
    errorText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, flex: 1 },
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
    icon: { marginRight: spacing.sm },
    input: {
      flex: 1,
      fontFamily: fontFamily.regular,
      fontSize: fontSize.base,
      paddingVertical: 14,
    },
    eyeBtn: { padding: spacing.sm },
    btn: {
      height: 52,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { fontFamily: fontFamily.semibold, fontSize: fontSize.base, color: '#fff' },
    footer: { flexDirection: 'row', justifyContent: 'center' },
    footerText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm },
    footerLink: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm },
  });
