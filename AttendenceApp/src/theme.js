import { Platform } from 'react-native';

/**
 * Mirrors the DayMark web palette so the app and the browser workspace read as one
 * product, including the dark theme. Roles are inverted rather than values flipped:
 * light tints become deep tints and dark accent text becomes light accent text.
 */
export const lightColors = {
  amber: '#B45309',
  amberSoft: '#FFFBEB',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  brand: '#047857',
  brandDark: '#065F46',
  brandSoft: '#ECFDF5',
  canvas: '#F7F8F5',
  cyan: '#115E59',
  cyanSoft: '#CCFBF1',
  danger: '#BE123C',
  dangerSoft: '#FFF1F2',
  ink: '#020617',
  muted: '#64748B',
  neutralSoft: '#F1F5F9',
  onBrand: '#D1FAE5',
  placeholder: '#94A3B8',
  positive: '#047857',
  positiveSoft: '#ECFDF5',
  skeleton: '#E2E8F0',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  text: '#334155',
  white: '#FFFFFF',
};

export const darkColors = {
  amber: '#FBBF24',
  amberSoft: '#2E2109',
  border: '#2B3650',
  borderStrong: '#3A4763',
  brand: '#12B886',
  brandDark: '#0E9B72',
  brandSoft: '#0D2A22',
  canvas: '#0B1220',
  cyan: '#2DD4BF',
  cyanSoft: '#0A2A2C',
  danger: '#FB7185',
  dangerSoft: '#33111C',
  ink: '#F4F7FB',
  muted: '#94A3B8',
  neutralSoft: '#212B40',
  onBrand: '#A7F3D0',
  placeholder: '#7E8DA5',
  positive: '#34D399',
  positiveSoft: '#0D2A22',
  skeleton: '#212B40',
  surface: '#151E30',
  surfaceMuted: '#1B2436',
  text: '#C8D2E0',
  // Kept literal so text on a filled brand button stays readable in both themes.
  white: '#FFFFFF',
};

export const createShadow = (scheme) =>
  Platform.select({
    android: { elevation: scheme === 'dark' ? 3 : 2 },
    ios: {
      shadowColor: '#020617',
      shadowOffset: { height: 3, width: 0 },
      shadowOpacity: scheme === 'dark' ? 0.4 : 0.08,
      shadowRadius: 10,
    },
  });

/**
 * Type scale aligned with the web app: compact body sizes for dense lists, tighter
 * tracking on headings.
 */
export const createTypography = (colors) => ({
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  eyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heading: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 29,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 21,
  },
});

// Defaults for any module-scope usage that has not been moved onto the hook.
export const colors = lightColors;
export const shadow = createShadow('light');
export const typography = createTypography(lightColors);
