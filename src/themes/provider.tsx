'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { themes, defaultTheme } from './registry'
import type { ThemeConfig } from './types'

interface ThemeContextValue {
  theme: ThemeConfig
  themeName: string
  setTheme: (name: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyThemeVars(config: ThemeConfig) {
  const root = document.documentElement
  const { colors, typography, effects } = config

  root.style.setProperty('--color-bg-primary', colors.bgPrimary)
  root.style.setProperty('--color-bg-secondary', colors.bgSecondary)
  root.style.setProperty('--color-bg-tertiary', colors.bgTertiary)
  root.style.setProperty('--color-bg-card', colors.bgCard)
  root.style.setProperty('--color-border', colors.border)
  root.style.setProperty('--color-text-primary', colors.textPrimary)
  root.style.setProperty('--color-text-secondary', colors.textSecondary)
  root.style.setProperty('--color-text-tertiary', colors.textTertiary)
  root.style.setProperty('--color-accent', colors.accent)
  root.style.setProperty('--color-accent-bright', colors.accentBright)
  root.style.setProperty('--color-accent-muted', colors.accentMuted)
  root.style.setProperty('--color-gain', colors.gain)
  root.style.setProperty('--color-gain-bright', colors.gainBright)
  root.style.setProperty('--color-gain-bg', colors.gainBg)
  root.style.setProperty('--color-loss', colors.loss)
  root.style.setProperty('--color-loss-bright', colors.lossBright)
  root.style.setProperty('--color-loss-bg', colors.lossBg)
  root.style.setProperty('--color-neutral', colors.neutral)
  root.style.setProperty('--color-warning', colors.warning)
  root.style.setProperty('--color-warning-bright', colors.warningBright)
  root.style.setProperty('--color-warning-bg', colors.warningBg)
  root.style.setProperty('--color-border-subtle', colors.borderSubtle)
  root.style.setProperty('--color-text-quaternary', colors.textQuaternary)

  root.style.setProperty('--font-display', typography.fontDisplay)
  root.style.setProperty('--font-body', typography.fontBody)
  root.style.setProperty('--font-mono', typography.fontMono)

  root.style.setProperty('--card-radius', effects.cardRadius)
  root.style.setProperty('--card-shadow', effects.cardShadow)
  if (effects.glowEffect) {
    root.style.setProperty('--glow-effect', effects.glowEffect)
  }
}

function loadGoogleFonts(url: string) {
  const existingLink = document.querySelector('link[data-theme-fonts]')
  if (existingLink) {
    existingLink.remove()
  }

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  link.setAttribute('data-theme-fonts', 'true')
  document.head.appendChild(link)
}

function getSavedTheme(): string {
  if (typeof window === 'undefined') return defaultTheme
  const saved = localStorage.getItem('trading-journal-theme')
  return saved && themes[saved] ? saved : defaultTheme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState(getSavedTheme)
  const theme = themes[themeName] ?? themes[defaultTheme]

  useEffect(() => {
    applyThemeVars(theme)
    loadGoogleFonts(theme.typography.googleFontsUrl)
  }, [theme])

  const setTheme = useCallback((name: string) => {
    if (!themes[name]) return
    setThemeName(name)
    localStorage.setItem('trading-journal-theme', name)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
