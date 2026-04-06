import { describe, it, expect } from 'vitest'
import { getTradePnl, classifyTrade, computeCorePnlKpis } from '../core-pnl'
import {
  winningTrade,
  losingTrade,
  breakevenTrade,
  winningTrade2,
  losingTrade2,
} from '@/lib/__tests__/fixtures'

// ---------------------------------------------------------------------------
// getTradePnl
// ---------------------------------------------------------------------------
describe('getTradePnl', () => {
  it('returns net P&L when mode is "net"', () => {
    expect(getTradePnl(winningTrade, 'net')).toBe(6.11)
  })

  it('returns gross P&L when mode is "gross"', () => {
    expect(getTradePnl(winningTrade, 'gross')).toBe(7.65)
  })

  it('handles negative net P&L', () => {
    expect(getTradePnl(losingTrade, 'net')).toBe(-12.5)
  })

  it('handles zero P&L (breakeven)', () => {
    expect(getTradePnl(breakevenTrade, 'net')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// classifyTrade
// ---------------------------------------------------------------------------
describe('classifyTrade', () => {
  it('classifies positive P&L as win', () => {
    expect(classifyTrade(6.11)).toBe('win')
  })

  it('classifies negative P&L as loss', () => {
    expect(classifyTrade(-12.5)).toBe('loss')
  })

  it('classifies zero P&L as breakeven', () => {
    expect(classifyTrade(0)).toBe('breakeven')
  })

  it('classifies very small positive as win', () => {
    expect(classifyTrade(0.0001)).toBe('win')
  })

  it('classifies very small negative as loss', () => {
    expect(classifyTrade(-0.0001)).toBe('loss')
  })
})

// ---------------------------------------------------------------------------
// computeCorePnlKpis — empty input
// ---------------------------------------------------------------------------
describe('computeCorePnlKpis — empty trades', () => {
  const result = computeCorePnlKpis([], 'net')

  it('returns null for rate/ratio fields', () => {
    expect(result.winRate).toBeNull()
    expect(result.profitFactor).toBeNull()
    expect(result.avgWin).toBeNull()
    expect(result.avgLoss).toBeNull()
    expect(result.winLossRatio).toBeNull()
    expect(result.largestWin).toBeNull()
    expect(result.largestLoss).toBeNull()
    expect(result.avgDurationSeconds).toBeNull()
  })

  it('returns zero for counts and totals', () => {
    expect(result.totalPnl).toBe(0)
    expect(result.totalTrades).toBe(0)
    expect(result.winCount).toBe(0)
    expect(result.lossCount).toBe(0)
  })

  it('returns empty P&L buckets', () => {
    expect(result.dailyPnl).toEqual({})
    expect(result.weeklyPnl).toEqual({})
    expect(result.monthlyPnl).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// computeCorePnlKpis — single winning trade
// ---------------------------------------------------------------------------
describe('computeCorePnlKpis — single win', () => {
  const result = computeCorePnlKpis([winningTrade], 'net')

  it('calculates 100% win rate', () => {
    expect(result.winRate).toBe(100)
  })

  it('sets profit factor to Infinity (no losses)', () => {
    expect(result.profitFactor).toBe(Infinity)
  })

  it('calculates correct avgWin and null avgLoss', () => {
    expect(result.avgWin).toBe(6.11)
    expect(result.avgLoss).toBeNull()
  })

  it('sets winLossRatio to Infinity (no losses)', () => {
    expect(result.winLossRatio).toBe(Infinity)
  })

  it('tallies counts correctly', () => {
    expect(result.totalTrades).toBe(1)
    expect(result.winCount).toBe(1)
    expect(result.lossCount).toBe(0)
  })

  it('sets largestWin and null largestLoss', () => {
    expect(result.largestWin).toBe(6.11)
    expect(result.largestLoss).toBeNull()
  })

  it('calculates average duration from trade_duration', () => {
    // "00:10:05.2472910" → 605 seconds (fractional truncated)
    expect(result.avgDurationSeconds).toBe(605)
  })
})

// ---------------------------------------------------------------------------
// computeCorePnlKpis — single losing trade
// ---------------------------------------------------------------------------
describe('computeCorePnlKpis — single loss', () => {
  const result = computeCorePnlKpis([losingTrade], 'net')

  it('calculates 0% win rate', () => {
    expect(result.winRate).toBe(0)
  })

  it('sets profit factor to null (no wins)', () => {
    expect(result.profitFactor).toBeNull()
  })

  it('has null avgWin and correct avgLoss', () => {
    expect(result.avgWin).toBeNull()
    expect(result.avgLoss).toBe(12.5)
  })

  it('has null winLossRatio (no wins)', () => {
    expect(result.winLossRatio).toBeNull()
  })

  it('tracks the largest loss', () => {
    expect(result.largestLoss).toBe(-12.5)
  })
})

// ---------------------------------------------------------------------------
// computeCorePnlKpis — mix of wins and losses
// ---------------------------------------------------------------------------
describe('computeCorePnlKpis — mixed trades', () => {
  const trades = [winningTrade, losingTrade, winningTrade2, losingTrade2]
  const result = computeCorePnlKpis(trades, 'net')

  it('calculates correct win rate', () => {
    // 2 wins / 4 trades = 50%
    expect(result.winRate).toBe(50)
  })

  it('calculates correct profit factor', () => {
    // sumWins = 6.11 + 25.00 = 31.11
    // sumLosses = -12.50 + -8.75 = -21.25
    // profitFactor = 31.11 / 21.25
    expect(result.profitFactor).toBeCloseTo(31.11 / 21.25, 5)
  })

  it('calculates correct avgWin and avgLoss', () => {
    expect(result.avgWin).toBeCloseTo(15.555, 2)
    expect(result.avgLoss).toBeCloseTo(10.625, 2)
  })

  it('calculates winLossRatio', () => {
    // avgWin / avgLoss = 15.555 / 10.625
    expect(result.winLossRatio).toBeCloseTo(15.555 / 10.625, 2)
  })

  it('calculates correct total P&L', () => {
    // 6.11 + (-12.50) + 25.00 + (-8.75) = 9.86
    expect(result.totalPnl).toBeCloseTo(9.86, 2)
  })

  it('tallies counts', () => {
    expect(result.totalTrades).toBe(4)
    expect(result.winCount).toBe(2)
    expect(result.lossCount).toBe(2)
  })

  it('identifies largest win and loss', () => {
    expect(result.largestWin).toBe(25)
    expect(result.largestLoss).toBe(-12.5)
  })

  it('aggregates daily P&L correctly', () => {
    // 2025-11-18: 6.11 + (-12.50) = -6.39
    // 2025-11-19: 25.00
    // 2025-11-20: -8.75
    expect(result.dailyPnl['2025-11-18']).toBeCloseTo(-6.39, 2)
    expect(result.dailyPnl['2025-11-19']).toBeCloseTo(25.0, 2)
    expect(result.dailyPnl['2025-11-20']).toBeCloseTo(-8.75, 2)
  })

  it('aggregates monthly P&L correctly', () => {
    expect(result.monthlyPnl['2025-11']).toBeCloseTo(9.86, 2)
  })
})

// ---------------------------------------------------------------------------
// computeCorePnlKpis — all breakeven
// ---------------------------------------------------------------------------
describe('computeCorePnlKpis — all breakeven', () => {
  const trades = [breakevenTrade, { ...breakevenTrade, id: 'be-2', topstep_id: 999 }]
  const result = computeCorePnlKpis(trades, 'net')

  it('returns 0% win rate', () => {
    expect(result.winRate).toBe(0)
  })

  it('returns null profit factor (no wins or losses)', () => {
    expect(result.profitFactor).toBeNull()
  })

  it('returns null avgWin and avgLoss', () => {
    expect(result.avgWin).toBeNull()
    expect(result.avgLoss).toBeNull()
  })

  it('returns zero total P&L', () => {
    expect(result.totalPnl).toBe(0)
  })

  it('returns zero win and loss counts', () => {
    expect(result.winCount).toBe(0)
    expect(result.lossCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// computeCorePnlKpis — gross mode
// ---------------------------------------------------------------------------
describe('computeCorePnlKpis — gross mode', () => {
  const result = computeCorePnlKpis([winningTrade], 'gross')

  it('uses gross P&L values', () => {
    expect(result.totalPnl).toBeCloseTo(7.65, 2)
    expect(result.avgWin).toBeCloseTo(7.65, 2)
  })
})

// ---------------------------------------------------------------------------
// computeCorePnlKpis — duration edge cases
// ---------------------------------------------------------------------------
describe('computeCorePnlKpis — null duration', () => {
  const tradeNoDuration = { ...winningTrade, trade_duration: null }
  const result = computeCorePnlKpis([tradeNoDuration], 'net')

  it('returns null avgDurationSeconds when no durations available', () => {
    expect(result.avgDurationSeconds).toBeNull()
  })
})
