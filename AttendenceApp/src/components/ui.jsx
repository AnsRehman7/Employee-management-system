import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Inbox,
} from 'lucide-react-native';
import { useAppTheme, useThemedStyles } from '../ThemeContext';
import { initialsFor, labelForValue } from '../utils/formatters';

export const Card = ({ children, style }) => {
  const styles = useThemedStyles(createStyles);

  return (
  <View style={[styles.card, style]}>{children}</View>
  );
};

export const Avatar = ({ name, size = 42 }) => {
  const styles = useThemedStyles(createStyles);

  return (
  <View
    style={[
      styles.avatar,
      {
        borderRadius: size / 2,
        height: size,
        width: size,
      },
    ]}
  >
    <Text style={[styles.avatarText, { fontSize: Math.max(13, size * 0.34) }]}>
      {initialsFor(name)}
    </Text>
  </View>
  );
};

export const PrimaryButton = ({
  disabled = false,
  icon: Icon,
  label,
  loading = false,
  onPress,
  tone = 'primary',
  style,
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const secondary = tone === 'secondary';
  const danger = tone === 'danger';
  const foreground = secondary
    ? colors.text
    : danger
      ? colors.danger
      : colors.white;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        danger && styles.buttonDanger,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : (
        <>
          {Icon && <Icon color={foreground} size={18} strokeWidth={2.2} />}
          <Text
            style={[
              styles.buttonText,
              secondary && styles.buttonSecondaryText,
              danger && styles.buttonDangerText,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
};

export const IconButton = ({
  accessibilityLabel,
  badge,
  icon: Icon,
  onPress,
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
  <Pressable
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
    hitSlop={8}
    onPress={onPress}
    style={({ pressed }) => [
      styles.iconButton,
      pressed && styles.iconButtonPressed,
    ]}
  >
    <Icon color={colors.text} size={19} strokeWidth={2} />
    {badge > 0 && (
      <View style={styles.iconBadge}>
        <Text style={styles.iconBadgeText}>{badge > 9 ? '9+' : badge}</Text>
      </View>
    )}
  </Pressable>
  );
};

export const SectionHeader = ({ action, subtitle, title }) => {
  const { typography } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderText}>
      <Text style={typography.sectionTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {action}
  </View>
  );
};

const STATUS_TONES = {
  accepted: 'positive',
  active: 'cyan',
  completed: 'positive',
  high: 'danger',
  in_progress: 'brand',
  low: 'neutral',
  new: 'neutral',
  normal: 'cyan',
  on_hold: 'warning',
  open: 'cyan',
  overdue: 'danger',
  planned: 'neutral',
  rejected: 'danger',
};

export const StatusBadge = ({ label, value = label }) => {
  const styles = useThemedStyles(createStyles);
  const tone = STATUS_TONES[String(value || '').toLowerCase()] || 'neutral';
  return (
    <View style={[styles.badge, styles[`badge_${tone}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>
        {label || labelForValue(value)}
      </Text>
    </View>
  );
};

export const MetricTile = ({
  icon: Icon,
  label,
  tone = 'brand',
  value,
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
  <View style={styles.metricTile}>
    <View style={[styles.metricIcon, styles[`metricIcon_${tone}`]]}>
      <Icon
        color={
          tone === 'cyan'
            ? colors.cyan
            : tone === 'positive'
              ? colors.positive
              : colors.brand
        }
        size={18}
        strokeWidth={2}
      />
    </View>
    <Text numberOfLines={1} style={styles.metricValue}>
      {value}
    </Text>
    <Text numberOfLines={1} style={styles.metricLabel}>
      {label}
    </Text>
  </View>
  );
};

export const EmptyState = ({
  icon: Icon = Inbox,
  message,
  title = 'Nothing here yet',
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Icon color={colors.brand} size={22} strokeWidth={1.8} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
  </View>
  );
};

export const ListLink = ({
  caption,
  icon: Icon,
  onPress,
  title,
  value,
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [
      styles.listLink,
      pressed && styles.listLinkPressed,
    ]}
  >
    <View style={styles.listLinkIcon}>
      <Icon color={colors.brand} size={19} strokeWidth={2} />
    </View>
    <View style={styles.listLinkBody}>
      <Text style={styles.listLinkTitle}>{title}</Text>
      {!!caption && <Text style={styles.listLinkCaption}>{caption}</Text>}
    </View>
    {!!value && <Text style={styles.listLinkValue}>{value}</Text>}
    <ChevronRight color={colors.muted} size={18} strokeWidth={2} />
  </Pressable>
  );
};

export const Snackbar = ({ message, tone = 'info' }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  if (!message) return null;
  const error = tone === 'error';
  const success = tone === 'success';
  const Icon = error ? AlertCircle : success ? CheckCircle2 : AlertCircle;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.snackbar,
        error
          ? styles.snackbarError
          : success
            ? styles.snackbarSuccess
            : styles.snackbarInfo,
      ]}
    >
      <Icon color={colors.white} size={19} strokeWidth={2.2} />
      <Text style={styles.snackbarText}>{message}</Text>
    </View>
  );
};

export const LoadingState = ({ label = 'Loading workspace' }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
  <View style={styles.loadingState}>
    <ActivityIndicator color={colors.brand} size="large" />
    <Text style={styles.loadingLabel}>{label}</Text>
  </View>
  );
};

const createStyles = ({ colors, shadow }) => StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.cyanSoft,
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.cyan,
    fontWeight: '800',
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badge_cyan: { backgroundColor: colors.cyanSoft },
  badge_danger: { backgroundColor: colors.dangerSoft },
  badge_neutral: { backgroundColor: colors.neutralSoft },
  badge_positive: { backgroundColor: colors.positiveSoft },
  badge_brand: { backgroundColor: colors.brandSoft },
  badge_warning: { backgroundColor: colors.amberSoft },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeText_cyan: { color: colors.cyan },
  badgeText_danger: { color: colors.danger },
  badgeText_neutral: { color: colors.muted },
  badgeText_positive: { color: colors.positive },
  badgeText_brand: { color: colors.brand },
  badgeText_warning: { color: colors.amber },
  button: {
    alignItems: 'center',
    backgroundColor: colors.brand,
    borderColor: colors.brand,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  buttonDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#FECDD3',
  },
  buttonDangerText: { color: colors.danger },
  buttonDisabled: { opacity: 0.52 },
  buttonPressed: { opacity: 0.82 },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  buttonSecondaryText: { color: colors.text },
  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    ...shadow,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 34,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.brandSoft,
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  emptyMessage: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderColor: colors.surface,
    borderRadius: 8,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -5,
    top: -5,
  },
  iconBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '900',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconButtonPressed: { backgroundColor: colors.surfaceMuted },
  listLink: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 2,
    paddingVertical: 10,
  },
  listLinkBody: { flex: 1 },
  listLinkCaption: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  listLinkIcon: {
    alignItems: 'center',
    backgroundColor: colors.brandSoft,
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  listLinkPressed: { backgroundColor: colors.surfaceMuted },
  listLinkTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  listLinkValue: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  loadingLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  metricIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    marginBottom: 12,
    width: 34,
  },
  metricIcon_cyan: { backgroundColor: colors.cyanSoft },
  metricIcon_positive: { backgroundColor: colors.positiveSoft },
  metricIcon_brand: { backgroundColor: colors.brandSoft },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  metricTile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: 96,
    padding: 13,
  },
  metricValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  skeletonAvatar: {
    backgroundColor: colors.skeleton,
    borderRadius: 8,
    height: 38,
    width: 38,
  },
  skeletonBar: {
    backgroundColor: colors.skeleton,
    borderRadius: 4,
    height: 10,
  },
  skeletonBarNarrow: { width: '45%' },
  skeletonBarWide: { width: '75%' },
  skeletonBody: { flex: 1, gap: 8 },
  skeletonRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  sectionHeaderText: { flex: 1 },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  snackbar: {
    alignItems: 'center',
    borderRadius: 8,
    bottom: 86,
    flexDirection: 'row',
    gap: 10,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    position: 'absolute',
    right: 16,
    ...shadow,
  },
  snackbarError: { backgroundColor: colors.danger },
  snackbarInfo: { backgroundColor: colors.cyan },
  snackbarSuccess: { backgroundColor: colors.positive },
  snackbarText: {
    color: colors.white,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
});

/**
 * Loading placeholder shaped like the list it replaces, so the layout does not jump
 * when data arrives. Announced once rather than per bar.
 */
export const SkeletonList = ({ label = 'Loading', rows = 4 }) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View accessibilityLabel={label} accessibilityRole="progressbar">
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.skeletonRow}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonBody}>
            <View style={[styles.skeletonBar, styles.skeletonBarWide]} />
            <View style={[styles.skeletonBar, styles.skeletonBarNarrow]} />
          </View>
        </View>
      ))}
    </View>
  );
};
