import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  AppState,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import ReactNativeBiometrics from 'react-native-biometrics';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Fingerprint,
  Home,
  ListChecks,
  UserRound,
} from 'lucide-react-native';
import {
  prepareFieldDefaults,
  validateRequiredFields,
} from './components/DynamicFields';
import { LoadingState, Snackbar } from './components/ui';
import { environment, getConfigurationIssue } from './config';
import AttendanceScreen from './screens/AttendanceScreen';
import HomeScreen from './screens/HomeScreen';
import InboxScreen from './screens/InboxScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import TasksScreen from './screens/TasksScreen';
import {
  refreshFirebaseSession,
  signInWithCustomToken,
} from './services/firebaseAuth';
import {
  requestSignInCode,
  requestStaffFlow,
  verifySignInCode,
} from './services/staffflowApi';
import {
  clearSecureSession,
  loadSecureSession,
  saveSecureSession,
} from './services/secureSession';
import { useAppTheme, useThemedStyles } from './ThemeContext';
import { todayKey } from './utils/formatters';
import {
  calculateDistanceMeters,
  formatDistance,
} from './utils/geofence';

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const NOTIFICATION_POLL_MS = 30000;
const LOCATION_TIMEOUT_MS = 60000;
const ATTENDANCE_REQUEST_TIMEOUT_MS = 120000;

Geolocation.setRNConfiguration({
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
  skipPermissionRequests: Platform.OS === 'android',
});

const EMPTY_WORKSPACE = {
  attendanceModule: null,
  employees: [],
  notifications: [],
  scans: [],
  taskModule: null,
  tasks: [],
  unreadCount: 0,
};

const TABS = [
  { icon: Home, label: 'Home', value: 'home' },
  { icon: Fingerprint, label: 'Attendance', value: 'attendance' },
  { icon: ListChecks, label: 'Tasks', value: 'tasks' },
  { icon: Bell, label: 'Inbox', value: 'inbox' },
  { icon: UserRound, label: 'Profile', value: 'profile' },
];

const getErrorMessage = error =>
  error?.message || 'Something went wrong. Please try again.';

const resolveLocationAgainstOffices = (location, offices = []) => {
  const nearest = offices
    .map(office => ({
      distanceMeters: calculateDistanceMeters(office, location),
      office,
    }))
    .sort((first, second) => first.distanceMeters - second.distanceMeters)[0];
  return {
    ...location,
    distanceMeters: nearest?.distanceMeters ?? null,
    office: nearest?.office || null,
  };
};

const requestLocationPermission = async () => {
  if (Platform.OS !== 'android') return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      buttonNegative: 'Not now',
      buttonPositive: 'Allow',
      message:
        'DayMark checks your current location only when you use mobile attendance.',
      title: 'Allow office location check',
    },
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: LOCATION_TIMEOUT_MS,
    });
  });

const openLocationSettings = async () => {
  if (Platform.OS !== 'android') {
    await Linking.openSettings();
    return;
  }

  try {
    await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
  } catch {
    await Linking.openSettings();
  }
};

