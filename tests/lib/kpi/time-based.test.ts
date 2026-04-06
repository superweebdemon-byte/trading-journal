import { describe, it, expect, beforeEach } from 'vitest'
import { computeTimeBasedKpis } from '@/lib/kpi/time-based'
import { makeTrade, resetIdCounter } from './helpers'

beforeEach(() => resetIdCounter())

describe('computeTimeBasedKpis', () => {
  describe('edge cases', () => {
    it('returns empty arrays for no trades', () => {
      const result = computeTimeBasedKpis([], 'net')
      expect(result.dayOfWeek).toEqual([])
      expect(result.bestDay).toBeNull()
      expect(result.worstDay).toBeNull()
      expect(result.timeBuckets).toEqual([])
      expect(result.bestBucket).toBeNull()
      expect(result.worstBucket).toBeNull()
      expect(result.monthlyTrend).toEqual([])
    })
  })

  describe('day of week', () => {
    it('groups P&L by day of week and finds best/worst', () => {
      // Wednesday 2026-01-14 (UTC 14:30 => ET 09:30)
      const wed1 = makeTrade({
        pnl: '100',
        entered_at: '2026-01-14T14:30:00.000Z',
        trade_day: '2026-01-14',
      })
      // Friday 2026-01-16 (UTC 14:30 => ET 09:30)
      const fri1 = makeTrade({
        pnl: '-50',
        entered_at: '2026-01-16T14:30:00.000Z',
        trade_day: '2026-01-16',
      })

      const result = computeTimeBasedKpis([wed1, fri1], 'net')
      expect(result.bestDay).toBe('Wednesday')
      expect(result.worstDay).toBe('Friday')
    })
  })

  describe('time buckets', () => {
    it('groups trades into 30-min buckets', () => {
      // 09:30 ET = 14:30 UTC (EST)
      const t1 = makeTrade({
        pnl: '100',
        entered_at: '2026-01-15T14:30:00.000Z',
        trade_day: '2026-01-15',
      })
      // 10:00 ET = 15:00 UTC (EST)
      const t2 = makeTrade({
        pnl: '-50',
        entered_at: '2026-01-15T15:00:00.000Z',
        trade_day: '2026-01-15',
      })

      const result = computeTimeBasedKpis([t1, t2], 'net')
      const bucket0930 = result.timeBuckets.find((b) => b.bucket === '09:30')
      const bucket1000 = result.timeBuckets.find((b) => b.bucket === '10:00')
      expect(bucket0930?.totalPnl).toBe(100)
      expect(bucket1000?.totalPnl).toBe(-50)
    })
  })

  describe('sessions', () => {
    it('classifies trades into correct sessions', () => {
      // pre-market: before 09:30 ET = before 14:30 UTC
      const preMarket = makeTrade({
        pnl: '10',
        entered_at: '2026-01-15T14:00:00.000Z',
        trade_day: '2026-01-15',
      })
      // ny-open: 09:30-11:00 ET = 14:30-16:00 UTC
      const nyOpen = makeTrade({
        pnl: '50',
        entered_at: '2026-01-15T14:30:00.000Z',
        trade_day: '2026-01-15',
      })
      // midday: 11:00-14:00 ET = 16:00-19:00 UTC
      const midday = makeTrade({
        pnl: '-20',
        entered_at: '2026-01-15T16:00:00.000Z',
        trade_day: '2026-01-15',
      })
      // afternoon: 14:00-16:00 ET = 19:00-21:00 UTC
      const afternoon = makeTrade({
        pnl: '30',
        entered_at: '2026-01-15T19:00:00.000Z',
        trade_day: '2026-01-15',
      })

      const result = computeTimeBasedKpis(
        [preMarket, nyOpen, midday, afternoon],
        'net'
      )

      const pre = result.sessions.find((s) => s.session === 'pre-market')!
      const ny = result.sessions.find((s) => s.session === 'ny-open')!
      const mid = result.sessions.find((s) => s.session === 'midday')!
      const aft = result.sessions.find((s) => s.session === 'afternoon')!

      expect(pre.totalPnl).toBe(10)
      expect(pre.tradeCount).toBe(1)
      expect(ny.totalPnl).toBe(50)
      expect(ny.tradeCount).toBe(1)
      expect(mid.totalPnl).toBe(-20)
      expect(mid.tradeCount).toBe(1)
      expect(aft.totalPnl).toBe(30)
      expect(aft.tradeCount).toBe(1)
    })

    it('shows empty sessions with 0 trades', () => {
      const trade = makeTrade({
        pnl: '50',
        entered_at: '2026-01-15T14:30:00.000Z',
        trade_day: '2026-01-15',
      })
      const result = computeTimeBasedKpis([trade], 'net')

      const pre = result.sessions.find((s) => s.session === 'pre-market')!
      expect(pre.tradeCount).toBe(0)
      expect(pre.totalPnl).toBe(0)
      expect(pre.avgPnl).toBeNull()
      expect(pre.winRate).toBeNull()
    })
  })

  describe('monthly trend', () => {
    it('computes monthly P&L with deltas', () => {
      const trades = [
        makeTrade({ pnl: '100', trade_day: '2026-01-15', entered_at: '2026-01-15T14:30:00.000Z' }),
        makeTrade({ pnl: '50', trade_day: '2026-02-10', entered_at: '2026-02-10T14:30:00.000Z' }),
        makeTrade({ pnl: '200', trade_day: '2026-02-15', entered_at: '2026-02-15T14:30:00.000Z' }),
      ]
      const result = computeTimeBasedKpis(trades, 'net')

      expect(result.monthlyTrend).toHaveLength(2)
      expect(result.monthlyTrend[0]).toEqual({
        month: '2026-01',
        pnl: 100,
        delta: null,
      })
      expect(result.monthlyTrend[1]).toEqual({
        month: '2026-02',
        pnl: 250,
        delta: 150,
      })
    })
  })
})
