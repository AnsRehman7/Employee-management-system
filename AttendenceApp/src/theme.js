import { Platform } from 'react-native';

export const colors = {
  amber: '#B54708',
  amberSoft: '#FFF7E8',
  border: '#E4E7EC',
  canvas: '#F5F7FB',
  cyan: '#087E8B',
  cyanSoft: '#E8F8FA',
  danger: '#C4324C',
  dangerSoft: '#FFF0F3',
  ink: '#101828',
  muted: '#667085',
  positive: '#067647',
  positiveSoft: '#ECFDF3',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  text: '#344054',
  violet: '#6D28D9',
  violetDark: '#5420AC',
  violetSoft: '#F2ECFF',
  white: '#FFFFFF',
};

export const shadow = Platform.select({
  android: {
    elevation: 2,
  },
  ios: {
    shadowColor: '#101828',
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
