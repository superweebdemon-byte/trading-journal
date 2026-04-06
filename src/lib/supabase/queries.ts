import { createClient } from './client'
import type {
  NormalizedTrade,
  Trade,
  Session,
  ImportBatch,
  TradeFilters,
  UserSettings,
} from '@/lib/types'

const DEV_USER_ID = 'f954c29f-d7c3-44d0-9263-e73408785ad6'

/** Resolve current user id, falling back to dev user when unauthenticated */
async function resolveUserId(): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return user.id
  if (process.env.NODE_ENV === 'development') return DEV_USER_ID
  throw new Error('Not authenticated')
}

/** Batch insert trades in chunks of 50 (Vercel timeout safety) */
export async function insertTrades(
  trades: NormalizedTrade[],
  importBatchId: string
): Promise<{ inserted: number; errors: string[] }> {
  const supabase = createClient()
  const userId = await resolveUserId()
  const chunkSize = 50
  let inserted = 0
  const errors: string[] = []

  for (let i = 0; i < trades.length; i += chunkSize) {
    const chunk = trades.slice(i, i + chunkSize)
    const rows = chunk.map((t) => ({
      ...t,
      user_id: userId,
      import_batch_id: importBatchId,
    }))

    const { error, data } = await supabase
      .from('trades')
      .insert(rows)
      .select('id')

    if (error) {
      errors.push(`Chunk ${Math.floor(i / chunkSize) + 1}: ${error.message}`)
    } else {
      inserted += data?.length ?? 0
    }
  }

  return { inserted, errors }
}

/** Create an import batch record */
export async function createImportBatch(
  filename: string,
  rowCount: number
): Promise<ImportBatch> {
  const supabase = createClient()
  const userId = await resolveUserId()
  const { data, error } = await supabase
    .from('import_batches')
    .insert({ user_id: userId, filename, row_count: rowCount, status: 'pending' })
    .select()
    .single()

  if (error) throw new Error(`Failed to create import batch: ${error.message}`)
  return data as ImportBatch
}

/** Update import batch status */
export async function updateImportBatchStatus(
  batchId: string,
  status: 'complete' | 'failed'
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('import_batches')
    .update({ status })
    .eq('id', batchId)

  if (error) throw new Error(`Failed to update batch status: ${error.message}`)
}

/** Fetch trades with optional filters */
export async function fetchTrades(filters?: TradeFilters): Promise<Trade[]> {
  const supabase = createClient()
  let query = supabase
    .from('trades')
    .select('*')
    .order('entered_at', { ascending: false })

  if (filters?.dateFrom) {
    query = query.gte('trade_day', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('trade_day', filters.dateTo)
  }
  if (filters?.contractSymbol) {
    query = query.eq('contract_symbol', filters.contractSymbol)
  }
  if (filters?.tradeType) {
    query = query.eq('trade_type', filters.tradeType)
  }
  if (filters?.outcome) {
    query = query.eq('outcome', filters.outcome)
  }

  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch trades: ${error.message}`)
  return (data ?? []) as Trade[]
}

/** Fetch trades grouped by trade_day as Sessions */
export async function fetchTradesBySession(): Promise<Session[]> {
  const trades = await fetchTrades()

  // Group by trade_day
  const grouped = new Map<string, Trade[]>()
  for (const trade of trades) {
    const existing = grouped.get(trade.trade_day) ?? []
    existing.push(trade)
    grouped.set(trade.trade_day, existing)
  }

  // Build sessions
  const sessions: Session[] = []
  for (const [tradeDay, dayTrades] of grouped) {
    const winCount = dayTrades.filter((t) => t.outcome === 'win').length
    const lossCount = dayTrades.filter((t) => t.outcome === 'loss').length
    const breakevenCount = dayTrades.filter((t) => t.outcome === 'breakeven').length
    const netPnl = dayTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0)
    const grossPnl = dayTrades.reduce((sum, t) => sum + parseFloat(t.gross_pnl), 0)
    const totalFees = dayTrades.reduce((sum, t) => sum + parseFloat(t.fees), 0)
    const contracts = [...new Set(dayTrades.map((t) => t.contract_symbol))]

    sessions.push({
      trade_day: tradeDay,
      trades: dayTrades,
      net_pnl: netPnl,
      gross_pnl: grossPnl,
      trade_count: dayTrades.length,
      win_count: winCount,
      loss_count: lossCount,
      breakeven_count: breakevenCount,
      win_rate: dayTrades.length > 0 ? winCount / dayTrades.length : 0,
      contracts,
      total_fees: totalFees,
    })
  }

  // Sort by date descending
  sessions.sort((a, b) => b.trade_day.localeCompare(a.trade_day))
  return sessions
}

/** Get all existing topstep_ids for the current user (for dedup) */
export async function getExistingTopstepIds(): Promise<Set<number>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('trades')
    .select('topstep_id')

  if (error) throw new Error(`Failed to fetch topstep IDs: ${error.message}`)

  return new Set((data ?? []).map((row: { topstep_id: number }) => row.topstep_id))
}

/** Fetch user settings */
export async function fetchUserSettings(): Promise<UserSettings | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .single()

  if (error) {
    // No settings row yet — that's fine
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to fetch settings: ${error.message}`)
  }
  return data as UserSettings
}

/** Update user settings (upsert) */
export async function updateUserSettings(
  settings: Partial<Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserSettings> {
  const supabase = createClient()
  const userId = await resolveUserId()

  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, ...settings, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) throw new Error(`Failed to update settings: ${error.message}`)
  return data as UserSettings
}
