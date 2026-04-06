/** Day-of-week stats for time-based analysis */
export interface DayOfWeekStats {
  day: string
  totalPnl: number
  tradeCount: number
  avgPnl: number
  winRate: number
}

/** Time bucket stats (30-min buckets) */
export interface TimeBucketStats {
  bucket: string
  totalPnl: number
  tradeCount: number
  avgPnl: number
}

/** Session window stats */
export interface SessionStats {
  session: 'pre-market' | 'ny-open' | 'midday' | 'afternoon'
  totalPnl: number
  tradeCount: number
  avgPnl: number | null
  winRate: number | null
}

/** Monthly P&L data point */
export interface MonthlyPnl {
  month: string
  pnl: number
  delta: number | null
}

/** Position size group stats */
export interface SizeGroupStats {
  size: number
  tradeCount: number
  wins: number
  losses: number
  breakevens: number
  winRate: number
  avgPnl: number
}

/** Core P&L KPIs */
export interface CorePnlKpis {
  winRate: number | null
  profitFactor: number | null
  avgWin: number | null
  avgLoss: number | null
  winLossRatio: number | null
  totalPnl: number
  dailyPnl: Record<string, number>
  weeklyPnl: Record<string, number>
  monthlyPnl: Record<string, number>
  totalTrades: number
  winCount: number
  lossCount: number
  largestWin: number | null
  largestLoss: number | null
  avgDurationSeconds: number | null
}

/** Time-based KPIs */
export interface TimeBasedKpis {
  dayOfWeek: DayOfWeekStats[]
  bestDay: string | null
  worstDay: string | null
  timeBuckets: TimeBucketStats[]
  bestBucket: string | null
  worstBucket: string | null
  sessions: SessionStats[]
  monthlyTrend: MonthlyPnl[]
}

/** Behavioral KPIs */
export interface BehavioralKpis {
  revengeTradeCount: number
  overtradeDays: string[]
  maxConsecutiveWins: number
  maxConsecutiveLosses: number
  tiltTradeCount: number
  tiltAvgPnl: number | null
  overallAvgPnl: number | null
  tiltDelta: number | null
}

/** Risk KPIs */
export interface RiskKpis {
  maxDrawdownDollars: number
  maxDrawdownPercent: number | null
  avgRiskPerTrade: number | null
  riskRewardRatio: number | null
  sizeGroups: SizeGroupStats[]
  sizeCorrelation: number | null
}

/** Direction split stats (Long vs Short) */
export interface DirectionStats {
  direction: 'Long' | 'Short'
  winRate: number
  avgPnl: number
  tradeCount: number
}

/** Performance Edge KPIs */
export interface PerformanceEdgeKpis {
  /** (winRate × avgWin) - (lossRate × avgLoss) */
  expectancy: number | null
  /** Total trades used in computation */
  totalTrades: number
  /** Win rate as decimal (0-1) for the formula breakdown */
  winRateDecimal: number | null
  /** Loss rate as decimal (0-1) */
  lossRateDecimal: number | null
  /** Avg win amount (positive) */
  avgWin: number | null
  /** Avg loss amount (positive, absolute) */
  avgLoss: number | null
  /** Long vs Short directional breakdown */
  directionSplit: DirectionStats[]
  /** Which direction has the edge, or null if equal/insufficient data */
  strongerDirection: 'Long' | 'Short' | null
  /** Long trade percentage (0-100) for the strength bar */
  longPercent: number
  /** Three-way outcome split */
  winPercent: number
  lossPercent: number
  breakevenPercent: number
  winCount: number
  lossCount: number
  breakevenCount: number
  /** Recovery Factor: totalNetPnl / maxDrawdownDollars */
  recoveryFactor: number | null
  /** Recovery factor rating label */
  recoveryRating: 'POOR' | 'MODERATE' | 'GOOD' | 'EXCELLENT'
  /** Best consecutive winning streak */
  maxConsecutiveWins: number
  /** Worst consecutive losing streak */
  maxConsecutiveLosses: number
}

/** Combined KPI result */
export interface KpiResults {
  corePnl: CorePnlKpis
  timeBased: TimeBasedKpis
  behavioral: BehavioralKpis
  risk: RiskKpis
  performanceEdge: PerformanceEdgeKpis
}
