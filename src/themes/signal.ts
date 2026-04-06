import type { ThemeConfig } from './types'

export const signal: ThemeConfig = {
  name: 'signal',
  displayName: 'Signal',
  colors: {
    // Near-black zinc backgrounds
    bgPrimary: '#09090B',
    bgSecondary: '#111113',
    bgTertiary: '#18181B',
    bgCard: '#18181B',
    border: '#27272A',
    // Zinc text scale
    textPrimary: '#FAFAFA',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    // Indigo — the ONE accent color
    accent: '#6366F1',
    accentBright: '#818CF8',
    accentMuted: 'rgba(99, 102, 241, 0.25)',
    // Gain: indigo (wins share the accent — Signal's design choice)
    gain: '#6366F1',
    gainBright: '#818CF8',
    gainBg: 'rgba(99, 102, 241, 0.12)',
    // Loss: neutral zinc (minimal, no red emphasis)
    loss: '#A1A1AA',
    lossBright: '#D4D4D8',
    lossBg: '#27272A',
    neutral: '#52525B',
    warning: '#FFD600',
    warningBright: '#FFEA00',
    warningBg: 'rgba(255, 214, 0, 0.10)',
    borderSubtle: 'rgba(255, 255, 255, 0.04)',
    textQuaternary: '#27272A',
  },
  typography: {
    fontDisplay: 'Inter',
    fontBody: 'Inter',
    fontMono: 'JetBrains Mono',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap',
  },
  effects: {
    cardRadius: '8px',
    cardShadow: '0 1px 3px rgba(0,0,0,0.4)',
  },
  layout: {
    variant: 'default',
    density: 'compact',
    navPosition: 'top',
  },
}
