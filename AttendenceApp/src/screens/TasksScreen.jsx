import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  CircleDot,
  Clock3,
  ListChecks,
  Play,
  RotateCcw,
  X,
} from 'lucide-react-native';
import {
  Card,
  EmptyState,
  PrimaryButton,
  SectionHeader,
  StatusBadge,
} from '../components/ui';
import { useAppTheme, useThemedStyles } from '../ThemeContext';
import {
  dueLabel,
  formatDate,
  formatHours,
  labelForValue,
} from '../utils/formatters';

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
];

const customValueLabel = (field, value, members) => {
  if (value === null || value === undefined || value === '') return 'Not set';
  if (field.type === 'boolean') return value ? 'Yes' : 'No';
  if (field.type === 'user') {
    return members.find(member => member.id === value)?.name || 'Team member';
  }
  if (['select', 'multi_select'].includes(field.type)) {
    const selected = Array.isArray(value) ? value : [value];
    return selected
      .map(item => field.options?.find(option => option.value === item)?.label || item)
      .join(', ');
  }
  return String(value);
};

const TaskDetailModal = ({
  members,
  moduleDefinition,
  onClose,
  onOpenWeb,
  onUpdateStatus,
  task,
  updating,
}) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  if (!task) return null;
  const customFields = (moduleDefinition?.fields || []).filter(
    field =>
      !field.isSystem &&
      !field.archived &&
      field.isVisible &&
      task.customFields?.[field.key] !== undefined,
  );
  const completed = task.status === 'completed';
  const started = task.status === 'in_progress';

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={Boolean(task)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.detailSheet}>
          <View style={styles.detailHeader}>
            <View style={styles.detailHeaderText}>
              <Text style={styles.detailEyebrow}>
                {task.projectName || 'Assigned work'}
              </Text>
              <Text style={styles.detailTitle}>{task.title}</Text>
            </View>
            <Pressable
              accessibilityLabel="Close task"
              hitSlop={8}
              onPress={onClose}
              style={styles.closeButton}
            >
              <X color={colors.text} size={20} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.detailContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailBadges}>
              <StatusBadge value={task.status} />
              <StatusBadge value={task.priority} />
            </View>

            <View style={styles.detailMetrics}>
              <View style={styles.detailMetric}>
                <Calendar color={colors.brand} size={17} />
                <View>
                  <Text style={styles.detailMetricLabel}>Due</Text>
                  <Text style={styles.detailMetricValue}>
                    {task.deadline ? formatDate(task.deadline) : 'Not set'}
                  </Text>
                </View>
              </View>
              <View style={styles.detailMetric}>
                <Clock3 color={colors.cyan} size={17} />
                <View>
                  <Text style={styles.detailMetricLabel}>Effort</Text>
                  <Text style={styles.detailMetricValue}>
                    {formatHours(task.totalLoggedHours)} /{' '}
                    {formatHours(task.estimatedHours)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Description</Text>
              <Text style={styles.detailCopy}>
                {task.description || 'No task description was provided.'}
              </Text>
            </View>

            {!!task.successCriteria && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Success criteria</Text>
                <Text style={styles.detailCopy}>{task.successCriteria}</Text>
              </View>
            )}

            {!!customFields.length && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Workspace details
                </Text>
                {customFields.map(field => (
                  <View key={field.id} style={styles.customRow}>
                    <Text style={styles.customLabel}>{field.label}</Text>
                    <Text style={styles.customValue}>
                      {customValueLabel(
                        field,
                        task.customFields[field.key],
                        members,
                      )}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.detailActions}>
            {!completed && !started && (
              <PrimaryButton
                icon={Play}
                label="Start task"
                loading={updating}
                onPress={() => onUpdateStatus(task, 'in_progress')}
                style={styles.detailAction}
                tone="secondary"
              />
            )}
            <PrimaryButton
              icon={completed ? RotateCcw : CheckCircle2}
              label={completed ? 'Reopen' : 'Complete'}
              loading={updating}
              onPress={() =>
                onUpdateStatus(task, completed ? 'in_progress' : 'completed')
              }
              style={styles.detailAction}
            />
            <Pressable
              accessibilityLabel="Open task in web workspace"
              onPress={() => onOpenWeb(task)}
              style={styles.webAction}
            >
              <ArrowUpRight color={colors.brand} size={19} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const TasksScreen = ({
  members,
  moduleDefinition,
  onCloseTask,
  onOpenWeb,
  onRefresh,
  onSelectTask,
  onUpdateStatus,
  refreshing,
  selectedTask,
  tasks,
  updatingTaskId,
}) => {
  const { colors, typography } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [filter, setFilter] = useState('active');
  const visibleTasks = useMemo(
    () =>
      tasks.filter(task => {
        if (filter === 'active') return task.status !== 'completed';
        if (filter === 'completed') return task.status === 'completed';
        return true;
      }),
    [filter, tasks],
  );

  return (
    <>
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
          <Text style={typography.eyebrow}>Assigned work</Text>
          <Text style={styles.title}>My tasks</Text>
          <Text style={styles.subtitle}>
            Review priorities, deadlines, and move work forward.
          </Text>
        </View>

        <View style={styles.filters}>
          {FILTERS.map(option => (
            <Pressable
              key={option.value}
              onPress={() => setFilter(option.value)}
              style={[
                styles.filter,
                filter === option.value && styles.filterActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === option.value && styles.filterTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <SectionHeader
          subtitle={`${visibleTasks.length} task${
            visibleTasks.length === 1 ? '' : 's'
          } in this view.`}
          title={filter === 'all' ? 'All assignments' : labelForValue(filter)}
        />

        <Card style={styles.taskList}>
          {visibleTasks.map((task, index) => {
            const overdue =
              task.deadline &&
              task.status !== 'completed' &&
              dueLabel(task.deadline).includes('overdue');
            return (
              <Pressable
                key={task.id}
                onPress={() => onSelectTask(task)}
                style={({ pressed }) => [
                  styles.taskRow,
                  index < visibleTasks.length - 1 && styles.taskRowBorder,
                  pressed && styles.taskRowPressed,
                ]}
              >
                <View
                  style={[
                    styles.taskIcon,
                    task.status === 'completed' && styles.taskIconCompleted,
                  ]}
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 color={colors.positive} size={19} />
                  ) : task.status === 'in_progress' ? (
                    <CircleDot color={colors.brand} size={19} />
                  ) : (
                    <ListChecks color={colors.cyan} size={19} />
                  )}
                </View>
                <View style={styles.taskBody}>
                  <Text numberOfLines={2} style={styles.taskTitle}>
                    {task.title}
                  </Text>
                  <View style={styles.taskMetaLine}>
                    <BriefcaseBusiness color={colors.muted} size={13} />
                    <Text numberOfLines={1} style={styles.taskMeta}>
                      {task.projectName || 'No project'}
                    </Text>
                  </View>
                  <View style={styles.taskFooter}>
                    <StatusBadge value={task.status} />
                    <Text
                      style={[
                        styles.dueText,
                        overdue && styles.dueTextOverdue,
                      ]}
                    >
                      {dueLabel(task.deadline)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
          {!visibleTasks.length && (
            <EmptyState
              icon={CheckCircle2}
              message={
                filter === 'completed'
                  ? 'Completed assignments will collect here.'
                  : 'You have no assignments in this view.'
              }
              title="No matching tasks"
            />
          )}
        </Card>
      </ScrollView>

      <TaskDetailModal
        members={members}
        moduleDefinition={moduleDefinition}
        onClose={onCloseTask}
        onOpenWeb={onOpenWeb}
        onUpdateStatus={onUpdateStatus}
        task={selectedTask}
        updating={updatingTaskId === selectedTask?.id}
      />
    </>
  );
};

export default TasksScreen;

const createStyles = ({ colors, typography }) => StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  content: {
    gap: 18,
    paddingBottom: 110,
    paddingHorizontal: 16,
    paddingTop: 17,
  },
  customLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  customRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: 5,
    paddingVertical: 11,
  },
  customValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  detailAction: { flex: 1 },
  detailActions: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 9,
    padding: 14,
  },
  detailBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  detailContent: {
    gap: 20,
    padding: 18,
    paddingBottom: 28,
  },
  detailCopy: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 9,
  },
  detailEyebrow: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailHeader: {
    alignItems: 'flex-start',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 18,
  },
  detailHeaderText: { flex: 1 },
  detailMetric: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 9,
    padding: 12,
  },
  detailMetricLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  detailMetricValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  detailMetrics: {
    flexDirection: 'row',
    gap: 9,
  },
  detailSection: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 18,
  },
  detailSectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  detailSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
  },
  detailTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginTop: 5,
  },
  dueText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  dueTextOverdue: { color: colors.danger },
  filter: {
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 38,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  filterActive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  filterText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  filterTextActive: { color: colors.brand },
  filters: {
    alignSelf: 'flex-start',
    backgroundColor: colors.neutralSoft,
    borderRadius: 8,
    flexDirection: 'row',
    padding: 3,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(16,24,40,0.42)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  subtitle: {
    ...typography.body,
    marginTop: 6,
  },
  taskBody: { flex: 1 },
  taskFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  taskIcon: {
    alignItems: 'center',
    backgroundColor: colors.cyanSoft,
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  taskIconCompleted: { backgroundColor: colors.positiveSoft },
  taskList: {
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  taskMeta: {
    color: colors.muted,
    flex: 1,
    fontSize: 11,
  },
  taskMetaLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 6,
  },
  taskRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 11,
    paddingVertical: 14,
  },
  taskRowBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  taskRowPressed: { opacity: 0.67 },
  taskTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  title: {
    ...typography.heading,
    marginTop: 4,
  },
  webAction: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
});
