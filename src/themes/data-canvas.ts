import type { ThemeConfig } from './types'

export const dataCanvas: ThemeConfig = {
  name: 'data-canvas',
  displayName: 'Data Canvas',
  colors: {
    bgPrimary: '#0A0C10',
    bgSecondary: '#0F1117',
    bgTertiary: '#13151D',
    bgCard: 'rgba(15, 17, 23, 0.6)',
    border: 'rgba(45, 212, 191, 0.08)',
    textPrimary: '#E2E8F0',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    accent: '#2DD4BF',
    accentBright: '#5EEAD4',
    accentMuted: '#0D9488',
    gain: '#34D399',
    gainBright: '#6EE7B7',
    gainBg: 'rgba(52, 211, 153, 0.08)',
    loss: '#F87171',
    lossBright: '#FCA5A5',
    lossBg: 'rgba(248, 113, 113, 0.08)',
    neutral: '#94A3B8',
  },
  typography: {
    fontDisplay: 'Sora',
    fontBody: 'IBM Plex Mono',
    fontMono: 'IBM Plex Mono',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Sora:wght@300;400;500;600;700&display=swap',
  },
  effects: {
    cardRadius: '12px',
    cardShadow: '0 0 20px rgba(45, 212, 191, 0.1), inset 0 1px 0 rgba(45, 212, 191, 0.05)',
    glowEffect: '0 0 20px rgba(45, 212, 191, 0.1)',
    backgroundTexture:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
  },
  layout: {
    variant: 'bento',
    density: 'comfortable',
    navPosition: 'top',
  },
}