const BottomNavigation = ({ activeTab, onChange, unreadCount }) => {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
  <View style={styles.bottomNavigation}>
    {TABS.map(tab => {
      const Icon = tab.icon;
      const active = tab.value === activeTab;
      return (
        <Pressable
          accessibilityLabel={`Open ${tab.label}`}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
          key={tab.value}
          onPress={() => onChange(tab.value)}
          style={({ pressed }) => [
            styles.tab,
            pressed && styles.tabPressed,
          ]}
        >
          <View style={styles.tabIcon}>
            <Icon
              color={active ? colors.brand : colors.muted}
              size={20}
              strokeWidth={active ? 2.4 : 2}
            />
            {tab.value === 'inbox' && unreadCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
            {tab.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
  );
};

const StaffFlowApp = () => {
  const { colors, isDark } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [activeTab, setActiveTab] = useState('home');
  const [attendanceOffices, setAttendanceOffices] = useState([]);
  const [attendanceCustomFields, setAttendanceCustomFields] = useState({});
  const [email, setEmail] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [lastLocation, setLastLocation] = useState(null);
  const [notice, setNotice] = useState({ message: '', tone: 'info' });
  const [signInStep, setSignInStep] = useState('email');
  const [signInCode, setSignInCode] = useState('');
  const [resendAfter, setResendAfter] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [session, setSession] = useState(null);
  const [signingIn, setSigningIn] = useState(false);
  const [submittingDirection, setSubmittingDirection] = useState('');
  const [updatingTaskId, setUpdatingTaskId] = useState('');
  const [workspace, setWorkspace] = useState(EMPTY_WORKSPACE);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const configurationIssue = getConfigurationIssue();

  const showNotice = useCallback((message, tone = 'info') => {
    setNotice({ message, tone });
  }, []);

  useEffect(() => {
    if (!notice.message) return undefined;
    const timer = setTimeout(
      () => setNotice({ message: '', tone: 'info' }),
      4500,
    );
    return () => clearTimeout(timer);
  }, [notice.message]);

  const saveSession = useCallback(async nextSession => {
    setSession(nextSession);
    await saveSecureSession(nextSession);
    return nextSession;
  }, []);

  const clearSession = useCallback(async () => {
    setSession(null);
    setWorkspace(EMPTY_WORKSPACE);
    setWorkspaceReady(false);
    setAttendanceOffices([]);
    setAttendanceCustomFields({});
    setSelectedTask(null);
    setActiveTab('home');
    setSignInStep('email');
    setSignInCode('');
    await clearSecureSession();
  }, []);

  const getAuthorizedSession = useCallback(
    async sourceSession => {
      const currentSession = sourceSession || session;
      if (!currentSession) throw new Error('Please sign in again.');
      if (
        Number(currentSession.expiresAt || 0) - Date.now() >
        TOKEN_REFRESH_BUFFER_MS
      ) {
        return currentSession;
      }
      const refreshed = await refreshFirebaseSession(currentSession);
      return saveSession(refreshed);
    },
    [saveSession, session],
  );

  const handleRequestError = useCallback(
    async error => {
      if (error?.status === 401) {
        await clearSession();
        throw new Error('Your session expired. Please sign in again.');
      }
      throw error;
    },
    [clearSession],
  );

  const authorizedRequest = useCallback(
    async (path, options) => {
      try {
        const activeSession = await getAuthorizedSession();
        return await requestStaffFlow(activeSession, path, options);
      } catch (error) {
        return handleRequestError(error);
      }
    },
    [getAuthorizedSession, handleRequestError],
  );

  const loadWorkspace = useCallback(
    async ({ sourceSession, silent = false } = {}) => {
      if (!silent) setRefreshing(true);
      try {
        const activeSession = await getAuthorizedSession(sourceSession);
        const optionalRequest = (path, fallback) =>
          requestStaffFlow(activeSession, path).catch(error => {
            if (error?.status === 401) throw error;
            return fallback;
          });
        const [
          taskData,
          attendanceData,
          notificationData,
          employeeData,
          taskModuleData,
          attendanceModuleData,
          officeData,
        ] = await Promise.all([
          requestStaffFlow(activeSession, '/tasks'),
          requestStaffFlow(
            activeSession,
            `/attendance/scans?date=${todayKey()}`,
          ),
          requestStaffFlow(activeSession, '/notifications'),
          optionalRequest('/users/employees', { employees: [] }),
          optionalRequest('/modules/tasks', { module: null }),
          optionalRequest('/modules/attendance', { module: null }),
          optionalRequest('/attendance/offices', { offices: [] }),
        ]);

        const currentUserId = activeSession.user?.id;
        const tasks = (taskData.tasks || []).filter(
          task => !currentUserId || task.assignedToId === currentUserId,
        );
        const scans = (attendanceData.scans || []).filter(
          scan => !currentUserId || scan.userId === currentUserId,
        );

        setWorkspace({
          attendanceModule: attendanceModuleData.module,
          employees: employeeData.employees || [],
          notifications: notificationData.notifications || [],
          scans,
          taskModule: taskModuleData.module,
          tasks,
          unreadCount: notificationData.unreadCount || 0,
        });
        setAttendanceOffices(officeData.offices || []);
        setAttendanceCustomFields(current =>
          prepareFieldDefaults(
            attendanceModuleData.module?.fields || [],
            current,
          ),
        );
        setSelectedTask(current =>
          current ? tasks.find(task => task.id === current.id) || null : null,
        );
        setWorkspaceReady(true);
      } catch (error) {
        try {
          await handleRequestError(error);
        } catch (handledError) {
          showNotice(getErrorMessage(handledError), 'error');
        }
      } finally {
        if (!silent) setRefreshing(false);
      }
    },
    [getAuthorizedSession, handleRequestError, showNotice],
  );

  const loadNotifications = useCallback(async () => {
    if (!session) return;
    try {
      const data = await authorizedRequest('/notifications');
      setWorkspace(current => ({
        ...current,
        notifications: data.notifications || [],
        unreadCount: data.unreadCount || 0,
      }));
    } catch {
      // Full-screen refresh handles persistent connectivity errors.
    }
  }, [authorizedRequest, session]);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        let restored = await loadSecureSession();
        if (!restored) return;
        if (
          Number(restored.expiresAt || 0) - Date.now() <=
          TOKEN_REFRESH_BUFFER_MS
        ) {
          restored = await refreshFirebaseSession(restored);
        }
        const { user } = await requestStaffFlow(restored, '/auth/me');
        if (!active) return;
        const nextSession = await saveSession({ ...restored, user });
        setEmail(user.email);
        await loadWorkspace({ silent: true, sourceSession: nextSession });
      } catch (error) {
        await clearSecureSession();
        if (active) showNotice(getErrorMessage(error), 'error');
      } finally {
        if (active) setInitializing(false);
      }
    };

    restore();
    return () => {
      active = false;
    };
  }, [loadWorkspace, saveSession, showNotice]);

  useEffect(() => {
    if (!session) return undefined;
    const poll = setInterval(loadNotifications, NOTIFICATION_POLL_MS);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') loadWorkspace({ silent: true });
    });
    return () => {
      clearInterval(poll);
      subscription.remove();
    };
  }, [loadNotifications, loadWorkspace, session]);

  const handleRequestCode = useCallback(async () => {
    if (!email.trim()) {
      showNotice('Enter your DayMark email.', 'error');
      return;
    }
    if (configurationIssue) {
      showNotice(configurationIssue, 'error');
      return;
    }

    setSigningIn(true);
    try {
      const result = await requestSignInCode(email.trim().toLowerCase());
      setSignInStep('code');
      setSignInCode('');
      setResendAfter(result?.resendAfterSeconds || 60);
      showNotice('If the account exists, a 6-digit code is on its way.', 'success');
    } catch (error) {
      showNotice(getErrorMessage(error), 'error');
    } finally {
      setSigningIn(false);
      setInitializing(false);
    }
  }, [configurationIssue, email, showNotice]);

  const handleVerifyCode = useCallback(async () => {
    if (signInCode.trim().length !== 6) {
      showNotice('Enter the 6-digit code from your email.', 'error');
      return;
    }

    setSigningIn(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { customToken } = await verifySignInCode({
        code: signInCode.trim(),
        email: normalizedEmail,
      });
      const firebaseSession = await signInWithCustomToken({
        customToken,
        email: normalizedEmail,
      });
      const { user } = await requestStaffFlow(firebaseSession, '/auth/me');
      const nextSession = await saveSession({ ...firebaseSession, user });
      setSignInCode('');
      setSignInStep('email');
      await loadWorkspace({ sourceSession: nextSession });
      showNotice('Welcome back to DayMark.', 'success');
    } catch (error) {
      setSignInCode('');
      showNotice(getErrorMessage(error), 'error');
    } finally {
      setSigningIn(false);
      setInitializing(false);
    }
  }, [email, loadWorkspace, saveSession, showNotice, signInCode]);

  const openWeb = useCallback(
    async path => {
      try {
        const url = `${environment.webBaseUrl}${path}`;
        const supported = await Linking.canOpenURL(url);
        if (!supported) {
          throw new Error('The DayMark web link is unavailable.');
        }
        await Linking.openURL(url);
      } catch (error) {
        showNotice(getErrorMessage(error), 'error');
      }
    },
    [showNotice],
  );

  const locateUser = useCallback(async (offices = attendanceOffices) => {
    const allowed = await requestLocationPermission();
    if (!allowed) {
      throw new Error('Location permission is required for attendance.');
    }
    let position;
    try {
      position = await getCurrentLocation();
    } catch (error) {
      if (
        Platform.OS === 'android' &&
        (error?.code === 2 ||
          /location provider|location not available/i.test(
            error?.message || '',
          ))
      ) {
        await openLocationSettings();
        throw new Error(
          'Turn on Location, return to DayMark, then check in again.',
        );
      }
      if (error?.code === 3 || /timed? ?out/i.test(error?.message || '')) {
        throw new Error(
          'Location took too long. Move near a window, keep Location enabled, and try again.',
        );
      }
      throw error;
    }
    const currentLocation = resolveLocationAgainstOffices({
      accuracy: Number(position.coords.accuracy || 0),
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }, offices);
    const result = currentLocation;
    setLastLocation(result);
    return result;
  }, [attendanceOffices]);

  const handleLocate = useCallback(async () => {
    setSubmittingDirection('locate');
    try {
      const [officeData, rawLocation] = await Promise.all([
        attendanceOffices.length
          ? Promise.resolve({ offices: attendanceOffices })
          : authorizedRequest('/attendance/offices'),
        locateUser([]),
      ]);
      const offices = officeData.offices || [];
      setAttendanceOffices(offices);
      const location = resolveLocationAgainstOffices(rawLocation, offices);
      setLastLocation(location);
      if (!location.office) {
        throw new Error('No active attendance office is configured.');
      }
      const inside =
        location.distanceMeters <= location.office.radiusMeters;
      showNotice(
        inside
          ? `You are inside the office boundary at ${formatDistance(
              location.distanceMeters,
            )}.`
          : `You are ${formatDistance(
              location.distanceMeters,
            )} from the office.`,
        inside ? 'success' : 'error',
      );
    } catch (error) {
      showNotice(getErrorMessage(error), 'error');
    } finally {
      setSubmittingDirection('');
    }
  }, [attendanceOffices, authorizedRequest, locateUser, showNotice]);

  const verifyBiometric = useCallback(async direction => {
    const biometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    });
    const sensor = await biometrics.isSensorAvailable();
    if (!sensor.available) {
      throw new Error(
        'Fingerprint, face unlock, or device credentials are unavailable.',
      );
    }
    const prompt = await biometrics.simplePrompt({
      cancelButtonText: 'Cancel',
      promptMessage:
        direction === 'in' ? 'Confirm check-in' : 'Confirm check-out',
    });
    if (!prompt.success) {
      throw new Error('Biometric confirmation was cancelled.');
    }
  }, []);

  const handleAttendance = useCallback(
    async direction => {
      const requiredError = validateRequiredFields(
        workspace.attendanceModule?.fields || [],
        attendanceCustomFields,
      );
      if (requiredError) {
        showNotice(requiredError, 'error');
        return;
      }

      setSubmittingDirection(direction);
      try {
        const rawLocation = await locateUser([]);
        await verifyBiometric(direction);
        const { challenge } = await authorizedRequest(
          '/attendance/challenge',
          { method: 'POST' },
        );
        const offices = challenge.offices || [];
        setAttendanceOffices(offices);
        const location = resolveLocationAgainstOffices(rawLocation, offices);
        setLastLocation(location);
        const { scan } = await authorizedRequest('/attendance/scans', {
          body: {
            accuracyMeters: location.accuracy,
            challengeToken: challenge.token,
            customFields: attendanceCustomFields,
            direction,
            latitude: location.latitude,
            longitude: location.longitude,
            source: 'mobile_biometric',
          },
          method: 'POST',
          retries: 1,
          timeout: ATTENDANCE_REQUEST_TIMEOUT_MS,
        });
        setWorkspace(current => ({
          ...current,
          scans: [...current.scans, scan].sort(
            (first, second) =>
              new Date(first.scannedAt).getTime() -
              new Date(second.scannedAt).getTime(),
          ),
        }));
        setAttendanceCustomFields(
          prepareFieldDefaults(
            workspace.attendanceModule?.fields || [],
            {},
          ),
        );
        showNotice(
          scan.accepted === false
            ? scan.rejectionReason || 'Attendance was rejected.'
            : `${direction === 'in' ? 'Check-in' : 'Check-out'} ${scan.replayed ? 'confirmed' : 'recorded'}.`,
          scan.accepted === false ? 'error' : 'success',
        );
      } catch (error) {
        showNotice(getErrorMessage(error), 'error');
      } finally {
        setSubmittingDirection('');
      }
    },
    [
      attendanceCustomFields,
      authorizedRequest,
      locateUser,
      showNotice,
      verifyBiometric,
      workspace.attendanceModule?.fields,
    ],
  );

  const handleUpdateTask = useCallback(
    async (task, status) => {
      setUpdatingTaskId(task.id);
      try {
        const { task: updatedTask } = await authorizedRequest(
          `/tasks/${task.id}/status`,
          {
            body: { status },
            method: 'PATCH',
          },
        );
        setWorkspace(current => ({
          ...current,
          tasks: current.tasks.map(item =>
            item.id === updatedTask.id ? updatedTask : item,
          ),
        }));
        setSelectedTask(updatedTask);
        showNotice(`Task moved to ${status.replaceAll('_', ' ')}.`, 'success');
        loadNotifications();
      } catch (error) {
        showNotice(getErrorMessage(error), 'error');
      } finally {
        setUpdatingTaskId('');
      }
    },
    [authorizedRequest, loadNotifications, showNotice],
  );

  const markNotificationRead = useCallback(
    async notification => {
      if (!notification.isRead) {
        try {
          await authorizedRequest(`/notifications/${notification.id}/read`, {
            method: 'PATCH',
          });
          setWorkspace(current => ({
            ...current,
            notifications: current.notifications.map(item =>
              item.id === notification.id
                ? { ...item, isRead: true }
                : item,
            ),
            unreadCount: Math.max(0, current.unreadCount - 1),
          }));
        } catch (error) {
          showNotice(getErrorMessage(error), 'error');
          return;
        }
      }

      if (
        notification.entityType === 'task' ||
        notification.actionUrl?.startsWith('/tasks')
      ) {
        const task = workspace.tasks.find(
          item => item.id === notification.entityId,
        );
        if (task) {
          setSelectedTask(task);
          setActiveTab('tasks');
          return;
        }
      }
      if (notification.actionUrl) {
        await openWeb(notification.actionUrl);
      }
    },
    [authorizedRequest, openWeb, showNotice, workspace.tasks],
  );

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await authorizedRequest('/notifications/read-all', { method: 'PATCH' });
      setWorkspace(current => ({
        ...current,
        notifications: current.notifications.map(item => ({
          ...item,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      showNotice(getErrorMessage(error), 'error');
    }
  }, [authorizedRequest, showNotice]);

  const requestSignOut = useCallback(() => {
    Alert.alert(
      'Sign out of DayMark?',
      'You will need your company credentials to sign in again.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: clearSession,
          style: 'destructive',
          text: 'Sign out',
        },
      ],
    );
  }, [clearSession]);

  const handleTabChange = useCallback(tab => {
    setActiveTab(tab);
    if (tab !== 'tasks') setSelectedTask(null);
  }, []);

  const selectedScreen = useMemo(() => {
    const commonRefresh = {
      onRefresh: () => loadWorkspace(),
      refreshing,
    };
    if (activeTab === 'attendance') {
      return (
        <AttendanceScreen
          customFields={attendanceCustomFields}
          employees={workspace.employees}
          lastLocation={lastLocation}
          moduleDefinition={workspace.attendanceModule}
          office={lastLocation?.office || attendanceOffices[0] || null}
          onCustomFieldsChange={setAttendanceCustomFields}
          onLocate={handleLocate}
          onMark={handleAttendance}
          scans={workspace.scans}
          submittingDirection={submittingDirection}
          {...commonRefresh}
        />
      );
    }
    if (activeTab === 'tasks') {
      return (
        <TasksScreen
          members={workspace.employees}
          moduleDefinition={workspace.taskModule}
          onCloseTask={() => setSelectedTask(null)}
          onOpenWeb={task => openWeb(`/tasks/${task.id}`)}
          onSelectTask={setSelectedTask}
          onUpdateStatus={handleUpdateTask}
          selectedTask={selectedTask}
          tasks={workspace.tasks}
          updatingTaskId={updatingTaskId}
          {...commonRefresh}
        />
      );
    }
    if (activeTab === 'inbox') {
      return (
        <InboxScreen
          notifications={workspace.notifications}
          onMarkAllRead={markAllNotificationsRead}
          onOpenNotification={markNotificationRead}
          unreadCount={workspace.unreadCount}
          {...commonRefresh}
        />
      );
    }
    if (activeTab === 'profile') {
      return (
        <ProfileScreen
          configurationIssue={configurationIssue}
          officeConfigured={attendanceOffices.length > 0}
          onOpenProfile={() => openWeb('/profile')}
          onOpenSettings={() => openWeb('/settings')}
          onSignOut={requestSignOut}
          user={session?.user}
        />
      );
    }
    return (
      <HomeScreen
        onOpenInbox={() => setActiveTab('inbox')}
        onOpenTab={setActiveTab}
        onSelectTask={task => {
          setSelectedTask(task);
          setActiveTab('tasks');
        }}
        scans={workspace.scans}
        tasks={workspace.tasks}
        unreadCount={workspace.unreadCount}
        user={session?.user}
        {...commonRefresh}
      />
    );
  }, [
    activeTab,
    attendanceCustomFields,
    attendanceOffices,
    configurationIssue,
    handleAttendance,
    handleLocate,
    handleUpdateTask,
    lastLocation,
    loadWorkspace,
    markAllNotificationsRead,
    markNotificationRead,
    openWeb,
    refreshing,
    requestSignOut,
    selectedTask,
    session?.user,
    submittingDirection,
    updatingTaskId,
    workspace,
  ]);

  if (initializing) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.canvas} />
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <LoadingState label="Opening DayMark" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.canvas} />
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <LoginScreen
            code={signInCode}
            configurationIssue={configurationIssue}
            email={email}
            loading={signingIn}
            onCodeChange={setSignInCode}
            onEmailChange={setEmail}
            onOpenWorkspace={() => openWeb('/login')}
            onRequestCode={handleRequestCode}
            onRestart={() => {
              setSignInStep('email');
              setSignInCode('');
            }}
            onVerifyCode={handleVerifyCode}
            resendAfter={resendAfter}
            step={signInStep}
          />
          <Snackbar message={notice.message} tone={notice.tone} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.canvas} />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.screen}>
          {workspaceReady ? (
            selectedScreen
          ) : (
            <LoadingState label="Loading your workspace" />
          )}
        </View>
        <BottomNavigation
          activeTab={activeTab}
          onChange={handleTabChange}
          unreadCount={workspace.unreadCount}
        />
        <Snackbar message={notice.message} tone={notice.tone} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const createStyles = ({ colors }) => StyleSheet.create({
  bottomNavigation: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    minHeight: 68,
    paddingHorizontal: 4,
    paddingTop: 5,
  },
  safeArea: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    minWidth: 0,
    paddingBottom: 6,
  },
  tabBadge: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderColor: colors.surface,
    borderRadius: 8,
    borderWidth: 2,
    height: 17,
    justifyContent: 'center',
    minWidth: 17,
    paddingHorizontal: 2,
    position: 'absolute',
    right: -8,
    top: -6,
  },
  tabBadgeText: {
    color: colors.white,
    fontSize: 7,
    fontWeight: '900',
  },
  tabIcon: { position: 'relative' },
  tabLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
  },
  tabLabelActive: { color: colors.brand },
  tabPressed: { opacity: 0.6 },
});

export default StaffFlowApp;
