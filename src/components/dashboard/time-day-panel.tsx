import type { TimeBucketStats, DayOfWeekStats } from '@/lib/kpi'
import { PnlTime } from './pnl-time'
import { PnlDay } from './pnl-day'

interface TimeDayPanelProps {
  timeBuckets: TimeBucketStats[]
  bestBucket: string | null
  dayOfWeek: DayOfWeekStats[]
  bestDay: string | null
}

export function TimeDayPanel({ timeBuckets, bestBucket, dayOfWeek, bestDay }: TimeDayPanelProps) {
  return (
    <div
      className="rounded-[6px] h-full flex flex-col overflow-hidden"
      style={{
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex-1 min-h-0 overflow-auto">
        <PnlTime timeBuckets={timeBuckets} bestBucket={bestBucket} />
      </div>
      {/* Subtle divider */}
      <div className="flex-shrink-0 mx-4 my-1" style={{ borderTop: '1px solid var(--color-border)' }} />
      <div className="flex-1 min-h-0 overflow-auto">
        <PnlDay dayOfWeek={dayOfWeek} bestDay={bestDay} />
      </div>
    </div>
  )
}
