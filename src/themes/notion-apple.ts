import type { ThemeConfig } from './types'

export const notionApple: ThemeConfig = {
  name: 'notion-apple',
  displayName: 'Notion + Apple',
  colors: {
    // Warm stone page backgrounds (light mode — v7 default)
    bgPrimary: '#FAFAF9',
    bgSecondary: '#F5F5F4',
    bgTertiary: '#EFEDEA',
    bgCard: '#FFFFFF',
    border: '#E7E5E4',
    // Warm stone text scale
    textPrimary: '#1C1917',
    textSecondary: '#57534E',
    textTertiary: '#78716C',
    // Amber accent — hand-underline / CTA
    accent: '#D97706',
    accentBright: '#F59E0B',
    accentMuted: '#B45309',
    // Gain: green
    gain: '#16A34A',
    gainBright: '#22C55E',
    gainBg: '#F0FDF4',
    // Loss: red
    loss: '#DC2626',
    lossBright: '#EF4444',
    lossBg: '#FEF2F2',
    neutral: '#78716C',
  },
  typography: {
    fontDisplay: 'Calistoga',
    fontBody: 'Inter',
    fontMono: 'JetBrains Mono',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Calistoga&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
  },
  effects: {
    cardRadius: '16px',
    cardShadow: '0 8px 30px rgba(0,0,0,0.06)',
  },
  layout: {
    variant: 'bento',
    density: 'spacious',
    navPosition: 'top',
  },
}
