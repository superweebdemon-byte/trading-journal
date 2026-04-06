import { format } from 'date-fns'
import type { RawCsvRow, NormalizedTrade } from '@/lib/types'
import { decodeContractName } from './contract-specs'

/**
 * Parse Topstep X timestamp format: "11/18/2025 09:45:25 -05:00"
 * Returns ISO 8601 UTC string. Handles DST offset shifts (CST -06:00 / CDT -05:00).
 */
function parseTimestamp(raw: string): string {
  // Format: MM/DD/YYYY HH:mm:ss ±HH:MM
  const trimmed = raw.trim()
  // Split into date, time, offset parts
  const parts = trimmed.split(' ')
  if (parts.length < 2) {
    throw new Error(`Invalid timestamp: ${raw}`)
  }

  const [datePart, timePart, offsetPart] = parts
  const [month, day, year] = datePart.split('/')
  // Build ISO-compatible string: YYYY-MM-DDTHH:mm:ss±HH:MM
  const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}${offsetPart ?? ''}`
  const date = new Date(isoString)

  if (isNaN(date.getTime())) {
    throw new Error(`Failed to parse timestamp: ${raw}`)
  }

  return date.toISOString()
}

/**
 * Parse TradeDay timestamp "11/18/2025 00:00:00 -06:00" → "2025-11-18" (date only).
 * We extract the date portion directly since TradeDay represents a calendar date.
 */
function parseTradeDay(raw: string): string {
  const trimmed = raw.trim()
  const datePart = trimmed.split(' ')[0]
  const [month, day, year] = datePart.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

/**
 * Parse duration "00:10:51.2472910" → PostgreSQL interval string "00:10:51.247291"
 */
function parseDuration(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Already in HH:MM:SS.fractional format, valid as PG interval
  return trimmed
}

/**
 * Determine trade outcome from PnL value.
 */
function determineOutcome(pnl: number): 'win' | 'loss' | 'breakeven' {
  if (pnl > 0) return 'win'
  if (pnl < 0) return 'loss'
  return 'breakeven'
}

export interface AdapterError {
  row: number
  topstep_id: string
  message: string
}

export interface AdapterResult {
  trades: NormalizedTrade[]
  errors: AdapterError[]
}

/**
 * Convert an array of raw Topstep X CSV rows into NormalizedTrade objects.
 */
export function adaptTopstepRows(rows: RawCsvRow[]): AdapterResult {
  const trades: NormalizedTrade[] = []
  const errors: AdapterError[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const pnlNum = parseFloat(row.PnL)
      const feesNum = parseFloat(row.Fees)
      const commissionsNum = parseFloat(row.Commissions || '0')
      // CSV PnL is net (fees already deducted). Gross = net + fees.
      const grossPnl = pnlNum + feesNum

      const decoded = decodeContractName(row.ContractName)

      const trade: NormalizedTrade = {
        topstep_id: parseInt(row.Id, 10),
        contract_name: row.ContractName,
        contract_symbol: decoded.symbol,
        contract_expiry: decoded.expiry,
        entered_at: parseTimestamp(row.EnteredAt),
        exited_at: parseTimestamp(row.ExitedAt),
        entry_price: row.EntryPrice.trim(),
        exit_price: row.ExitPrice.trim(),
        fees: row.Fees.trim() || '0',
        pnl: row.PnL.trim(),
        gross_pnl: grossPnl.toFixed(9),
        size: parseInt(row.Size, 10),
        trade_type: row.Type.trim() as 'Long' | 'Short',
        outcome: determineOutcome(pnlNum),
        trade_day: parseTradeDay(row.TradeDay),
        trade_duration: parseDuration(row.TradeDuration),
        commissions: row.Commissions.trim() || '0',
        raw_csv_row: row,
      }

      trades.push(trade)
    } catch (err) {
      errors.push({
        row: i,
        topstep_id: row.Id,
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return { trades, errors }
}
