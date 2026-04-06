'use client'

import { useState, useCallback, useEffect } from 'react'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import { AddTradeModal } from '@/components/add-trade/add-trade-modal'
import { createClient } from '@/lib/supabase/client'

function formatDateRange(earliest: string, latest: string): string {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const fmt = (d: string) => {
    const [y, m] = d.split('-')
    return `${names[parseInt(m, 10) - 1]} ${y}`
  }
  const e = earliest.substring(0, 7)
  const l = latest.substring(0, 7)
  if (e === l) return fmt(e)
  return `${fmt(e)} \u2013 ${fmt(l)}`
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [addTradeOpen, setAddTradeOpen] = useState(false)
  const [tradeCount, setTradeCount] = useState<number>(0)
  const [dateRange, setDateRange] = useState<string>('')
  const [lastImport, setLastImport] = useState<string>('')

  const handleAddTradeOpen = useCallback(() => setAddTradeOpen(true), [])
  const handleAddTradeClose = useCallback(() => {
    setAddTradeOpen(false)
    // Refresh stats after import closes
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const supabase = createClient()

      // Trade count + date range
      const { count } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
      setTradeCount(count ?? 0)

      if (count && count > 0) {
        const { data: earliest } = await supabase
          .from('trades')
          .select('trade_day')
          .order('trade_day', { ascending: true })
          .limit(1)
          .single()
        const { data: latest } = await supabase
          .from('trades')
          .select('trade_day')
          .order('trade_day', { ascending: false })
          .limit(1)
          .single()
        if (earliest && latest) {
          setDateRange(formatDateRange(earliest.trade_day, latest.trade_day))
        }
      }

      // Last import date
      const { data: lastBatch } = await supabase
        .from('import_batches')
        .select('imported_at')
        .eq('status', 'complete')
        .order('imported_at', { ascending: false })
        .limit(1)
        .single()
      if (lastBatch?.imported_at) {
        try {
          const d = new Date(lastBatch.imported_at)
          setLastImport(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
        } catch {
          setLastImport('')
        }
      }
    } catch {
      // Non-critical — nav/footer will show defaults
    }
  }

  useEffect(() => { fetchStats() }, [])

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0D1117' }}>
      <Nav
        onAddTradeClick={handleAddTradeOpen}
        tradeCount={tradeCount}
        dateRange={dateRange || undefined}
      />
      <main className="flex-1 min-h-0 overflow-auto w-full pt-1 pb-1 flex flex-col">
        {children}
      </main>
      <Footer lastImportDate={lastImport || undefined} />
      <AddTradeModal isOpen={addTradeOpen} onClose={handleAddTradeClose} />
    </div>
  )
}
