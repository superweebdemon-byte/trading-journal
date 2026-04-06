export interface ContractSpec {
  symbol: string
  displayName: string
  tickSize: number
  tickValue: number
}

const SPECS: Record<string, ContractSpec> = {
  MYM: { symbol: 'MYM', displayName: 'Micro E-mini Dow', tickSize: 1.0, tickValue: 0.5 },
  MNQ: { symbol: 'MNQ', displayName: 'Micro E-mini Nasdaq-100', tickSize: 0.25, tickValue: 0.5 },
  MES: { symbol: 'MES', displayName: 'Micro E-mini S&P 500', tickSize: 0.25, tickValue: 1.25 },
  M2K: { symbol: 'M2K', displayName: 'Micro E-mini Russell 2000', tickSize: 0.1, tickValue: 0.5 },
  MCL: { symbol: 'MCL', displayName: 'Micro WTI Crude Oil', tickSize: 0.01, tickValue: 1.0 },
  MGC: { symbol: 'MGC', displayName: 'Micro Gold', tickSize: 0.1, tickValue: 1.0 },
}

/** Month code → month name lookup */
const MONTH_CODES: Record<string, string> = {
  F: 'Jan', G: 'Feb', H: 'Mar', J: 'Apr', K: 'May', M: 'Jun',
  N: 'Jul', Q: 'Aug', U: 'Sep', V: 'Oct', X: 'Nov', Z: 'Dec',
}

export interface DecodedContract {
  symbol: string
  expiry: string // e.g. "Dec 2025"
  displayName: string // e.g. "Micro E-mini Nasdaq-100"
}

/**
 * Decode contract name like "MNQZ5" → { symbol: "MNQ", expiry: "Dec 2025", displayName: ... }
 * Tries 3-char then 2-char symbol prefixes to handle M2K etc.
 */
export function decodeContractName(name: string): DecodedContract {
  let symbol = ''
  let monthCode = ''
  let yearDigit = ''

  // Try 3-char symbol first (MNQ, MYM, MES, MCL, MGC), then 2-char (not needed now but future-safe)
  for (const len of [3, 2]) {
    const candidate = name.slice(0, len)
    if (SPECS[candidate]) {
      symbol = candidate
      monthCode = name.slice(len, len + 1)
      yearDigit = name.slice(len + 1)
      break
    }
  }

  if (!symbol) {
    // Fallback: assume 3-char symbol even if not in specs
    symbol = name.slice(0, 3)
    monthCode = name.slice(3, 4)
    yearDigit = name.slice(4)
  }

  const monthName = MONTH_CODES[monthCode] ?? 'Unknown'
  const year = yearDigit ? `202${yearDigit}` : 'Unknown'
  const expiry = `${monthName} ${year}`

  const spec = SPECS[symbol]
  const displayName = spec?.displayName ?? symbol

  return { symbol, expiry, displayName }
}

/**
 * Get contract specifications by symbol.
 * Returns undefined for unknown contracts.
 */
export function getContractSpec(symbol: string): ContractSpec | undefined {
  return SPECS[symbol]
}
