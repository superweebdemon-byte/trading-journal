import type { TimeBucketStats } from '@/lib/kpi'

interface PnlTimeProps {
  timeBuckets: TimeBucketStats[]
  bestBucket: string | null
}

/** Collapse buckets into display-friendly groups matching mockup: 9:30, 10:00, 10:30, 11:00, 11:30, 12:00+ */
function collapseBuckets(buckets: TimeBucketStats[]): { label: string; totalPnl: number }[] {
  const groups: Record<string, number> = {
    '9:30': 0,
    '10:00': 0,
    '10:30': 0,
    '11:00': 0,
    '11:30': 0,
    '12:00+': 0,
  }

  for (const b of buckets) {
    const [hStr, mStr] = b.bucket.split(':')
    const h = parseInt(hStr, 10)
    const m = parseInt(mStr, 10)
    const minuteOfDay = h * 60 + m

    if (minuteOfDay < 600) {
      // Before 10:00 -> 9:30
      groups['9:30'] += b.totalPnl
    } else if (minuteOfDay < 630) {
      groups['10:00'] += b.totalPnl
    } else if (minuteOfDay < 660) {
      groups['10:30'] += b.totalPnl
    } else if (minuteOfDay < 690) {
      groups['11:00'] += b.totalPnl
    } else if (minuteOfDay < 720) {
      groups['11:30'] += b.totalPnl
    } else {
      groups['12:00+'] += b.totalPnl
    }
  }

  return Object.entries(groups).map(([label, totalPnl]) => ({ label, totalPnl }))
}

function formatPnl(value: number): string {
  const abs = Math.abs(value)
  const prefix = value >= 0 ? '+$' : '-$'
  return prefix + abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function PnlTime({ timeBuckets, bestBucket }: PnlTimeProps) {
  const groups = collapseBuckets(timeBuckets)
  const maxPnl = Math.max(...groups.map(g => Math.abs(g.totalPnl)), 1)

  // Format best bucket for header display
  const bestLabel = bestBucket ? bestBucket.replace(/^0/, '') + ' ET' : ''

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>
          P&L by Time of Day
        </span>
        {bestLabel && (
          <span style={{ fontSize: '10px', color: 'var(--color-gain)', fontWeight: 600 }} className="tabular-nums">
            {bestLabel} BEST
          </span>
        )}
      </div>
      <div className="px-4 pb-3">
        <div className="space-y-1.5">
          {groups.map(({ label, totalPnl }) => {
            const widthPercent = maxPnl > 0
              ? Math.max(4, Math.round((Math.abs(totalPnl) / maxPnl) * 100))
              : 4
            const isGain = totalPnl >= 0
            const barColor = isGain
              ? 'rgba(52,211,153,0.65)'
              : 'rgba(239,68,68,0.55)'
            const textColor = isGain ? 'var(--color-gain)' : 'var(--color-loss)'

            return (
              <div key={label} className="flex items-center gap-2">
                <span className="text-right tabular-nums shrink-0" style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', width: '40px' }}>
                  {label}
                </span>
                <div className="flex-1 h-3.5 rounded-sm overflow-hidden" style={{ background: 'rgba(22,27,34,0.8)' }}>
                  <div
                    className="h-full rounded-sm"
                    style={{ width: `${widthPercent}%`, background: barColor }}
                  />
                </div>
                <span className="text-right tabular-nums shrink-0" style={{ fontSize: '10px', color: textColor, width: '56px' }}>
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
