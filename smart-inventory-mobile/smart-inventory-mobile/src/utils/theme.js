export const colors = {
  bg:        '#080c14',
  bg2:       '#0f172a',
  bg3:       '#1e293b',
  bgCard:    '#131d31',
  bgGlass:   'rgba(19, 29, 49, 0.75)',
  
  border:    'rgba(255, 255, 255, 0.08)',
  border2:   'rgba(255, 255, 255, 0.14)',
  borderGlow:'rgba(99, 102, 241, 0.3)',
  
  text:      '#f8fafc',
  text2:     '#94a3b8',
  text3:     '#64748b',
  
  accent:    '#6366f1',
  accentLight: '#818cf8',
  accentBg:  'rgba(99, 102, 241, 0.15)',
  accentGlow:'rgba(99, 102, 241, 0.35)',
  
  green:     '#10b981',
  greenLight:'#34d399',
  greenBg:   'rgba(16, 185, 129, 0.15)',
  greenGlow: 'rgba(16, 185, 129, 0.35)',
  
  amber:     '#f59e0b',
  amberLight:'#fbbf24',
  amberBg:   'rgba(245, 158, 11, 0.15)',
  amberGlow: 'rgba(245, 158, 11, 0.35)',
  
  red:       '#f43f5e',
  redLight:  '#fb7185',
  redBg:     'rgba(244, 63, 94, 0.15)',
  redGlow:   'rgba(244, 63, 94, 0.35)',
  
  purple:    '#a855f7',
  purpleLight: '#c084fc',
  purpleBg:  'rgba(168, 85, 247, 0.15)',
  purpleGlow:'rgba(168, 85, 247, 0.35)',
  
  cyan:      '#06b6d4',
  cyanBg:    'rgba(6, 182, 212, 0.15)',
  
  white:     '#ffffff',
  black:     '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const font = {
  regular: '400',
  medium:  '500',
  semibold:'600',
  bold:    '700',
  heavy:   '800',
};

export const shadows = {
  glowPrimary: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  glowGreen: {
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
};
