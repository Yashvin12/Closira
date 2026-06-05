/**
 * NewEnquiryModal — bottom-sheet modal for submitting a new customer enquiry.
 *
 * Features:
 * - Channel selector (WhatsApp / Email / Call) with brand colours
 * - Customer name and message text inputs
 * - Live validation with error messages
 * - Loading spinner during API call
 * - Success / error feedback
 * - Smooth slide-up animation using Animated API
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMockData } from '../../hooks/useMockData';
import {
  borderRadius,
  fontFamily,
  fontSize,
  iconSize,
  spacing,
} from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Channel = 'whatsapp' | 'email' | 'call';

interface ChannelOption {
  key: Channel;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

const CHANNEL_OPTIONS: ChannelOption[] = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: 'logo-whatsapp',
    color: '#25D366',
    bg: 'rgba(37,211,102,0.15)',
  },
  {
    key: 'email',
    label: 'Email',
    icon: 'mail',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.15)',
  },
  {
    key: 'call',
    label: 'Call',
    icon: 'call',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.15)',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface NewEnquiryModalProps {
  visible: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function NewEnquiryModal({
  visible,
  onClose,
}: NewEnquiryModalProps): React.JSX.Element {
  const { colors, shadows } = useTheme();
  const { submitNewEnquiry, isLive } = useMockData() as any;

  // Form state
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [customerName, setCustomerName] = useState('');
  const [message, setMessage] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Slide-up animation
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      setSubmitStatus('idle');
      setErrorMessage('');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const resetForm = useCallback(() => {
    setChannel('whatsapp');
    setCustomerName('');
    setMessage('');
    setSubmitStatus('idle');
    setErrorMessage('');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(async () => {
    // Validate
    if (!customerName.trim()) {
      setErrorMessage('Customer name is required.');
      setSubmitStatus('error');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Message is required.');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      if (typeof submitNewEnquiry === 'function') {
        const result = await submitNewEnquiry(
          channel,
          customerName.trim(),
          message.trim()
        );
        if (result.success) {
          setSubmitStatus('success');
          setTimeout(() => {
            handleClose();
          }, 1200);
        } else {
          setErrorMessage(result.error ?? 'Submission failed. Please retry.');
          setSubmitStatus('error');
        }
      } else {
        // No real API available (demo mode)
        setSubmitStatus('success');
        setTimeout(() => {
          handleClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Unexpected error. Please retry.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [channel, customerName, message, submitNewEnquiry, handleClose]);

  const styles = makeStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={handleClose} />

      {/* Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            shadows.lg,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconRing}>
                <Ionicons name="add-circle" size={iconSize.md} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>New Enquiry</Text>
                <Text style={styles.headerSub}>
                  {isLive ? '● Live — will be saved to backend' : '○ Demo mode'}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={iconSize.md} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Channel Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CHANNEL</Text>
              <View style={styles.channelRow}>
                {CHANNEL_OPTIONS.map((opt) => {
                  const active = channel === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => setChannel(opt.key)}
                      style={[
                        styles.channelPill,
                        { backgroundColor: active ? opt.bg : 'transparent' },
                        active && {
                          borderColor: opt.color,
                          borderWidth: 1.5,
                        },
                        !active && styles.channelPillInactive,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Channel: ${opt.label}`}
                      accessibilityState={{ selected: active }}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={14}
                        color={active ? opt.color : colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.channelPillText,
                          { color: active ? opt.color : colors.textTertiary },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Customer Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CUSTOMER NAME</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Sarah Mitchell"
                  placeholderTextColor={colors.textTertiary}
                  value={customerName}
                  onChangeText={setCustomerName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  editable={!isSubmitting}
                  accessibilityLabel="Customer name input"
                />
              </View>
            </View>

            {/* Message */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>MESSAGE</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter the customer's enquiry message…"
                  placeholderTextColor={colors.textTertiary}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  returnKeyType="default"
                  editable={!isSubmitting}
                  accessibilityLabel="Customer message input"
                />
              </View>
            </View>

            {/* Status Feedback */}
            {submitStatus === 'error' && (
              <View style={styles.statusBanner}>
                <Ionicons name="alert-circle" size={14} color={colors.danger} />
                <Text style={styles.statusBannerText}>{errorMessage}</Text>
              </View>
            )}
            {submitStatus === 'success' && (
              <View style={[styles.statusBanner, styles.statusBannerSuccess]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={[styles.statusBannerText, { color: colors.success }]}>
                  Enquiry submitted successfully!
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isSubmitting || submitStatus === 'success') && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || submitStatus === 'success'}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Submit enquiry"
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Submitting…</Text>
              ) : submitStatus === 'success' ? (
                <>
                  <Ionicons name="checkmark-circle" size={iconSize.sm} color={colors.white} />
                  <Text style={styles.submitButtonText}>Submitted!</Text>
                </>
              ) : (
                <>
                  <Ionicons name="send" size={iconSize.sm} color={colors.white} />
                  <Text style={styles.submitButtonText}>Submit Enquiry</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const makeStyles = (colors: any) =>
  StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    keyboardView: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing['3xl'],
      maxHeight: '85%',
      borderTopWidth: 1,
      borderColor: colors.borderSubtle,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: borderRadius.full,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },

    // ─── Header ────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing['2xl'],
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    headerIconRing: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: fontSize.lg,
      fontFamily: fontFamily.bold,
      color: colors.textPrimary,
    },
    headerSub: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.regular,
      color: colors.textTertiary,
      marginTop: 2,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.closeButtonBg,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // ─── Fields ────────────────────────────────────────────────────
    fieldGroup: {
      marginBottom: spacing.lg,
    },
    fieldLabel: {
      fontSize: 10,
      fontFamily: fontFamily.bold,
      color: colors.textTertiary,
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
    },
    channelRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    channelPill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
    },
    channelPillInactive: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    channelPillText: {
      fontSize: fontSize.xs,
      fontFamily: fontFamily.semibold,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
    },
    textAreaWrapper: {
      alignItems: 'flex-start',
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    inputIcon: {
      marginRight: spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.textPrimary,
      paddingVertical: spacing.md,
      minHeight: 44,
    },
    textArea: {
      minHeight: 96,
      paddingTop: 0,
    },

    // ─── Status ────────────────────────────────────────────────────
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: 'rgba(239,68,68,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.25)',
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    statusBannerSuccess: {
      backgroundColor: 'rgba(34,197,94,0.1)',
      borderColor: 'rgba(34,197,94,0.25)',
    },
    statusBannerText: {
      flex: 1,
      fontSize: fontSize.sm,
      fontFamily: fontFamily.semibold,
      color: colors.danger,
    },

    // ─── Submit ────────────────────────────────────────────────────
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.lg,
      marginTop: spacing.sm,
    },
    submitButtonDisabled: {
      backgroundColor: colors.primaryDark,
      opacity: 0.7,
    },
    submitButtonText: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.bold,
      color: colors.white,
      letterSpacing: 0.3,
    },
  });
