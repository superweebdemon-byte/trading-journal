/** Raw CSV row — all 13 columns as strings, exactly matching Topstep X export */
export interface RawCsvRow {
  Id: string
  ContractName: string
  EnteredAt: string
  ExitedAt: string
  EntryPrice: string
  ExitPrice: string
  Fees: string
  PnL: string
  Size: string
  Type: string
  TradeDay: string
  TradeDuration: string
  Commissions: string
}

/** Normalized trade ready for Supabase insert (matches trades table schema) */
export interface NormalizedTrade {
  topstep_id: number
  contract_name: string
  contract_symbol: string
  contract_expiry: string | null
  entered_at: string // ISO 8601 UTC
  exited_at: string // ISO 8601 UTC
  entry_price: string // numeric string for Supabase
  exit_price: string // numeric string for Supabase
  fees: string // numeric string
  pnl: string // numeric string (net, after fees)
  gross_pnl: string // numeric string (pnl + fees)
  size: number
  trade_type: 'Long' | 'Short'
  outcome: 'win' | 'loss' | 'breakeven'
  trade_day: string // YYYY-MM-DD
  trade_duration: string | null // PostgreSQL interval string
  commissions: string // numeric string
  raw_csv_row: RawCsvRow
}

/** Trade as returned from Supabase query (includes DB-generated fields) */
export interface Trade extends NormalizedTrade {
  id: string
  user_id: string
  import_batch_id: string | null
  created_at: string
}

/** Session — trades grouped by trade_day with summary stats */
export interface Session {
  trade_day: string
  trades: Trade[]
  net_pnl: number
  gross_pnl: number
  trade_count: number
  win_count: number
  loss_count: number
  breakeven_count: number
  win_rate: number
  contracts: string[] // unique contract symbols traded
  total_fees: number
}

/** Import batch metadata */
export interface ImportBatch {
  id: string
  user_id: string
  filename: string
  row_count: number
  imported_at: string
  status: 'pending' | 'complete' | 'failed'
}

/** Filters for trade queries */
export interface TradeFilters {
  dateFrom?: string
  dateTo?: string
  contractSymbol?: string
  tradeType?: 'Long' | 'Short'
  outcome?: 'win' | 'loss' | 'breakeven'
}

/** User settings matching user_settings table */
export interface UserSettings {
  user_id: string
  revenge_window_seconds: number
  overtrade_multiplier: number
  pnl_display: 'gross' | 'net'
  theme: string
  timeframe_bucket_minutes: number
  default_contract: string
  timezone_display: 'ET' | 'CT' | 'PT' | 'UTC'
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  currency_format: 'USD' | 'EUR'
  relative_dates: boolean
  compact_numbers: boolean
  created_at: string
  updated_at: string
}
