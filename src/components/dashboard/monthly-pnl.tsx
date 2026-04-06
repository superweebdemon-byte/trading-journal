import type { MonthlyPnl as MonthlyPnlData } from '@/lib/kpi'

interface MonthlyPnlProps {
  monthlyTrend: MonthlyPnlData[]
  monthlyPnlMap: Record<string, number>
  tradeCountByMonth: Record<string, number>
}

function formatPnl(value: number): string {
  const abs = Math.abs(value)
  const prefix = value >= 0 ? '+$' : '-$'
  return prefix + abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatMonthLabel(month: string): string {
  // month is "YYYY-MM"
  const [y, m] = month.split('-')
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthIdx = parseInt(m, 10) - 1
  const yearShort = y.slice(2)
  return `${monthNames[monthIdx]} '${yearShort}`
}

function getMonthBorderStyle(pnl: number, maxAbsPnl: number): { borderColor: string; bgColor: string } {
  const isGain = pnl >= 0
  const intensity = maxAbsPnl > 0 ? Math.min(Math.abs(pnl) / maxAbsPnl, 1) : 0

  if (isGain) {
    const opacity = 0.25 + intensity * 0.45
    const bgOpacity = 0.03 + intensity * 0.07
    return {
      borderColor: `rgba(52,211,153,${opacity.toFixed(2)})`,
      bgColor: `rgba(52,211,153,${bgOpacity.toFixed(2)})`,
    }
  } else {
    const opacity = 0.35 + intensity * 0.35
    const bgOpacity = 0.04 + intensity * 0.06
    return {
      borderColor: `rgba(239,68,68,${opacity.toFixed(2)})`,
      bgColor: `rgba(239,68,68,${bgOpacity.toFixed(2)})`,
    }
  }
}

export function MonthlyPnl({ monthlyTrend, monthlyPnlMap, tradeCountByMonth }: MonthlyPnlProps) {
  // Get months sorted newest first
  const months = Object.keys(monthlyPnlMap).sort().reverse()
  const maxAbsPnl = Math.max(...months.map(m => Math.abs(monthlyPnlMap[m])), 1)

  // Find best month
  let bestMonth = ''
  let bestPnl = -Infinity
  for (const m of months) {
    if (monthlyPnlMap[m] > bestPnl) {
      bestPnl = monthlyPnlMap[m]
      bestMonth = m
    }
  }

  // Average P&L
  const avgPnl = months.length > 0
    ? months.reduce((sum, m) => sum + monthlyPnlMap[m], 0) / months.length
    : 0

  // Date range for header
  const dateRange = months.length > 0
    ? `${formatMonthLabel(months[months.length - 1])} – ${formatMonthLabel(months[0])}`
    : ''

  // Best month short name for summary
  const bestMonthShort = bestMonth
    ? formatMonthLabel(bestMonth).split("'")[0].trim()
    : ''

  return (
    <div
      className="rounded-[6px] h-full flex flex-col overflow-hidden"
      style={{
        background: '#161B22',
        border: '1px solid rgba(92,92,122,0.12)',
      }}
    >
      <div className="flex-shrink-0 flex items-center justify-between px-3 pt-2 pb-1">
        <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E7681' }}>
          Monthly P&L
        </span>
        <span style={{ fontSize: '10px', color: '#6E7681' }} className="tabular-nums">
          {dateRange}
        </span>
      </div>
      <div className="px-2 pb-1.5 flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="grid grid-cols-1 gap-1 flex-1 min-h-0 overflow-auto" style={{ gridAutoRows: 'auto' }}>
          {months.map(month => {
            const pnl = monthlyPnlMap[month]
            const count = tradeCountByMonth[month] ?? 0
            const { borderColor, bgColor } = getMonthBorderStyle(pnl, maxAbsPnl)
            const isGain = pnl >= 0
            // Highlight best month label color
            const isBest = month === bestMonth
            const labelColor = isBest && isGain ? '#6EE7B7' : '#6E7681'

            return (
              <div
                key={month}
                className="rounded px-2.5 py-1.5 flex items-center justify-between"
                style={{
                  background: bgColor,
                  borderLeft: `2px solid ${borderColor}`,
                  transition: 'background 0.15s ease, transform 0.1s ease',
                  cursor: 'default',
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', color: labelColor, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {formatMonthLabel(month)}
                  </div>
                  <div
                    className="tabular-nums mt-0.5"
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isGain ? '#34D399' : '#EF4444',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {formatPnl(pnl)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="tabular-nums" style={{ fontSize: '10px', color: '#8B949E', fontWeight: 500 }}>
                    {count}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6E7681' }}>trades</div>
                </div>
              </div>
            )
          })}
        </div>
        {/* Summary line */}
        <div className="flex-shrink-0 flex items-center justify-between pt-1 mt-0.5 px-0.5">
          <span style={{ fontSize: '10px', color: '#6E7681' }}>
            Best: <span style={{ color: '#34D399', fontWeight: 600 }}>{bestMonthShort}</span>
          </span>
          <span style={{ fontSize: '10px', color: '#6E7681' }} className="tabular-nums">
            Avg: <span style={{ color: '#8B949E', fontWeight: 600 }}>{formatPnl(Math.round(avgPnl))}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
