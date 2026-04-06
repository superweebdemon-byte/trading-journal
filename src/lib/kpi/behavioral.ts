import type { Trade, UserSettings } from '@/lib/types'
import type { BehavioralKpis } from './types'
import { getTradePnl, classifyTrade } from './core-pnl'

/**
 * Sort trades by EnteredAt (ascending), with Id as tiebreaker.
 * Returns a new sorted array (does not mutate input).
 */
function sortByEnteredAt(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => {
    const timeA = new Date(a.entered_at).getTime()
    const timeB = new Date(b.entered_at).getTime()
    if (timeA !== timeB) return timeA - timeB
    return a.topstep_id - b.topstep_id
  })
}

/**
 * Sort trades by ExitedAt (ascending), with Id as tiebreaker.
 * Used for revenge trade detection.
 */
function sortByExitedAt(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => {
    const timeA = new Date(a.exited_at).getTime()
    const timeB = new Date(b.exited_at).getTime()
    if (timeA !== timeB) return timeA - timeB
    return a.topstep_id - b.topstep_id
  })
}

/**
 * KPI 3.1 — Revenge Trade Detection
 *
 * A trade is a revenge trade if:
 * 1. The immediately preceding trade (by ExitedAt) was a loss
 * 2. Time gap (current EnteredAt - previous ExitedAt) >= 0s
 * 3. Time gap <= revenge_window_seconds
 */
function computeRevengeTrades(
  trades: Trade[],
  pnlMode: 'net' | 'gross',
  revengeWindowSeconds: number
): number {
  if (trades.length < 2) return 0

  const sorted = sortByExitedAt(trades)
  let count = 0

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]

    const prevPnl = getTradePnl(prev, pnlMode)
    if (classifyTrade(prevPnl) !== 'loss') continue

    const gapMs =
      new Date(curr.entered_at).getTime() - new Date(prev.exited_at).getTime()
    const gapSeconds = gapMs / 1000

    if (gapSeconds >= 0 && gapSeconds <= revengeWindowSeconds) {
      count++
    }
  }

  return count
}

/**
 * KPI 3.2 — Overtrading Detection
 *
 * Flag days where trade count > overtrade_multiplier * rolling 5-day avg.
 * Rolling avg uses up to 5 prior *trading* days.
 */
function computeOvertradeDays(
  trades: Trade[],
  overtradeMultiplier: number
): string[] {
  // Group by trade_day
  const dayCounts = new Map<string, number>()
  for (const trade of trades) {
    dayCounts.set(trade.trade_day, (dayCounts.get(trade.trade_day) ?? 0) + 1)
  }

  const sortedDays = Array.from(dayCounts.keys()).sort()
  const flaggedDays: string[] = []

  for (let i = 0; i < sortedDays.length; i++) {
    const day = sortedDays[i]
    const todayCount = dayCounts.get(day)!

    // Need at least 1 prior day
    if (i === 0) continue

    // Get up to 5 prior trading days
    const priorStart = Math.max(0, i - 5)
    const priorDays = sortedDays.slice(priorStart, i)
    const priorSum = priorDays.reduce((sum, d) => sum + dayCounts.get(d)!, 0)
    const rollingAvg = priorSum / priorDays.length

    if (todayCount > overtradeMultiplier * rollingAvg) {
      flaggedDays.push(day)
    }
  }

  return flaggedDays
}

/**
 * KPI 3.3 — Max Consecutive Wins/Losses
 *
 * Breakeven resets both streaks.
 */
function computeConsecutiveStreaks(
  trades: Trade[],
  pnlMode: 'net' | 'gross'
): { maxWins: number; maxLosses: number } {
  const sorted = sortByEnteredAt(trades)

  let currentWinStreak = 0
  let currentLossStreak = 0
  let maxWins = 0
  let maxLosses = 0

  for (const trade of sorted) {
    const pnl = getTradePnl(trade, pnlMode)
    const outcome = classifyTrade(pnl)

    if (outcome === 'win') {
      currentWinStreak++
      currentLossStreak = 0
    } else if (outcome === 'loss') {
      currentLossStreak++
      currentWinStreak = 0
    } else {
      // breakeven: only wins reset loss streak, only losses reset win streak
      currentWinStreak = 0
    }

    maxWins = Math.max(maxWins, currentWinStreak)
    maxLosses = Math.max(maxLosses, currentLossStreak)
  }

  return { maxWins, maxLosses }
}

/**
 * KPI 3.4 — Tilt Indicator
 *
 * Tracks performance after 2+ consecutive losses.
 * The tilt check happens BEFORE updating the streak.
 */
function computeTiltIndicator(
  trades: Trade[],
  pnlMode: 'net' | 'gross'
): { tiltCount: number; tiltAvgPnl: number | null; overallAvgPnl: number | null; tiltDelta: number | null } {
  const sorted = sortByEnteredAt(trades)

  if (sorted.length === 0) {
    return { tiltCount: 0, tiltAvgPnl: null, overallAvgPnl: null, tiltDelta: null }
  }

  const allPnls = sorted.map((t) => getTradePnl(t, pnlMode))
  const overallAvgPnl = allPnls.reduce((a, b) => a + b, 0) / allPnls.length

  let lossStreak = 0
  const tiltPnls: number[] = []

  for (const trade of sorted) {
    const pnl = getTradePnl(trade, pnlMode)

    // Check if in tilt BEFORE updating streak
    if (lossStreak >= 2) {
      tiltPnls.push(pnl)
    }

    // Update streak
    if (classifyTrade(pnl) === 'loss') {
      lossStreak++
    } else {
      lossStreak = 0
    }
  }

  if (tiltPnls.length === 0) {
    return { tiltCount: 0, tiltAvgPnl: null, overallAvgPnl, tiltDelta: null }
  }

  const tiltAvgPnl = tiltPnls.reduce((a, b) => a + b, 0) / tiltPnls.length
  const tiltDelta = tiltAvgPnl - overallAvgPnl

  return { tiltCount: tiltPnls.length, tiltAvgPnl, overallAvgPnl, tiltDelta }
}

/** Compute all Behavioral KPIs */
export function computeBehavioralKpis(
  trades: Trade[],
  settings: UserSettings,
  pnlMode: 'net' | 'gross'
): BehavioralKpis {
  const revengeTradeCount = computeRevengeTrades(
    trades,
    pnlMode,
    settings.revenge_window_seconds
  )

  const overtradeDays = computeOvertradeDays(trades, settings.overtrade_multiplier)

  const { maxWins, maxLosses } = computeConsecutiveStreaks(trades, pnlMode)

  const tilt = computeTiltIndicator(trades, pnlMode)

  return {
    revengeTradeCount,
    overtradeDays,
    maxConsecutiveWins: maxWins,
    maxConsecutiveLosses: maxLosses,
    tiltTradeCount: tilt.tiltCount,
    tiltAvgPnl: tilt.tiltAvgPnl,
    overallAvgPnl: tilt.overallAvgPnl,
    tiltDelta: tilt.tiltDelta,
  }
}
