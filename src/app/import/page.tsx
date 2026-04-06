'use client'

import { useState, useCallback } from 'react'
import { DropZone } from '@/components/import/drop-zone'
import { PreviewTable } from '@/components/import/preview-table'
import { ImportProgress } from '@/components/import/import-progress'
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

type ImportStep = 'upload' | 'preview' | 'importing' | 'done'

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>('upload')
  const [filename, setFilename] = useState('')
  const [newTrades, setNewTrades] = useState<NormalizedTrade[]>([])
  const [duplicates, setDuplicates] = useState<NormalizedTrade[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [importState, setImportState] = useState<'inserting' | 'success' | 'error'>('inserting')
  const [inserted, setInserted] = useState(0)
  const [importErrors, setImportErrors] = useState<string[]>([])

  const handleFile = useCallback(async (file: File) => {
    setFilename(file.name)
    setParseErrors([])

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
      // Continue with successfully parsed trades if we have some
      if (adapted.trades.length === 0) return
    }

    // 3. Check for duplicates against existing data
    const existingIds = await getExistingTopstepIds()
    const result = dedup(adapted.trades, existingIds)

    setNewTrades(result.newTrades)
    setDuplicates(result.duplicates)
    setStep('preview')
  }, [])

  const handleConfirm = useCallback(async () => {
    setStep('importing')
    setImportState('inserting')
    setInserted(0)
    setImportErrors([])

    try {
      // Create batch
      const batch = await createImportBatch(filename, newTrades.length)

      // Insert trades
      const result = await insertTrades(newTrades, batch.id)
      setInserted(result.inserted)

      if (result.errors.length > 0) {
        setImportErrors(result.errors)
        setImportState('error')
        await updateImportBatchStatus(batch.id, 'failed')
      } else {
        setImportState('success')
        await updateImportBatchStatus(batch.id, 'complete')
      }
    } catch (err) {
      setImportErrors([err instanceof Error ? err.message : 'Unknown error'])
      setImportState('error')
    }

    setStep('done')
  }, [filename, newTrades])

  const handleCancel = useCallback(() => {
    setStep('upload')
    setNewTrades([])
    setDuplicates([])
    setParseErrors([])
  }, [])

  const handleDone = useCallback(() => {
    setStep('upload')
    setNewTrades([])
    setDuplicates([])
    setParseErrors([])
    setInserted(0)
    setImportErrors([])
  }, [])

  return (
    <main className="min-h-screen bg-theme-bg-primary">
      <div className="px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl font-semibold text-theme-text-primary tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Import Trades
          </h1>
          <p className="text-sm text-theme-text-secondary mt-1">
            Upload your Topstep X CSV export to import trades
          </p>
        </div>

        {/* Step content */}
        <div
          className="rounded-[var(--card-radius)] border border-theme-border p-6"
          style={{ background: 'var(--color-bg-card)', boxShadow: 'var(--card-shadow)' }}
        >
          {step === 'upload' && (
            <div className="space-y-4">
              <DropZone onFile={handleFile} />
              {parseErrors.length > 0 && (
                <div className="space-y-1">
                  {parseErrors.map((err, i) => (
                    <p key={i} className="text-xs text-theme-loss">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <PreviewTable
              newTrades={newTrades}
              duplicates={duplicates}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          )}

          {(step === 'importing' || step === 'done') && (
            <ImportProgress
              state={importState}
              inserted={inserted}
              total={newTrades.length}
              errors={importErrors}
              onDone={handleDone}
            />
          )}
        </div>
      </div>
    </main>
  )
}
