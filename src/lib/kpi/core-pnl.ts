import { getISOWeek, getISOWeekYear } from 'date-fns'
import type { Trade } from '@/lib/types'
import type { CorePnlKpis } from './types'

/** Get the P&L value for a trade based on the active mode */
export function getTradePnl(trade: Trade, pnlMode: 'net' | 'gross'): number {
  return pnlMode === 'net'
    ? parseFloat(trade.pnl)
    : parseFloat(trade.gross_pnl)
}

/** Classify a trade's outcome based on the active P&L mode */
export function classifyTrade(
  pnl: number
): 'win' | 'loss' | 'breakeven' {
  if (pnl > 0) return 'win'
  if (pnl < 0) return 'loss'
  return 'breakeven'
}

/**
 * Parse a TradeDuration string "HH:MM:SS.xxxxxxx" to total seconds.
 * Truncates sub-seconds.
 */
function parseDurationToSeconds(duration: string | null): number | null {
  if (!duration) return null
  const parts = duration.split(':')
  if (parts.length < 3) return null
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  const seconds = parseFloat(parts[2])
  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null
  return hours * 3600 + minutes * 60 + Math.floor(seconds)
}

/**
 * Extract local date from an ISO timestamp by parsing
 * the original offset to preserve the local calendar date.
 * Falls back to trade_day if available.
 */
function getTradeLocalDate(trade: Trade): string {
  return trade.trade_day
}

/**
 * Extract ISO week string like "2025-W47" from a trade's entered_at.
 * Uses the timestamp parsed as a Date (UTC), but weeks are based on the
 * local date (trade_day).
 */
function getTradeIsoWeek(trade: Trade): string {
  const date = new Date(trade.trade_day + 'T12:00:00Z')
  const week = getISOWeek(date)
  const year = getISOWeekYear(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

/** Extract year-month "YYYY-MM" from trade_day */
function getTradeMonth(trade: Trade): string {
  return trade.trade_day.substring(0, 7)
}

/** Compute all Core P&L KPIs */
export function computeCorePnlKpis(
  trades: Trade[],
  pnlMode: 'net' | 'gross'
): CorePnlKpis {
  const totalTrades = trades.length

  if (totalTrades === 0) {
    return {
      winRate: null,
      profitFactor: null,
      avgWin: null,
      avgLoss: null,
      winLossRatio: null,
      totalPnl: 0,
      dailyPnl: {},
      weeklyPnl: {},
      monthlyPnl: {},
      totalTrades: 0,
      winCount: 0,
      lossCount: 0,
      largestWin: null,
      largestLoss: null,
      avgDurationSeconds: null,
    }
  }

  const pnls = trades.map((t) => getTradePnl(t, pnlMode))
  const outcomes = pnls.map(classifyTrade)

  // Win/loss classification
  const winIndices: number[] = []
  const lossIndices: number[] = []
  for (let i = 0; i < outcomes.length; i++) {
    if (outcomes[i] === 'win') winIndices.push(i)
    else if (outcomes[i] === 'loss') lossIndices.push(i)
  }

  const winPnls = winIndices.map((i) => pnls[i])
  const lossPnls = lossIndices.map((i) => pnls[i])

  // KPI 1.1 — Win Rate
  const winRate = (winIndices.length / totalTrades) * 100

  // KPI 1.2 — Profit Factor
  const sumWins = winPnls.reduce((a, b) => a + b, 0)
  const sumLosses = lossPnls.reduce((a, b) => a + b, 0)
  let profitFactor: number | null = null
  if (winPnls.length > 0 && lossPnls.length > 0) {
    profitFactor = sumWins / Math.abs(sumLosses)
  } else if (winPnls.length > 0 && lossPnls.length === 0) {
    profitFactor = Infinity
  }
  // If no wins and no losses (all breakeven) or no wins, profitFactor stays null

  // KPI 1.3 — Avg Win / Avg Loss
  const avgWin = winPnls.length > 0 ? sumWins / winPnls.length : null
  const avgLoss =
    lossPnls.length > 0 ? Math.abs(sumLosses) / lossPnls.length : null
  let winLossRatio: number | null = null
  if (avgWin !== null && avgLoss !== null) {
    winLossRatio = avgWin / avgLoss
  } else if (avgWin !== null && avgLoss === null) {
    winLossRatio = Infinity
  }

  // KPI 1.4 — Net P&L (total, daily, weekly, monthly)
  const totalPnl = pnls.reduce((a, b) => a + b, 0)

  const dailyPnl: Record<string, number> = {}
  const weeklyPnl: Record<string, number> = {}
  const monthlyPnl: Record<string, number> = {}

  for (let i = 0; i < trades.length; i++) {
    const trade = trades[i]
    const pnl = pnls[i]

    const day = getTradeLocalDate(trade)
    dailyPnl[day] = (dailyPnl[day] ?? 0) + pnl

    const week = getTradeIsoWeek(trade)
    weeklyPnl[week] = (weeklyPnl[week] ?? 0) + pnl

    const month = getTradeMonth(trade)
    monthlyPnl[month] = (monthlyPnl[month] ?? 0) + pnl
  }

  // KPI 1.6 — Largest Win / Largest Loss
  const largestWin = winPnls.length > 0 ? Math.max(...winPnls) : null
  const largestLoss = lossPnls.length > 0 ? Math.min(...lossPnls) : null

  // KPI 1.7 — Average Duration
  let totalDuration = 0
  let durationCount = 0
  for (const trade of trades) {
    const seconds = parseDurationToSeconds(trade.trade_duration)
    if (seconds !== null) {
      totalDuration += seconds
      durationCount++
    }
  }
  const avgDurationSeconds =
    durationCount > 0 ? totalDuration / durationCount : null

  return {
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    winLossRatio,
    totalPnl,
    dailyPnl,
    weeklyPnl,
    monthlyPnl,
    totalTrades,
    winCount: winIndices.length,
    lossCount: lossIndices.length,
    largestWin,
    largestLoss,
    avgDurationSeconds,
  }
}
