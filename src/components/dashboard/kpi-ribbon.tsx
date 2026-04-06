import type { CorePnlKpis, RiskKpis } from '@/lib/kpi'

interface KpiRibbonProps {
  corePnl: CorePnlKpis
  risk: RiskKpis
  dateRange: string
}

function formatDollars(value: number): string {
  const abs = Math.abs(value)
  const prefix = value >= 0 ? '+$' : '-$'
  return prefix + abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—'
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins}`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return `${hrs}h ${rem}`
}

function durationSuffix(seconds: number | null): string {
  if (seconds === null) return ''
  const mins = Math.round(seconds / 60)
  if (mins < 60) return 'm'
  return 'm'
}

export function KpiRibbon({ corePnl, risk, dateRange }: KpiRibbonProps) {
  const {
    totalPnl,
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    totalTrades,
    winCount: wins,
    lossCount: losses,
    largestWin,
    largestLoss,
    avgDurationSeconds,
  } = corePnl

  const grossWins = avgWin !== null && wins > 0 ? avgWin * wins : 0
  const grossLosses = avgLoss !== null && losses > 0 ? avgLoss * losses : 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
      {/* Net P&L — hero tile */}
      <div
        className="px-3 py-2 rounded-[6px]"
        style={{
          background: '#161B22',
          border: '1px solid rgba(0,212,170,0.20)',
        }}
      >
        <div className="pb-0.5" style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E7681' }}>
          Net P&L
        </div>
        <div
          className="font-bold tabular-nums leading-tight"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.25rem',
            color: totalPnl >= 0 ? '#34D399' : '#EF4444',
          }}
        >
          {formatDollars(totalPnl)}
        </div>
        <div className="mt-0.5 tabular-nums" style={{ fontSize: '10px', color: '#6E7681' }}>
          {dateRange}
        </div>
      </div>

      {/* Win Rate */}
      <Tile label="Win Rate">
        <div
          className="font-bold tabular-nums leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', color: '#E6EDF3' }}
        >
          {winRate !== null ? winRate.toFixed(1) : '—'}
          <span style={{ fontSize: '0.75rem', color: '#6E7681' }}>%</span>
        </div>
        <div className="mt-0.5 tabular-nums" style={{ fontSize: '10px', color: '#6E7681' }}>
          {wins}W / {losses}L
        </div>
      </Tile>

      {/* Profit Factor */}
      <Tile label="Profit Factor">
        <div
          className="font-bold tabular-nums leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', color: '#E6EDF3' }}
        >
          {profitFactor !== null && profitFactor !== Infinity
            ? profitFactor.toFixed(2)
            : profitFactor === Infinity
              ? '∞'
              : '—'}
          <span style={{ fontSize: '0.75rem', color: '#6E7681' }}>x</span>
        </div>
        <div className="mt-0.5 tabular-nums" style={{ fontSize: '10px', color: '#6E7681' }}>
          ${Math.round(grossWins).toLocaleString()} / ${Math.round(grossLosses).toLocaleString()}
        </div>
      </Tile>

      {/* Avg Win / Loss */}
      <Tile label="Avg Win / Loss">
        <div className="flex items-baseline gap-1 leading-tight">
          <span
            className="font-bold tabular-nums"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.125rem', color: '#34D399' }}
          >
            ${avgWin !== null ? Math.round(avgWin).toLocaleString() : '—'}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#6E7681' }}>/</span>
          <span
            className="font-bold tabular-nums"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.125rem', color: '#EF4444' }}
          >
            ${avgLoss !== null ? Math.round(avgLoss).toLocaleString() : '—'}
          </span>
        </div>
        <div className="mt-0.5 tabular-nums" style={{ fontSize: '10px', color: '#6E7681' }}>
          {risk.riskRewardRatio !== null && risk.riskRewardRatio !== Infinity
            ? `${risk.riskRewardRatio.toFixed(2)}:1 R:R`
            : '—'}
        </div>
      </Tile>

      {/* Total Trades */}
      <Tile label="Total Trades">
        <div
          className="font-bold tabular-nums leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', color: '#E6EDF3' }}
        >
          {totalTrades}
        </div>
        <div className="mt-0.5 tabular-nums" style={{ fontSize: '10px', color: '#6E7681' }}>
          Best: {largestWin !== null ? formatDollars(largestWin) : '—'} | Worst: {largestLoss !== null ? formatDollars(largestLoss) : '—'}
        </div>
      </Tile>

      {/* Max Drawdown */}
      <Tile label="Max Drawdown">
        <div
          className="font-bold tabular-nums leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', color: '#EF4444' }}
        >
          {risk.maxDrawdownDollars > 0 ? `-$${Math.round(risk.maxDrawdownDollars).toLocaleString()}` : '$0'}
        </div>
        <div className="mt-0.5" style={{ fontSize: '10px', color: '#6E7681' }}>
          {risk.maxDrawdownPercent !== null
            ? `${risk.maxDrawdownPercent.toFixed(1)}% from peak`
            : 'peak-to-trough'}
        </div>
      </Tile>

      {/* Avg Duration */}
      <Tile label="Avg Duration">
        <div
          className="font-bold tabular-nums leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', color: '#E6EDF3' }}
        >
          {formatDuration(avgDurationSeconds)}
          <span style={{ fontSize: '0.75rem', color: '#6E7681' }}>{durationSuffix(avgDurationSeconds)}</span>
        </div>
        <div className="mt-0.5" style={{ fontSize: '10px', color: '#6E7681' }}>
          per trade
        </div>
      </Tile>
    </div>
  )
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="px-3 py-2 rounded-[6px]"
      style={{
        background: '#161B22',
        border: '1px solid rgba(92,92,122,0.12)',
      }}
    >
      <div className="pb-0.5" style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E7681' }}>
        {label}
      </div>
      {children}
    </div>
  )
}
