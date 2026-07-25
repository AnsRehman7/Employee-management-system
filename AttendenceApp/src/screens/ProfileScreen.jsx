import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Building2,
  ExternalLink,
  Fingerprint,
  LogOut,
  Mail,
  MapPinCheck,
  Settings,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import {
  Avatar,
  Card,
  ListLink,
  PrimaryButton,
  SectionHeader,
  StatusBadge,
} from '../components/ui';
import { colors, typography } from '../theme';
import { labelForValue } from '../utils/formatters';

const ProfileScreen = ({
  configurationIssue,
  onOpenProfile,
  onOpenSettings,
  onSignOut,
  officeConfigured,
  user,
}) => (
  <ScrollView
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}
  >
    <View>
      <Text style={typography.eyebrow}>Account</Text>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>
        Your StaffFlow identity and mobile security status.
      </Text>
    </View>

    <Card style={styles.identity}>
      <Avatar name={user?.name} size={58} />
      <View style={styles.identityBody}>
        <Text numberOfLines={1} style={styles.identityName}>
          {user?.name || 'StaffFlow member'}
        </Text>
        <Text numberOfLines={1} style={styles.identityRole}>
          {user?.designation || labelForValue(user?.role)}
        </Text>
        <View style={styles.identityBadge}>
          <StatusBadge
            label={labelForValue(user?.role || 'employee')}
            value="active"
          />
        </View>
      </View>
    </Card>

    <View style={styles.section}>
      <SectionHeader title="Account details" />
      <Card style={styles.detailList}>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Mail color={colors.violet} size={18} />
          </View>
          <View style={styles.detailBody}>
            <Text style={styles.detailLabel}>Work email</Text>
            <Text numberOfLines={1} style={styles.detailValue}>
              {user?.email || 'Not available'}
            </Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Building2 color={colors.cyan} size={18} />
          </View>
          <View style={styles.detailBody}>
            <Text style={styles.detailLabel}>Workspace</Text>
            <Text numberOfLines={1} style={styles.detailValue}>
              {user?.organization?.name || 'StaffFlow'}
            </Text>
          </View>
        </View>
        <View style={[styles.detailRow, styles.detailRowLast]}>
          <View style={styles.detailIcon}>
            <UserRound color={colors.positive} size={18} />
          </View>
          <View style={styles.detailBody}>
            <Text style={styles.detailLabel}>Department</Text>
            <Text numberOfLines={1} style={styles.detailValue}>
              {user?.department || 'Not assigned'}
            </Text>
          </View>
        </View>
      </Card>
    </View>

    <View style={styles.section}>
      <SectionHeader title="Mobile security" />
      <Card style={styles.securityList}>
        <View style={styles.securityRow}>
          <Fingerprint color={colors.violet} size={19} />
          <View style={styles.securityBody}>
            <Text style={styles.securityTitle}>Biometric confirmation</Text>
            <Text style={styles.securityCopy}>
              Required before every mobile attendance scan.
            </Text>
          </View>
          <ShieldCheck color={colors.positive} size={20} />
        </View>
        <View style={styles.securityRow}>
          <MapPinCheck color={colors.cyan} size={19} />
          <View style={styles.securityBody}>
            <Text style={styles.securityTitle}>Office geofence</Text>
            <Text style={styles.securityCopy}>
              {officeConfigured
                ? 'Location boundary is configured.'
                : 'Location boundary needs configuration.'}
            </Text>
          </View>
          <StatusBadge
            label={officeConfigured ? 'Ready' : 'Missing'}
            value={officeConfigured ? 'completed' : 'overdue'}
          />
        </View>
      </Card>
      {!!configurationIssue && (
        <Text style={styles.configurationIssue}>{configurationIssue}</Text>
      )}
    </View>

    <View style={styles.section}>
      <SectionHeader title="Web workspace" />
      <Card style={styles.linkList}>
        <ListLink
          caption="Edit personal and employment information."
          icon={UserRound}
          onPress={onOpenProfile}
          title="Open full profile"
        />
        <ListLink
          caption="Workspace, notifications, access, and customization."
          icon={Settings}
          onPress={onOpenSettings}
          title="Open settings"
        />
        <ListLink
          caption="Continue in the complete StaffFlow web application."
          icon={ExternalLink}
          onPress={onOpenProfile}
          title="Open web application"
        />
      </Card>
    </View>

    <PrimaryButton
      icon={LogOut}
      label="Sign out"
      onPress={onSignOut}
      tone="danger"
    />
    <Text style={styles.version}>StaffFlow mobile / Version 1.0</Text>
  </ScrollView>
);

export default ProfileScreen;

const styles = StyleSheet.create({
  configurationIssue: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 8,
  },
  content: {
    gap: 18,
    paddingBottom: 116,
    paddingHorizontal: 16,
    paddingTop: 17,
  },
  detailBody: { flex: 1 },
  detailIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  detailList: {
    marginTop: 12,
    paddingBottom: 0,
    paddingTop: 0,
  },
  detailRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 64,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  identity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  identityBadge: { marginTop: 9 },
  identityBody: { flex: 1 },
  identityName: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '800',
  },
  identityRole: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  linkList: {
    marginTop: 12,
    paddingBottom: 0,
    paddingTop: 0,
  },
  section: { marginTop: 1 },
  securityBody: { flex: 1 },
  securityCopy: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  securityList: {
    gap: 0,
    marginTop: 12,
    paddingBottom: 4,
    paddingTop: 4,
  },
  securityRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 68,
    paddingVertical: 10,
  },
  securityTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.body,
    marginTop: 6,
  },
  title: {
    ...typography.heading,
    marginTop: 4,
  },
  version: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
