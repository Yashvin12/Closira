/**
 * Forgot Password screen — email input, shows confirmation message.
 * No backend flow required yet; confirmation is shown inline.
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { fontFamily, fontSize, spacing, borderRadius } from '../../constants/theme';

export default function ForgotPasswordScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const s = makeStyles(colors);

  return (
    <KeyboardAvoidingView
      style={[s.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.container}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={s.iconCircle}>
          <Ionicons name="key-outline" size={32} color={colors.primary} />
        </View>

        <Text style={[s.title, { color: colors.textPrimary }]}>Reset password</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          Enter the email address associated with your account and we'll send you a reset link.
        </Text>

        {sent ? (
          <View style={[s.successBox, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
            <Text style={[s.successText, { color: colors.success }]}>
              If an account exists for {email}, you'll receive a reset link shortly.
            </Text>
          </View>
        ) : (
          <>
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

            <Pressable
              style={[s.btn, { backgroundColor: colors.primary }, !email.trim() && s.btnDisabled]}
              onPress={() => setSent(true)}
              disabled={!email.trim()}
            >
              <Text style={s.btnText}>Send Reset Link</Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={() => router.replace('/(auth)/login')} style={s.backToLogin}>
          <Text style={[s.backToLoginText, { color: colors.primary }]}>← Back to Sign In</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: {
      flex: 1,
      paddingHorizontal: spacing['2xl'],
      paddingTop: 60,
    },
    backBtn: { marginBottom: spacing['2xl'] },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
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
      lineHeight: 22,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.lg,
    },
    icon: { marginRight: spacing.sm },
    input: {
      flex: 1,
      fontFamily: fontFamily.regular,
      fontSize: fontSize.base,
      paddingVertical: 14,
    },
    btn: {
      height: 52,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    btnDisabled: { opacity: 0.4 },
    btnText: { fontFamily: fontFamily.semibold, fontSize: fontSize.base, color: '#fff' },
    successBox: {
      flexDirection: 'row',
      gap: 10,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      marginBottom: spacing.lg,
    },
    successText: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.sm,
      flex: 1,
      lineHeight: 20,
    },
    backToLogin: { alignSelf: 'center' },
    backToLoginText: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm },
  });
