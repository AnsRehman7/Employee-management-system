import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CheckCircle2,
  Clock3,
  Fingerprint,
  LocateFixed,
  LogIn,
  LogOut,
  MapPin,
  Navigation,
  ShieldCheck,
  XCircle,
} from 'lucide-react-native';
import DynamicFields from '../components/DynamicFields';
import {
  Card,
  EmptyState,
  PrimaryButton,
  SectionHeader,
  StatusBadge,
} from '../components/ui';
import { useAppTheme, useThemedStyles } from '../ThemeContext';
import { formatDateTime, formatTime } from '../utils/formatters';
import { formatDistance } from '../utils/geofence';

const AttendanceScreen = ({
  customFields,
  employees,
  lastLocation,
  moduleDefinition,
  office,
  onCustomFieldsChange,
  onLocate,
  onMark,
  onRefresh,
  refreshing,
  scans,
  submittingDirection,
}) => {
  const { colors, typography } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const acceptedScans = useMemo(
    () => scans.filter(scan => scan.accepted !== false),
    [scans],
  );
  const latestAccepted = acceptedScans.at(-1);
  const atWork = latestAccepted?.direction === 'in';
  const withinOffice =
    lastLocation &&
    office &&
    lastLocation.distanceMeters <= office.radiusMeters;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          colors={[colors.brand]}
          onRefresh={onRefresh}
          refreshing={refreshing}
          tintColor={colors.brand}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={typography.eyebrow}>Workforce time</Text>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.subtitle}>
          Secure office presence with location and biometric verification.
        </Text>
      </View>

      <View style={styles.clockPanel}>
        <View style={styles.clockTop}>
          <View style={styles.clockIcon}>
            <Fingerprint color={colors.white} size={24} strokeWidth={1.9} />
          </View>
          <StatusBadge
            label={atWork ? 'Day active' : 'Not checked in'}
            value={atWork ? 'completed' : 'new'}
          />
        </View>
        <Text style={styles.clock}>
          {new Intl.DateTimeFormat('en', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(now)}
        </Text>
        <Text style={styles.clockDate}>
          {new Intl.DateTimeFormat('en', {
            day: 'numeric',
            month: 'long',
            weekday: 'long',
          }).format(now)}
        </Text>
        <View style={styles.shiftLine}>
          <Clock3 color={colors.onBrand} size={16} />
          <Text style={styles.shiftText}>
            {latestAccepted
              ? `Last ${latestAccepted.direction === 'in' ? 'check-in' : 'check-out'} at ${formatTime(
                  latestAccepted.scannedAt,
                )}`
              : 'No attendance recorded today'}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <PrimaryButton
          disabled={atWork}
          icon={LogIn}
          label="Check in"
          loading={submittingDirection === 'in'}
          onPress={() => onMark('in')}
          style={styles.actionButton}
        />
        <PrimaryButton
          disabled={!atWork}
          icon={LogOut}
          label="Check out"
          loading={submittingDirection === 'out'}
          onPress={() => onMark('out')}
          style={styles.actionButton}
          tone="secondary"
        />
      </View>

      <Card style={styles.locationPanel}>
        <SectionHeader
          action={
            <PrimaryButton
              icon={LocateFixed}
              label="Check"
              loading={submittingDirection === 'locate'}
              onPress={onLocate}
              style={styles.locateButton}
              tone="secondary"
            />
          }
          subtitle="Attendance is accepted only inside the configured radius."
          title="Office geofence"
        />
        <View style={styles.locationMetrics}>
          <View style={styles.locationMetric}>
            <View style={styles.locationMetricIcon}>
              <MapPin color={colors.brand} size={18} />
            </View>
            <View>
              <Text style={styles.metricLabel}>Allowed radius</Text>
              <Text style={styles.metricValue}>
                {office
                  ? formatDistance(office.radiusMeters)
                  : 'Not configured'}
              </Text>
            </View>
          </View>
          <View style={styles.locationMetric}>
            <View
              style={[
                styles.locationMetricIcon,
                withinOffice
                  ? styles.locationPositive
                  : styles.locationNeutral,
              ]}
            >
              <Navigation
                color={withinOffice ? colors.positive : colors.cyan}
                size={18}
              />
            </View>
            <View>
              <Text style={styles.metricLabel}>Current distance</Text>
              <Text style={styles.metricValue}>
                {lastLocation
                  ? formatDistance(lastLocation.distanceMeters)
                  : 'Check location'}
              </Text>
            </View>
          </View>
        </View>
        {!!lastLocation && (
          <View
            style={[
              styles.locationStatus,
              withinOffice
                ? styles.locationStatusPositive
                : styles.locationStatusDanger,
            ]}
          >
            {withinOffice ? (
              <ShieldCheck color={colors.positive} size={18} />
            ) : (
              <XCircle color={colors.danger} size={18} />
            )}
            <Text
              style={[
                styles.locationStatusText,
                withinOffice
                  ? styles.locationStatusTextPositive
                  : styles.locationStatusTextDanger,
              ]}
            >
              {withinOffice
                ? `Inside office boundary / GPS accuracy ${formatDistance(
                    lastLocation.accuracy,
                  )}`
                : 'Outside the approved office boundary'}
            </Text>
          </View>
        )}
      </Card>

      <DynamicFields
        fields={moduleDefinition?.fields || []}
        members={employees}
        onChange={onCustomFieldsChange}
        values={customFields}
      />

      <View style={styles.history}>
        <SectionHeader
          subtitle="Check-in and check-out activity for today."
          title="Today's record"
        />
        <Card style={styles.scanList}>
          {scans.map((scan, index) => (
            <View
              key={scan.id}
              style={[
                styles.scanRow,
                index < scans.length - 1 && styles.scanRowBorder,
              ]}
            >
              <View
                style={[
                  styles.scanIcon,
                  scan.accepted === false && styles.scanIconRejected,
                ]}
              >
                {scan.accepted === false ? (
                  <XCircle color={colors.danger} size={18} />
                ) : (
                  <CheckCircle2 color={colors.positive} size={18} />
                )}
              </View>
              <View style={styles.scanBody}>
                <Text style={styles.scanTitle}>
                  {scan.direction === 'in' ? 'Check-in' : 'Check-out'}
                </Text>
                <Text numberOfLines={1} style={styles.scanMeta}>
                  {formatDateTime(scan.scannedAt)} /{' '}
                  {scan.distanceMeters === null
                    ? 'Distance unavailable'
                    : formatDistance(scan.distanceMeters)}
                </Text>
              </View>
              <StatusBadge
                label={scan.accepted === false ? 'Rejected' : 'Accepted'}
                value={scan.accepted === false ? 'rejected' : 'accepted'}
              />
            </View>
          ))}
          {!scans.length && (
            <EmptyState
              icon={Clock3}
              message="Your first successful check-in will appear here."
              title="No attendance today"
            />
          )}
        </Card>
      </View>
    </ScrollView>
  );
};

