/* global jest */

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();

  return {
    clear: jest.fn(() => {
      store.clear();
      return Promise.resolve();
    }),
    getItem: jest.fn(key => Promise.resolve(store.has(key) ? store.get(key) : null)),
    removeItem: jest.fn(key => {
      store.delete(key);
      return Promise.resolve();
    }),
    setItem: jest.fn((key, value) => {
      store.set(key, value);
      return Promise.resolve();
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
