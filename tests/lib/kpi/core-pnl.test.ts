import { describe, it, expect, beforeEach } from 'vitest'
import { computeCorePnlKpis, getTradePnl, classifyTrade } from '@/lib/kpi/core-pnl'
import { makeTrade, resetIdCounter } from './helpers'

beforeEach(() => resetIdCounter())

describe('getTradePnl', () => {
  it('returns net pnl in net mode', () => {
    const trade = makeTrade({ pnl: '100.50', gross_pnl: '106.42' })
    expect(getTradePnl(trade, 'net')).toBe(100.50)
  })

  it('returns gross pnl in gross mode', () => {
    const trade = makeTrade({ pnl: '100.50', gross_pnl: '106.42' })
    expect(getTradePnl(trade, 'gross')).toBe(106.42)
  })
})

describe('classifyTrade', () => {
  it('classifies positive as win', () => expect(classifyTrade(10)).toBe('win'))
  it('classifies negative as loss', () => expect(classifyTrade(-5)).toBe('loss'))
  it('classifies zero as breakeven', () => expect(classifyTrade(0)).toBe('breakeven'))
})

describe('computeCorePnlKpis', () => {
  describe('edge cases', () => {
    it('returns nulls for empty trades', () => {
      const result = computeCorePnlKpis([], 'net')
      expect(result.winRate).toBeNull()
      expect(result.profitFactor).toBeNull()
      expect(result.avgWin).toBeNull()
      expect(result.avgLoss).toBeNull()
      expect(result.totalPnl).toBe(0)
      expect(result.totalTrades).toBe(0)
      expect(result.largestWin).toBeNull()
      expect(result.largestLoss).toBeNull()
      expect(result.avgDurationSeconds).toBeNull()
    })

    it('handles single winning trade', () => {
      const trades = [makeTrade({ pnl: '50.00', gross_pnl: '55.92' })]
      const result = computeCorePnlKpis(trades, 'net')
      expect(result.winRate).toBe(100)
      expect(result.profitFactor).toBe(Infinity)
      expect(result.avgWin).toBe(50)
      expect(result.avgLoss).toBeNull()
      expect(result.totalPnl).toBe(50)
      expect(result.totalTrades).toBe(1)
      expect(result.largestWin).toBe(50)
      expect(result.largestLoss).toBeNull()
    })

    it('handles all losses', () => {
      const trades = [
        makeTrade({ pnl: '-10', gross_pnl: '-4.08' }),
        makeTrade({ pnl: '-20', gross_pnl: '-14.08' }),
      ]
      const result = computeCorePnlKpis(trades, 'net')
      expect(result.winRate).toBe(0)
      expect(result.profitFactor).toBeNull()
      expect(result.avgWin).toBeNull()
      expect(result.avgLoss).toBe(15)
      expect(result.largestWin).toBeNull()
      expect(result.largestLoss).toBe(-20)
    })

    it('handles all breakeven trades', () => {
      const trades = [
        makeTrade({ pnl: '0', gross_pnl: '5.92' }),
        makeTrade({ pnl: '0', gross_pnl: '5.92' }),
      ]
      const result = computeCorePnlKpis(trades, 'net')
      expect(result.winRate).toBe(0)
      expect(result.profitFactor).toBeNull()
      expect(result.avgWin).toBeNull()
      expect(result.avgLoss).toBeNull()
    })
  })

  describe('win rate', () => {
    it('computes correct win rate with mixed outcomes', () => {
      const trades = [
        makeTrade({ pnl: '100' }),
        makeTrade({ pnl: '-50' }),
        makeTrade({ pnl: '75' }),
        makeTrade({ pnl: '0', gross_pnl: '5.92' }),
      ]
      const result = computeCorePnlKpis(trades, 'net')
      expect(result.winRate).toBe(50)
    })
  })

  describe('profit factor', () => {
    it('computes correct profit factor', () => {
      const trades = [
        makeTrade({ pnl: '200' }),
        makeTrade({ pnl: '-100' }),
      ]
      const result = computeCorePnlKpis(trades, 'net')
      expect(result.profitFactor).toBe(2.0)
    })
  })

  describe('avg win / avg loss', () => {
    it('computes averages and ratio correctly', () => {
      const trades = [
        makeTrade({ pnl: '100' }),
        makeTrade({ pnl: '200' }),
        makeTrade({ pnl: '-50' }),
      ]
      const result = computeCorePnlKpis(trades, 'net')
      expect(result.avgWin).toBe(150)
      expect(result.avgLoss).toBe(50)
      expect(result.winLossRatio).toBe(3)
    })
  })

  describe('net P&L aggregations', () => {
    it('computes total P&L', () => {
      const trades = [
        makeTrade({ pnl: '100' }),
        makeTrade({ pnl: '-30' }),
        makeTrade({ pnl: '50' }),
      ]
      const result = computeCorePnlKpis(trades, 'net')
      expect(result.totalPnl).toBe(120)
    })

    it('groups daily P&L by trade_day', () => {
      const trades = [
        makeTrade({ pnl: '100', trade_day: '2026-01-15' }),
        makeTrade({ pnl: '50', trade_day: '2026-01-15' }),
        makeTrade({ pnl: '-30', trade_day: '2026-01-16' }),
      ]
      const result = computeCorePnlKpis(trades, 'net')
      expect(result.dailyPnl['2026-01-15']).toBe(150)
      expect(result.dailyPnl['2026-01-16']).toBe(-30)
    })

    it('groups monthly P&L by year-month', () => {
      const trades = [
        makeTrade({ pnl: '100', trade_day: '2026-01-15' }),
        makeTrade({ pnl: '50', trade_day: '2026-02-10' }),
      ]
      const result = computeCorePnlKpis(trades, 'net')
      expect(result.monthlyPnl['2026-01']).toBe(100)
      expect(result.monthlyPnl['2026-02']).toBe(50)
    })
  })

  describe('largest win / largest loss', () => {
    it('finds the correct extremes', () => {
      const trades = [
        makeTrade({ pnl: '100' }),
        makeTrade({ pnl: '400.50' }),
        makeTrade({ pnl: '-208' }),
        makeTrade({ pnl: '-50' }),
      ]
      const result = computeCorePnlKpis(trades, 'net')
      expect(result.largestWin).toBe(400.50)
      expect(result.largestLoss).toBe(-208)
    })
  })

  describe('average duration', () => {
    it('computes average duration in seconds', () => {
      const trades = [
        makeTrade({ trade_duration: '00:10:00.0000000' }),
        makeTrade({ trade_duration: '00:20:00.0000000' }),
      ]
      const result = computeCorePnlKpis(trades, 'net')
      expect(result.avgDurationSeconds).toBe(900) // (600 + 1200) / 2
    })

    it('handles null durations', () => {
      const trades = [
        makeTrade({ trade_duration: null }),
        makeTrade({ trade_duration: '00:10:00.0000000' }),
      ]
      const result = computeCorePnlKpis(trades, 'net')
      expect(result.avgDurationSeconds).toBe(600)
    })
  })

  describe('gross mode', () => {
    it('uses gross_pnl for classification and calculation', () => {
      // Net breakeven trade that is a gross win
      const trades = [
        makeTrade({ pnl: '0', gross_pnl: '5.92' }),
        makeTrade({ pnl: '-10', gross_pnl: '-4.08' }),
      ]
      const netResult = computeCorePnlKpis(trades, 'net')
      const grossResult = computeCorePnlKpis(trades, 'gross')

      // Net: 0 wins, 1 loss, 1 breakeven => win rate 0%
      expect(netResult.winRate).toBe(0)
      // Gross: 1 win (5.92), 1 loss (-4.08) => win rate 50%
      expect(grossResult.winRate).toBe(50)
    })
  })
})
