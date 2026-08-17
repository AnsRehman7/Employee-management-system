import { Platform } from 'react-native';

/**
 * Mirrors the StaffFlow web palette (Tailwind emerald / teal / slate) so the app
 * and the browser workspace read as one product.
 */
export const colors = {
  amber: '#B45309', // amber-700
  amberSoft: '#FFFBEB', // amber-50
  border: '#E2E8F0', // slate-200
  borderStrong: '#CBD5E1', // slate-300
  brand: '#047857', // emerald-700
  brandDark: '#065F46', // emerald-800
  brandSoft: '#ECFDF5', // emerald-50
  canvas: '#F7F8F5',
  cyan: '#115E59', // teal-800
  cyanSoft: '#CCFBF1', // teal-100
  danger: '#BE123C', // rose-700
  dangerSoft: '#FFF1F2', // rose-50
  ink: '#020617', // slate-950
  muted: '#64748B', // slate-500
  neutralSoft: '#F1F5F9', // slate-100
  onBrand: '#D1FAE5', // emerald-100, for text on a brand surface
  positive: '#047857', // emerald-700
  positiveSoft: '#ECFDF5', // emerald-50
  placeholder: '#94A3B8', // slate-400
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC', // slate-50
  text: '#334155', // slate-700
  white: '#FFFFFF',
};

export const shadow = Platform.select({
  android: {
    elevation: 2,
  },
  ios: {
    shadowColor: '#020617',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
});

export const typography = {
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  heading: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 30,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 22,
  },
};
