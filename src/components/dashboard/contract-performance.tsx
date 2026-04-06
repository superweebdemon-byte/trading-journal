import type { Trade } from '@/lib/types'

interface TradeBreakdownProps {
  trades: Trade[]
  pnlMode: 'net' | 'gross'
}

interface SetupStats {
  key: string
  symbol: string
  size: number
  tradeCount: number
  pnl: number
  winRate: number
  avgPnl: number
}

function formatDollar(value: number): string {
  const abs = Math.abs(value)
  const sign = value >= 0 ? '+' : '-'
  return `${sign}$${Math.round(abs)}`
}

export function TradeBreakdown({ trades, pnlMode }: TradeBreakdownProps) {
  // Group by contract_symbol + size
  const bySetup = new Map<string, Trade[]>()
  for (const t of trades) {
    const key = `${t.contract_symbol}×${t.size}`
    if (!bySetup.has(key)) bySetup.set(key, [])
    bySetup.get(key)!.push(t)
  }

  const setupStats: SetupStats[] = Array.from(bySetup.entries()).map(([key, setupTrades]) => {
    const first = setupTrades[0]
    const tradeCount = setupTrades.length
    const pnl = setupTrades.reduce((sum, t) => {
      return sum + parseFloat(pnlMode === 'gross' ? t.gross_pnl : t.pnl)
    }, 0)
    const wins = setupTrades.filter(t => t.outcome === 'win').length
    const winRate = tradeCount > 0 ? (wins / tradeCount) * 100 : 0
    const avgPnl = tradeCount > 0 ? pnl / tradeCount : 0
    return { key, symbol: first.contract_symbol, size: first.size, tradeCount, pnl, winRate, avgPnl }
  })

  // Sort by total P&L descending (best setup first)
  setupStats.sort((a, b) => b.pnl - a.pnl)

  return (
    <div
      className="flex flex-col flex-shrink-0 rounded-[6px]"
      style={{
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        overflow: 'visible',
      }}
    >
      {/* Card header */}
      <div
        className="px-4 pt-2 pb-0.5"
        style={{
          fontFamily: "'Fira Code', monospace",
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
        }}
      >
        Trade Breakdown
      </div>

      <div className="px-4 pb-2 flex flex-col" style={{ gap: '5px' }}>
        {setupStats.map((s) => (
          <div key={s.key} className="flex items-center justify-between">
            <span
              style={{
                fontSize: '11px',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              {s.symbol} &times; {s.size}
            </span>
            <div className="flex items-center gap-2">
              <span className="tabular-nums" style={{ fontSize: '11px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {Math.round(s.winRate)}%
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>|</span>
              <span
                className="tabular-nums"
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: s.avgPnl >= 0 ? 'var(--color-gain)' : 'var(--color-loss)',
                }}
              >
                {formatDollar(s.avgPnl)}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>avg</span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>|</span>
              <span className="tabular-nums" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {s.tradeCount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
