'use client'

import type { Trade } from '@/lib/types'

interface TradeRowProps {
  trade: Trade
}

function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/New_York' })
}

function formatPrice(price: string): string {
  const num = parseFloat(price)
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatPnl(pnl: string): string {
  const num = parseFloat(pnl)
  const prefix = num >= 0 ? '+' : ''
  return `${prefix}$${Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDuration(duration: string | null): string {
  if (!duration) return '--'
  // PostgreSQL interval: "00:24:50" or "24m 50s" patterns
  // Try HH:MM:SS format first
  const hmsMatch = duration.match(/^(\d+):(\d+):(\d+)/)
  if (hmsMatch) {
    const h = parseInt(hmsMatch[1], 10)
    const m = parseInt(hmsMatch[2], 10)
    const s = parseInt(hmsMatch[3], 10)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m ${s}s`
  }
  return duration
}

function contractBadge(symbol: string) {
  const isMNQ = symbol.toUpperCase().startsWith('MNQ')
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm uppercase tracking-wide"
      style={{
        background: isMNQ ? 'rgba(0,212,170,0.15)' : 'rgba(48,54,61,0.15)',
        color: isMNQ ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        letterSpacing: '0.06em',
      }}
    >
      {symbol}
    </span>
  )
}

export function TradeRowHeader() {
  return (
    <tr className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
      <th className="text-left font-medium px-2 py-1">Time</th>
      <th className="text-left font-medium px-2 py-1">Contract</th>
      <th className="text-center font-medium px-2 py-1">Side</th>
      <th className="text-right font-medium px-2 py-1">Entry</th>
      <th className="text-right font-medium px-2 py-1">Exit</th>
      <th className="text-right font-medium px-2 py-1">P&L</th>
      <th className="text-right font-medium px-2 py-1">Duration</th>
    </tr>
  )
}

export function TradeRow({ trade }: TradeRowProps) {
  const pnlNum = parseFloat(trade.pnl)
  const isGain = pnlNum >= 0
  const isLong = trade.trade_type === 'Long'

  return (
    <tr style={{ borderTop: '1px solid rgba(22,27,34,0.5)' }}>
      <td className="px-2 py-1.5 tabular-nums text-[10px]" style={{ color: 'var(--color-text-primary)' }}>
        {formatTime(trade.entered_at)}
      </td>
      <td className="px-2 py-1.5 text-[10px]">
        {contractBadge(trade.contract_symbol)}
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        <span style={{ color: isLong ? 'var(--color-gain)' : 'var(--color-loss)' }}>
          {trade.trade_type}
        </span>
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
        {formatPrice(trade.entry_price)}
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
        {formatPrice(trade.exit_price)}
      </td>
      <td
        className="px-2 py-1.5 text-right tabular-nums font-medium text-[10px]"
        style={{ color: isGain ? 'var(--color-gain)' : 'var(--color-loss)' }}
      >
        {formatPnl(trade.pnl)}
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
        {formatDuration(trade.trade_duration)}
      </td>
    </tr>
  )
}
