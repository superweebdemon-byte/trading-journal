'use client'

import { useRouter } from 'next/navigation'
import type { Session } from '@/lib/types'

interface DayCellProps {
  day: number
  session: Session | null
  isCurrentMonth: boolean
  isToday?: boolean
}

function formatPnl(value: number): string {
  const abs = Math.abs(value)
  const prefix = value >= 0 ? '$' : '-$'
  return prefix + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function DayCell({ day, session, isCurrentMonth, isToday }: DayCellProps) {
  const router = useRouter()

  // Today indicator ring style
  const todayBorder = isToday ? '1px solid var(--color-accent)' : '1px solid var(--color-border)'
  const todayDayColor = isToday ? 'var(--color-accent)' : 'var(--color-text-tertiary)'

  // Outside current month — dimmed uniformly
  if (!isCurrentMonth) {
    if (!session) {
      return (
        <div
          className="calendar-cell relative"
          style={{
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            padding: '8px 10px',
            opacity: 0.45,
          }}
        >
          <span
            className="absolute"
            style={{ top: 6, left: 8, fontSize: 12, color: 'var(--color-text-tertiary)' }}
          >
            {day}
          </span>
        </div>
      )
    }

    // Outside month but has trades — same cell styling as current month, just dimmed
    const pnl = session.net_pnl
    const isGreen = pnl > 0
    const isRed = pnl < 0
    const bg = isGreen ? 'var(--color-gain-bg)' : isRed ? 'var(--color-loss-bg)' : 'var(--color-bg-tertiary)'
    const pnlColor = isRed ? 'var(--color-loss)' : 'var(--color-gain)'
    const tradeLabel = `${session.trade_count} ${session.trade_count === 1 ? 'trade' : 'trades'}`

    return (
      <div
        className="calendar-cell relative cursor-pointer"
        style={{
          background: bg,
          border: '1px solid var(--color-border)',
          padding: '8px 10px',
          opacity: 0.45,
        }}
        onPointerDown={() => router.push(`/sessions?date=${session.trade_day}`)}
      >
        <span
          className="absolute"
          style={{ top: 6, left: 8, fontSize: 12, color: 'var(--color-text-tertiary)' }}
        >
          {day}
        </span>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <span
            className="font-mono tabular-nums font-semibold"
            style={{ fontSize: 16, color: pnlColor }}
          >
            {formatPnl(pnl)}
          </span>
          <span
            className="font-mono tabular-nums"
            style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}
          >
            {tradeLabel}
          </span>
        </div>
      </div>
    )
  }

  // Current month, no trades
  if (!session) {
    return (
      <div
        className="calendar-cell relative"
        style={{
          background: 'var(--color-bg-tertiary)',
          border: todayBorder,
          padding: '8px 10px',
        }}
      >
        <span
          className="absolute"
          style={{ top: 6, left: 8, fontSize: 12, color: todayDayColor }}
        >
          {day}
        </span>
      </div>
    )
  }

  // Current month, has trades
  const pnl = session.net_pnl
  const isGreen = pnl > 0
  const isRed = pnl < 0
  const bg = isGreen ? 'var(--color-gain-bg)' : isRed ? 'var(--color-loss-bg)' : 'var(--color-bg-tertiary)'
  const pnlColor = isRed ? 'var(--color-loss)' : 'var(--color-gain)'
  const tradeLabel = `${session.trade_count} ${session.trade_count === 1 ? 'trade' : 'trades'}`

  return (
    <div
      className="calendar-cell relative cursor-pointer transition-colors"
      style={{
        background: bg,
        border: todayBorder,
        padding: '8px 10px',
      }}
      onPointerDown={() => router.push(`/sessions?date=${session.trade_day}`)}
    >
      <span
        className="absolute"
        style={{ top: 6, left: 8, fontSize: 12, color: todayDayColor }}
      >
        {day}
      </span>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <span
          className="font-mono tabular-nums font-semibold"
          style={{ fontSize: 16, color: pnlColor }}
        >
          {formatPnl(pnl)}
        </span>
        <span
          className="font-mono tabular-nums"
          style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}
        >
          {tradeLabel}
        </span>
      </div>
    </div>
  )
}
