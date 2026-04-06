import { describe, it, expect, beforeEach } from 'vitest'
import { computeBehavioralKpis } from '@/lib/kpi/behavioral'
import { makeTrade, resetIdCounter, DEFAULT_SETTINGS } from './helpers'

beforeEach(() => resetIdCounter())

describe('computeBehavioralKpis', () => {
  describe('edge cases', () => {
    it('returns zeros/nulls for empty trades', () => {
      const result = computeBehavioralKpis([], DEFAULT_SETTINGS, 'net')
      expect(result.revengeTradeCount).toBe(0)
      expect(result.overtradeDays).toEqual([])
      expect(result.maxConsecutiveWins).toBe(0)
      expect(result.maxConsecutiveLosses).toBe(0)
      expect(result.tiltTradeCount).toBe(0)
      expect(result.tiltAvgPnl).toBeNull()
      expect(result.tiltDelta).toBeNull()
    })

    it('handles single trade', () => {
      const trades = [makeTrade({ pnl: '100' })]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.revengeTradeCount).toBe(0)
      expect(result.maxConsecutiveWins).toBe(1)
      expect(result.maxConsecutiveLosses).toBe(0)
    })
  })

  describe('revenge trades', () => {
    it('detects revenge trade within window', () => {
      const trades = [
        makeTrade({
          pnl: '-100',
          entered_at: '2026-01-15T14:30:00.000Z',
          exited_at: '2026-01-15T14:35:00.000Z',
        }),
        makeTrade({
          pnl: '50',
          entered_at: '2026-01-15T14:36:00.000Z', // 60s after prior exit
          exited_at: '2026-01-15T14:40:00.000Z',
        }),
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.revengeTradeCount).toBe(1)
    })

    it('does not flag if gap exceeds window', () => {
      const trades = [
        makeTrade({
          pnl: '-100',
          entered_at: '2026-01-15T14:30:00.000Z',
          exited_at: '2026-01-15T14:35:00.000Z',
        }),
        makeTrade({
          pnl: '50',
          entered_at: '2026-01-15T14:40:00.000Z', // 300s after prior exit
          exited_at: '2026-01-15T14:45:00.000Z',
        }),
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.revengeTradeCount).toBe(0)
    })

    it('does not flag after a win', () => {
      const trades = [
        makeTrade({
          pnl: '100',
          entered_at: '2026-01-15T14:30:00.000Z',
          exited_at: '2026-01-15T14:35:00.000Z',
        }),
        makeTrade({
          pnl: '50',
          entered_at: '2026-01-15T14:36:00.000Z',
          exited_at: '2026-01-15T14:40:00.000Z',
        }),
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.revengeTradeCount).toBe(0)
    })

    it('does not flag after breakeven', () => {
      const trades = [
        makeTrade({
          pnl: '0',
          gross_pnl: '5.92',
          entered_at: '2026-01-15T14:30:00.000Z',
          exited_at: '2026-01-15T14:35:00.000Z',
        }),
        makeTrade({
          pnl: '50',
          entered_at: '2026-01-15T14:36:00.000Z',
          exited_at: '2026-01-15T14:40:00.000Z',
        }),
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.revengeTradeCount).toBe(0)
    })

    it('excludes negative gap (overlapping trades)', () => {
      const trades = [
        makeTrade({
          pnl: '-100',
          entered_at: '2026-01-15T14:30:00.000Z',
          exited_at: '2026-01-15T14:40:00.000Z',
        }),
        makeTrade({
          pnl: '50',
          entered_at: '2026-01-15T14:35:00.000Z', // entered before prior exited
          exited_at: '2026-01-15T14:45:00.000Z',
        }),
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.revengeTradeCount).toBe(0)
    })
  })

  describe('overtrading', () => {
    it('flags days exceeding 2x rolling average', () => {
      // Day 1: 1 trade, Day 2: 1 trade, Day 3: 3 trades (avg of prior = 1.0, threshold = 2.0)
      const trades = [
        makeTrade({ trade_day: '2026-01-13' }),
        makeTrade({ trade_day: '2026-01-14' }),
        makeTrade({ trade_day: '2026-01-15' }),
        makeTrade({ trade_day: '2026-01-15' }),
        makeTrade({ trade_day: '2026-01-15' }),
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.overtradeDays).toContain('2026-01-15')
    })

    it('does not flag first day (no prior history)', () => {
      const trades = [
        makeTrade({ trade_day: '2026-01-15' }),
        makeTrade({ trade_day: '2026-01-15' }),
        makeTrade({ trade_day: '2026-01-15' }),
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.overtradeDays).toEqual([])
    })

    it('does not flag exact match (strictly greater than)', () => {
      // Day 1: 1 trade, Day 2: 2 trades (avg=1, threshold=2.0, count=2 not > 2)
      const trades = [
        makeTrade({ trade_day: '2026-01-13' }),
        makeTrade({ trade_day: '2026-01-14' }),
        makeTrade({ trade_day: '2026-01-14' }),
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.overtradeDays).toEqual([])
    })
  })

  describe('consecutive streaks', () => {
    it('computes max consecutive wins and losses', () => {
      const trades = [
        makeTrade({ pnl: '10', entered_at: '2026-01-15T14:30:00Z' }),
        makeTrade({ pnl: '20', entered_at: '2026-01-15T14:31:00Z' }),
        makeTrade({ pnl: '30', entered_at: '2026-01-15T14:32:00Z' }),
        makeTrade({ pnl: '-10', entered_at: '2026-01-15T14:33:00Z' }),
        makeTrade({ pnl: '-20', entered_at: '2026-01-15T14:34:00Z' }),
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.maxConsecutiveWins).toBe(3)
      expect(result.maxConsecutiveLosses).toBe(2)
    })

    it('breakeven resets both streaks', () => {
      const trades = [
        makeTrade({ pnl: '10', entered_at: '2026-01-15T14:30:00Z' }),
        makeTrade({ pnl: '20', entered_at: '2026-01-15T14:31:00Z' }),
        makeTrade({ pnl: '0', gross_pnl: '5.92', entered_at: '2026-01-15T14:32:00Z' }),
        makeTrade({ pnl: '30', entered_at: '2026-01-15T14:33:00Z' }),
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.maxConsecutiveWins).toBe(2) // breakeven broke the streak
    })

    it('handles all wins', () => {
      const trades = [
        makeTrade({ pnl: '10', entered_at: '2026-01-15T14:30:00Z' }),
        makeTrade({ pnl: '20', entered_at: '2026-01-15T14:31:00Z' }),
        makeTrade({ pnl: '30', entered_at: '2026-01-15T14:32:00Z' }),
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.maxConsecutiveWins).toBe(3)
      expect(result.maxConsecutiveLosses).toBe(0)
    })

    it('handles all losses', () => {
      const trades = [
        makeTrade({ pnl: '-10', entered_at: '2026-01-15T14:30:00Z' }),
        makeTrade({ pnl: '-20', entered_at: '2026-01-15T14:31:00Z' }),
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.maxConsecutiveWins).toBe(0)
      expect(result.maxConsecutiveLosses).toBe(2)
    })
  })

  describe('tilt indicator', () => {
    it('detects tilt trades after 2+ consecutive losses', () => {
      const trades = [
        makeTrade({ pnl: '-10', entered_at: '2026-01-15T14:30:00Z' }),
        makeTrade({ pnl: '-20', entered_at: '2026-01-15T14:31:00Z' }),
        makeTrade({ pnl: '5', entered_at: '2026-01-15T14:32:00Z' }), // tilt trade
        makeTrade({ pnl: '100', entered_at: '2026-01-15T14:33:00Z' }), // not tilt (streak reset)
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.tiltTradeCount).toBe(1)
      expect(result.tiltAvgPnl).toBe(5)
      expect(result.overallAvgPnl).toBe(18.75) // (-10 + -20 + 5 + 100) / 4
      expect(result.tiltDelta).toBeCloseTo(5 - 18.75, 2)
    })

    it('includes multiple tilt trades in extended streak', () => {
      const trades = [
        makeTrade({ pnl: '-10', entered_at: '2026-01-15T14:30:00Z' }),
        makeTrade({ pnl: '-20', entered_at: '2026-01-15T14:31:00Z' }),
        makeTrade({ pnl: '-30', entered_at: '2026-01-15T14:32:00Z' }), // tilt (2 prior losses)
        makeTrade({ pnl: '-40', entered_at: '2026-01-15T14:33:00Z' }), // tilt (3 prior losses)
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.tiltTradeCount).toBe(2)
      expect(result.tiltAvgPnl).toBe(-35) // (-30 + -40) / 2
    })

    it('returns null tilt when no 2+ loss streaks', () => {
      const trades = [
        makeTrade({ pnl: '-10', entered_at: '2026-01-15T14:30:00Z' }),
        makeTrade({ pnl: '20', entered_at: '2026-01-15T14:31:00Z' }),
        makeTrade({ pnl: '-30', entered_at: '2026-01-15T14:32:00Z' }),
        makeTrade({ pnl: '40', entered_at: '2026-01-15T14:33:00Z' }),
      ]
      const result = computeBehavioralKpis(trades, DEFAULT_SETTINGS, 'net')
      expect(result.tiltTradeCount).toBe(0)
      expect(result.tiltAvgPnl).toBeNull()
      expect(result.tiltDelta).toBeNull()
    })
  })
})
