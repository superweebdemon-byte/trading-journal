'use client'

type FilterId = 'all-dates' | 'MYM' | 'MNQ' | 'Long' | 'Short' | 'win' | 'loss' | 'breakeven'

interface FilterBarProps {
  activeFilters: Set<FilterId>
  onToggle: (filter: FilterId) => void
}

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all-dates', label: 'All Dates' },
  { id: 'MYM', label: 'MYM' },
  { id: 'MNQ', label: 'MNQ' },
  { id: 'Long', label: 'Long' },
  { id: 'Short', label: 'Short' },
  { id: 'win', label: 'Win' },
  { id: 'loss', label: 'Loss' },
  { id: 'breakeven', label: 'Breakeven' },
]

export type { FilterId }

export function FilterBar({ activeFilters, onToggle }: FilterBarProps) {
  return (
    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
      <span
        className="text-[10px] font-semibold mr-1"
        style={{ color: 'var(--color-text-tertiary)', fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
      >
        Filters:
      </span>
      {FILTERS.map((f) => {
        const isActive = activeFilters.has(f.id)
        return (
          <button
            key={f.id}
            onClick={() => onToggle(f.id)}
            className="text-[10px] px-2.5 py-1 rounded cursor-pointer transition-colors"
            style={{
              fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
              background: isActive ? 'rgba(0,212,170,0.15)' : 'rgba(22,27,34,0.8)',
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
              border: isActive
                ? '1px solid rgba(0,212,170,0.25)'
                : '1px solid rgba(48,54,61,0.15)',
            }}
          >
            {f.label}
          </button>
        )
      })}
    </div>
  )
}
