import type { Trade } from '@/lib/types'
import type { PerformanceEdgeKpis, DirectionStats } from './types'
import { getTradePnl, classifyTrade } from './core-pnl'

/** Breakeven threshold: trades with |P&L| <= $0.50 are breakeven */
const BREAKEVEN_THRESHOLD = 0.50

function classifyTradeWithThreshold(pnl: number): 'win' | 'loss' | 'breakeven' {
  if (Math.abs(pnl) <= BREAKEVEN_THRESHOLD) return 'breakeven'
  if (pnl > 0) return 'win'
  return 'loss'
}

function getRecoveryRating(factor: number | null): 'POOR' | 'MODERATE' | 'GOOD' | 'EXCELLENT' {
  if (factor === null || factor < 1) return 'POOR'
  if (factor < 2) return 'MODERATE'
  if (factor < 3) return 'GOOD'
  return 'EXCELLENT'
}

/**
 * Compute Performance Edge KPIs:
 * - Expectancy per trade
 * - Long vs Short split
 * - Breakeven rate (three-way)
 * - Recovery Factor
 */
export function computePerformanceEdgeKpis(
  trades: Trade[],
  pnlMode: 'net' | 'gross',
  totalNetPnl: number,
  maxDrawdownDollars: number
): PerformanceEdgeKpis {
  const totalTrades = trades.length

  if (totalTrades === 0) {
    return {
      expectancy: null,
      totalTrades: 0,
      winRateDecimal: null,
      lossRateDecimal: null,
      avgWin: null,
      avgLoss: null,
      directionSplit: [],
      strongerDirection: null,
      longPercent: 0,
      winPercent: 0,
      lossPercent: 0,
      breakevenPercent: 0,
      winCount: 0,
      lossCount: 0,
      breakevenCount: 0,
      recoveryFactor: null,
      recoveryRating: 'POOR',
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
    }
  }

  const pnls = trades.map((t) => getTradePnl(t, pnlMode))

  // --- Three-way outcome split with threshold ---
  let winCount = 0
  let lossCount = 0
  let breakevenCount = 0
  let sumWins = 0
  let sumLosses = 0

  for (const pnl of pnls) {
    const outcome = classifyTradeWithThreshold(pnl)
    if (outcome === 'win') {
      winCount++
      sumWins += pnl
    } else if (outcome === 'loss') {
      lossCount++
      sumLosses += Math.abs(pnl)
    } else {
      breakevenCount++
    }
  }

  const winPercent = (winCount / totalTrades) * 100
  const lossPercent = (lossCount / totalTrades) * 100
  const breakevenPercent = (breakevenCount / totalTrades) * 100

  // --- Expectancy ---
  // Uses standard win/loss classification (from core-pnl) for consistency
  const standardPnls = pnls.map(classifyTrade)
  let stdWinCount = 0
  let stdLossCount = 0
  let stdSumWins = 0
  let stdSumLosses = 0

  for (let i = 0; i < pnls.length; i++) {
    if (standardPnls[i] === 'win') {
      stdWinCount++
      stdSumWins += pnls[i]
    } else if (standardPnls[i] === 'loss') {
      stdLossCount++
      stdSumLosses += Math.abs(pnls[i])
    }
  }

  const winRateDecimal = stdWinCount / totalTrades
  const lossRateDecimal = stdLossCount / totalTrades
  const avgWin = stdWinCount > 0 ? stdSumWins / stdWinCount : null
  const avgLoss = stdLossCount > 0 ? stdSumLosses / stdLossCount : null

  let expectancy: number | null = null
  if (avgWin !== null && avgLoss !== null) {
    expectancy = (winRateDecimal * avgWin) - (lossRateDecimal * avgLoss)
  } else if (avgWin !== null) {
    expectancy = winRateDecimal * avgWin
  } else if (avgLoss !== null) {
    expectancy = -(lossRateDecimal * avgLoss)
  }

  // --- Long vs Short split ---
  const directionMap = new Map<'Long' | 'Short', { pnls: number[]; wins: number; count: number }>()

  for (let i = 0; i < trades.length; i++) {
    const dir = trades[i].trade_type
    const pnl = pnls[i]
    const entry = directionMap.get(dir) ?? { pnls: [], wins: 0, count: 0 }
    entry.pnls.push(pnl)
    entry.count++
    if (classifyTrade(pnl) === 'win') entry.wins++
    directionMap.set(dir, entry)
  }

  const directionSplit: DirectionStats[] = []
  for (const direction of ['Long', 'Short'] as const) {
    const data = directionMap.get(direction)
    if (data && data.count > 0) {
      const sum = data.pnls.reduce((a, b) => a + b, 0)
      directionSplit.push({
        direction,
        winRate: (data.wins / data.count) * 100,
        avgPnl: sum / data.count,
        tradeCount: data.count,
      })
    }
  }

  // Determine stronger direction by avg P&L
  let strongerDirection: 'Long' | 'Short' | null = null
  if (directionSplit.length === 2) {
    const longStats = directionSplit.find(d => d.direction === 'Long')
    const shortStats = directionSplit.find(d => d.direction === 'Short')
    if (longStats && shortStats) {
      if (longStats.avgPnl > shortStats.avgPnl) strongerDirection = 'Long'
      else if (shortStats.avgPnl > longStats.avgPnl) strongerDirection = 'Short'
    }
  } else if (directionSplit.length === 1) {
    strongerDirection = directionSplit[0].direction
  }

  // Long percentage for the strength bar
  const longData = directionMap.get('Long')
  const longPercent = longData ? (longData.count / totalTrades) * 100 : 0

  // --- Consecutive streaks ---
  let maxConsecutiveWins = 0
  let maxConsecutiveLosses = 0
  let currentWinStreak = 0
  let currentLossStreak = 0

  for (const pnl of pnls) {
    const outcome = classifyTrade(pnl)
    if (outcome === 'win') {
      currentWinStreak++
      currentLossStreak = 0
      if (currentWinStreak > maxConsecutiveWins) maxConsecutiveWins = currentWinStreak
    } else if (outcome === 'loss') {
      currentLossStreak++
      currentWinStreak = 0
      if (currentLossStreak > maxConsecutiveLosses) maxConsecutiveLosses = currentLossStreak
    } else {
      currentWinStreak = 0
      currentLossStreak = 0
    }
  }

  // --- Recovery Factor ---
  let recoveryFactor: number | null = null
  if (maxDrawdownDollars > 0) {
    recoveryFactor = totalNetPnl / maxDrawdownDollars
  }
  const recoveryRating = getRecoveryRating(recoveryFactor)

  return {
    expectancy,
    totalTrades,
    winRateDecimal,
    lossRateDecimal,
    avgWin,
    avgLoss,
    directionSplit,
    strongerDirection,
    longPercent,
    winPercent,
    lossPercent,
    breakevenPercent,
    winCount,
    lossCount,
    breakevenCount,
    recoveryFactor,
    recoveryRating,
    maxConsecutiveWins,
    maxConsecutiveLosses,
  }
}
