/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../src/StaffFlowApp';
import {
  prepareFieldDefaults,
  validateRequiredFields,
} from '../src/components/DynamicFields';
import { calculateDistanceMeters } from '../src/utils/geofence';
import {
  clearSecureSession,
  loadSecureSession,
  saveSecureSession,
} from '../src/services/secureSession';

test('renders correctly', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
    await new Promise(resolve => setTimeout(() => resolve(undefined), 0));
  });
});

test('calculates office distance consistently', () => {
  expect(
    calculateDistanceMeters(
      { latitude: 31.4892, longitude: 74.403997 },
      { latitude: 31.4892, longitude: 74.403997 },
    ),
  ).toBe(0);
});

test('prepares defaults and validates required custom fields', () => {
  const fields = [
    {
      archived: false,
      defaultValue: 'Head office',
      id: 'location',
      isRequired: true,
      isSystem: false,
      isVisible: true,
      key: 'location',
      sortOrder: 10,
    },
    {
      archived: false,
      id: 'note',
      isRequired: true,
      isSystem: false,
      isVisible: true,
      key: 'note',
      label: 'Shift note',
      sortOrder: 20,
    },
  ];

  const values = prepareFieldDefaults(fields, {});
  expect(values.location).toBe('Head office');
  expect(validateRequiredFields(fields, values)).toBe(
    'Shift note is required.',
  );
  expect(validateRequiredFields(fields, { ...values, note: 'On site' })).toBe(
    '',
  );
});

test('stores mobile sessions in the OS credential vault', async () => {
  const session = { idToken: 'id-token', refreshToken: 'refresh-token' };

  await saveSecureSession(session);
  await expect(loadSecureSession()).resolves.toEqual(session);
  await clearSecureSession();
  await expect(loadSecureSession()).resolves.toBeNull();
});
