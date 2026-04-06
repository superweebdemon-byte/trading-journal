'use client'

import { useCallback, useRef, useState } from 'react'

interface DropZoneProps {
  onFile: (file: File) => void
  disabled?: boolean
}

export function DropZone({ onFile, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      setError(null)
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Only .csv files are accepted')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File too large (max 10 MB)')
        return
      }
      onFile(file)
    },
    [onFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (disabled) return
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [disabled, handleFile]
  )

  const handleBrowse = useCallback(() => {
    if (!disabled) inputRef.current?.click()
  }, [disabled])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      e.target.value = ''
    },
    [handleFile]
  )

  return (
    <div className="mb-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowse}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBrowse() } }}
        tabIndex={0}
        role="button"
        className="transition-all duration-200 cursor-pointer"
        style={{
          border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'rgba(48,54,61,0.25)'}`,
          borderRadius: '6px',
          padding: '16px',
          textAlign: 'center',
          background: isDragging ? 'rgba(0,212,170,0.03)' : 'transparent',
        }}
      >
        {/* Download arrow icon */}
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="mx-auto mb-1.5">
          <path d="M16 4V20M16 20L10 14M16 20L22 14" stroke="#6E7681" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 22V26C4 27.1046 4.89543 28 6 28H26C27.1046 28 28 27.1046 28 26V22" stroke="#6E7681" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        <div
          className="font-medium"
          style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {isDragging ? 'Drop your CSV file here' : 'Drag and drop your CSV file here'}
        </div>

        <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
          or{' '}
          <span
            style={{ color: 'var(--color-accent)', cursor: 'pointer' }}
          >
            browse files
          </span>
          {' '}&middot; Accepts .csv from Topstep X
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload CSV file"
      />

      {error && (
        <p className="mt-2" style={{ fontSize: '11px', color: 'var(--color-loss)' }}>{error}</p>
      )}
    </div>
  )
}
