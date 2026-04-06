'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { fetchTrades } from '@/lib/supabase/queries'
import type { Trade, Session } from '@/lib/types'
import { MonthNav } from '@/components/calendar/month-nav'
import { MonthGrid } from '@/components/calendar/month-grid'
import { MonthSummary } from '@/components/calendar/month-summary'

/** Group trades into sessions by trade_day */
function groupByDay(trades: Trade[]): Session[] {
  const grouped = new Map<string, Trade[]>()
  for (const trade of trades) {
    const existing = grouped.get(trade.trade_day) ?? []
    existing.push(trade)
    grouped.set(trade.trade_day, existing)
  }

  const sessions: Session[] = []
  for (const [tradeDay, dayTrades] of grouped) {
    const winCount = dayTrades.filter((t) => t.outcome === 'win').length
    const lossCount = dayTrades.filter((t) => t.outcome === 'loss').length
    const breakevenCount = dayTrades.filter((t) => t.outcome === 'breakeven').length
    const netPnl = dayTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0)
    const grossPnl = dayTrades.reduce((sum, t) => sum + parseFloat(t.gross_pnl), 0)
    const totalFees = dayTrades.reduce((sum, t) => sum + parseFloat(t.fees), 0)
    const contracts = [...new Set(dayTrades.map((t) => t.contract_symbol))]

    sessions.push({
      trade_day: tradeDay,
      trades: dayTrades,
      net_pnl: netPnl,
      gross_pnl: grossPnl,
      trade_count: dayTrades.length,
      win_count: winCount,
      loss_count: lossCount,
      breakeven_count: breakevenCount,
      win_rate: dayTrades.length > 0 ? winCount / dayTrades.length : 0,
      contracts,
      total_fees: totalFees,
    })
  }

  sessions.sort((a, b) => a.trade_day.localeCompare(b.trade_day))
  return sessions
}

export default function CalendarPage() {
  const [allTrades, setAllTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const trades = await fetchTrades()
        if (cancelled) return
        setAllTrades(trades)

        // Default to the most recent month with data
        if (trades.length > 0) {
          const sorted = [...trades].sort((a, b) => b.trade_day.localeCompare(a.trade_day))
          const latest = new Date(sorted[0].trade_day + 'T00:00:00')
          setYear(latest.getFullYear())
          setMonth(latest.getMonth())
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const allSessions = useMemo(() => groupByDay(allTrades), [allTrades])

  // Sessions for the visible month
  const monthSessions = useMemo(() => {
    return allSessions.filter((s) => {
      const d = new Date(s.trade_day + 'T00:00:00')
      return d.getFullYear() === year && d.getMonth() === month
    })
  }, [allSessions, year, month])

  // Map of YYYY-MM-DD -> Session for grid lookup
  const sessionsByDay = useMemo(() => {
    const map = new Map<string, Session>()
    for (const s of allSessions) {
      map.set(s.trade_day, s)
    }
    return map
  }, [allSessions])

  const handleNavigate = useCallback((newYear: number, newMonth: number) => {
    setYear(newYear)
    setMonth(newMonth)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <p className="text-sm" style={{ color: '#6E7681' }}>Loading calendar...</p>
      </div>
    )
  }

  return (
    <div
      className="w-full"
      style={{
        padding: '12px 24px 16px',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <MonthNav
        year={year}
        month={month}
        onNavigate={handleNavigate}
      />
      <MonthGrid
        year={year}
        month={month}
        sessionsByDay={sessionsByDay}
      />
      <div style={{ marginTop: 10, flexShrink: 0 }}>
        <MonthSummary sessions={monthSessions} />
      </div>
    </div>
  )
}
