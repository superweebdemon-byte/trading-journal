import type { ThemeConfig } from './types'

// =============================================================================
// TOPO GRID STRUCTURE (v15 layout reference — theme-agnostic, apply to any theme)
// =============================================================================
// v15 uses a standard single-column flow with a sticky top nav.
// Key grid patterns extracted from the Topo mockup:
//
//   KPI row:    grid-template-columns: repeat(4, 1fr); gap: 14px
//   Chart row:  grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 16px
//   Heatmap:    grid-template-columns: 80px repeat(4, 1fr)
//   3-col:      grid-template-columns: 1fr 1fr 1fr; gap: 14px  (session summaries)
//
// Body texture: overlapping grid-paper + topo-contour SVG layers.
//   grid-paper:  linear-gradient(var(--grid-line) 1px, transparent 1px)
//                linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
//                background-size: 24px 24px
//   contour:     SVG polylines with low opacity (~0.5) rendered in a fixed #topo-bg
//
// Max content width: 1400px, padding: 24px 32px 60px.
// Responsive breakpoint collapses kpi-grid to repeat(2, 1fr).
// =============================================================================

export const splitCockpit: ThemeConfig = {
  name: 'split-cockpit',
  displayName: 'Split Cockpit',
  colors: {
    // Deep blue-black backgrounds (v11 dark mode)
    bgPrimary: '#06080C',
    bgSecondary: '#0A0C10',
    bgTertiary: '#0F1218',
    bgCard: '#141820',
    border: 'rgba(255,255,255,0.06)',
    // Slate text scale
    textPrimary: '#E8ECF2',
    textSecondary: '#8B95A8',
    textTertiary: '#4A5568',
    // Teal accent
    accent: '#2DD4BF',
    accentBright: '#5EEAD4',
    accentMuted: 'rgba(45, 212, 191, 0.15)',
    // Gain: emerald green
    gain: '#10B981',
    gainBright: '#34D399',
    gainBg: 'rgba(16, 185, 129, 0.12)',
    // Loss: red
    loss: '#EF4444',
    lossBright: '#F87171',
    lossBg: 'rgba(239, 68, 68, 0.12)',
    neutral: '#8B95A8',
  },
  typography: {
    fontDisplay: 'Sora',
    fontBody: 'Sora',
    fontMono: 'IBM Plex Mono',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Sora:wght@300;400;500;600;700&display=swap',
  },
  effects: {
    cardRadius: '10px',
    cardShadow: '0 1px 3px rgba(0,0,0,0.4)',
    backgroundTexture:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
  },
  layout: {
    variant: 'sidebar',
    density: 'compact',
    navPosition: 'top',
  },
}
