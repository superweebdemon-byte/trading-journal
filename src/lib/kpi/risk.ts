import type { Trade } from '@/lib/types'
import type { RiskKpis, SizeGroupStats } from './types'
import { getTradePnl, classifyTrade } from './core-pnl'

/**
 * KPI 4.1 — Max Drawdown
 *
 * Peak-to-trough on cumulative P&L series.
 * Trades ordered by EnteredAt ascending.
 */
function computeMaxDrawdown(
  trades: Trade[],
  pnlMode: 'net' | 'gross'
): { dollars: number; percent: number | null } {
  if (trades.length === 0) return { dollars: 0, percent: null }

  const sorted = [...trades].sort((a, b) => {
    const timeA = new Date(a.entered_at).getTime()
    const timeB = new Date(b.entered_at).getTime()
    if (timeA !== timeB) return timeA - timeB
    return a.topstep_id - b.topstep_id
  })

  let cumPnl = 0
  let runningPeak = 0
  let maxDrawdownDollars = 0
  let peakAtMaxDrawdown = 0

  for (const trade of sorted) {
    const pnl = getTradePnl(trade, pnlMode)
    cumPnl += pnl

    if (cumPnl > runningPeak) {
      runningPeak = cumPnl
    }

    const drawdown = runningPeak - cumPnl
    if (drawdown > maxDrawdownDollars) {
      maxDrawdownDollars = drawdown
      peakAtMaxDrawdown = runningPeak
    }
  }

  // Percentage: only meaningful if peak > 0
  let percent: number | null = null
  if (peakAtMaxDrawdown > 0) {
    percent = (maxDrawdownDollars / peakAtMaxDrawdown) * 100
  }

  return { dollars: maxDrawdownDollars, percent }
}

/**
 * KPI 4.2 — Average Risk Per Trade
 *
 * Average loss amount (absolute value of losing trades' P&L).
 */
function computeAvgRisk(
  trades: Trade[],
  pnlMode: 'net' | 'gross'
): number | null {
  const losses: number[] = []
  for (const trade of trades) {
    const pnl = getTradePnl(trade, pnlMode)
    if (classifyTrade(pnl) === 'loss') {
      losses.push(Math.abs(pnl))
    }
  }
  if (losses.length === 0) return null
  return losses.reduce((a, b) => a + b, 0) / losses.length
}

/**
 * KPI 4.3 — Risk-Reward Ratio
 *
 * avg_win / avg_loss (absolute values)
 */
function computeRiskRewardRatio(
  trades: Trade[],
  pnlMode: 'net' | 'gross'
): number | null {
  let sumWins = 0
  let winCount = 0
  let sumLosses = 0
  let lossCount = 0

  for (const trade of trades) {
    const pnl = getTradePnl(trade, pnlMode)
    const outcome = classifyTrade(pnl)
    if (outcome === 'win') {
      sumWins += pnl
      winCount++
    } else if (outcome === 'loss') {
      sumLosses += Math.abs(pnl)
      lossCount++
    }
  }

  if (winCount === 0 && lossCount === 0) return null
  if (winCount === 0) return 0
  if (lossCount === 0) return Infinity

  const avgWin = sumWins / winCount
  const avgLoss = sumLosses / lossCount
  return avgWin / avgLoss
}

/**
 * KPI 4.4 — Position Sizing Patterns
 *
 * Group trades by size, compute stats per group.
 * Compute Pearson correlation between size and P&L.
 */
function computeSizeGroups(
  trades: Trade[],
  pnlMode: 'net' | 'gross'
): SizeGroupStats[] {
  const groups = new Map<number, { pnls: number[]; wins: number; losses: number; breakevens: number }>()

  for (const trade of trades) {
    const pnl = getTradePnl(trade, pnlMode)
    const outcome = classifyTrade(pnl)
    const size = trade.size

    const group = groups.get(size) ?? { pnls: [], wins: 0, losses: 0, breakevens: 0 }
    group.pnls.push(pnl)
    if (outcome === 'win') group.wins++
    else if (outcome === 'loss') group.losses++
    else group.breakevens++
    groups.set(size, group)
  }

  const result: SizeGroupStats[] = []
  for (const [size, data] of groups) {
    const count = data.pnls.length
    result.push({
      size,
      tradeCount: count,
      wins: data.wins,
      losses: data.losses,
      breakevens: data.breakevens,
      winRate: count > 0 ? (data.wins / count) * 100 : 0,
      avgPnl: count > 0 ? data.pnls.reduce((a, b) => a + b, 0) / count : 0,
    })
  }

  result.sort((a, b) => a.size - b.size)
  return result
}

/**
 * Pearson correlation coefficient between two arrays.
 * Returns null if either array has zero variance.
 */
function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = xs.length
  if (n < 2) return null

  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n

  let sumXY = 0
  let sumX2 = 0
  let sumY2 = 0

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    sumXY += dx * dy
    sumX2 += dx * dx
    sumY2 += dy * dy
  }

  if (sumX2 === 0 || sumY2 === 0) return null

  return sumXY / Math.sqrt(sumX2 * sumY2)
}

/** Compute all Risk KPIs */
export function computeRiskKpis(
  trades: Trade[],
  pnlMode: 'net' | 'gross'
): RiskKpis {
  const drawdown = computeMaxDrawdown(trades, pnlMode)
  const avgRiskPerTrade = computeAvgRisk(trades, pnlMode)
  const riskRewardRatio = computeRiskRewardRatio(trades, pnlMode)
  const sizeGroups = computeSizeGroups(trades, pnlMode)

  // Position sizing correlation
  const sizes = trades.map((t) => t.size)
  const pnls = trades.map((t) => getTradePnl(t, pnlMode))
  const sizeCorrelation = pearsonCorrelation(sizes, pnls)

  return {
    maxDrawdownDollars: drawdown.dollars,
    maxDrawdownPercent: drawdown.percent,
    avgRiskPerTrade,
    riskRewardRatio,
    sizeGroups,
    sizeCorrelation,
  }
}
