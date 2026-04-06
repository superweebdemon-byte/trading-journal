'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DataManagement() {
  const [confirming, setConfirming] = useState(false)
  const [clearing, setClearing] = useState(false)
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-reset confirm state after 5 seconds
  useEffect(() => {
    if (!confirming) return
    confirmTimerRef.current = setTimeout(() => setConfirming(false), 5000)
    return () => { if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current) }
  }, [confirming])

  async function handleExportCsv() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('entered_at', { ascending: true })

    if (error || !data?.length) return

    // Sanitize CSV cells to prevent formula injection
    function sanitizeCsvCell(val: string): string {
      if (/^[=+\-@\t\r]/.test(val)) return `'${val}`
      return val
    }

    const headers = [
      'Id', 'ContractName', 'EnteredAt', 'ExitedAt', 'EntryPrice', 'ExitPrice',
      'Fees', 'PnL', 'Size', 'Type', 'TradeDay', 'TradeDuration', 'Commissions',
    ]
    const rows = data.map((t: Record<string, unknown>) => {
      const raw = (t.raw_csv_row ?? {}) as Record<string, string>
      return headers.map((h) => {
        const rawVal = raw[h] ?? ''
        const val = typeof rawVal === 'string' ? sanitizeCsvCell(rawVal) : String(rawVal)
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      }).join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tradelog-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  async function handleExportPdf() {
    window.print()
  }

  async function handleClearAll() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setClearing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      await supabase.from('trades').delete().eq('user_id', user.id)
      await supabase.from('import_batches').delete().eq('user_id', user.id)
      window.location.reload()
    } finally {
      setClearing(false)
      setConfirming(false)
    }
  }

  const downloadIcon = (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )

  return (
    <div
      className="px-5 py-4 mb-3"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      <div
        className="font-[family-name:var(--font-display)] text-sm font-semibold mb-1"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Data Management
      </div>
      <div className="text-[11px] mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
        Export or clear your trade data.
      </div>

      <div className="space-y-4">
        {/* Export CSV */}
        <div
          className="flex items-center justify-between py-3"
          style={{ borderBottom: '1px solid rgba(48,54,61,0.12)' }}
        >
          <div>
            <div
              className="font-[family-name:var(--font-display)] text-[11px] font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Export Trades as CSV
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Download all trades in Topstep X compatible format.
            </div>
          </div>
          <button
            onClick={handleExportCsv}
            className="font-[family-name:var(--font-display)] text-[12px] font-medium px-5 py-2 rounded cursor-pointer transition-colors"
            style={{
              background: 'rgba(22,27,34,0.8)',
              border: '1px solid rgba(48,54,61,0.15)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span className="flex items-center gap-1.5">
              {downloadIcon}
              Export CSV
            </span>
          </button>
        </div>

        {/* Export PDF */}
        <div
          className="flex items-center justify-between py-3"
          style={{ borderBottom: '1px solid rgba(48,54,61,0.12)' }}
        >
          <div>
            <div
              className="font-[family-name:var(--font-display)] text-[11px] font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Export Dashboard as PDF
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Generate a snapshot of your current dashboard stats.
            </div>
          </div>
          <button
            onClick={handleExportPdf}
            className="font-[family-name:var(--font-display)] text-[12px] font-medium px-5 py-2 rounded cursor-pointer transition-colors"
            style={{
              background: 'rgba(22,27,34,0.8)',
              border: '1px solid rgba(48,54,61,0.15)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span className="flex items-center gap-1.5">
              {downloadIcon}
              Export PDF
            </span>
          </button>
        </div>

        {/* Clear All Data */}
        <div className="flex items-center justify-between py-3">
          <div>
            <div
              className="font-[family-name:var(--font-display)] text-[11px] font-semibold"
              style={{ color: 'var(--color-loss)' }}
            >
              Clear All Data
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Permanently delete all trades and import history. This cannot be undone.
            </div>
          </div>
          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="font-[family-name:var(--font-display)] text-[12px] font-semibold px-5 py-2 rounded cursor-pointer transition-colors"
            style={{
              background: confirming
                ? 'rgba(239,68,68,0.20)'
                : 'rgba(239,68,68,0.10)',
              border: confirming
                ? '1px solid rgba(239,68,68,0.40)'
                : '1px solid rgba(239,68,68,0.25)',
              color: 'var(--color-loss)',
            }}
          >
            {clearing ? 'Clearing...' : confirming ? 'Confirm Delete' : 'Clear All Data'}
          </button>
        </div>
      </div>
    </div>
  )
}
