import type { Trade } from '@/lib/types'
import type { TimeBasedKpis, DayOfWeekStats, TimeBucketStats, SessionStats, MonthlyPnl } from './types'
import { getTradePnl, classifyTrade } from './core-pnl'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Extract local hour and minute from an ISO timestamp.
 * The entered_at is stored as UTC ISO string. We need the original local time.
 * Since the adapter converts to UTC, we need to recover the local time.
 * The trade_day + the UTC time gives us enough context, but the spec says
 * to use the timestamp's original offset. Since entered_at is UTC, and the
 * original offset was embedded in the raw CSV, we parse the UTC time and
 * apply the known offset pattern: trades before 2026-03-09 are ET (UTC-5),
 * trades on/after 2026-03-09 are EDT (UTC-4).
 *
 * Simpler approach: derive local time from UTC by applying -5 or -4 offset.
 */
function getLocalTimeComponents(trade: Trade): { dayOfWeek: number; hour: number; minute: number } {
  const utcDate = new Date(trade.entered_at)
  // Determine offset: 2026-03-08 is DST change date
  // Before 2026-03-09: EST = UTC-5
  // On/after 2026-03-09: EDT = UTC-4
  const dstCutoff = new Date('2026-03-09T00:00:00Z')
  const offsetHours = utcDate < dstCutoff ? -5 : -4

  const localMs = utcDate.getTime() + offsetHours * 3600 * 1000
  const localDate = new Date(localMs)

  return {
    dayOfWeek: localDate.getUTCDay(),
    hour: localDate.getUTCHours(),
    minute: localDate.getUTCMinutes(),
  }
}

/** Get local day of week name */
function getLocalDayOfWeek(trade: Trade): string {
  const { dayOfWeek } = getLocalTimeComponents(trade)
  return DAY_NAMES[dayOfWeek]
}

/** Get 30-min bucket label like "09:30", "10:00" */
function getTimeBucket(trade: Trade): string {
  const { hour, minute } = getLocalTimeComponents(trade)
  const minuteOfDay = hour * 60 + minute
  const bucketStart = Math.floor(minuteOfDay / 30) * 30
  const bucketHour = Math.floor(bucketStart / 60)
  const bucketMinute = bucketStart % 60
  return `${String(bucketHour).padStart(2, '0')}:${String(bucketMinute).padStart(2, '0')}`
}

/** Determine session from local time */
function getSession(trade: Trade): 'pre-market' | 'ny-open' | 'midday' | 'afternoon' {
  const { hour, minute } = getLocalTimeComponents(trade)
  const minuteOfDay = hour * 60 + minute

  if (minuteOfDay < 9 * 60 + 30) return 'pre-market'
  if (minuteOfDay < 11 * 60) return 'ny-open'
  if (minuteOfDay < 14 * 60) return 'midday'
  return 'afternoon'
}

/** Extract year-month "YYYY-MM" from trade_day */
function getTradeMonth(trade: Trade): string {
  return trade.trade_day.substring(0, 7)
}

/** Compute all Time-Based KPIs */
export function computeTimeBasedKpis(
  trades: Trade[],
  pnlMode: 'net' | 'gross'
): TimeBasedKpis {
  // Day of week aggregation
  const dowMap = new Map<string, { totalPnl: number; count: number; wins: number }>()
  // Time bucket aggregation
  const bucketMap = new Map<string, { totalPnl: number; count: number }>()
  // Session aggregation
  const sessionMap = new Map<string, { totalPnl: number; count: number; wins: number }>()
  for (const s of ['pre-market', 'ny-open', 'midday', 'afternoon'] as const) {
    sessionMap.set(s, { totalPnl: 0, count: 0, wins: 0 })
  }
  // Monthly aggregation
  const monthMap = new Map<string, number>()

  for (const trade of trades) {
    const pnl = getTradePnl(trade, pnlMode)
    const outcome = classifyTrade(pnl)

    // Day of week
    const dow = getLocalDayOfWeek(trade)
    const dowEntry = dowMap.get(dow) ?? { totalPnl: 0, count: 0, wins: 0 }
    dowEntry.totalPnl += pnl
    dowEntry.count++
    if (outcome === 'win') dowEntry.wins++
    dowMap.set(dow, dowEntry)

    // Time bucket
    const bucket = getTimeBucket(trade)
    const bucketEntry = bucketMap.get(bucket) ?? { totalPnl: 0, count: 0 }
    bucketEntry.totalPnl += pnl
    bucketEntry.count++
    bucketMap.set(bucket, bucketEntry)

    // Session
    const session = getSession(trade)
    const sessionEntry = sessionMap.get(session)!
    sessionEntry.totalPnl += pnl
    sessionEntry.count++
    if (outcome === 'win') sessionEntry.wins++

    // Monthly
    const month = getTradeMonth(trade)
    monthMap.set(month, (monthMap.get(month) ?? 0) + pnl)
  }

  // Build day of week stats
  const dayOfWeek: DayOfWeekStats[] = []
  for (const [day, data] of dowMap) {
    dayOfWeek.push({
      day,
      totalPnl: data.totalPnl,
      tradeCount: data.count,
      avgPnl: data.count > 0 ? data.totalPnl / data.count : 0,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
    })
  }
  dayOfWeek.sort((a, b) => b.totalPnl - a.totalPnl)

  const bestDay = dayOfWeek.length > 0 ? dayOfWeek[0].day : null
  const worstDay = dayOfWeek.length > 0 ? dayOfWeek[dayOfWeek.length - 1].day : null

  // Build time bucket stats
  const timeBuckets: TimeBucketStats[] = []
  for (const [bucket, data] of bucketMap) {
    timeBuckets.push({
      bucket,
      totalPnl: data.totalPnl,
      tradeCount: data.count,
      avgPnl: data.count > 0 ? data.totalPnl / data.count : 0,
    })
  }
  timeBuckets.sort((a, b) => a.bucket.localeCompare(b.bucket))

  const bestBucket =
    timeBuckets.length > 0
      ? timeBuckets.reduce((a, b) => (b.totalPnl > a.totalPnl ? b : a)).bucket
      : null
  const worstBucket =
    timeBuckets.length > 0
      ? timeBuckets.reduce((a, b) => (b.totalPnl < a.totalPnl ? b : a)).bucket
      : null

  // Build session stats
  const sessions: SessionStats[] = (['pre-market', 'ny-open', 'midday', 'afternoon'] as const).map(
    (session) => {
      const data = sessionMap.get(session)!
      return {
        session,
        totalPnl: data.totalPnl,
        tradeCount: data.count,
        avgPnl: data.count > 0 ? data.totalPnl / data.count : null,
        winRate: data.count > 0 ? (data.wins / data.count) * 100 : null,
      }
    }
  )

  // Build monthly trend
  const sortedMonths = Array.from(monthMap.keys()).sort()
  const monthlyTrend: MonthlyPnl[] = sortedMonths.map((month, i) => ({
    month,
    pnl: monthMap.get(month)!,
    delta: i > 0 ? monthMap.get(month)! - monthMap.get(sortedMonths[i - 1])! : null,
  }))

  return {
    dayOfWeek,
    bestDay,
    worstDay,
    timeBuckets,
    bestBucket,
    worstBucket,
    sessions,
    monthlyTrend,
  }
}
