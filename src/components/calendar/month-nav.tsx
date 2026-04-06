'use client'

import { format } from 'date-fns'

interface MonthNavProps {
  year: number
  month: number // 0-indexed
  onNavigate: (year: number, month: number) => void
}

export function MonthNav({ year, month, onNavigate }: MonthNavProps) {
  const goPrev = () => {
    const prev = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    onNavigate(prevYear, prev)
  }

  const goNext = () => {
    const next = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    onNavigate(nextYear, next)
  }

  const goToday = () => {
    const now = new Date()
    onNavigate(now.getFullYear(), now.getMonth())
  }

  const label = format(new Date(year, month, 1), 'MMM yyyy')

  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2.5">
        <button
          onPointerDown={goPrev}
          aria-label="Previous month"
          className="flex items-center justify-center cursor-pointer transition-colors"
          style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-tertiary)',
            fontSize: 14,
          }}
        >
          &larr;
        </button>
        <h1
          className="font-semibold"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 20,
            color: 'var(--color-text-primary)',
          }}
        >
          {label}
        </h1>
        <button
          onPointerDown={goNext}
          aria-label="Next month"
          className="flex items-center justify-center cursor-pointer transition-colors"
          style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-tertiary)',
            fontSize: 14,
          }}
        >
          &rarr;
        </button>
      </div>

      <button
        onPointerDown={goToday}
        className="cursor-pointer transition-colors"
        style={{
          padding: '4px 14px',
          borderRadius: 6,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-tertiary)',
          fontSize: 12,
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        Today
      </button>
    </div>
  )
}
