'use client'

import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import type { NormalizedTrade } from '@/lib/types'

interface ImportSummaryProps {
  newCount: number
  dupCount: number
  trades: NormalizedTrade[]
}

export function ImportSummary({ newCount, dupCount, trades }: ImportSummaryProps) {
  const { sessionCount, dateRange } = useMemo(() => {
    if (trades.length === 0) {
      return { sessionCount: 0, dateRange: '' }
    }

    // Count unique trade days = sessions
    const days = new Set(trades.map((t) => t.trade_day))
    const sessionCount = days.size

    // Date range
    const sorted = [...days].sort()
    const from = sorted[0]
    const to = sorted[sorted.length - 1]

    const fromFormatted = format(parseISO(from), 'MMM d')
    const toFormatted = format(parseISO(to), 'MMM d')

    const dateRange = from === to ? fromFormatted : `${fromFormatted} – ${toFormatted}`

    return { sessionCount, dateRange }
  }, [trades])

  return (
    <div
      className="rounded px-3 py-2 mb-3"
      style={{
        background: 'rgba(22,27,34,0.8)',
        border: '1px solid rgba(48,54,61,0.12)',
      }}
    >
      <div className="flex items-center gap-6">
        <div
          className="uppercase tracking-wider font-semibold"
          style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: '10px',
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.14em',
          }}
        >
          Import Summary
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>New trades</span>
            <span
              className="tabular-nums font-bold"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: '12px',
                color: 'var(--color-gain)',
              }}
            >
              {newCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Duplicates</span>
            <span
              className="tabular-nums font-bold"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: '12px',
                color: 'var(--color-text-tertiary)',
              }}
            >
              {dupCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Days</span>
            <span
              className="tabular-nums font-bold"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: '12px',
                color: 'var(--color-text-primary)',
              }}
            >
              {sessionCount}
            </span>
          </div>
          {dateRange && (
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Range</span>
              <span
                className="tabular-nums font-medium"
                style={{
                  fontFamily: 'var(--font-display), sans-serif',
                  fontSize: '10px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {dateRange}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
