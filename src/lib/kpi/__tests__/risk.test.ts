import { describe, it, expect } from 'vitest'
import { computeRiskKpis } from '../risk'
import {
  winningTrade,
  losingTrade,
  breakevenTrade,
  winningTrade2,
  losingTrade2,
} from '@/lib/__tests__/fixtures'

// ---------------------------------------------------------------------------
// Empty input
// ---------------------------------------------------------------------------
describe('computeRiskKpis — empty trades', () => {
  const result = computeRiskKpis([], 'net')

  it('returns zero drawdown', () => {
    expect(result.maxDrawdownDollars).toBe(0)
    expect(result.maxDrawdownPercent).toBeNull()
  })

  it('returns null for avg risk and risk-reward', () => {
    expect(result.avgRiskPerTrade).toBeNull()
    expect(result.riskRewardRatio).toBeNull()
  })

  it('returns empty size groups', () => {
    expect(result.sizeGroups).toEqual([])
  })

  it('returns null size correlation', () => {
    expect(result.sizeCorrelation).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Max Drawdown
// ---------------------------------------------------------------------------
describe('computeRiskKpis — max drawdown', () => {
  it('calculates drawdown from peak-to-trough on cumulative P&L', () => {
    // Sequence by entered_at:
    //   winningTrade  (+6.11)  cum=6.11  peak=6.11
    //   losingTrade   (-12.50) cum=-6.39 drawdown=12.50
    //   winningTrade2 (+25.00) cum=18.61 peak=18.61
    //   losingTrade2  (-8.75)  cum=9.86  drawdown=8.75
    // Max drawdown = 12.50 (from peak 6.11 to trough -6.39)
    const trades = [winningTrade, losingTrade, winningTrade2, losingTrade2]
    const result = computeRiskKpis(trades, 'net')
    expect(result.maxDrawdownDollars).toBeCloseTo(12.5, 2)
  })

  it('has zero drawdown when only wins', () => {
    const result = computeRiskKpis([winningTrade, winningTrade2], 'net')
    expect(result.maxDrawdownDollars).toBe(0)
  })

  it('calculates drawdown percent relative to peak', () => {
    const trades = [winningTrade, losingTrade]
    const result = computeRiskKpis(trades, 'net')
    // peak = 6.11, drawdown = 12.50, percent = 12.50 / 6.11 * 100
    expect(result.maxDrawdownPercent).toBeCloseTo((12.5 / 6.11) * 100, 1)
  })

  it('returns null percent when peak never goes positive', () => {
    // Single loss: cumulative never goes above 0
    const result = computeRiskKpis([losingTrade], 'net')
    expect(result.maxDrawdownDollars).toBeCloseTo(12.5, 2)
    expect(result.maxDrawdownPercent).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Average Risk Per Trade
// ---------------------------------------------------------------------------
describe('computeRiskKpis — avg risk per trade', () => {
  it('averages the absolute value of losing trades', () => {
    const trades = [winningTrade, losingTrade, losingTrade2]
    const result = computeRiskKpis(trades, 'net')
    // avg = (12.50 + 8.75) / 2 = 10.625
    expect(result.avgRiskPerTrade).toBeCloseTo(10.625, 2)
  })

  it('returns null when no losses', () => {
    const result = computeRiskKpis([winningTrade], 'net')
    expect(result.avgRiskPerTrade).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Risk-Reward Ratio
// ---------------------------------------------------------------------------
describe('computeRiskKpis — risk-reward ratio', () => {
  it('calculates avg win / avg loss', () => {
    const trades = [winningTrade, losingTrade, winningTrade2, losingTrade2]
    const result = computeRiskKpis(trades, 'net')
    // avgWin = (6.11 + 25.00) / 2 = 15.555
    // avgLoss = (12.50 + 8.75) / 2 = 10.625
    expect(result.riskRewardRatio).toBeCloseTo(15.555 / 10.625, 2)
  })

  it('returns Infinity when wins only', () => {
    const result = computeRiskKpis([winningTrade, winningTrade2], 'net')
    expect(result.riskRewardRatio).toBe(Infinity)
  })

  it('returns 0 when losses only', () => {
    const result = computeRiskKpis([losingTrade, losingTrade2], 'net')
    expect(result.riskRewardRatio).toBe(0)
  })

  it('returns null when all breakeven', () => {
    const result = computeRiskKpis([breakevenTrade], 'net')
    expect(result.riskRewardRatio).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Size Groups
// ---------------------------------------------------------------------------
describe('computeRiskKpis — size groups', () => {
  it('groups trades by position size', () => {
    // winningTrade(size=1), losingTrade(size=1), winningTrade2(size=2)
    const trades = [winningTrade, losingTrade, winningTrade2]
    const result = computeRiskKpis(trades, 'net')

    expect(result.sizeGroups).toHaveLength(2)
    // sorted by size ascending
    expect(result.sizeGroups[0].size).toBe(1)
    expect(result.sizeGroups[0].tradeCount).toBe(2)
    expect(result.sizeGroups[0].wins).toBe(1)
    expect(result.sizeGroups[0].losses).toBe(1)

    expect(result.sizeGroups[1].size).toBe(2)
    expect(result.sizeGroups[1].tradeCount).toBe(1)
    expect(result.sizeGroups[1].wins).toBe(1)
  })

  it('calculates win rate per group', () => {
    const trades = [winningTrade, losingTrade]
    const result = computeRiskKpis(trades, 'net')
    // Both size=1: 1 win, 1 loss → 50%
    expect(result.sizeGroups[0].winRate).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// Gross mode
// ---------------------------------------------------------------------------
describe('computeRiskKpis — gross mode', () => {
  it('uses gross P&L for calculations', () => {
    const result = computeRiskKpis([winningTrade, losingTrade], 'gross')
    // gross: winning = 7.65, losing = -10.96
    // drawdown peak = 7.65, trough = 7.65 + (-10.96) = -3.31, dd = 10.96
    expect(result.maxDrawdownDollars).toBeCloseTo(10.96, 1)
  })
})
