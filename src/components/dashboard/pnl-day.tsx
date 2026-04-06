import type { DayOfWeekStats } from '@/lib/kpi'

interface PnlDayProps {
  dayOfWeek: DayOfWeekStats[]
  bestDay: string | null
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
}

function formatPnl(value: number): string {
  const abs = Math.abs(value)
  const prefix = value >= 0 ? '+$' : '-$'
  return prefix + abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function PnlDay({ dayOfWeek, bestDay }: PnlDayProps) {
  // Build ordered rows for Mon-Fri
  const rows = DAY_ORDER.map(day => {
    const stats = dayOfWeek.find(d => d.day === day)
    return {
      label: DAY_SHORT[day] ?? day.slice(0, 3),
      totalPnl: stats?.totalPnl ?? 0,
    }
  })

  const maxPnl = Math.max(...rows.map(r => Math.abs(r.totalPnl)), 1)

  const bestShort = bestDay ? (DAY_SHORT[bestDay] ?? bestDay.slice(0, 3)).toUpperCase() : ''

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E7681' }}>
          P&L by Day of Week
        </span>
        {bestShort && (
          <span style={{ fontSize: '10px', color: '#34D399', fontWeight: 600 }} className="tabular-nums">
            {bestShort} BEST
          </span>
        )}
      </div>
      <div className="px-4 pb-3">
        <div className="space-y-1.5">
          {rows.map(({ label, totalPnl }) => {
            const widthPercent = maxPnl > 0
              ? Math.max(4, Math.round((Math.abs(totalPnl) / maxPnl) * 100))
              : 4
            const isGain = totalPnl >= 0
            const barColor = isGain
              ? 'rgba(52,211,153,0.65)'
              : 'rgba(239,68,68,0.55)'
            const textColor = isGain ? '#34D399' : '#EF4444'

            return (
              <div key={label} className="flex items-center gap-2">
                <span className="text-right tabular-nums shrink-0" style={{ fontSize: '10px', color: '#6E7681', width: '32px' }}>
                  {label}
                </span>
                <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ background: 'rgba(22,27,34,0.8)' }}>
                  <div
                    className="h-full rounded-sm"
                    style={{ width: `${widthPercent}%`, background: barColor }}
                  />
                </div>
                <span className="text-right tabular-nums shrink-0" style={{ fontSize: '10px', color: textColor, width: '48px' }}>
                  {formatPnl(totalPnl)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
