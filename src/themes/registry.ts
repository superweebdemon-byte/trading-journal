import { dataCanvas } from './data-canvas'
import { tradeLog } from './trade-log'
import { tradingRecord } from './trading-record'
import { notionApple } from './notion-apple'
import { signal } from './signal'
import { splitCockpit } from './split-cockpit'
import type { ThemeConfig } from './types'

export const themes: Record<string, ThemeConfig> = {
  'data-canvas': dataCanvas,
  'trade-log': tradeLog,
  'trading-record': tradingRecord,
  'notion-apple': notionApple,
  'signal': signal,
  'split-cockpit': splitCockpit,
}

export const defaultTheme = 'data-canvas'
