import Config from 'react-native-config';

const normalizeUrl = value => String(value || '').trim().replace(/\/+$/, '');

export const environment = Object.freeze({
  apiBaseUrl: normalizeUrl(
    Config.STAFFFLOW_API_URL || 'https://ems-backend-lemon.vercel.app/api',
  ),
  firebaseWebApiKey: String(Config.FIREBASE_WEB_API_KEY || '').trim(),
  webBaseUrl: normalizeUrl(
    Config.STAFFFLOW_WEB_URL || 'https://ahsanfyp.netlify.app',
  ),
});

export const getConfigurationIssue = () => {
  if (!environment.firebaseWebApiKey) {
    return 'Firebase authentication is not configured for this build.';
  }
  if (!environment.apiBaseUrl.startsWith('https://')) {
    return 'The production API must use a secure HTTPS URL.';
  }
  return '';
};
