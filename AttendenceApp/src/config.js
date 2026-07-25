import Config from 'react-native-config';

const normalizeUrl = value => String(value || '').trim().replace(/\/+$/, '');

const parseNumber = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const latitude = parseNumber(Config.OFFICE_LATITUDE);
const longitude = parseNumber(Config.OFFICE_LONGITUDE);
const radiusMeters = parseNumber(Config.OFFICE_RADIUS_METERS);

export const environment = Object.freeze({
  apiBaseUrl: normalizeUrl(
    Config.STAFFFLOW_API_URL || 'https://ems-backend-lemon.vercel.app/api',
  ),
  firebaseWebApiKey: String(Config.FIREBASE_WEB_API_KEY || '').trim(),
  office:
    latitude !== null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude !== null &&
    longitude >= -180 &&
    longitude <= 180
      ? {
          latitude,
          longitude,
          radiusMeters:
            radiusMeters !== null && radiusMeters > 0 ? radiusMeters : 100,
        }
      : null,
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
  if (!environment.office) {
    return 'Office latitude and longitude are not configured correctly.';
  }
  return '';
};
