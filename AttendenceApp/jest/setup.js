/* global jest */

jest.mock('react-native-keychain', () => {
  let credentials = false;
  return {
    ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' },
    getGenericPassword: jest.fn(() => Promise.resolve(credentials)),
    resetGenericPassword: jest.fn(() => {
      credentials = false;
      return Promise.resolve(true);
    }),
    setGenericPassword: jest.fn((username, password) => {
      credentials = { password, username };
      return Promise.resolve(true);
    }),
  };
});

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  setRNConfiguration: jest.fn(),
}));

jest.mock('react-native-biometrics', () =>
  jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn(),
    simplePrompt: jest.fn(),
  })),
);

jest.mock('react-native-config', () => ({
  FIREBASE_WEB_API_KEY: 'test-key',
  OFFICE_LATITUDE: '0',
  OFFICE_LONGITUDE: '0',
  OFFICE_RADIUS_METERS: '100',
  STAFFFLOW_API_URL: 'http://localhost:4000/api',
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = props => React.createElement(View, props);

  return new Proxy(
    { __esModule: true },
    {
      get: (target, property) =>
        property === '__esModule' ? target[property] : Icon,
    },
  );
});
