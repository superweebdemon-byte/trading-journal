import type { Trade, RawCsvRow, NormalizedTrade } from '@/lib/types'

/** Minimal valid RawCsvRow for Topstep adapter tests */
export function makeRawRow(overrides: Partial<RawCsvRow> = {}): RawCsvRow {
  return {
    Id: '100001',
    ContractName: 'MNQZ5',
    EnteredAt: '11/18/2025 09:45:25 -05:00',
    ExitedAt: '11/18/2025 09:55:30 -05:00',
    EntryPrice: '21050.25',
    ExitPrice: '21065.50',
    Fees: '1.54',
    PnL: '6.11',
    Size: '1',
    Type: 'Long',
    TradeDay: '11/18/2025 00:00:00 -06:00',
    TradeDuration: '00:10:05.2472910',
    Commissions: '0.62',
    ...overrides,
  }
}

/** Base fields shared by all Trade fixtures (DB-generated columns) */
const dbFields = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  user_id: 'user-001',
  import_batch_id: 'batch-001',
  created_at: '2025-11-20T00:00:00Z',
}

/** Winning long trade: MNQ, net +6.11, gross +7.65 */
export const winningTrade: Trade = {
  ...dbFields,
  topstep_id: 100001,
  contract_name: 'MNQZ5',
  contract_symbol: 'MNQ',
  contract_expiry: 'Dec 2025',
  entered_at: '2025-11-18T14:45:25.000Z',
  exited_at: '2025-11-18T14:55:30.000Z',
  entry_price: '21050.25',
  exit_price: '21065.50',
  fees: '1.54',
  pnl: '6.11',
  gross_pnl: '7.650000000',
  size: 1,
  trade_type: 'Long',
  outcome: 'win',
  trade_day: '2025-11-18',
  trade_duration: '00:10:05.2472910',
  commissions: '0.62',
  raw_csv_row: makeRawRow(),
}

/** Losing short trade: MES, net -12.50, gross -10.96 */
export const losingTrade: Trade = {
  ...dbFields,
  id: 'aaaaaaaa-0000-0000-0000-000000000002',
  topstep_id: 100002,
  contract_name: 'MESH5',
  contract_symbol: 'MES',
  contract_expiry: 'Mar 2025',
  entered_at: '2025-11-18T15:10:00.000Z',
  exited_at: '2025-11-18T15:25:00.000Z',
  entry_price: '5980.00',
  exit_price: '5990.00',
  fees: '1.54',
  pnl: '-12.50',
  gross_pnl: '-10.960000000',
  size: 1,
  trade_type: 'Short',
  outcome: 'loss',
  trade_day: '2025-11-18',
  trade_duration: '00:15:00.0000000',
  commissions: '0.62',
  raw_csv_row: makeRawRow({ Id: '100002', PnL: '-12.50' }),
}

/** Breakeven trade: net 0, gross +1.54 */
export const breakevenTrade: Trade = {
  ...dbFields,
  id: 'aaaaaaaa-0000-0000-0000-000000000003',
  topstep_id: 100003,
  contract_name: 'MNQZ5',
  contract_symbol: 'MNQ',
  contract_expiry: 'Dec 2025',
  entered_at: '2025-11-19T14:00:00.000Z',
  exited_at: '2025-11-19T14:05:00.000Z',
  entry_price: '21100.00',
  exit_price: '21100.00',
  fees: '1.54',
  pnl: '0',
  gross_pnl: '1.540000000',
  size: 1,
  trade_type: 'Long',
  outcome: 'breakeven',
  trade_day: '2025-11-19',
  trade_duration: '00:05:00.0000000',
  commissions: '0.62',
  raw_csv_row: makeRawRow({ Id: '100003', PnL: '0' }),
}

/** Second winning trade on a different day for daily P&L aggregation */
export const winningTrade2: Trade = {
  ...dbFields,
  id: 'aaaaaaaa-0000-0000-0000-000000000004',
  topstep_id: 100004,
  contract_name: 'MESH5',
  contract_symbol: 'MES',
  contract_expiry: 'Mar 2025',
  entered_at: '2025-11-19T16:00:00.000Z',
  exited_at: '2025-11-19T16:30:00.000Z',
  entry_price: '5950.00',
  exit_price: '5940.00',
  fees: '1.54',
  pnl: '25.00',
  gross_pnl: '26.540000000',
  size: 2,
  trade_type: 'Short',
  outcome: 'win',
  trade_day: '2025-11-19',
  trade_duration: '00:30:00.0000000',
  commissions: '0.62',
  raw_csv_row: makeRawRow({ Id: '100004', PnL: '25.00', Size: '2' }),
}

/** Second losing trade for drawdown tests */
export const losingTrade2: Trade = {
  ...dbFields,
  id: 'aaaaaaaa-0000-0000-0000-000000000005',
  topstep_id: 100005,
  contract_name: 'MNQZ5',
  contract_symbol: 'MNQ',
  contract_expiry: 'Dec 2025',
  entered_at: '2025-11-20T14:00:00.000Z',
  exited_at: '2025-11-20T14:20:00.000Z',
  entry_price: '21200.00',
  exit_price: '21180.00',
  fees: '1.54',
  pnl: '-8.75',
  gross_pnl: '-7.210000000',
  size: 1,
  trade_type: 'Long',
  outcome: 'loss',
  trade_day: '2025-11-20',
  trade_duration: '00:20:00.0000000',
  commissions: '0.62',
  raw_csv_row: makeRawRow({ Id: '100005', PnL: '-8.75' }),
}

/** Helper to build a NormalizedTrade (no DB fields) */
export function makeNormalizedTrade(
  overrides: Partial<NormalizedTrade> = {}
): NormalizedTrade {
  const { id, user_id, import_batch_id, created_at, ...base } = winningTrade
  return { ...base, ...overrides }
}
