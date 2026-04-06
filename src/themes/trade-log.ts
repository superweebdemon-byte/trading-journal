import type { ThemeConfig } from './types'

export const tradeLog: ThemeConfig = {
  name: 'trade-log',
  displayName: 'TradeLog',
  colors: {
    // Warm off-white paper backgrounds
    bgPrimary: '#FAFAF8',
    bgSecondary: '#F5F5F0',
    bgTertiary: '#EDEDEA',
    bgCard: '#FFFFFF',
    border: '#E7E5E0',
    // Warm stone text scale
    textPrimary: '#1C1917',
    textSecondary: '#57534E',
    textTertiary: '#78716C',
    // Amber accent
    accent: '#D97706',
    accentBright: '#F59E0B',
    accentMuted: '#B45309',
    // Gain: emerald green
    gain: '#059669',
    gainBright: '#10B981',
    gainBg: '#ECFDF5',
    // Loss: red
    loss: '#DC2626',
    lossBright: '#EF4444',
    lossBg: '#FEF2F2',
    neutral: '#78716C',
    warning: '#D97706',
    warningBright: '#F59E0B',
    warningBg: 'rgba(217, 119, 6, 0.08)',
    borderSubtle: 'rgba(0, 0, 0, 0.04)',
    textQuaternary: '#A8A29E',
  },
  typography: {
    fontDisplay: 'Outfit',
    fontBody: 'Work Sans',
    fontMono: 'JetBrains Mono',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Work+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap',
  },
  effects: {
    cardRadius: '8px',
    cardShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    backgroundTexture:
      "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E\")",
  },
  layout: {
    variant: 'default',
    density: 'comfortable',
    navPosition: 'top',
  },
}
