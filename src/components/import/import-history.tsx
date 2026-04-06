'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { ImportBatch } from '@/lib/types'

interface ImportHistoryProps {
  refreshKey: number
}

export function ImportHistory({ refreshKey }: ImportHistoryProps) {
  const [batches, setBatches] = useState<ImportBatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('import_batches')
          .select('*')
          .eq('status', 'complete')
          .order('imported_at', { ascending: false })
          .limit(10)

        if (!error && data) {
          setBatches(data as ImportBatch[])
        }
      } catch {
        // Silently fail — history is non-critical
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [refreshKey])

  if (loading && batches.length === 0) return null

  return (
    <div
      className="border-t pt-2.5"
      style={{ borderColor: 'rgba(48,54,61,0.12)' }}
    >
      <div
        className="uppercase tracking-wider font-semibold mb-2"
        style={{
          fontFamily: 'var(--font-display), sans-serif',
          fontSize: '10px',
          color: '#8B949E',
          letterSpacing: '0.14em',
        }}
      >
        Import History
      </div>

      {batches.length === 0 && !loading && (
        <p style={{ fontSize: '10px', color: '#6E7681' }}>No imports yet.</p>
      )}

      <div className="space-y-1">
        {batches.map((batch, i) => (
          <div
            key={batch.id}
            className={`flex items-center justify-between py-1 ${
              i < batches.length - 1 ? 'border-b' : ''
            }`}
            style={{ borderColor: 'rgba(48,54,61,0.08)' }}
          >
            <div className="flex items-center gap-3">
              <span className="tabular-nums" style={{ fontSize: '10px', color: '#8B949E' }}>
                {(() => {
                  try {
                    return batch.imported_at ? format(parseISO(batch.imported_at), 'MMM d, yyyy') : 'Unknown date'
                  } catch {
                    return 'Unknown date'
                  }
                })()}
              </span>
              <span style={{ fontSize: '10px', color: '#6E7681' }}>
                {batch.filename}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="tabular-nums" style={{ fontSize: '10px', color: '#8B949E' }}>
                {batch.row_count} trades
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: '2px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  background: 'rgba(52,211,153,0.10)',
                  color: '#34D399',
                }}
              >
                SUCCESS
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
