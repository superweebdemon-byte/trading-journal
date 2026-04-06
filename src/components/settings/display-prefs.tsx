'use client'

import type { UserSettings } from '@/lib/types'

interface DisplayPrefsProps {
  settings: UserSettings
  onUpdate: (patch: Partial<UserSettings>) => void
}

function ToggleSwitch({
  on,
  onToggle,
}: {
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative shrink-0 cursor-pointer transition-all duration-200"
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        background: on ? 'rgba(0,212,170,0.25)' : 'rgba(22,27,34,0.9)',
        border: on
          ? '1px solid rgba(0,212,170,0.45)'
          : '1px solid rgba(48,54,61,0.20)',
      }}
    >
      <span
        className="block rounded-full transition-all duration-200"
        style={{
          width: 14,
          height: 14,
          background: on ? '#00D4AA' : '#6E7681',
          position: 'absolute',
          top: 2,
          left: on ? 18 : 2,
        }}
      />
    </button>
  )
}

const chevronBg = `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23555570' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`

const selectStyle = {
  background: 'rgba(22,27,34,0.8)',
  border: '1px solid rgba(48,54,61,0.15)',
  color: 'var(--color-text-primary)',
  backgroundImage: chevronBg,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
} as const

export function DisplayPrefs({ settings, onUpdate }: DisplayPrefsProps) {
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
        Display Preferences
      </div>
      <div className="text-[11px] mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
        How dates, numbers, and currencies appear.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            className="font-[family-name:var(--font-display)] text-[11px] font-medium block mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Date Format
          </label>
          <select
            value={settings.date_format}
            onChange={(e) =>
              onUpdate({ date_format: e.target.value as UserSettings['date_format'] })
            }
            className="w-full text-[12px] font-[family-name:var(--font-mono)] px-3 py-2 rounded appearance-none cursor-pointer"
            style={selectStyle}
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY (03/12/2026)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (12/03/2026)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (2026-03-12)</option>
          </select>
        </div>
        <div>
          <label
            className="font-[family-name:var(--font-display)] text-[11px] font-medium block mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Currency Format
          </label>
          <select
            value={settings.currency_format}
            onChange={(e) =>
              onUpdate({ currency_format: e.target.value as UserSettings['currency_format'] })
            }
            className="w-full text-[12px] font-[family-name:var(--font-mono)] px-3 py-2 rounded appearance-none cursor-pointer"
            style={selectStyle}
          >
            <option value="USD">USD ($1,234.56)</option>
            <option value="EUR">EUR (1.234,56)</option>
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div
        className="pt-4 mt-4"
        style={{ borderTop: '1px solid rgba(48,54,61,0.12)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div
              className="font-[family-name:var(--font-display)] text-[11px] font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Relative Dates
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Show &quot;Today&quot;, &quot;Yesterday&quot; instead of absolute dates for recent entries.
            </div>
          </div>
          <ToggleSwitch
            on={settings.relative_dates}
            onToggle={() => onUpdate({ relative_dates: !settings.relative_dates })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div
              className="font-[family-name:var(--font-display)] text-[11px] font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Compact Numbers
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Show &quot;$1.2k&quot; instead of &quot;$1,200&quot; in summary tiles.
            </div>
          </div>
          <ToggleSwitch
            on={settings.compact_numbers}
            onToggle={() => onUpdate({ compact_numbers: !settings.compact_numbers })}
          />
        </div>
      </div>
    </div>
  )
}
