import React from 'react';
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
  CheckCheck,
  CheckCircle2,
  CircleAlert,
  FolderKanban,
  ListChecks,
} from 'lucide-react-native';
import {
  Card,
  EmptyState,
  PrimaryButton,
  SectionHeader,
} from '../components/ui';
import { colors, typography } from '../theme';
import { formatDateTime } from '../utils/formatters';

const iconForNotification = notification => {
  const type = String(notification.type || '').toUpperCase();
  if (type.includes('TASK')) return ListChecks;
  if (type.includes('PROJECT')) return FolderKanban;
  if (type.includes('COMPLETED')) return CheckCircle2;
  return CircleAlert;
};

const InboxScreen = ({
  notifications,
  onMarkAllRead,
  onOpenNotification,
  onRefresh,
  refreshing,
  unreadCount,
}) => (
  <ScrollView
    contentContainerStyle={styles.content}
    refreshControl={
      <RefreshControl
        colors={[colors.violet]}
        onRefresh={onRefresh}
        refreshing={refreshing}
        tintColor={colors.violet}
      />
    }
    showsVerticalScrollIndicator={false}
  >
    <View>
      <Text style={typography.eyebrow}>Workspace updates</Text>
      <Text style={styles.title}>Inbox</Text>
      <Text style={styles.subtitle}>
        Assignments, project changes, and completion updates in one place.
      </Text>
    </View>

    <SectionHeader
      action={
        unreadCount > 0 ? (
          <PrimaryButton
            icon={CheckCheck}
            label="Read all"
            onPress={onMarkAllRead}
            style={styles.readAllButton}
            tone="secondary"
          />
        ) : null
      }
      subtitle={`${unreadCount} unread update${unreadCount === 1 ? '' : 's'}.`}
      title="Recent activity"
    />

    <Card style={styles.notificationList}>
      {notifications.map((notification, index) => {
        const Icon = iconForNotification(notification);
        return (
          <Pressable
            key={notification.id}
            onPress={() => onOpenNotification(notification)}
            style={({ pressed }) => [
              styles.notification,
              !notification.isRead && styles.notificationUnread,
              index < notifications.length - 1 &&
                styles.notificationBorder,
              pressed && styles.notificationPressed,
            ]}
          >
            <View
              style={[
                styles.notificationIcon,
                !notification.isRead && styles.notificationIconUnread,
              ]}
            >
              <Icon
                color={
                  notification.isRead ? colors.muted : colors.violet
                }
                size={19}
              />
            </View>
            <View style={styles.notificationBody}>
              <View style={styles.notificationTitleRow}>
                <Text numberOfLines={1} style={styles.notificationTitle}>
                  {notification.title}
                </Text>
                {!notification.isRead && <View style={styles.unreadDot} />}
              </View>
              <Text numberOfLines={2} style={styles.notificationMessage}>
                {notification.message}
              </Text>
              <Text style={styles.notificationMeta}>
                {notification.actorName} /{' '}
                {formatDateTime(notification.createdAt)}
              </Text>
            </View>
          </Pressable>
        );
      })}
      {!notifications.length && (
        <EmptyState
          icon={Bell}
          message="Task and project updates will appear here."
          title="Your inbox is clear"
        />
      )}
    </Card>
  </ScrollView>
);

export default InboxScreen;

const styles = StyleSheet.create({
  content: {
    gap: 18,
    paddingBottom: 110,
    paddingHorizontal: 16,
    paddingTop: 17,
  },
  notification: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  notificationBody: { flex: 1 },
  notificationBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  notificationIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  notificationIconUnread: { backgroundColor: colors.violetSoft },
  notificationList: {
    overflow: 'hidden',
    padding: 0,
  },
  notificationMessage: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  notificationMeta: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 7,
  },
  notificationPressed: { opacity: 0.66 },
  notificationTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  notificationTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  notificationUnread: {
    backgroundColor: '#FCFAFF',
  },
  readAllButton: {
    minHeight: 38,
    paddingHorizontal: 11,
  },
  subtitle: {
    ...typography.body,
    marginTop: 6,
  },
  title: {
    ...typography.heading,
    marginTop: 4,
  },
  unreadDot: {
    backgroundColor: colors.violet,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
});
