import type { NormalizedTrade } from '@/lib/types'

export interface DedupResult {
  newTrades: NormalizedTrade[]
  duplicates: NormalizedTrade[]
}

/**
 * Separate new trades from duplicates based on topstep_id.
 * @param trades - All parsed trades from current import
 * @param existingIds - Set of topstep_ids already in the database for this user
 */
export function dedup(trades: NormalizedTrade[], existingIds: Set<number>): DedupResult {
  const newTrades: NormalizedTrade[] = []
  const duplicates: NormalizedTrade[] = []

  for (const trade of trades) {
    if (existingIds.has(trade.topstep_id)) {
      duplicates.push(trade)
    } else {
      newTrades.push(trade)
    }
  }

  return { newTrades, duplicates }
}
