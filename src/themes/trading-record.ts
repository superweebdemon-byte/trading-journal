import type { ThemeConfig } from './types'

export const tradingRecord: ThemeConfig = {
  name: 'trading-record',
  displayName: 'The Trading Record',
  colors: {
    // Aged newsprint backgrounds
    bgPrimary: '#f5f0e8',
    bgSecondary: '#faf7f2',
    bgTertiary: '#ebe5d9',
    bgCard: '#faf7f2',
    border: '#c4b99a',
    // Ink text scale
    textPrimary: '#1a1a1a',
    textSecondary: '#6b6356',
    textTertiary: '#8a7e66',
    // Deep crimson / editorial red accent
    accent: '#8b0000',
    accentBright: '#a52a2a',
    accentMuted: '#6b0000',
    // Gain: dark forest green (ink feel)
    gain: '#1a5c2a',
    gainBright: '#4ade80',
    gainBg: 'rgba(26, 92, 42, 0.08)',
    // Loss: crimson (shares accent hue)
    loss: '#8b0000',
    lossBright: '#f87171',
    lossBg: 'rgba(139, 0, 0, 0.06)',
    neutral: '#6b6356',
    warning: '#D97706',
    warningBright: '#F59E0B',
    warningBg: 'rgba(217, 119, 6, 0.08)',
    borderSubtle: 'rgba(0, 0, 0, 0.05)',
    textQuaternary: '#A39882',
  },
  typography: {
    fontDisplay: 'Playfair Display',
    fontBody: 'Source Serif 4',
    fontMono: 'JetBrains Mono',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,500&family=JetBrains+Mono:wght@300;400;500;600&display=swap',
  },
  effects: {
    cardRadius: '2px',
    cardShadow: '0 1px 4px rgba(0,0,0,0.06)',
    backgroundTexture:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
  },
  layout: {
    variant: 'columns',
    density: 'spacious',
    navPosition: 'top',
  },
}
