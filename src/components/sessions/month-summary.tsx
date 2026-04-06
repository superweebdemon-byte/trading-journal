'use client'

interface MonthData {
  key: string // "2026-03"
  label: string // "Mar '26"
  pnl: number
  tradeCount: number
  sessionCount: number
}

interface MonthSummaryProps {
  months: MonthData[]
  selectedMonth: string | null
  onSelect: (monthKey: string | null) => void
}

export type { MonthData }

export function MonthSummary({ months, selectedMonth, onSelect }: MonthSummaryProps) {
  if (months.length === 0) return null

  return (
    <div
      className="grid gap-1.5 mb-2"
      style={{ gridTemplateColumns: `repeat(${Math.min(months.length, 6)}, 1fr)` }}
    >
      {months.map((m) => {
        const isGain = m.pnl >= 0
        const isSelected = selectedMonth === m.key
        return (
          <button
            key={m.key}
            onClick={() => onSelect(isSelected ? null : m.key)}
            className="text-left px-3 py-2 rounded-md transition-colors cursor-pointer"
            style={{
              background: 'rgba(0,212,170,0.04)',
              border: isSelected
                ? `1px solid ${isGain ? 'rgba(52,211,153,0.30)' : 'rgba(239,68,68,0.30)'}`
                : '1px solid rgba(48,54,61,0.12)',
              borderRadius: '6px',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div
                  className="text-[10px] uppercase tracking-wider font-semibold"
                  style={{
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    color: isSelected ? (isGain ? '#6EE7B7' : '#F87171') : '#6E7681',
                  }}
                >
                  {m.label}
                </div>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    color: isGain ? '#34D399' : '#EF4444',
                  }}
                >
                  {isGain ? '+' : '-'}${Math.abs(m.pnl).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="text-right">
                <div className="text-[10px] tabular-nums" style={{ color: '#8B949E' }}>
                  {m.tradeCount} trades
                </div>
                <div className="text-[10px]" style={{ color: '#6E7681' }}>
                  {m.sessionCount} sessions
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
