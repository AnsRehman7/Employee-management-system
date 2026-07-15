/**
 * StaffFlow Attendance mobile client.
 * Android-focused React Native app for biometric attendance with office geofencing.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import Config from 'react-native-config';
import ReactNativeBiometrics from 'react-native-biometrics';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const SESSION_STORAGE_KEY = '@staffflow_attendance_session';
const API_BASE_URL = Config.STAFFFLOW_API_URL || 'http://10.0.2.2:4000/api';
const FIREBASE_API_KEY = Config.FIREBASE_WEB_API_KEY || '';
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

const parseConfigNumber = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getOfficeConfig = () => {
  const latitude = parseConfigNumber(Config.OFFICE_LATITUDE);
  const longitude = parseConfigNumber(Config.OFFICE_LONGITUDE);
  const radiusMeters = parseConfigNumber(Config.OFFICE_RADIUS_METERS) || 100;

  if (latitude === null || longitude === null) {
    return null;
  }

  return { latitude, longitude, radiusMeters };
};

const toRadians = degrees => (degrees * Math.PI) / 180;

const calculateDistanceMeters = (origin, target) => {
  const earthRadiusMeters = 6371000;
  const deltaLatitude = toRadians(target.latitude - origin.latitude);
  const deltaLongitude = toRadians(target.longitude - origin.longitude);
  const startLatitude = toRadians(origin.latitude);
  const endLatitude = toRadians(target.latitude);
  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusMeters * c);
};

const formatDistance = meters => {
  if (!Number.isFinite(Number(meters))) {
    return '-';
  }

  if (Number(meters) >= 1000) {
    return `${(Number(meters) / 1000).toFixed(2)} km`;
  }

  return `${Math.round(Number(meters))} m`;
};

const formatDateTime = value => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
};

const mapFirebaseError = message => {
  const messages = {
    EMAIL_NOT_FOUND: 'No StaffFlow login was found for this email.',
    INVALID_EMAIL: 'Enter a valid email address.',
    INVALID_LOGIN_CREDENTIALS: 'Email or password is incorrect.',
    INVALID_PASSWORD: 'Email or password is incorrect.',
    USER_DISABLED: 'This StaffFlow account is disabled.',
  };

  return messages[message] || 'Unable to sign in. Please try again.';
};

const getErrorMessage = error =>
  error?.message || 'Something went wrong. Please try again.';

const requestLocationPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      buttonNegative: 'Not now',
      buttonPositive: 'Allow',
      message:
        'StaffFlow uses your current location only when you mark attendance.',
      title: 'Allow office location check',
    },
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000,
    });
  });

const signInWithFirebase = async ({ email, password }) => {
  if (!FIREBASE_API_KEY) {
    throw new Error('Firebase web API key is missing in the mobile .env file.');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(mapFirebaseError(payload?.error?.message));
  }

  return {
    email: payload.email,
    expiresAt: Date.now() + Number(payload.expiresIn || 3600) * 1000,
    idToken: payload.idToken,
    localId: payload.localId,
    refreshToken: payload.refreshToken,
  };
};

const refreshFirebaseSession = async session => {
  if (!FIREBASE_API_KEY || !session?.refreshToken) {
    throw new Error('Your session expired. Please sign in again.');
  }

  const formBody = `grant_type=refresh_token&refresh_token=${encodeURIComponent(
    session.refreshToken,
  )}`;
  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
    {
      body: formBody,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
    },
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error('Your session expired. Please sign in again.');
  }

  return {
    ...session,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
    idToken: payload.id_token,
    refreshToken: payload.refresh_token || session.refreshToken,
  };
};

const requestStaffFlow = async (session, path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.idToken}`,
      ...(options.headers || {}),
    },
    method: options.method || 'GET',
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'StaffFlow API request failed.');
  }

  return payload.data;
};

const Field = ({
  label,
  onChangeText,
  placeholder,
  secureTextEntry,
  value,
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      secureTextEntry={secureTextEntry}
      style={styles.input}
      value={value}
    />
  </View>
);

const ActionButton = ({
  disabled,
  fill,
  label,
  loading,
  onPress,
  tone = 'primary',
}) => (
  <TouchableOpacity
    activeOpacity={0.82}
    disabled={disabled || loading}
    onPress={onPress}
    style={[
      styles.actionButton,
      tone === 'secondary' ? styles.secondaryButton : styles.primaryButton,
      fill && styles.fillButton,
      (disabled || loading) && styles.disabledButton,
    ]}
  >
    {loading ? (
      <ActivityIndicator color={tone === 'secondary' ? '#0f172a' : '#ffffff'} />
    ) : (
      <Text
        style={
          tone === 'secondary'
            ? styles.secondaryButtonText
            : styles.primaryButtonText
        }
      >
        {label}
      </Text>
    )}
  </TouchableOpacity>
);

const Snackbar = ({ message, tone }) => {
  if (!message) {
    return null;
  }

  return (
    <View
      style={[
        styles.snackbar,
        tone === 'error' && styles.snackbarError,
        tone === 'success' && styles.snackbarSuccess,
        tone !== 'error' && tone !== 'success' && styles.snackbarInfo,
      ]}
    >
      <Text style={styles.snackbarText}>{message}</Text>
    </View>
  );
};

const App = () => {
  const officeConfig = useMemo(() => getOfficeConfig(), []);
  const [email, setEmail] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [lastLocation, setLastLocation] = useState(null);
  const [latestScan, setLatestScan] = useState(null);
  const [password, setPassword] = useState('');
  const [session, setSession] = useState(null);
  const [signingIn, setSigningIn] = useState(false);
  const [snackbar, setSnackbar] = useState({ message: '', tone: 'info' });
  const [submittingDirection, setSubmittingDirection] = useState('');

  const showSnackbar = useCallback((message, tone = 'info') => {
    setSnackbar({ message, tone });
  }, []);

  useEffect(() => {
    if (!snackbar.message) {
      return undefined;
    }

    const timeout = setTimeout(
      () => setSnackbar({ message: '', tone: 'info' }),
      4200,
    );
    return () => clearTimeout(timeout);
  }, [snackbar.message]);

  const saveSession = useCallback(async nextSession => {
    setSession(nextSession);
    await AsyncStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(nextSession),
    );
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
    setLatestScan(null);
    setPassword('');
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const getAuthorizedSession = useCallback(async () => {
    if (!session) {
      throw new Error('Please sign in again.');
    }

    if (Number(session.expiresAt || 0) - Date.now() > TOKEN_REFRESH_BUFFER_MS) {
      return session;
    }

    const refreshed = await refreshFirebaseSession(session);
    await saveSession(refreshed);
    return refreshed;
  }, [saveSession, session]);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const stored = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (!stored) {
          return;
        }

        let restored = JSON.parse(stored);
        if (
          Number(restored.expiresAt || 0) - Date.now() <=
          TOKEN_REFRESH_BUFFER_MS
        ) {
          restored = await refreshFirebaseSession(restored);
        }

        const { user } = await requestStaffFlow(restored, '/auth/me');
        if (active) {
          await saveSession({ ...restored, user });
          setEmail(user.email);
        }
      } catch (error) {
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        if (active) {
          showSnackbar(getErrorMessage(error), 'error');
        }
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
  }, [saveSession, showSnackbar]);

  const handleSignIn = useCallback(async () => {
    if (!email.trim() || !password) {
      showSnackbar('Enter your StaffFlow email and password.', 'error');
      return;
    }

    setSigningIn(true);

    try {
      const firebaseSession = await signInWithFirebase({
        email: email.trim(),
        password,
      });
      const { user } = await requestStaffFlow(firebaseSession, '/auth/me');
      await saveSession({ ...firebaseSession, user });
      showSnackbar('Signed in successfully.', 'success');
    } catch (error) {
      showSnackbar(getErrorMessage(error), 'error');
    } finally {
      setSigningIn(false);
    }
  }, [email, password, saveSession, showSnackbar]);

  const verifyBiometric = useCallback(async direction => {
    const biometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    });
    const sensor = await biometrics.isSensorAvailable();

    if (!sensor.available) {
      throw new Error(
        'Fingerprint or device biometric unlock is not available on this phone.',
      );
    }

    const prompt = await biometrics.simplePrompt({
      cancelButtonText: 'Cancel',
      promptMessage:
        direction === 'in' ? 'Confirm check-in' : 'Confirm check-out',
    });

    if (!prompt.success) {
      throw new Error('Fingerprint confirmation was cancelled.');
    }
  }, []);

  const handleAttendance = useCallback(
    async direction => {
      if (!officeConfig) {
        showSnackbar(
          'Office latitude and longitude are missing in the mobile .env file.',
          'error',
        );
        return;
      }

      setSubmittingDirection(direction);

      try {
        const allowed = await requestLocationPermission();
        if (!allowed) {
          throw new Error(
            'Location permission is required to mark attendance.',
          );
        }

        const position = await getCurrentLocation();
        const currentLocation = {
          accuracy: position.coords.accuracy,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        const distanceMeters = calculateDistanceMeters(
          officeConfig,
          currentLocation,
        );
        setLastLocation({ ...currentLocation, distanceMeters });

        if (distanceMeters > officeConfig.radiusMeters) {
          throw new Error(
            `You are ${formatDistance(
              distanceMeters,
            )} from office. Attendance is allowed within ${formatDistance(
              officeConfig.radiusMeters,
            )}.`,
          );
        }

        await verifyBiometric(direction);
        const activeSession = await getAuthorizedSession();
        const { scan } = await requestStaffFlow(
          activeSession,
          '/attendance/scans',
          {
            body: {
              accuracyMeters: currentLocation.accuracy,
              direction,
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              source: 'mobile_fingerprint',
            },
            method: 'POST',
          },
        );

        setLatestScan(scan);
        showSnackbar(
          scan.accepted === false
            ? scan.rejectionReason ||
                'Attendance scan was recorded but rejected.'
            : `${
                direction === 'in' ? 'Check-in' : 'Check-out'
              } saved in StaffFlow.`,
          scan.accepted === false ? 'error' : 'success',
        );
      } catch (error) {
        showSnackbar(getErrorMessage(error), 'error');
      } finally {
        setSubmittingDirection('');
      }
    },
    [getAuthorizedSession, officeConfig, showSnackbar, verifyBiometric],
  );

  if (initializing) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <SafeAreaView style={styles.centeredScreen}>
          <ActivityIndicator color="#059669" size="large" />
          <Text style={styles.loadingText}>Opening StaffFlow Attendance</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SafeAreaView style={styles.screen}>
        {!session ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
          >
            <ScrollView
              contentContainerStyle={styles.loginContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>SF</Text>
              </View>
              <Text style={styles.brandTitle}>StaffFlow Attendance</Text>
              <Text style={styles.brandSubtitle}>
                Use your company account to mark office check-in and check-out.
              </Text>

              <View style={styles.card}>
                <Field
                  label="Email"
                  onChangeText={setEmail}
                  placeholder="name@company.com"
                  value={email}
                />
                <Field
                  label="Password"
                  onChangeText={setPassword}
                  placeholder="Your StaffFlow password"
                  secureTextEntry
                  value={password}
                />
                <ActionButton
                  label="Sign in"
                  loading={signingIn}
                  onPress={handleSignIn}
                />
                <Text style={styles.helperText}>
                  Forgot password is handled from the StaffFlow web login for
                  now.
                </Text>
              </View>

              <View style={styles.configPanel}>
                <Text style={styles.configTitle}>Connection</Text>
                <Text style={styles.configLine}>{API_BASE_URL}</Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          <ScrollView contentContainerStyle={styles.homeContent}>
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {session.user?.name?.slice(0, 1)?.toUpperCase() || 'S'}
                </Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.userName}>
                  {session.user?.name || session.email}
                </Text>
                <Text style={styles.userMeta}>
                  {session.user?.designation ||
                    session.user?.role ||
                    'Team member'}{' '}
                  - {session.user?.organization?.name || 'StaffFlow'}
                </Text>
              </View>
              <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
                <Text style={styles.signOutText}>Sign out</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.attendanceCard}>
              <Text style={styles.sectionEyebrow}>Attendance</Text>
              <Text style={styles.sectionTitle}>Fingerprint check</Text>
              <Text style={styles.sectionCopy}>
                Location is checked first. If you are inside the office radius,
                Android biometric confirmation will open.
              </Text>

              <View style={styles.actionGrid}>
                <ActionButton
                  fill
                  label="Check in"
                  loading={submittingDirection === 'in'}
                  onPress={() => handleAttendance('in')}
                />
                <ActionButton
                  fill
                  label="Check out"
                  loading={submittingDirection === 'out'}
                  onPress={() => handleAttendance('out')}
                  tone="secondary"
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Office geofence</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Allowed radius</Text>
                <Text style={styles.metricValue}>
                  {officeConfig
                    ? formatDistance(officeConfig.radiusMeters)
                    : 'Not configured'}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Last distance</Text>
                <Text style={styles.metricValue}>
                  {lastLocation
                    ? formatDistance(lastLocation.distanceMeters)
                    : '-'}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>GPS accuracy</Text>
                <Text style={styles.metricValue}>
                  {lastLocation ? formatDistance(lastLocation.accuracy) : '-'}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionEyebrow}>Latest scan</Text>
              <Text style={styles.latestTitle}>
                {latestScan
                  ? latestScan.direction === 'in'
                    ? 'Check-in recorded'
                    : 'Check-out recorded'
                  : 'No mobile scan yet'}
              </Text>
              <Text style={styles.latestMeta}>
                {latestScan
                  ? `${formatDateTime(latestScan.scannedAt)} - ${
                      latestScan.accepted === false ? 'Rejected' : 'Accepted'
                    }`
                  : 'Your next successful scan will appear here.'}
              </Text>
              {!!latestScan?.distanceMeters && (
                <Text style={styles.latestMeta}>
                  Distance: {formatDistance(latestScan.distanceMeters)} from
                  office
                </Text>
              )}
            </View>
          </ScrollView>
        )}
        <Snackbar message={snackbar.message} tone={snackbar.tone} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  attendanceCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    marginTop: 20,
    padding: 22,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 18,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: '#047857',
    fontSize: 18,
    fontWeight: '900',
  },
  brandMark: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 18,
    height: 58,
    justifyContent: 'center',
    marginBottom: 18,
    width: 58,
  },
  brandMarkText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: '#64748b',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  brandTitle: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 18,
    padding: 18,
  },
  centeredScreen: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    flex: 1,
    justifyContent: 'center',
  },
  configLine: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  configPanel: {
    backgroundColor: '#ecfeff',
    borderColor: '#bae6fd',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 18,
    padding: 14,
  },
  configTitle: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  disabledButton: {
    opacity: 0.62,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  flex: {
    flex: 1,
  },
  fillButton: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  helperText: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
    textAlign: 'center',
  },
  homeContent: {
    padding: 20,
    paddingBottom: 42,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  latestMeta: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  latestTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },
  loadingText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 16,
  },
  loginContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  metricRow: {
    alignItems: 'center',
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  metricValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900',
  },
  primaryButton: {
    backgroundColor: '#059669',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  screen: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900',
  },
  sectionCopy: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  sectionEyebrow: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 8,
  },
  signOutButton: {
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  signOutText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '900',
  },
  snackbar: {
    borderRadius: 12,
    bottom: 18,
    left: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
    position: 'absolute',
    right: 18,
  },
  snackbarError: {
    backgroundColor: '#be123c',
  },
  snackbarInfo: {
    backgroundColor: '#0369a1',
  },
  snackbarSuccess: {
    backgroundColor: '#047857',
  },
  snackbarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  userMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  userName: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
});

export default App;
