import type { Trade, UserSettings } from '@/lib/types'

let idCounter = 1

/** Create a minimal Trade for testing */
export function makeTrade(overrides: Partial<Trade> & {
  pnl?: string
  gross_pnl?: string
  entered_at?: string
  exited_at?: string
  trade_day?: string
  size?: number
  trade_duration?: string | null
}): Trade {
  const id = String(idCounter++)
  const pnl = overrides.pnl ?? '0'
  const grossPnl = overrides.gross_pnl ?? String(parseFloat(pnl) + 5.92)
  const fees = String(parseFloat(grossPnl) - parseFloat(pnl))

  return {
    id: overrides.id ?? id,
    user_id: 'test-user',
    import_batch_id: null,
    created_at: '2026-01-01T00:00:00Z',
    topstep_id: overrides.topstep_id ?? parseInt(id, 10),
    contract_name: 'MNQZ5',
    contract_symbol: 'MNQ',
    contract_expiry: '2025-12',
    entered_at: overrides.entered_at ?? '2026-01-15T14:30:00.000Z',
    exited_at: overrides.exited_at ?? '2026-01-15T14:45:00.000Z',
    entry_price: '100.00',
    exit_price: '101.00',
    fees,
    pnl,
    gross_pnl: grossPnl,
    size: overrides.size ?? 1,
    trade_type: overrides.trade_type ?? 'Long',
    outcome: parseFloat(pnl) > 0 ? 'win' : parseFloat(pnl) < 0 ? 'loss' : 'breakeven',
    trade_day: overrides.trade_day ?? '2026-01-15',
    trade_duration: overrides.trade_duration !== undefined ? overrides.trade_duration : '00:15:00.0000000',
    commissions: '0',
    raw_csv_row: {
      Id: id,
      ContractName: 'MNQZ5',
      EnteredAt: '',
      ExitedAt: '',
      EntryPrice: '100.00',
      ExitPrice: '101.00',
      Fees: fees,
      PnL: pnl,
      Size: String(overrides.size ?? 1),
      Type: 'Long',
      TradeDay: '',
      TradeDuration: '',
      Commissions: '0',
    },
  }
}

export function resetIdCounter(): void {
  idCounter = 1
}

export const DEFAULT_SETTINGS: UserSettings = {
  user_id: 'test-user',
  revenge_window_seconds: 120,
  overtrade_multiplier: 2.0,
  pnl_display: 'net',
  theme: 'midnight',
  timeframe_bucket_minutes: 30,
  default_contract: 'MNQ',
  timezone_display: 'ET',
  date_format: 'MM/DD/YYYY',
  currency_format: 'USD',
  relative_dates: true,
  compact_numbers: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}
