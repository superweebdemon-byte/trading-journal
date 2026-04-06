'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { DropZone } from './drop-zone'
import { CsvPreview } from './csv-preview'
import { ImportSummary } from './import-summary'
import { ImportHistory } from './import-history'
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

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
}

type ModalStep = 'upload' | 'preview' | 'importing' | 'success' | 'error'

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [step, setStep] = useState<ModalStep>('upload')
  const [filename, setFilename] = useState('')
  const [totalRows, setTotalRows] = useState(0)
  const [newTrades, setNewTrades] = useState<NormalizedTrade[]>([])
  const [duplicates, setDuplicates] = useState<NormalizedTrade[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [historyKey, setHistoryKey] = useState(0)

  // Reset state when modal closes — synchronous setState is intentional here
  // to clear form state in response to the isOpen prop change
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep('upload')
      setFilename('')
      setTotalRows(0)
      setNewTrades([])
      setDuplicates([])
      setParseErrors([])
    }
  }, [isOpen])

  // Close on Escape (but not during import)
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'importing') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose, step])

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

  // Body scroll lock when modal is open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  // Basic focus trap
  const modalRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!isOpen || !modalRef.current) return
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length > 0) focusable[0].focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return
      const focusableEls = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusableEls.length === 0) return
      const first = focusableEls[0]
      const last = focusableEls[focusableEls.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen, step])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(13,17,23,0.85)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        onPointerDown={() => { if (step !== 'importing') onClose() }}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-heading"
        className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[90vw] max-h-[85vh] overflow-y-auto p-4"
        style={{
          background: 'var(--color-bg-tertiary)',
          border: '1px solid rgba(48,54,61,0.20)',
          borderRadius: '8px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2
              id="import-modal-heading"
              className="text-lg font-bold"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                color: 'var(--color-text-primary)',
              }}
            >
              Import Trades
            </h2>
            <p
              className="mt-0.5"
              style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}
            >
              Upload a CSV export from Topstep X.
            </p>
          </div>
          <button
            onPointerDown={() => { if (step !== 'importing') onClose() }}
            disabled={step === 'importing'}
            className="cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontSize: '20px',
              lineHeight: '1',
              color: 'var(--color-text-tertiary)',
              background: 'none',
              border: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-tertiary)' }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Drop zone (always shown in upload step) */}
        {step === 'upload' && (
          <>
            <DropZone onFile={handleFile} />
            {parseErrors.length > 0 && (
              <div className="mt-2 space-y-1">
                {parseErrors.map((err, i) => (
                  <p key={i} style={{ fontSize: '11px', color: 'var(--color-loss)' }}>{err}</p>
                ))}
              </div>
            )}
          </>
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
                  color: 'var(--color-text-secondary)',
                  padding: '6px 16px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-display), sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-primary)'
                  e.currentTarget.style.borderColor = 'rgba(48,54,61,0.30)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)'
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
                  background: 'var(--color-accent)',
                  border: '1px solid var(--color-accent)',
                  color: 'var(--color-bg-secondary)',
                  padding: '6px 16px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display), sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-accent-bright)'
                  e.currentTarget.style.borderColor = 'var(--color-accent-bright)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-accent)'
                  e.currentTarget.style.borderColor = 'var(--color-accent)'
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
          <div className="flex items-center gap-2 mb-3 py-3" style={{ fontSize: '12px', color: 'var(--color-gain)' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Import complete — {newTrades.length} trades added
          </div>
        )}

        {/* Error state */}
        {step === 'error' && (
          <div className="mb-3 space-y-2">
            <p style={{ fontSize: '12px', color: 'var(--color-loss)' }}>Import failed</p>
            {parseErrors.map((err, i) => (
              <p key={i} style={{ fontSize: '11px', color: 'var(--color-loss)' }}>{err}</p>
            ))}
            <button
              onPointerDown={handleCancel}
              className="cursor-pointer"
              style={{
                background: 'rgba(22,27,34,0.8)',
                border: '1px solid rgba(48,54,61,0.15)',
                color: 'var(--color-text-secondary)',
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
    </>
  )
}
