'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { getContractSpec } from '@/lib/csv/contract-specs'
import type { NormalizedTrade } from '@/lib/types'

const CONTRACTS = ['MNQ', 'MYM', 'MES', 'M2K', 'MCL', 'MGC'] as const
const FEE_PER_CONTRACT = 2.96

interface ManualEntryFormProps {
  onSubmit: (trade: NormalizedTrade) => void
  onSubmitAndContinue: (trade: NormalizedTrade) => void
}

interface FormState {
  contract: string
  direction: 'Long' | 'Short'
  entryPrice: string
  exitPrice: string
  stoppedOut: boolean
  entryTime: string
  exitTime: string
  size: string
  fees: string
  feesAuto: boolean
  stopLoss: string
}

const initialForm: FormState = {
  contract: 'MNQ',
  direction: 'Long',
  entryPrice: '',
  exitPrice: '',
  stoppedOut: false,
  entryTime: '',
  exitTime: '',
  size: '1',
  fees: FEE_PER_CONTRACT.toFixed(2),
  feesAuto: true,
  stopLoss: '',
}

function parseNum(v: string): number | null {
  const cleaned = v.replace(/,/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

function parseDatetime(v: string): Date | null {
  // Expected: MM/DD/YYYY HH:MM:SS
  const match = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/)
  if (!match) return null
  const [, mm, dd, yyyy, hh, mi, ss] = match
  const d = new Date(
    parseInt(yyyy),
    parseInt(mm) - 1,
    parseInt(dd),
    parseInt(hh),
    parseInt(mi),
    parseInt(ss),
  )
  return isNaN(d.getTime()) ? null : d
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(Math.abs(ms) / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatPgInterval(ms: number): string {
  const totalSec = Math.floor(Math.abs(ms) / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function toIso(d: Date): string {
  return d.toISOString()
}

function toTradeDay(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatSessionDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[m - 1]} ${d}, ${y}`
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono), monospace',
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: '#6E7681',
  marginBottom: '4px',
  display: 'block',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(13,17,23,0.6)',
  border: '1px solid rgba(48,54,61,0.25)',
  borderRadius: '4px',
  padding: '7px 10px',
  fontSize: '12px',
  fontFamily: 'var(--font-mono), monospace',
  color: '#E6EDF3',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const focusBorder = 'rgba(0,212,170,0.45)'

function FormInput({
  value,
  onChange,
  placeholder,
  style: extraStyle,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  style?: React.CSSProperties
  disabled?: boolean
}) {
  return (
    <input
      type="text"
      className="tabular-nums"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{ ...inputStyle, ...extraStyle }}
      onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder }}
      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(48,54,61,0.25)' }}
    />
  )
}

export function ManualEntryForm({ onSubmit, onSubmitAndContinue }: ManualEntryFormProps) {
  const [form, setForm] = useState<FormState>(initialForm)

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }))
  }, [])

  // Auto-calc fees when size or feesAuto changes
  useEffect(() => {
    if (form.feesAuto) {
      const size = parseNum(form.size) ?? 0
      set('fees', (size * FEE_PER_CONTRACT).toFixed(2))
    }
  }, [form.size, form.feesAuto, set])

  // Stopped out: auto-fill exit price from stop loss
  useEffect(() => {
    if (form.stoppedOut && form.stopLoss) {
      set('exitPrice', form.stopLoss)
    }
  }, [form.stoppedOut, form.stopLoss, set])

  const spec = useMemo(() => getContractSpec(form.contract), [form.contract])

  const calc = useMemo(() => {
    const entry = parseNum(form.entryPrice)
    const exit = parseNum(form.exitPrice)
    const size = parseNum(form.size) ?? 0
    const fees = parseNum(form.fees) ?? 0
    const stopLoss = parseNum(form.stopLoss)
    const entryTime = parseDatetime(form.entryTime)
    const exitTime = parseDatetime(form.exitTime)

    let pnl: number | null = null
    let grossPnl: number | null = null
    let duration: number | null = null
    let durationStr: string | null = null
    let risk: number | null = null
    let rr: number | null = null

    if (entry !== null && exit !== null && spec && size > 0) {
      const ticks = (exit - entry) / spec.tickSize
      grossPnl = ticks * spec.tickValue * size
      if (form.direction === 'Short') grossPnl = -grossPnl
      pnl = grossPnl - fees
    }

    if (entryTime && exitTime) {
      duration = exitTime.getTime() - entryTime.getTime()
      durationStr = formatDuration(duration)
    }

    if (entry !== null && stopLoss !== null && spec && size > 0) {
      risk = Math.abs(entry - stopLoss) / spec.tickSize * spec.tickValue * size
    }

    if (pnl !== null && risk !== null && risk > 0) {
      rr = Math.abs(pnl + fees) / risk
    }

    return { pnl, grossPnl, duration, durationStr, risk, rr }
  }, [form, spec])

  const sessionDate = useMemo(() => {
    const d = parseDatetime(form.entryTime)
    if (!d) return null
    return formatSessionDate(toTradeDay(d))
  }, [form.entryTime])

  const buildTrade = useCallback((): NormalizedTrade | null => {
    const entry = parseNum(form.entryPrice)
    const exit = parseNum(form.exitPrice)
    const size = parseNum(form.size)
    const fees = parseNum(form.fees) ?? 0
    const entryTime = parseDatetime(form.entryTime)
    const exitTime = parseDatetime(form.exitTime)

    if (!entry || !exit || !size || !entryTime || !exitTime || !spec) return null
    if (calc.pnl === null || calc.grossPnl === null) return null

    const outcome: 'win' | 'loss' | 'breakeven' =
      calc.pnl > 0 ? 'win' : calc.pnl < 0 ? 'loss' : 'breakeven'

    const durationMs = exitTime.getTime() - entryTime.getTime()

    return {
      topstep_id: 0, // Manual entry — no Topstep ID
      contract_name: form.contract,
      contract_symbol: form.contract,
      contract_expiry: null,
      entered_at: toIso(entryTime),
      exited_at: toIso(exitTime),
      entry_price: entry.toString(),
      exit_price: exit.toString(),
      fees: fees.toString(),
      pnl: calc.pnl.toFixed(2),
      gross_pnl: calc.grossPnl.toFixed(2),
      size,
      trade_type: form.direction,
      outcome,
      trade_day: toTradeDay(entryTime),
      trade_duration: formatPgInterval(durationMs),
      commissions: fees.toString(),
      raw_csv_row: {
        Id: '0',
        ContractName: form.contract,
        EnteredAt: form.entryTime,
        ExitedAt: form.exitTime,
        EntryPrice: entry.toString(),
        ExitPrice: exit.toString(),
        Fees: fees.toString(),
        PnL: calc.pnl.toFixed(2),
        Size: size.toString(),
        Type: form.direction,
        TradeDay: toTradeDay(entryTime),
        TradeDuration: formatPgInterval(durationMs),
        Commissions: fees.toString(),
      },
    }
  }, [form, spec, calc])

  const isValid = useMemo(() => buildTrade() !== null, [buildTrade])

  const handleSubmit = useCallback(() => {
    const trade = buildTrade()
    if (trade) onSubmit(trade)
  }, [buildTrade, onSubmit])

  const handleSubmitAndContinue = useCallback(() => {
    const trade = buildTrade()
    if (trade) {
      onSubmitAndContinue(trade)
      setForm(initialForm)
    }
  }, [buildTrade, onSubmitAndContinue])

  const contractDisplayName = spec?.displayName ?? form.contract

  return (
    <div>
      <div className="space-y-3">
        {/* Row 1: Contract + Direction */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Contract</label>
            <div className="relative">
              <select
                className="tabular-nums"
                value={form.contract}
                onChange={(e) => set('contract', e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: 'none' as const,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236E7681' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  paddingRight: '28px',
                  cursor: 'pointer',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = focusBorder }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(48,54,61,0.25)' }}
              >
                {CONTRACTS.map((sym) => {
                  const s = getContractSpec(sym)
                  return (
                    <option key={sym} value={sym}>
                      {sym} — {s?.displayName ?? sym}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Direction</label>
            <div className="flex items-center gap-0 mt-0.5">
              <button
                type="button"
                onPointerDown={() => set('direction', 'Long')}
                className="cursor-pointer"
                style={{
                  fontFamily: 'var(--font-display), sans-serif',
                  fontSize: '11px',
                  fontWeight: form.direction === 'Long' ? 600 : 500,
                  padding: '7px 16px',
                  borderRadius: '4px 0 0 4px',
                  border: form.direction === 'Long'
                    ? '1px solid #00D4AA'
                    : '1px solid rgba(48,54,61,0.25)',
                  background: form.direction === 'Long'
                    ? '#00D4AA'
                    : 'rgba(13,17,23,0.6)',
                  color: form.direction === 'Long'
                    ? '#0D1117'
                    : '#6E7681',
                }}
              >
                Long
              </button>
              <button
                type="button"
                onPointerDown={() => set('direction', 'Short')}
                className="cursor-pointer"
                style={{
                  fontFamily: 'var(--font-display), sans-serif',
                  fontSize: '11px',
                  fontWeight: form.direction === 'Short' ? 600 : 500,
                  padding: '7px 16px',
                  borderRadius: '0 4px 4px 0',
                  border: form.direction === 'Short'
                    ? '1px solid #00D4AA'
                    : '1px solid rgba(48,54,61,0.25)',
                  borderLeft: form.direction === 'Short'
                    ? '1px solid #00D4AA'
                    : 'none',
                  background: form.direction === 'Short'
                    ? '#00D4AA'
                    : 'rgba(13,17,23,0.6)',
                  color: form.direction === 'Short'
                    ? '#0D1117'
                    : '#6E7681',
                }}
              >
                Short
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Entry Price + Exit Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Entry Price</label>
            <FormInput
              value={form.entryPrice}
              onChange={(v) => set('entryPrice', v)}
              placeholder="19,842.50"
            />
          </div>
          <div>
            <label style={labelStyle}>Exit Price</label>
            <FormInput
              value={form.exitPrice}
              onChange={(v) => set('exitPrice', v)}
              placeholder="19,922.50"
              disabled={form.stoppedOut}
              style={form.stoppedOut ? { opacity: 0.5 } : undefined}
            />
          </div>
        </div>

        {/* Stopped out checkbox */}
        <div className="flex justify-end" style={{ marginTop: '4px', marginBottom: '8px' }}>
          <label
            className="flex items-center gap-1.5 cursor-pointer"
            style={{ fontSize: '11px', color: '#6E7681' }}
          >
            <span
              onPointerDown={() => set('stoppedOut', !form.stoppedOut)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '14px',
                height: '14px',
                borderRadius: '2px',
                background: form.stoppedOut ? '#00D4AA' : 'rgba(48,54,61,0.15)',
                border: form.stoppedOut ? '1px solid #00D4AA' : '1px solid rgba(48,54,61,0.35)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontSize: '10px',
                color: '#0D1117',
                fontWeight: 700,
              }}
            >
              {form.stoppedOut ? '✓' : ''}
            </span>
            Stopped out
          </label>
          <span style={{ fontSize: '9px', color: '#484F58', marginLeft: '8px', alignSelf: 'center' }}>
            Auto-fills exit from stop loss
          </span>
        </div>

        {/* Row 3: Entry Time + Exit Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Entry Time</label>
            <FormInput
              value={form.entryTime}
              onChange={(v) => set('entryTime', v)}
              placeholder="MM/DD/YYYY HH:MM:SS"
            />
          </div>
          <div>
            <label style={labelStyle}>Exit Time</label>
            <FormInput
              value={form.exitTime}
              onChange={(v) => set('exitTime', v)}
              placeholder="MM/DD/YYYY HH:MM:SS"
            />
          </div>
        </div>

        {/* Row 4: Size + Fees + Stop Loss */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label style={labelStyle}>Size</label>
            <FormInput
              value={form.size}
              onChange={(v) => {
                set('size', v)
                if (form.feesAuto) {
                  const n = parseNum(v) ?? 0
                  set('fees', (n * FEE_PER_CONTRACT).toFixed(2))
                }
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>Fees</label>
            <div className="relative">
              <FormInput
                value={form.fees}
                onChange={(v) => {
                  set('fees', v)
                  set('feesAuto', false)
                }}
              />
              {form.feesAuto && (
                <span
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ fontSize: '9px', color: '#6E7681' }}
                >
                  auto
                </span>
              )}
            </div>
          </div>
          <div>
            <label style={labelStyle}>
              Stop Loss{' '}
              <span style={{ color: '#6E7681', fontWeight: 400, letterSpacing: '0.04em', fontSize: '9px' }}>
                (optional)
              </span>
            </label>
            <FormInput
              value={form.stopLoss}
              onChange={(v) => set('stopLoss', v)}
              placeholder="19,802.50"
            />
          </div>
        </div>
      </div>

      {/* Auto-calculated section */}
      <div
        className="rounded px-3 py-2.5 mt-4 mb-3"
        style={{
          background: 'rgba(52,211,153,0.04)',
          border: '1px solid rgba(52,211,153,0.12)',
        }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span
              className="uppercase tracking-wider font-medium"
              style={{ fontSize: '10px', color: '#6E7681', letterSpacing: '0.10em' }}
            >
              P&L
            </span>
            <span
              className="tabular-nums"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: '14px',
                fontWeight: 700,
                color: calc.pnl !== null
                  ? calc.pnl > 0 ? '#34D399' : calc.pnl < 0 ? '#EF4444' : '#E6EDF3'
                  : '#484F58',
              }}
            >
              {calc.pnl !== null
                ? `${calc.pnl >= 0 ? '+' : ''}$${Math.abs(calc.pnl).toFixed(2)}`
                : '—'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="uppercase tracking-wider font-medium"
              style={{ fontSize: '10px', color: '#6E7681', letterSpacing: '0.10em' }}
            >
              Duration
            </span>
            <span
              className="tabular-nums"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                color: calc.durationStr ? '#E6EDF3' : '#484F58',
              }}
            >
              {calc.durationStr ?? '—'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="uppercase tracking-wider font-medium"
              style={{ fontSize: '10px', color: '#6E7681', letterSpacing: '0.10em' }}
            >
              Risk
            </span>
            <span
              className="tabular-nums"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                color: calc.risk !== null ? '#EF4444' : '#484F58',
              }}
            >
              {calc.risk !== null ? `$${calc.risk.toFixed(2)}` : '—'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="uppercase tracking-wider font-medium"
              style={{ fontSize: '10px', color: '#6E7681', letterSpacing: '0.10em' }}
            >
              R:R
            </span>
            <span
              className="tabular-nums"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: '13px',
                fontWeight: 700,
                color: calc.rr !== null ? '#00D4AA' : '#484F58',
              }}
            >
              {calc.rr !== null ? `${calc.rr.toFixed(1)}:1` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onPointerDown={handleSubmitAndContinue}
          disabled={!isValid}
          className="cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(22,27,34,0.8)',
            border: '1px solid rgba(48,54,61,0.15)',
            color: '#8B949E',
            padding: '6px 16px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            fontFamily: 'var(--font-display), sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#E6EDF3'
            e.currentTarget.style.borderColor = 'rgba(48,54,61,0.30)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#8B949E'
            e.currentTarget.style.borderColor = 'rgba(48,54,61,0.15)'
          }}
        >
          Add &amp; Continue
        </button>
        <button
          type="button"
          onPointerDown={handleSubmit}
          disabled={!isValid}
          className="cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: '#00D4AA',
            border: '1px solid #00D4AA',
            color: '#0D1117',
            padding: '6px 16px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'var(--font-display), sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#33DDBB'
            e.currentTarget.style.borderColor = '#33DDBB'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#00D4AA'
            e.currentTarget.style.borderColor = '#00D4AA'
          }}
        >
          Add Trade
        </button>
      </div>

      {/* Footer text */}
      <div className="text-center mt-2">
        <span style={{ fontSize: '10px', color: '#6E7681' }}>
          {sessionDate
            ? `Trade will be added to ${sessionDate} session`
            : 'Enter entry time to determine session date'}
        </span>
      </div>
    </div>
  )
}
