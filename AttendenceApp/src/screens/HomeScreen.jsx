import React, { useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  ListChecks,
  MapPin,
} from 'lucide-react-native';
import {
  Avatar,
  Card,
  IconButton,
  MetricTile,
  SectionHeader,
  StatusBadge,
} from '../components/ui';
import { useAppTheme, useThemedStyles } from '../ThemeContext';
import {
  dueLabel,
  formatDateLong,
  formatTime,
} from '../utils/formatters';

const taskRank = task => {
  if (!task.deadline) return Number.MAX_SAFE_INTEGER;
  return new Date(task.deadline).getTime();
};

const HomeScreen = ({
  onOpenInbox,
  onOpenTab,
  onRefresh,
  onSelectTask,
  refreshing,
  scans,
  tasks,
  unreadCount,
  user,
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const activeTasks = useMemo(
    () =>
      tasks
        .filter(task => task.status !== 'completed')
        .sort((first, second) => taskRank(first) - taskRank(second)),
    [tasks],
  );
  const completedCount = tasks.filter(task => task.status === 'completed').length;
  const acceptedScans = scans.filter(scan => scan.accepted !== false);
  const latestScan = acceptedScans.at(-1);
  const atWork = latestScan?.direction === 'in';

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
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} style={styles.workspace}>
            {user?.organization?.name || 'StaffFlow'}
          </Text>
          <Text numberOfLines={1} style={styles.greeting}>
            Hello, {String(user?.name || 'there').split(' ')[0]}
          </Text>
          <Text style={styles.eyebrow}>{formatDateLong()}</Text>
        </View>
        <IconButton
          accessibilityLabel="Open notifications"
          badge={unreadCount}
          icon={Bell}
          onPress={onOpenInbox}
        />
        <Avatar name={user?.name} />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => onOpenTab('attendance')}
        style={({ pressed }) => [
          styles.attendanceBand,
          pressed && styles.bandPressed,
        ]}
      >
        <View style={styles.bandTop}>
          <View style={styles.bandIcon}>
            {atWork ? (
              <CheckCircle2 color={colors.white} size={22} />
            ) : (
              <MapPin color={colors.white} size={22} />
            )}
          </View>
          <StatusBadge
            label={atWork ? 'Checked in' : 'Not checked in'}
            value={atWork ? 'completed' : 'new'}
          />
        </View>
        <Text style={styles.bandTitle}>
          {atWork ? 'Your workday is active' : 'Ready to start your day?'}
        </Text>
        <Text style={styles.bandCopy}>
          {latestScan
            ? `Last ${latestScan.direction === 'in' ? 'check-in' : 'check-out'} at ${formatTime(
                latestScan.scannedAt,
              )}`
            : 'Confirm your office location and biometric identity.'}
        </Text>
        <View style={styles.bandAction}>
          <Text style={styles.bandActionText}>
            {atWork ? 'Open attendance' : 'Check in'}
          </Text>
          <ChevronRight color={colors.white} size={18} />
        </View>
      </Pressable>

      <View style={styles.metrics}>
        <MetricTile
          icon={ListChecks}
          label="Active tasks"
          value={activeTasks.length}
        />
        <MetricTile
          icon={CheckCircle2}
          label="Completed"
          tone="positive"
          value={completedCount}
        />
        <MetricTile
          icon={Bell}
          label="Unread"
          tone="cyan"
          value={unreadCount}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader
          action={
            <Pressable onPress={() => onOpenTab('tasks')}>
              <Text style={styles.textAction}>View all</Text>
            </Pressable>
          }
          subtitle="The nearest deadlines in your queue."
          title="Priority work"
        />
        <Card style={styles.taskList}>
          {activeTasks.slice(0, 4).map((task, index) => (
            <Pressable
              key={task.id}
              onPress={() => onSelectTask(task)}
              style={({ pressed }) => [
                styles.taskRow,
                index < Math.min(activeTasks.length, 4) - 1 &&
                  styles.taskRowBorder,
                pressed && styles.taskRowPressed,
              ]}
            >
              <View
                style={[
                  styles.taskIcon,
                  task.priority === 'high' && styles.taskIconHigh,
                ]}
              >
                {task.status === 'in_progress' ? (
                  <CircleDot color={colors.brand} size={17} />
                ) : (
                  <CalendarClock
                    color={
                      task.priority === 'high'
                        ? colors.danger
                        : colors.cyan
                    }
                    size={17}
                  />
                )}
              </View>
              <View style={styles.taskBody}>
                <Text numberOfLines={1} style={styles.taskTitle}>
                  {task.title}
                </Text>
                <Text numberOfLines={1} style={styles.taskMeta}>
                  {task.projectName || 'No project'} / {dueLabel(task.deadline)}
                </Text>
              </View>
              <StatusBadge value={task.status} />
            </Pressable>
          ))}
          {!activeTasks.length && (
            <View style={styles.clearState}>
              <CheckCircle2 color={colors.positive} size={24} />
              <Text style={styles.clearTitle}>Your task queue is clear</Text>
              <Text style={styles.clearCopy}>
                New assignments will appear here.
              </Text>
            </View>
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Today at a glance" />
        <View style={styles.glance}>
          <View style={styles.glanceItem}>
            <Clock3 color={colors.brand} size={19} />
            <View>
              <Text style={styles.glanceLabel}>First check-in</Text>
              <Text style={styles.glanceValue}>
                {formatTime(
                  acceptedScans.find(scan => scan.direction === 'in')
                    ?.scannedAt,
                )}
              </Text>
            </View>
          </View>
          <View style={styles.glanceDivider} />
          <View style={styles.glanceItem}>
            <CalendarClock color={colors.cyan} size={19} />
            <View>
              <Text style={styles.glanceLabel}>Next deadline</Text>
              <Text style={styles.glanceValue}>
                {activeTasks[0]
                  ? dueLabel(activeTasks[0].deadline)
                  : 'No deadline'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const createStyles = ({ colors, typography }) => StyleSheet.create({
  attendanceBand: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    marginTop: 22,
    padding: 18,
  },
  bandAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 18,
  },
  bandActionText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  bandCopy: {
    color: colors.onBrand,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },
  bandIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  bandPressed: { opacity: 0.9 },
  bandTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
  },
  bandTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearCopy: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  clearState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  clearTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 9,
  },
  content: {
    paddingBottom: 110,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.muted,
    marginTop: 3,
    textTransform: 'none',
  },
  glance: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 12,
    padding: 15,
  },
  glanceDivider: {
    backgroundColor: colors.border,
    marginHorizontal: 13,
    width: 1,
  },
  glanceItem: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  glanceLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  glanceValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  greeting: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '800',
    marginTop: 2,
  },
  workspace: {
    ...typography.eyebrow,
    color: colors.brand,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  headerCopy: { flex: 1 },
  metrics: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
  },
  section: { marginTop: 25 },
  taskBody: { flex: 1 },
  taskIcon: {
    alignItems: 'center',
    backgroundColor: colors.cyanSoft,
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  taskIconHigh: { backgroundColor: colors.dangerSoft },
  taskList: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  taskMeta: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  taskRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
    minHeight: 70,
    paddingVertical: 10,
  },
  taskRowBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  taskRowPressed: { opacity: 0.68 },
  taskTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  textAction: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: '800',
    paddingVertical: 3,
  },
});
