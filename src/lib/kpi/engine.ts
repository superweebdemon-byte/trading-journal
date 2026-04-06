import type { Trade, UserSettings } from '@/lib/types'
import type { KpiResults } from './types'
import { computeCorePnlKpis } from './core-pnl'
import { computeTimeBasedKpis } from './time-based'
import { computeBehavioralKpis } from './behavioral'
import { computeRiskKpis } from './risk'
import { computePerformanceEdgeKpis } from './performance-edge'

/**
 * Compute all KPIs for a set of trades.
 *
 * Pure function — no side effects, no API calls.
 * All trades should already be filtered by the caller.
 */
export function computeAllKpis(
  trades: Trade[],
  settings: UserSettings,
  pnlMode: 'net' | 'gross'
): KpiResults {
  const corePnl = computeCorePnlKpis(trades, pnlMode)
  const risk = computeRiskKpis(trades, pnlMode)

  return {
    corePnl,
    timeBased: computeTimeBasedKpis(trades, pnlMode),
    behavioral: computeBehavioralKpis(trades, settings, pnlMode),
    risk,
    performanceEdge: computePerformanceEdgeKpis(
      trades,
      pnlMode,
      corePnl.totalPnl,
      risk.maxDrawdownDollars
    ),
  }
}
