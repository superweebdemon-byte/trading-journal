import Papa from 'papaparse'
import type { RawCsvRow } from '@/lib/types'

export interface ParseError {
  row: number
  message: string
}

export interface ParseResult {
  data: RawCsvRow[]
  errors: ParseError[]
}

const REQUIRED_COLUMNS: (keyof RawCsvRow)[] = [
  'Id', 'ContractName', 'EnteredAt', 'ExitedAt', 'EntryPrice',
  'ExitPrice', 'Fees', 'PnL', 'Size', 'Type', 'TradeDay',
  'TradeDuration', 'Commissions',
]

/**
 * Parse a CSV file (client-side via Papa Parse).
 * Returns typed rows and any parsing errors.
 */
export function parseCsvFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<RawCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const errors: ParseError[] = []

        // Validate that all required columns are present
        if (results.meta.fields) {
          const missing = REQUIRED_COLUMNS.filter(
            (col) => !results.meta.fields!.includes(col)
          )
          if (missing.length > 0) {
            resolve({
              data: [],
              errors: [{ row: 0, message: `Missing columns: ${missing.join(', ')}` }],
            })
            return
          }
        }

        // Collect Papa Parse errors
        for (const err of results.errors) {
          errors.push({
            row: err.row ?? 0,
            message: err.message,
          })
        }

        // Filter out rows that are completely empty (Papa sometimes emits them)
        const data = results.data.filter((row) => row.Id && row.Id.trim() !== '')

        resolve({ data, errors })
      },
    })
  })
}
