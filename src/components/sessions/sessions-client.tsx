'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Session } from '@/lib/types'
import { FilterBar, type FilterId } from './filter-bar'
import { MonthSummary, type MonthData } from './month-summary'
import { SessionCard } from './session-card'

interface SessionsClientProps {
  sessions: Session[]
  initialDate?: string // YYYY-MM-DD from ?date= query param
}

const PAGE_SIZE = 10

function getMonthKey(tradeDay: string): string {
  // "2026-03-12" -> "2026-03"
  return tradeDay.slice(0, 7)
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${monthNames[parseInt(month, 10) - 1]} '${year.slice(2)}`
}

function getMonthFullLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`
}

export function SessionsClient({ sessions, initialDate }: SessionsClientProps) {
  const [activeFilters, setActiveFilters] = useState<Set<FilterId>>(new Set(['all-dates']))
  const [selectedMonth, setSelectedMonth] = useState<string | null>(
    initialDate ? initialDate.slice(0, 7) : null
  )
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    initialDate ? new Set([initialDate]) : new Set()
  )
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Build month summary data
  const monthData: MonthData[] = useMemo(() => {
    const monthMap = new Map<string, { pnl: number; trades: number; sessions: number }>()
    for (const s of sessions) {
      const key = getMonthKey(s.trade_day)
      const existing = monthMap.get(key) ?? { pnl: 0, trades: 0, sessions: 0 }
      existing.pnl += s.net_pnl
      existing.trades += s.trade_count
      existing.sessions += 1
      monthMap.set(key, existing)
    }
    return Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) // newest first
      .map(([key, data]) => ({
        key,
        label: getMonthLabel(key),
        pnl: data.pnl,
        tradeCount: data.trades,
        sessionCount: data.sessions,
      }))
  }, [sessions])

  // Apply filters
  const filteredSessions = useMemo(() => {
    let result = sessions

    // Month filter (from month summary selection)
    if (selectedMonth) {
      result = result.filter((s) => getMonthKey(s.trade_day) === selectedMonth)
    }

    // Contract filters
    const hasContractFilter = activeFilters.has('MYM') || activeFilters.has('MNQ')
    if (hasContractFilter) {
      result = result.filter((s) => {
        if (activeFilters.has('MYM') && s.contracts.some((c) => c.toUpperCase().startsWith('MYM'))) return true
        if (activeFilters.has('MNQ') && s.contracts.some((c) => c.toUpperCase().startsWith('MNQ'))) return true
        return false
      })
    }

    // Direction filters
    const hasDirectionFilter = activeFilters.has('Long') || activeFilters.has('Short')
    if (hasDirectionFilter) {
      result = result.filter((s) => {
        if (activeFilters.has('Long') && s.trades.some((t) => t.trade_type === 'Long')) return true
        if (activeFilters.has('Short') && s.trades.some((t) => t.trade_type === 'Short')) return true
        return false
      })
    }

    // Outcome filters
    const hasOutcomeFilter = activeFilters.has('win') || activeFilters.has('loss') || activeFilters.has('breakeven')
    if (hasOutcomeFilter) {
      result = result.filter((s) => {
        if (activeFilters.has('win') && s.net_pnl > 0) return true
        if (activeFilters.has('loss') && s.net_pnl < 0) return true
        if (activeFilters.has('breakeven') && s.net_pnl === 0) return true
        return false
      })
    }

    return result
  }, [sessions, selectedMonth, activeFilters])

  // Group filtered sessions by month for display
  const groupedByMonth = useMemo(() => {
    const groups: { monthKey: string; label: string; sessions: Session[] }[] = []
    const monthMap = new Map<string, Session[]>()
    for (const s of filteredSessions) {
      const key = getMonthKey(s.trade_day)
      const existing = monthMap.get(key) ?? []
      existing.push(s)
      monthMap.set(key, existing)
    }
    for (const [key, sess] of monthMap) {
      groups.push({ monthKey: key, label: getMonthFullLabel(key), sessions: sess })
    }
    groups.sort((a, b) => b.monthKey.localeCompare(a.monthKey))
    return groups
  }, [filteredSessions])

  // Flatten for pagination
  const allVisibleSessions = useMemo(() => filteredSessions.slice(0, visibleCount), [filteredSessions, visibleCount])
  const remaining = filteredSessions.length - visibleCount

  const handleFilterToggle = useCallback((filter: FilterId) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (filter === 'all-dates') {
        // Reset: clear all, set all-dates
        return new Set<FilterId>(['all-dates'])
      }
      // Remove all-dates when selecting specific filter
      next.delete('all-dates')
      if (next.has(filter)) {
        next.delete(filter)
      } else {
        next.add(filter)
      }
      // If nothing selected, go back to all-dates
      if (next.size === 0) {
        return new Set<FilterId>(['all-dates'])
      }
      return next
    })
    setVisibleCount(PAGE_SIZE)
  }, [])

  const handleMonthSelect = useCallback((monthKey: string | null) => {
    setSelectedMonth(monthKey)
    setVisibleCount(PAGE_SIZE)
  }, [])

  const handleToggleExpand = useCallback((tradeDay: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev)
      if (next.has(tradeDay)) {
        next.delete(tradeDay)
      } else {
        next.add(tradeDay)
      }
      return next
    })
  }, [])

  // Build paginated groups
  const paginatedGroups = useMemo(() => {
    const visibleDays = new Set(allVisibleSessions.map((s) => s.trade_day))
    return groupedByMonth
      .map((g) => ({
        ...g,
        sessions: g.sessions.filter((s) => visibleDays.has(s.trade_day)),
      }))
      .filter((g) => g.sessions.length > 0)
  }, [allVisibleSessions, groupedByMonth])

  return (
    <div>
      <FilterBar activeFilters={activeFilters} onToggle={handleFilterToggle} />
      <MonthSummary months={monthData} selectedMonth={selectedMonth} onSelect={handleMonthSelect} />

      <div className="space-y-1.5">
        {paginatedGroups.map((group, gi) => (
          <div key={group.monthKey}>
            {/* Month heading / divider */}
            {gi === 0 ? (
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-semibold"
                    style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", color: 'var(--color-text-primary)' }}
                  >
                    {group.label}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                    &middot; {group.sessions.length} days &middot;{' '}
                    {group.sessions.reduce((sum, s) => sum + s.trade_count, 0)} trades
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-1 mb-1.5">
                <div className="h-px flex-1" style={{ background: 'var(--color-text-quaternary)' }} />
                <span
                  className="text-[11px] font-semibold"
                  style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", color: 'var(--color-text-tertiary)' }}
                >
                  {group.label}
                </span>
                <div className="h-px flex-1" style={{ background: 'var(--color-text-quaternary)' }} />
              </div>
            )}

            <div className="space-y-1.5">
              {group.sessions.map((session) => (
                <SessionCard
                  key={session.trade_day}
                  session={session}
                  isExpanded={expandedSessions.has(session.trade_day)}
                  onToggle={() => handleToggleExpand(session.trade_day)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {remaining > 0 && (
        <div className="text-center py-2">
          <button
            onPointerDown={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="text-[11px] cursor-pointer hover:opacity-80 transition-opacity"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", color: 'var(--color-text-tertiary)', background: 'none', border: 'none' }}
          >
            Load more ({remaining} remaining)
          </button>
        </div>
      )}

      {filteredSessions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>
            No trades match the current filters.
          </p>
        </div>
      )}
    </div>
  )
}
