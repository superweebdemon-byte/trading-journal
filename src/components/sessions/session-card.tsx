'use client'

import type { Session } from '@/lib/types'
import { TradeRow, TradeRowHeader } from './trade-row'

interface SessionCardProps {
  session: Session
  isExpanded: boolean
  onToggle: () => void
}

function formatDate(tradeDay: string): { full: string; dayName: string } {
  const d = new Date(tradeDay + 'T12:00:00') // noon to avoid timezone shifts
  const full = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
  return { full, dayName }
}

function formatPnl(pnl: number): string {
  const prefix = pnl >= 0 ? '+' : '-'
  return `${prefix}$${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getOutcomeLabel(session: Session): 'WIN' | 'LOSS' | 'BREAKEVEN' {
  if (session.net_pnl > 0) return 'WIN'
  if (session.net_pnl < 0) return 'LOSS'
  return 'BREAKEVEN'
}

function formatSessionDuration(session: Session): string {
  if (session.trades.length === 0) return '--'
  // Sum duration from all trades
  let totalSeconds = 0
  for (const trade of session.trades) {
    if (!trade.trade_duration) continue
    const hmsMatch = trade.trade_duration.match(/^(\d+):(\d+):(\d+)/)
    if (hmsMatch) {
      totalSeconds += parseInt(hmsMatch[1], 10) * 3600 + parseInt(hmsMatch[2], 10) * 60 + parseInt(hmsMatch[3], 10)
    }
  }
  if (totalSeconds === 0) return '--'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

function ContractBadge({ symbol }: { symbol: string }) {
  const isMNQ = symbol.toUpperCase().startsWith('MNQ')
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm uppercase"
      style={{
        background: isMNQ ? 'rgba(0,212,170,0.15)' : 'rgba(48,54,61,0.15)',
        color: isMNQ ? '#00D4AA' : '#8B949E',
        letterSpacing: '0.06em',
      }}
    >
      {symbol}
    </span>
  )
}

export function SessionCard({ session, isExpanded, onToggle }: SessionCardProps) {
  const { full, dayName } = formatDate(session.trade_day)
  const isGain = session.net_pnl >= 0
  const isLoss = session.net_pnl < 0
  const outcome = getOutcomeLabel(session)
  const winRate = Math.round(session.win_rate * 100)

  const borderClass = isLoss ? 'loss' : isGain && session.net_pnl > 0 ? 'win' : 'flat-day'

  return (
    <div
      className="rounded-md transition-all cursor-pointer"
      style={{
        background: '#161B22',
        border: '1px solid rgba(48,54,61,0.12)',
        borderLeft: `3px solid ${isLoss ? 'rgba(239,68,68,0.50)' : session.net_pnl > 0 ? 'rgba(52,211,153,0.50)' : 'rgba(48,54,61,0.30)'}`,
        borderRadius: '6px',
      }}
    >
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        {/* Left side: date, P&L, outcome */}
        <div className="flex items-center gap-4">
          <div
            className="font-semibold text-[12px]"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", color: '#E6EDF3' }}
          >
            {full}{' '}
            <span className="text-[10px] font-normal" style={{ color: '#6E7681' }}>
              {dayName}
            </span>
          </div>
          <span
            className="font-bold tabular-nums text-[13px]"
            style={{ color: isGain ? '#34D399' : '#EF4444' }}
          >
            {formatPnl(session.net_pnl)}
          </span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm uppercase"
            style={{
              letterSpacing: '0.06em',
              background: outcome === 'WIN' ? 'rgba(52,211,153,0.10)' : outcome === 'LOSS' ? 'rgba(239,68,68,0.10)' : 'rgba(48,54,61,0.10)',
              color: outcome === 'WIN' ? '#34D399' : outcome === 'LOSS' ? '#EF4444' : '#6E7681',
            }}
          >
            {outcome}
          </span>
        </div>

        {/* Right side: stats + chevron */}
        <div className="flex items-center gap-6 text-[11px]">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider" style={{ color: '#6E7681' }}>Trades</div>
            <div className="font-bold tabular-nums" style={{ color: '#E6EDF3' }}>{session.trade_count}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider" style={{ color: '#6E7681' }}>Win Rate</div>
            <div
              className="font-bold tabular-nums"
              style={{ color: winRate >= 50 ? '#34D399' : '#EF4444' }}
            >
              {winRate === 0 && session.breakeven_count === session.trade_count ? '0' : winRate}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider" style={{ color: '#6E7681' }}>Duration</div>
            <div className="tabular-nums" style={{ color: '#8B949E' }}>{formatSessionDuration(session)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider" style={{ color: '#6E7681' }}>Contracts</div>
            <div className="flex items-center gap-1">
              {session.contracts.map((c) => (
                <ContractBadge key={c} symbol={c} />
              ))}
            </div>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
          >
            <polyline
              points="4,6 8,10 12,6"
              stroke="#6E7681"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Expanded trade table */}
      {isExpanded && (
        <div className="px-3 py-1.5" style={{ background: 'rgba(22,27,34,0.5)', borderTop: '1px solid rgba(48,54,61,0.10)' }}>
          <table className="w-full text-[10px]">
            <thead>
              <TradeRowHeader />
            </thead>
            <tbody>
              {session.trades
                .sort((a, b) => a.entered_at.localeCompare(b.entered_at))
                .map((trade) => (
                  <TradeRow key={trade.id} trade={trade} />
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
