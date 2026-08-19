import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { useAppTheme, useThemedStyles } from '../ThemeContext';
import { PrimaryButton } from '../components/ui';

const LoginScreen = ({
  code,
  configurationIssue,
  email,
  loading,
  onCodeChange,
  onEmailChange,
  onOpenWorkspace,
  onRequestCode,
  onRestart,
  onVerifyCode,
  resendAfter = 0,
  step = 'email',
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (step !== 'code') return undefined;
    setSecondsLeft(resendAfter);
    return undefined;
  }, [resendAfter, step]);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setInterval(
      () => setSecondsLeft(current => Math.max(0, current - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [secondsLeft]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>SF</Text>
          </View>
          <View>
            <Text style={styles.brandName}>DayMark</Text>
            <Text style={styles.brandMeta}>Work intelligence</Text>
          </View>
        </View>

        <View style={styles.intro}>
          <View style={styles.eyebrowRow}>
            <Sparkles color={colors.brand} size={15} strokeWidth={2.2} />
            <Text style={styles.eyebrow}>Mobile workspace</Text>
          </View>
          <Text style={styles.title}>Your workday, ready when you are.</Text>
          <Text style={styles.subtitle}>
            Check attendance, review assigned work, and stay current with your
            team.
          </Text>
        </View>

        {!!configurationIssue && (
          <View style={styles.configurationAlert}>
            <AlertTriangle color={colors.amber} size={19} />
            <Text style={styles.configurationText}>{configurationIssue}</Text>
          </View>
        )}

        <View style={styles.form}>
          {step === 'email' ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Work email</Text>
                <View style={styles.inputShell}>
                  <Mail color={colors.muted} size={18} strokeWidth={2} />
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    keyboardType="email-address"
                    onChangeText={onEmailChange}
                    onSubmitEditing={onRequestCode}
                    placeholder="name@company.com"
                    placeholderTextColor={colors.placeholder}
                    returnKeyType="go"
                    style={styles.input}
                    value={email}
                  />
                </View>
                <Text style={styles.helper}>
                  We email you a 6-digit code. No password needed.
                </Text>
              </View>

              <PrimaryButton
                disabled={Boolean(configurationIssue)}
                icon={ArrowRight}
                label="Send code"
                loading={loading}
                onPress={onRequestCode}
              />
            </>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>6-digit code</Text>
                <View style={styles.inputShell}>
                  <KeyRound color={colors.muted} size={18} strokeWidth={2} />
                  <TextInput
                    autoComplete="sms-otp"
                    autoFocus
                    keyboardType="number-pad"
                    maxLength={6}
                    onChangeText={value =>
                      onCodeChange(value.replace(/[^0-9]/g, '').slice(0, 6))
                    }
                    onSubmitEditing={onVerifyCode}
                    placeholder="000000"
                    placeholderTextColor={colors.placeholder}
                    returnKeyType="go"
                    style={[styles.input, styles.codeInput]}
                    textContentType="oneTimeCode"
                    value={code}
                  />
                </View>
                <Text style={styles.helper}>Sent to {email}</Text>
              </View>

              <PrimaryButton
                disabled={String(code || '').length !== 6}
                icon={ArrowRight}
                label="Verify and sign in"
                loading={loading}
                onPress={onVerifyCode}
              />

              <View style={styles.codeActions}>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={onRestart}
                  style={styles.backRow}
                >
                  <ArrowLeft color={colors.muted} size={15} strokeWidth={2} />
                  <Text style={styles.backText}>Use a different email</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={secondsLeft > 0 || loading}
                  hitSlop={8}
                  onPress={onRequestCode}
                >
                  <Text
                    style={[
                      styles.resendText,
                      secondsLeft > 0 && styles.resendTextDisabled,
                    ]}
                  >
                    {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          <View style={styles.securityLine}>
            <ShieldCheck color={colors.positive} size={16} strokeWidth={2} />
            <Text style={styles.securityText}>
              One-time code sign-in, valid for 3 days
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="link"
          onPress={onOpenWorkspace}
          style={styles.webLink}
        >
          <Text style={styles.webLinkText}>Open DayMark on the web</Text>
          <ExternalLink color={colors.brand} size={16} />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const createStyles = ({ colors, typography, shadow }) => StyleSheet.create({
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.brand,
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  brandMarkText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  brandMeta: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  brandName: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
  },
  configurationAlert: {
    alignItems: 'flex-start',
    backgroundColor: colors.amberSoft,
    borderColor: '#FDE68A',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    padding: 13,
  },
  configurationText: {
    color: colors.amber,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 34,
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.brand,
  },
  eyebrowRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  field: { gap: 7 },
  flex: { flex: 1 },
  backRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  backText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  codeActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeInput: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 8,
  },
  form: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 17,
    marginTop: 28,
    padding: 18,
    ...shadow,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    minHeight: 46,
    paddingVertical: 0,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 13,
  },
  intro: { marginTop: 42 },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  helper: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
  },
  resendText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: '800',
  },
  resendTextDisabled: { color: colors.placeholder },
  securityLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
  },
  securityText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.body,
    marginTop: 11,
    maxWidth: 360,
  },
  title: {
    ...typography.heading,
    fontSize: 31,
    lineHeight: 38,
    marginTop: 12,
  },
  webLink: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 22,
    padding: 8,
  },
  webLinkText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: '800',
  },
});
