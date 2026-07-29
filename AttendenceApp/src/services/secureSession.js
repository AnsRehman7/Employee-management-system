import * as Keychain from 'react-native-keychain';

const SESSION_SERVICE = 'com.staffflow.mobile.session';

export const saveSecureSession = async session => {
  await Keychain.setGenericPassword('staffflow', JSON.stringify(session), {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    service: SESSION_SERVICE,
  });
  return session;
};

export const loadSecureSession = async () => {
  const credentials = await Keychain.getGenericPassword({
    service: SESSION_SERVICE,
  });
  if (!credentials) return null;

  try {
    return JSON.parse(credentials.password);
  } catch {
    await clearSecureSession();
    return null;
  }
};

export const clearSecureSession = () =>
  Keychain.resetGenericPassword({ service: SESSION_SERVICE });
