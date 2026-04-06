'use client'

interface WeeklySummaryCellProps {
  day: number
  weekNumber: number
  totalPnl: number
  tradeCount: number
  hasTrades: boolean
  isCurrentMonth: boolean
  isOverflowWeek: boolean
}

function formatPnl(value: number): string {
  const abs = Math.abs(value)
  const prefix = value >= 0 ? '$' : '-$'
  return prefix + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function WeeklySummaryCell({
  day,
  weekNumber,
  totalPnl,
  tradeCount,
  hasTrades,
  isCurrentMonth,
  isOverflowWeek,
}: WeeklySummaryCellProps) {
  // Padding-only row: render a blank dark cell with no label, no P&L, no border
  if (weekNumber === 0) {
    return (
      <div
        style={{
          background: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)',
          padding: '8px 10px',
        }}
      />
    )
  }

  const isGreen = totalPnl > 0
  const isRed = totalPnl < 0
  const pnlColor = isRed ? 'var(--color-loss)' : isGreen ? 'var(--color-gain)' : 'var(--color-text-tertiary)'
  const tradeLabel = `${tradeCount} ${tradeCount === 1 ? 'trade' : 'trades'}`

  // Background and border based on weekly P&L
  let bg = 'var(--color-bg-tertiary)'
  let borderLeft = '2px solid transparent'

  if (hasTrades) {
    if (isGreen) {
      bg = 'rgba(16, 185, 129, 0.20)'
      borderLeft = '2px solid rgba(16, 185, 129, 0.4)'
    } else if (isRed) {
      bg = 'rgba(153, 27, 27, 0.35)'
      borderLeft = '2px solid rgba(153, 27, 27, 0.5)'
    }
  }

  // Day number color
  const dayColor = isCurrentMonth ? 'var(--color-text-tertiary)' : 'var(--color-text-quaternary)'

  return (
    <div
      className="relative"
      style={{
        background: bg,
        borderLeft,
        border: '1px solid var(--color-border)',
        borderLeftWidth: 2,
        borderLeftColor: hasTrades && isGreen
          ? 'rgba(16, 185, 129, 0.4)'
          : hasTrades && isRed
            ? 'rgba(153, 27, 27, 0.5)'
            : 'transparent',
        padding: '8px 10px',
        opacity: isCurrentMonth ? 1 : 0.45,
      }}
    >
      {/* Day number top-left */}
      <span
        className="absolute"
        style={{ top: 6, left: 10, fontSize: 12, color: dayColor }}
      >
        {day}
      </span>

      {/* Week label top-right */}
      {weekNumber > 0 && (
        <span
          className="absolute font-semibold"
          style={{
            top: 6,
            right: 10,
            fontSize: 10,
            color: 'var(--color-text-tertiary)',
            letterSpacing: '0.05em',
          }}
        >
          Week {weekNumber}
        </span>
      )}

      {/* P&L and trade count centered */}
      {hasTrades ? (
        <div className="flex flex-col items-center justify-center h-full text-center" style={{ marginTop: 8 }}>
          <span
            className="font-mono tabular-nums font-semibold"
            style={{ fontSize: 13, color: pnlColor }}
          >
            {formatPnl(totalPnl)}
          </span>
          <span
            className="font-mono tabular-nums"
            style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}
          >
            {tradeLabel}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full" />
      )}
    </div>
  )
}
