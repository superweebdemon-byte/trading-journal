import { describe, it, expect, beforeEach } from 'vitest'
import { computeRiskKpis } from '@/lib/kpi/risk'
import { makeTrade, resetIdCounter } from './helpers'

beforeEach(() => resetIdCounter())

describe('computeRiskKpis', () => {
  describe('edge cases', () => {
    it('returns zeros/nulls for empty trades', () => {
      const result = computeRiskKpis([], 'net')
      expect(result.maxDrawdownDollars).toBe(0)
      expect(result.maxDrawdownPercent).toBeNull()
      expect(result.avgRiskPerTrade).toBeNull()
      expect(result.riskRewardRatio).toBeNull()
      expect(result.sizeGroups).toEqual([])
      expect(result.sizeCorrelation).toBeNull()
    })

    it('handles single winning trade', () => {
      const trades = [makeTrade({ pnl: '100' })]
      const result = computeRiskKpis(trades, 'net')
      expect(result.maxDrawdownDollars).toBe(0) // monotonically increasing
      expect(result.avgRiskPerTrade).toBeNull() // no losses
      expect(result.riskRewardRatio).toBe(Infinity) // no losses
    })

    it('handles single losing trade', () => {
      const trades = [makeTrade({ pnl: '-50' })]
      const result = computeRiskKpis(trades, 'net')
      expect(result.maxDrawdownDollars).toBe(50) // peak=0, trough=-50
      expect(result.maxDrawdownPercent).toBeNull() // peak=0, pct undefined
      expect(result.avgRiskPerTrade).toBe(50)
      expect(result.riskRewardRatio).toBe(0) // no wins
    })
  })

  describe('max drawdown', () => {
    it('computes peak-to-trough correctly', () => {
      const trades = [
        makeTrade({ pnl: '100', entered_at: '2026-01-15T14:30:00Z' }),
        makeTrade({ pnl: '50', entered_at: '2026-01-15T14:31:00Z' }),
        makeTrade({ pnl: '-200', entered_at: '2026-01-15T14:32:00Z' }),
        makeTrade({ pnl: '100', entered_at: '2026-01-15T14:33:00Z' }),
      ]
      // cum: 100, 150, -50, 50
      // peak: 100, 150, 150, 150
      // dd: 0, 0, 200, 100
      const result = computeRiskKpis(trades, 'net')
      expect(result.maxDrawdownDollars).toBe(200)
      expect(result.maxDrawdownPercent).toBeCloseTo((200 / 150) * 100, 1)
    })

    it('returns 0 drawdown for monotonically increasing', () => {
      const trades = [
        makeTrade({ pnl: '10', entered_at: '2026-01-15T14:30:00Z' }),
        makeTrade({ pnl: '20', entered_at: '2026-01-15T14:31:00Z' }),
        makeTrade({ pnl: '30', entered_at: '2026-01-15T14:32:00Z' }),
      ]
      const result = computeRiskKpis(trades, 'net')
      expect(result.maxDrawdownDollars).toBe(0)
    })

    it('handles drawdown > 100% when P&L goes negative', () => {
      const trades = [
        makeTrade({ pnl: '100', entered_at: '2026-01-15T14:30:00Z' }),
        makeTrade({ pnl: '-150', entered_at: '2026-01-15T14:31:00Z' }),
      ]
      // cum: 100, -50. peak: 100, 100. dd: 0, 150.
      // pct = 150/100 = 150%
      const result = computeRiskKpis(trades, 'net')
      expect(result.maxDrawdownDollars).toBe(150)
      expect(result.maxDrawdownPercent).toBe(150)
    })
  })

  describe('avg risk per trade', () => {
    it('computes average of absolute loss amounts', () => {
      const trades = [
        makeTrade({ pnl: '100' }),
        makeTrade({ pnl: '-50' }),
        makeTrade({ pnl: '-150' }),
      ]
      const result = computeRiskKpis(trades, 'net')
      expect(result.avgRiskPerTrade).toBe(100) // (50 + 150) / 2
    })

    it('returns null when no losses', () => {
      const trades = [
        makeTrade({ pnl: '100' }),
        makeTrade({ pnl: '50' }),
      ]
      const result = computeRiskKpis(trades, 'net')
      expect(result.avgRiskPerTrade).toBeNull()
    })
  })

  describe('risk-reward ratio', () => {
    it('computes avg_win / avg_loss', () => {
      const trades = [
        makeTrade({ pnl: '100' }),
        makeTrade({ pnl: '200' }),
        makeTrade({ pnl: '-50' }),
        makeTrade({ pnl: '-150' }),
      ]
      // avg win = 150, avg loss = 100
      const result = computeRiskKpis(trades, 'net')
      expect(result.riskRewardRatio).toBe(1.5)
    })

    it('returns Infinity when no losses', () => {
      const trades = [makeTrade({ pnl: '100' })]
      const result = computeRiskKpis(trades, 'net')
      expect(result.riskRewardRatio).toBe(Infinity)
    })

    it('returns 0 when no wins', () => {
      const trades = [makeTrade({ pnl: '-100' })]
      const result = computeRiskKpis(trades, 'net')
      expect(result.riskRewardRatio).toBe(0)
    })

    it('returns null when no trades', () => {
      const result = computeRiskKpis([], 'net')
      expect(result.riskRewardRatio).toBeNull()
    })
  })

  describe('position sizing', () => {
    it('groups trades by size', () => {
      const trades = [
        makeTrade({ pnl: '100', size: 1 }),
        makeTrade({ pnl: '-50', size: 1 }),
        makeTrade({ pnl: '200', size: 4 }),
      ]
      const result = computeRiskKpis(trades, 'net')

      const size1 = result.sizeGroups.find((g) => g.size === 1)!
      expect(size1.tradeCount).toBe(2)
      expect(size1.wins).toBe(1)
      expect(size1.losses).toBe(1)
      expect(size1.avgPnl).toBe(25) // (100 + -50) / 2

      const size4 = result.sizeGroups.find((g) => g.size === 4)!
      expect(size4.tradeCount).toBe(1)
      expect(size4.wins).toBe(1)
      expect(size4.winRate).toBe(100)
    })

    it('sorts size groups ascending', () => {
      const trades = [
        makeTrade({ pnl: '10', size: 4 }),
        makeTrade({ pnl: '10', size: 1 }),
        makeTrade({ pnl: '10', size: 2 }),
      ]
      const result = computeRiskKpis(trades, 'net')
      expect(result.sizeGroups.map((g) => g.size)).toEqual([1, 2, 4])
    })
  })

  describe('Pearson correlation', () => {
    it('computes negative correlation when larger sizes lose', () => {
      const trades = [
        makeTrade({ pnl: '100', size: 1 }),
        makeTrade({ pnl: '80', size: 2 }),
        makeTrade({ pnl: '-50', size: 4 }),
        makeTrade({ pnl: '-100', size: 8 }),
      ]
      const result = computeRiskKpis(trades, 'net')
      expect(result.sizeCorrelation).not.toBeNull()
      expect(result.sizeCorrelation!).toBeLessThan(0)
    })

    it('returns null for all same size (zero variance)', () => {
      const trades = [
        makeTrade({ pnl: '100', size: 2 }),
        makeTrade({ pnl: '-50', size: 2 }),
      ]
      const result = computeRiskKpis(trades, 'net')
      expect(result.sizeCorrelation).toBeNull()
    })

    it('returns null for single trade', () => {
      const trades = [makeTrade({ pnl: '100', size: 1 })]
      const result = computeRiskKpis(trades, 'net')
      expect(result.sizeCorrelation).toBeNull()
    })
  })

  describe('gross mode', () => {
    it('uses gross P&L for all calculations', () => {
      const trades = [
        makeTrade({ pnl: '0', gross_pnl: '5.92' }), // net breakeven, gross win
        makeTrade({ pnl: '-10', gross_pnl: '-4.08' }), // net loss, gross loss
      ]
      const netResult = computeRiskKpis(trades, 'net')
      const grossResult = computeRiskKpis(trades, 'gross')

      // Net: 1 loss (-10), avg risk = 10
      expect(netResult.avgRiskPerTrade).toBe(10)
      // Gross: 1 loss (-4.08), avg risk = 4.08
      expect(grossResult.avgRiskPerTrade).toBeCloseTo(4.08, 2)
    })
  })
})
