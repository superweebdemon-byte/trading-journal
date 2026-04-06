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

  // Fill trailing days from next month (to complete last week through Saturday)
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year
  let nextDay = 1
  while (allDays.length % 7 !== 0) {
    allDays.push({ day: nextDay, isCurrentMonth: false, dateKey: toDateKey(nextYear, nextMonth, nextDay) })
    nextDay++
  }

  // Split into weeks of 7
  const allWeeks: CalendarWeek[] = []
  for (let i = 0; i < allDays.length; i += 7) {
    const weekDays = allDays.slice(i, i + 7)
    allWeeks.push({
      days: weekDays,
      weekNumber: 0, // placeholder, assigned below
    })
  }

  // Remove trailing weeks where ALL days are outside the current month
  const weeks = allWeeks.filter(w => w.days.some(d => d.isCurrentMonth))

  // Assign week numbers sequentially: Week 1 through Week N
  for (let i = 0; i < weeks.length; i++) {
    weeks[i].weekNumber = i + 1
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
  const weekCount = weeks.length

  // Today's date key for highlighting
  const now = new Date()
  const todayKey = toDateKey(now.getFullYear(), now.getMonth(), now.getDate())

  // Weeks beyond row 4 are overflow (reduced opacity)

  return (
    <div
      className=""
      style={{
        background: 'var(--color-border-subtle)',
        border: '1px solid var(--color-border)',
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr) 140px',
        gridTemplateRows: `auto repeat(${weekCount}, 1fr)`,
        flex: 1,
        minHeight: `${weekCount * 80 + 30}px`,
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
        const isOverflowWeek = wi >= 4

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
                isOverflowWeek={isOverflowWeek}
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
  )
}