export default AttendanceScreen;

const createStyles = ({ colors, typography }) => StyleSheet.create({
  actionButton: { flex: 1 },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  clock: {
    color: colors.white,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 24,
  },
  clockDate: {
    color: colors.onBrand,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  clockIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  clockPanel: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    marginTop: 22,
    padding: 18,
  },
  clockTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  content: {
    gap: 14,
    paddingBottom: 110,
    paddingHorizontal: 16,
    paddingTop: 17,
  },
  history: { marginTop: 7 },
  locateButton: {
    minHeight: 38,
    paddingHorizontal: 11,
  },
  locationMetric: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 9,
  },
  locationMetricIcon: {
    alignItems: 'center',
    backgroundColor: colors.brandSoft,
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  locationMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  locationNeutral: { backgroundColor: colors.cyanSoft },
  locationPanel: { marginTop: 2 },
  locationPositive: { backgroundColor: colors.positiveSoft },
  locationStatus: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    padding: 11,
  },
  locationStatusDanger: { backgroundColor: colors.dangerSoft },
  locationStatusPositive: { backgroundColor: colors.positiveSoft },
  locationStatusText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  locationStatusTextDanger: { color: colors.danger },
  locationStatusTextPositive: { color: colors.positive },
  metricLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  metricValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  scanBody: { flex: 1 },
  scanIcon: {
    alignItems: 'center',
    backgroundColor: colors.positiveSoft,
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  scanIconRejected: { backgroundColor: colors.dangerSoft },
  scanList: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  scanMeta: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  scanRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 68,
    paddingVertical: 10,
  },
  scanRowBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  scanTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  shiftLine: {
    alignItems: 'center',
    borderTopColor: 'rgba(255,255,255,0.16)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    paddingTop: 14,
  },
  shiftText: {
    color: colors.onBrand,
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    marginTop: 6,
  },
  title: {
    ...typography.heading,
    marginTop: 4,
  },
});
