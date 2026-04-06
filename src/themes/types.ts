export interface ThemeColors {
  bgPrimary: string
  bgSecondary: string
  bgTertiary: string
  bgCard: string
  border: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  accent: string
  accentBright: string
  accentMuted: string
  gain: string
  gainBright: string
  gainBg: string
  loss: string
  lossBright: string
  lossBg: string
  neutral: string
  warning: string
  warningBright: string
  warningBg: string
  borderSubtle: string
  textQuaternary: string
}

export interface ThemeTypography {
  fontDisplay: string
  fontBody: string
  fontMono: string
  googleFontsUrl: string
}

export interface ThemeEffects {
  cardRadius: string
  cardShadow: string
  glowEffect?: string
  backgroundTexture?: string
}

export interface ThemeLayout {
  variant: 'default' | 'sidebar' | 'columns' | 'bento'
  density: 'compact' | 'comfortable' | 'spacious'
  navPosition: 'top' | 'left'
}

export interface ThemeConfig {
  name: string
  displayName: string
  colors: ThemeColors
  typography: ThemeTypography
  effects: ThemeEffects
  layout: ThemeLayout
}
