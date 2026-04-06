import type { Session } from '@/lib/types'
import { format } from 'date-fns'

interface MonthSummaryProps {
  sessions: Session[] // sessions for the current month only
}

function formatDollars(value: number): string {
  const abs = Math.abs(value)
  const prefix = value >= 0 ? '$' : '-$'
  return prefix + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return format(d, 'MMM d')
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg"
      style={{
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        padding: '14px 18px',
      }}
    >
      <div
        className="uppercase font-medium"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 10,
          letterSpacing: '0.08em',
          color: 'var(--color-text-tertiary)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

export function MonthSummary({ sessions }: MonthSummaryProps) {
  if (sessions.length === 0) {
    return (
      <div className="grid grid-cols-6 gap-2.5">
        {['Month P&L', 'Trades', 'Win Rate', 'Best Day', 'Worst Day', 'Avg P&L/Day'].map((label) => (
          <Tile key={label} label={label}>
            <div
              className="font-semibold tabular-nums font-mono"
              style={{ fontSize: 18, color: 'var(--color-text-tertiary)' }}
            >
              —
            </div>
            <div className="tabular-nums" style={{ fontSize: 11, color: 'transparent', marginTop: 3 }}>
              &nbsp;
            </div>
          </Tile>
        ))}
      </div>
    )
  }

  const totalPnl = sessions.reduce((sum, s) => sum + s.net_pnl, 0)
  const totalTrades = sessions.reduce((sum, s) => sum + s.trade_count, 0)
  const totalWins = sessions.reduce((sum, s) => sum + s.win_count, 0)
  const totalLosses = totalTrades - totalWins
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0

  const sortedByPnl = [...sessions].sort((a, b) => b.net_pnl - a.net_pnl)
  const bestDay = sortedByPnl[0]
  const worstDay = sortedByPnl[sortedByPnl.length - 1]

  const avgPnlPerDay = totalPnl / sessions.length

  const pnlColor = totalPnl >= 0 ? 'var(--color-gain)' : 'var(--color-loss)'
  const avgColor = avgPnlPerDay >= 0 ? 'var(--color-gain)' : 'var(--color-loss)'

  return (
    <div className="grid grid-cols-6 gap-2.5">
      {/* Month P&L */}
      <Tile label="Month P&L">
        <div
          className="font-semibold tabular-nums font-mono"
          style={{ fontSize: 18, color: pnlColor }}
        >
          {formatDollars(totalPnl)}
        </div>
        <div className="tabular-nums" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
          {sessions.length} trading day{sessions.length !== 1 ? 's' : ''}
        </div>
      </Tile>

      {/* Trades */}
      <Tile label="Trades">
        <div
          className="font-semibold tabular-nums font-mono"
          style={{ fontSize: 18, color: 'var(--color-text-primary)' }}
        >
          {totalTrades}
        </div>
        <div className="tabular-nums" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
          across {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </div>
      </Tile>

      {/* Win Rate */}
      <Tile label="Win Rate">
        <div
          className="font-semibold tabular-nums font-mono"
          style={{ fontSize: 18, color: 'var(--color-text-primary)' }}
        >
          {Math.round(winRate)}
          <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>%</span>
        </div>
        <div className="tabular-nums" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
          {totalWins}W / {totalLosses}L
        </div>
      </Tile>

      {/* Best Day */}
      <Tile label="Best Day">
        <div
          className="font-semibold tabular-nums font-mono"
          style={{ fontSize: 18, color: bestDay.net_pnl >= 0 ? 'var(--color-gain)' : 'var(--color-loss)' }}
        >
          {formatDollars(bestDay.net_pnl)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
          {formatDate(bestDay.trade_day)}
        </div>
      </Tile>

      {/* Worst Day */}
      <Tile label="Worst Day">
        <div
          className="font-semibold tabular-nums font-mono"
          style={{ fontSize: 18, color: worstDay.net_pnl >= 0 ? 'var(--color-gain)' : 'var(--color-loss)' }}
        >
          {formatDollars(worstDay.net_pnl)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
          {formatDate(worstDay.trade_day)}
        </div>
      </Tile>

      {/* Avg P&L/Day */}
      <Tile label="Avg P&L/Day">
        <div
          className="font-semibold tabular-nums font-mono"
          style={{ fontSize: 18, color: avgColor }}
        >
          {formatDollars(avgPnlPerDay)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
          per trading day
        </div>
      </Tile>
    </div>
  )
}
