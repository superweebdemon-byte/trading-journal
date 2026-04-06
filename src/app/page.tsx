import { createClient } from '@/lib/supabase/server'
import { computeAllKpis } from '@/lib/kpi'
import type { Trade, UserSettings } from '@/lib/types'
import { KpiRibbon } from '@/components/dashboard/kpi-ribbon'
import { EquityCurve } from '@/components/dashboard/equity-curve'
import { PerformanceEdge } from '@/components/dashboard/performance-edge'
import { TradeBreakdown } from '@/components/dashboard/contract-performance'
import { TimeDayPanel } from '@/components/dashboard/time-day-panel'
import { MonthlyPnl } from '@/components/dashboard/monthly-pnl'

const DEFAULT_SETTINGS: UserSettings = {
  user_id: '',
  revenge_window_seconds: 120,
  overtrade_multiplier: 2,
  pnl_display: 'net',
  theme: 'split-cockpit',
  timeframe_bucket_minutes: 30,
  default_contract: 'MNQ',
  timezone_display: 'ET',
  date_format: 'MM/DD/YYYY',
  currency_format: 'USD',
  relative_dates: true,
  compact_numbers: false,
  created_at: '',
  updated_at: '',
}

async function fetchTrades(): Promise<Trade[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('entered_at', { ascending: true })

  if (error) return []
  return (data ?? []) as Trade[]
}

async function fetchSettings(): Promise<UserSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .single()

  if (error || !data) return DEFAULT_SETTINGS
  return data as UserSettings
}

function buildDateRange(trades: Trade[]): string {
  if (trades.length === 0) return ''
  const months = new Set(trades.map(t => t.trade_day.substring(0, 7)))
  const sorted = Array.from(months).sort()
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const fmt = (ym: string) => {
    const [y, m] = ym.split('-')
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${names[parseInt(m, 10) - 1]} ${y}`
  }
  if (first === last) return fmt(first)
  return `${fmt(first)} – ${fmt(last)}`
}

function buildTradeCountByMonth(trades: Trade[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const t of trades) {
    const month = t.trade_day.substring(0, 7)
    counts[month] = (counts[month] ?? 0) + 1
  }
  return counts
}

export default async function DashboardPage() {
  const [trades, settings] = await Promise.all([fetchTrades(), fetchSettings()])

  const pnlMode = settings.pnl_display === 'gross' ? 'gross' : 'net'
  const kpis = computeAllKpis(trades, settings, pnlMode)
  const dateRange = buildDateRange(trades)
  const tradeCountByMonth = buildTradeCountByMonth(trades)

  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <p style={{ color: '#6E7681', fontSize: '14px', fontFamily: "'Space Grotesk', sans-serif" }}>
            No trades yet
          </p>
          <p style={{ color: '#6E7681', fontSize: '11px', marginTop: '4px' }}>
            Import a CSV to see your dashboard
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col gap-3 overflow-hidden">
      {/* Row 1: KPI Ribbon — fixed height, never shrinks */}
      <div className="flex-shrink-0">
        <KpiRibbon corePnl={kpis.corePnl} risk={kpis.risk} dateRange={dateRange} />
      </div>

      {/* Row 2: Equity Curve + Behavioral Signals + Performance Edge — takes ~60% of remaining space */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0" style={{ flex: '6 1 0%' }}>
        <EquityCurve
          trades={trades}
          pnlMode={pnlMode}
          maxDrawdownDollars={kpis.risk.maxDrawdownDollars}
        />
        <div className="col-span-1 lg:col-span-4 flex flex-col justify-evenly min-h-0">
          <TradeBreakdown trades={trades} pnlMode={pnlMode} />
          <PerformanceEdge
            edge={kpis.performanceEdge}
          />
        </div>
      </div>

      {/* Row 3: Time+Day Panel + Monthly P&L — takes ~40% of remaining space */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0" style={{ flex: '4 1 0%' }}>
        <div className="col-span-1 lg:col-span-6 overflow-hidden">
          <TimeDayPanel
            timeBuckets={kpis.timeBased.timeBuckets}
            bestBucket={kpis.timeBased.bestBucket}
            dayOfWeek={kpis.timeBased.dayOfWeek}
            bestDay={kpis.timeBased.bestDay}
          />
        </div>
        <div className="col-span-1 lg:col-span-6 overflow-hidden">
          <MonthlyPnl
            monthlyTrend={kpis.timeBased.monthlyTrend}
            monthlyPnlMap={kpis.corePnl.monthlyPnl}
            tradeCountByMonth={tradeCountByMonth}
          />
        </div>
      </div>
    </div>
  )
}
