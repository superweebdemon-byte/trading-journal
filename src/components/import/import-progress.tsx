'use client'

interface ImportProgressProps {
  state: 'inserting' | 'success' | 'error'
  inserted: number
  total: number
  errors?: string[]
  onDone: () => void
}

export function ImportProgress({ state, inserted, total, errors, onDone }: ImportProgressProps) {
  const percent = total > 0 ? Math.round((inserted / total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-theme-text-secondary">
            {state === 'inserting' && 'Importing trades...'}
            {state === 'success' && 'Import complete'}
            {state === 'error' && 'Import finished with errors'}
          </span>
          <span className="text-theme-text-tertiary tabular-nums">
            {inserted}/{total}
          </span>
        </div>
        <div className="h-2 rounded-full bg-theme-bg-tertiary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              state === 'error' ? 'bg-theme-loss' : 'bg-theme-accent'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Success state */}
      {state === 'success' && (
        <div className="flex items-center gap-2 text-sm text-theme-gain">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Successfully imported {inserted} trades
        </div>
      )}

      {/* Error state */}
      {state === 'error' && errors && errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-theme-loss">{err}</p>
          ))}
        </div>
      )}

      {/* Done button */}
      {(state === 'success' || state === 'error') && (
        <div className="flex justify-end">
          <button
            type="button"
            onPointerDown={onDone}
            className="px-4 py-2 text-sm font-medium rounded-[var(--card-radius)]
              bg-theme-accent text-theme-bg-primary hover:bg-theme-accent-bright transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
