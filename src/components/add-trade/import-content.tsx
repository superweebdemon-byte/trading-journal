'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { DropZone } from '@/components/import/drop-zone'
import { CsvPreview } from '@/components/import/csv-preview'
import { ImportSummary } from '@/components/import/import-summary'
import { ImportHistory } from '@/components/import/import-history'
import { parseCsvFile } from '@/lib/csv/parser'
import { adaptTopstepRows } from '@/lib/csv/topstep-adapter'
import { dedup } from '@/lib/csv/dedup'
import {
  getExistingTopstepIds,
  createImportBatch,
  insertTrades,
  updateImportBatchStatus,
} from '@/lib/supabase/queries'
import type { NormalizedTrade } from '@/lib/types'

interface ImportContentProps {
  isVisible: boolean
  onClose: () => void
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'success' | 'error'

export function ImportContent({ isVisible, onClose }: ImportContentProps) {
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [step, setStep] = useState<ImportStep>('upload')
  const [filename, setFilename] = useState('')
  const [totalRows, setTotalRows] = useState(0)
  const [newTrades, setNewTrades] = useState<NormalizedTrade[]>([])
  const [duplicates, setDuplicates] = useState<NormalizedTrade[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [historyKey, setHistoryKey] = useState(0)

  // Reset state when hidden
  useEffect(() => {
    if (!isVisible) {
      setStep('upload')
      setFilename('')
      setTotalRows(0)
      setNewTrades([])
      setDuplicates([])
      setParseErrors([])
    }
  }, [isVisible])

  // Clean up success timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setFilename(file.name)
    setParseErrors([])

    try {
      // 1. Parse CSV
      const parsed = await parseCsvFile(file)
      if (parsed.errors.length > 0) {
        setParseErrors(parsed.errors.map((e) => `Row ${e.row}: ${e.message}`))
        return
      }
      if (parsed.data.length === 0) {
        setParseErrors(['No data rows found in CSV'])
        return
      }

      // 2. Adapt to normalized format
      const adapted = adaptTopstepRows(parsed.data)
      if (adapted.errors.length > 0) {
        setParseErrors(adapted.errors.map((e) => `Row ${e.row} (ID ${e.topstep_id}): ${e.message}`))
        if (adapted.trades.length === 0) return
      }

      setTotalRows(adapted.trades.length)

      // 3. Dedup against existing data
      const existingIds = await getExistingTopstepIds()
      const result = dedup(adapted.trades, existingIds)

      setNewTrades(result.newTrades)
      setDuplicates(result.duplicates)
      setStep('preview')
    } catch (err) {
      setParseErrors([err instanceof Error ? err.message : 'Failed to process file'])
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (newTrades.length === 0) return
    setStep('importing')

    try {
      const batch = await createImportBatch(filename, newTrades.length)
      const result = await insertTrades(newTrades, batch.id)

      if (result.errors.length > 0) {
        await updateImportBatchStatus(batch.id, 'failed')
        setParseErrors(result.errors)
        setStep('error')
      } else {
        await updateImportBatchStatus(batch.id, 'complete')
        setStep('success')
        setHistoryKey((k) => k + 1)
        // Auto-close after brief delay
        successTimerRef.current = setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (err) {
      setParseErrors([err instanceof Error ? err.message : 'Import failed'])
      setStep('error')
    }
  }, [filename, newTrades, onClose])

  const handleCancel = useCallback(() => {
    setStep('upload')
    setFilename('')
    setTotalRows(0)
    setNewTrades([])
    setDuplicates([])
    setParseErrors([])
  }, [])

  if (!isVisible) return null

  return (
    <div className="h-full flex flex-col">
      {/* Drop zone (upload step) */}
      {step === 'upload' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <DropZone onFile={handleFile} />
          {parseErrors.length > 0 && (
            <div className="mt-2 space-y-1">
              {parseErrors.map((err, i) => (
                <p key={i} style={{ fontSize: '11px', color: '#EF4444' }}>{err}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview + Summary + Actions */}
      {(step === 'preview' || step === 'importing') && (
        <>
          <CsvPreview
            filename={filename}
            totalRows={totalRows}
            trades={[...newTrades, ...duplicates]}
          />

          <ImportSummary
            newCount={newTrades.length}
            dupCount={duplicates.length}
            trades={newTrades}
          />

          {/* Action buttons */}
          <div className="flex items-center justify-between mb-3">
            <button
              onPointerDown={handleCancel}
              disabled={step === 'importing'}
              className="cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(22,27,34,0.8)',
                border: '1px solid rgba(48,54,61,0.15)',
                color: '#8B949E',
                padding: '6px 16px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                fontFamily: 'var(--font-display), sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#E6EDF3'
                e.currentTarget.style.borderColor = 'rgba(48,54,61,0.30)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#8B949E'
                e.currentTarget.style.borderColor = 'rgba(48,54,61,0.15)'
              }}
            >
              Cancel
            </button>
            <button
              onPointerDown={handleImport}
              disabled={step === 'importing' || newTrades.length === 0}
              className="cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: '#00D4AA',
                border: '1px solid #00D4AA',
                color: '#0D1117',
                padding: '6px 16px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'var(--font-display), sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#33DDBB'
                e.currentTarget.style.borderColor = '#33DDBB'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#00D4AA'
                e.currentTarget.style.borderColor = '#00D4AA'
              }}
            >
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 14V2M8 14L4 10M8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {step === 'importing' ? 'Importing...' : `Import ${newTrades.length} Trades`}
              </span>
            </button>
          </div>
        </>
      )}

      {/* Success state */}
      {step === 'success' && (
        <div className="flex items-center gap-2 mb-3 py-3" style={{ fontSize: '12px', color: '#34D399' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Import complete — {newTrades.length} trades added
        </div>
      )}

      {/* Error state */}
      {step === 'error' && (
        <div className="mb-3 space-y-2">
          <p style={{ fontSize: '12px', color: '#EF4444' }}>Import failed</p>
          {parseErrors.map((err, i) => (
            <p key={i} style={{ fontSize: '11px', color: '#EF4444' }}>{err}</p>
          ))}
          <button
            onPointerDown={handleCancel}
            className="cursor-pointer"
            style={{
              background: 'rgba(22,27,34,0.8)',
              border: '1px solid rgba(48,54,61,0.15)',
              color: '#8B949E',
              padding: '6px 16px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              fontFamily: 'var(--font-display), sans-serif',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Import History */}
      <ImportHistory refreshKey={historyKey} />
    </div>
  )
}
