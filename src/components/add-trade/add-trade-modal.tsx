'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ImportContent } from './import-content'
import { ManualEntryForm } from './manual-entry-form'
import type { NormalizedTrade } from '@/lib/types'

type Tab = 'import' | 'manual'

interface AddTradeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddTradeModal({ isOpen, onClose }: AddTradeModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('manual')
  const modalRef = useRef<HTMLDivElement>(null)

  // Reset tab when modal closes — intentional sync reset on prop change
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('manual')
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  // Focus trap
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
  }, [isOpen, activeTab])

  const handleManualSubmit = useCallback((trade: NormalizedTrade) => {
    // TODO: Insert trade into Supabase
    console.log('Manual trade submitted:', trade)
    onClose()
  }, [onClose])

  const handleManualSubmitAndContinue = useCallback((trade: NormalizedTrade) => {
    // TODO: Insert trade into Supabase
    console.log('Manual trade submitted (continue):', trade)
  }, [])

  if (!isOpen) return null

  const isImportTab = activeTab === 'import'

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
        onPointerDown={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-trade-modal-heading"
        className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[90vw] max-h-[85vh] overflow-y-auto p-4"
        style={{
          background: 'var(--color-bg-tertiary)',
          border: '1px solid rgba(48,54,61,0.20)',
          borderRadius: '8px',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2
              id="add-trade-modal-heading"
              className="text-lg font-bold"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                color: 'var(--color-text-primary)',
              }}
            >
              Add Trade
            </h2>
            <p
              className="mt-0.5"
              style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}
            >
              Add trades manually or import from CSV
            </p>
          </div>
          <button
            onPointerDown={onClose}
            className="cursor-pointer transition-colors"
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

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 mb-4">
          <button
            type="button"
            onPointerDown={() => setActiveTab('import')}
            className="cursor-pointer"
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: '11px',
              fontWeight: isImportTab ? 600 : 500,
              padding: '6px 12px',
              borderRadius: '4px',
              background: isImportTab ? 'var(--color-accent)' : 'rgba(48,54,61,0.15)',
              border: isImportTab ? '1px solid var(--color-accent)' : '1px solid rgba(48,54,61,0.12)',
              color: isImportTab ? 'var(--color-bg-secondary)' : 'var(--color-text-secondary)',
            }}
          >
            Import CSV
          </button>
          <button
            type="button"
            onPointerDown={() => setActiveTab('manual')}
            className="cursor-pointer"
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: '11px',
              fontWeight: !isImportTab ? 600 : 500,
              padding: '6px 12px',
              borderRadius: '4px',
              background: !isImportTab ? 'var(--color-accent)' : 'rgba(48,54,61,0.15)',
              border: !isImportTab ? '1px solid var(--color-accent)' : '1px solid rgba(48,54,61,0.12)',
              color: !isImportTab ? 'var(--color-bg-secondary)' : 'var(--color-text-secondary)',
            }}
          >
            Manual Entry
          </button>
        </div>

        {/* Tab Content — fixed height so switching tabs causes zero visual shift */}
        <div className="min-h-[480px]">
          {isImportTab ? (
            <ImportContent isVisible={isImportTab} onClose={onClose} />
          ) : (
            <ManualEntryForm
              onSubmit={handleManualSubmit}
              onSubmitAndContinue={handleManualSubmitAndContinue}
            />
          )}
        </div>
      </div>
    </>
  )
}
