import type { Session } from '@/lib/types'
import { DayCell } from './day-cell'
import { WeeklySummaryCell } from './weekly-summary-cell'

interface MonthGridProps {
  year: number
  month: number // 0-indexed (JS Date convention)
  sessionsByDay: Map<string, Session> // key: YYYY-MM-DD
}

const DAY_HEADERS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

interface CalendarDay {
  day: number
  isCurrentMonth: boolean
  dateKey: string // YYYY-MM-DD
}

interface CalendarWeek {
  days: CalendarDay[] // 7 days: Sun through Sat
  weekNumber: number
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildCalendarWeeks(year: number, month: number): CalendarWeek[] {
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // getDay(): Sun=0, Mon=1, ..., Sat=6  — already Sunday-first
  const startDow = firstOfMonth.getDay()

  const allDays: CalendarDay[] = []

  // Fill leading days from previous month (to fill back to Sunday)
  if (startDow > 0) {
    const prevMonthDays = new Date(year, month, 0).getDate()
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevMonthDays - i
      allDays.push({ day: d, isCurrentMonth: false, dateKey: toDateKey(prevYear, prevMonth, d) })
    }
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    allDays.push({ day: d, isCurrentMonth: true, dateKey: toDateKey(year, month, d) })
  }

  // Fill trailing days from next month to always reach exactly 42 days (6 weeks)
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year
  let nextDay = 1
  while (allDays.length < 42) {
    allDays.push({ day: nextDay, isCurrentMonth: false, dateKey: toDateKey(nextYear, nextMonth, nextDay) })
    nextDay++
  }

  // Split into exactly 6 weeks of 7 days
  const weeks: CalendarWeek[] = []
  for (let i = 0; i < 42; i += 7) {
    const weekDays = allDays.slice(i, i + 7)
    weeks.push({
      days: weekDays,
      weekNumber: 0,
    })
  }

  // Assign week numbers (Topstep X style)
  // A week belongs to the current month only if it has NO next-month days.
  // Once a week contains any next-month day, the counter resets to Week 1.
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  const lastDateKey = toDateKey(year, month, lastDayOfMonth)

  let currentMonthWeek = 0
  let nextMonthWeek = 0
  for (let i = 0; i < weeks.length; i++) {
    const hasNextMonthDay = weeks[i].days.some(d => !d.isCurrentMonth && d.dateKey > lastDateKey)
    if (!hasNextMonthDay) {
      currentMonthWeek++
      weeks[i].weekNumber = currentMonthWeek
    } else {
      nextMonthWeek++
      weeks[i].weekNumber = nextMonthWeek
    }
  }

  return weeks
}

/** Aggregate P&L and trade count for a week (Sun-Sat) */
function aggregateWeek(
  days: CalendarDay[],
  sessionsByDay: Map<string, Session>
): { totalPnl: number; tradeCount: number; hasTrades: boolean } {
  let totalPnl = 0
  let tradeCount = 0
  let hasTrades = false

  for (const day of days) {
    const session = sessionsByDay.get(day.dateKey)
    if (session) {
      totalPnl += session.net_pnl
      tradeCount += session.trade_count
      hasTrades = true
    }
  }

  return { totalPnl, tradeCount, hasTrades }
}

export function MonthGrid({ year, month, sessionsByDay }: MonthGridProps) {
  const weeks = buildCalendarWeeks(year, month)

  // Today's date key for highlighting
  const now = new Date()
  const todayKey = toDateKey(now.getFullYear(), now.getMonth(), now.getDate())

  return (
    <div className="overflow-x-auto sm:overflow-visible" style={{ flex: 1, minHeight: 0 }}>
      <div
        className="min-w-[640px] sm:min-w-0 h-full"
        style={{
          background: 'var(--color-border-subtle)',
          border: '1px solid var(--color-border)',
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr) 140px',
          gridTemplateRows: 'auto repeat(6, 1fr)',
          minHeight: '510px',
        }}
      >
      {/* Day headers */}
      {DAY_HEADERS.map((d) => (
        <div
          key={d}
          className="text-center uppercase tracking-wider font-medium"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 11,
            color: 'var(--color-text-tertiary)',
            letterSpacing: '0.06em',
            padding: '6px 0',
            borderLeft: undefined,
          }}
        >
          {d}
        </div>
      ))}

      {/* Week rows */}
      {weeks.map((week, wi) => {
        const { totalPnl, tradeCount, hasTrades } = aggregateWeek(week.days, sessionsByDay)
        return week.days.map((cell, di) => {
          // Saturday column (index 6) = weekly summary
          if (di === 6) {
            return (
              <WeeklySummaryCell
                key={cell.dateKey}
                day={cell.day}
                weekNumber={week.weekNumber}
                totalPnl={totalPnl}
                tradeCount={tradeCount}
                hasTrades={hasTrades}
                isCurrentMonth={cell.isCurrentMonth}
                isOverflowWeek={false}
              />
            )
          }

          return (
            <DayCell
              key={cell.dateKey}
              day={cell.day}
              session={sessionsByDay.get(cell.dateKey) ?? null}
              isCurrentMonth={cell.isCurrentMonth}
              isToday={cell.dateKey === todayKey}
            />
          )
        })
      })}
      </div>
    </div>
  )
}
