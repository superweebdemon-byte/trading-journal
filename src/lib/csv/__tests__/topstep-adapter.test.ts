import { describe, it, expect } from 'vitest'
import { adaptTopstepRows } from '../topstep-adapter'
import { makeRawRow } from '@/lib/__tests__/fixtures'

describe('adaptTopstepRows — valid row', () => {
  const { trades, errors } = adaptTopstepRows([makeRawRow()])

  it('produces one trade with no errors', () => {
    expect(trades).toHaveLength(1)
    expect(errors).toHaveLength(0)
  })

  it('parses topstep_id as integer', () => {
    expect(trades[0].topstep_id).toBe(100001)
  })

  it('normalizes contract symbol', () => {
    expect(trades[0].contract_symbol).toBe('MNQ')
    expect(trades[0].contract_expiry).toBe('Dec 2025')
  })

  it('converts timestamps to ISO UTC', () => {
    expect(trades[0].entered_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(trades[0].exited_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('parses trade_day as YYYY-MM-DD', () => {
    expect(trades[0].trade_day).toBe('2025-11-18')
  })

  it('keeps entry_price and exit_price as trimmed strings', () => {
    expect(trades[0].entry_price).toBe('21050.25')
    expect(trades[0].exit_price).toBe('21065.50')
  })

  it('calculates gross_pnl = pnl + fees', () => {
    // net PnL = 6.11, fees = 1.54, gross = 7.65
    expect(parseFloat(trades[0].gross_pnl)).toBeCloseTo(7.65, 2)
  })

  it('determines outcome from PnL', () => {
    expect(trades[0].outcome).toBe('win')
  })

  it('parses size as integer', () => {
    expect(trades[0].size).toBe(1)
  })

  it('preserves raw_csv_row', () => {
    expect(trades[0].raw_csv_row.Id).toBe('100001')
  })
})

describe('adaptTopstepRows — negative P&L', () => {
  const row = makeRawRow({ PnL: '-25.50', Fees: '1.54' })
  const { trades } = adaptTopstepRows([row])

  it('correctly classifies as loss', () => {
    expect(trades[0].outcome).toBe('loss')
  })

  it('calculates gross_pnl for negative net', () => {
    // gross = -25.50 + 1.54 = -23.96
    expect(parseFloat(trades[0].gross_pnl)).toBeCloseTo(-23.96, 2)
  })
})

describe('adaptTopstepRows — zero fees', () => {
  const row = makeRawRow({ Fees: '0', PnL: '10.00' })
  const { trades } = adaptTopstepRows([row])

  it('handles zero fees', () => {
    expect(trades[0].fees).toBe('0')
    expect(parseFloat(trades[0].gross_pnl)).toBeCloseTo(10.0, 2)
  })
})

describe('adaptTopstepRows — breakeven P&L', () => {
  const row = makeRawRow({ PnL: '0' })
  const { trades } = adaptTopstepRows([row])

  it('classifies zero PnL as breakeven', () => {
    expect(trades[0].outcome).toBe('breakeven')
  })
})

describe('adaptTopstepRows — long duration string', () => {
  const row = makeRawRow({ TradeDuration: '02:45:30.9999999' })
  const { trades } = adaptTopstepRows([row])

  it('preserves full duration string', () => {
    expect(trades[0].trade_duration).toBe('02:45:30.9999999')
  })
})

describe('adaptTopstepRows — empty duration', () => {
  const row = makeRawRow({ TradeDuration: '' })
  const { trades } = adaptTopstepRows([row])

  it('returns null for empty duration', () => {
    expect(trades[0].trade_duration).toBeNull()
  })
})

describe('adaptTopstepRows — invalid timestamp', () => {
  const row = makeRawRow({ EnteredAt: 'not-a-date' })
  const { trades, errors } = adaptTopstepRows([row])

  it('captures error and skips bad row', () => {
    expect(trades).toHaveLength(0)
    expect(errors).toHaveLength(1)
    expect(errors[0].row).toBe(0)
    expect(errors[0].topstep_id).toBe('100001')
    expect(errors[0].message).toContain('timestamp')
  })
})

describe('adaptTopstepRows — multiple rows with one bad', () => {
  const good = makeRawRow({ Id: '1' })
  const bad = makeRawRow({ Id: '2', EnteredAt: 'garbage' })
  const good2 = makeRawRow({ Id: '3' })
  const { trades, errors } = adaptTopstepRows([good, bad, good2])

  it('processes good rows and records errors for bad ones', () => {
    expect(trades).toHaveLength(2)
    expect(errors).toHaveLength(1)
    expect(errors[0].topstep_id).toBe('2')
  })
})

describe('adaptTopstepRows — empty input', () => {
  const { trades, errors } = adaptTopstepRows([])

  it('returns empty arrays', () => {
    expect(trades).toHaveLength(0)
    expect(errors).toHaveLength(0)
  })
})

describe('adaptTopstepRows — missing Commissions field', () => {
  const row = makeRawRow({ Commissions: '' })
  const { trades } = adaptTopstepRows([row])

  it('defaults commissions to "0"', () => {
    expect(trades[0].commissions).toBe('0')
  })
})
