import { describe, it, expect } from 'vitest'
import { dedup } from '../dedup'
import { makeNormalizedTrade } from '@/lib/__tests__/fixtures'

describe('dedup', () => {
  it('returns all trades as new when existingIds is empty', () => {
    const trades = [
      makeNormalizedTrade({ topstep_id: 1 }),
      makeNormalizedTrade({ topstep_id: 2 }),
      makeNormalizedTrade({ topstep_id: 3 }),
    ]
    const result = dedup(trades, new Set())
    expect(result.newTrades).toHaveLength(3)
    expect(result.duplicates).toHaveLength(0)
  })

  it('returns all trades as duplicates when all IDs exist', () => {
    const trades = [
      makeNormalizedTrade({ topstep_id: 1 }),
      makeNormalizedTrade({ topstep_id: 2 }),
    ]
    const result = dedup(trades, new Set([1, 2]))
    expect(result.newTrades).toHaveLength(0)
    expect(result.duplicates).toHaveLength(2)
  })

  it('separates new and duplicate trades correctly', () => {
    const trades = [
      makeNormalizedTrade({ topstep_id: 1 }),
      makeNormalizedTrade({ topstep_id: 2 }),
      makeNormalizedTrade({ topstep_id: 3 }),
    ]
    const result = dedup(trades, new Set([2]))
    expect(result.newTrades).toHaveLength(2)
    expect(result.duplicates).toHaveLength(1)
    expect(result.newTrades.map((t) => t.topstep_id)).toEqual([1, 3])
    expect(result.duplicates[0].topstep_id).toBe(2)
  })

  it('returns empty arrays for empty input', () => {
    const result = dedup([], new Set([1, 2, 3]))
    expect(result.newTrades).toHaveLength(0)
    expect(result.duplicates).toHaveLength(0)
  })

  it('handles single trade that is new', () => {
    const trades = [makeNormalizedTrade({ topstep_id: 42 })]
    const result = dedup(trades, new Set([1, 2, 3]))
    expect(result.newTrades).toHaveLength(1)
    expect(result.duplicates).toHaveLength(0)
  })

  it('handles single trade that is a duplicate', () => {
    const trades = [makeNormalizedTrade({ topstep_id: 2 })]
    const result = dedup(trades, new Set([1, 2, 3]))
    expect(result.newTrades).toHaveLength(0)
    expect(result.duplicates).toHaveLength(1)
  })

  it('preserves trade data in results', () => {
    const trade = makeNormalizedTrade({ topstep_id: 5, pnl: '99.99' })
    const result = dedup([trade], new Set())
    expect(result.newTrades[0].pnl).toBe('99.99')
    expect(result.newTrades[0].topstep_id).toBe(5)
  })
})
