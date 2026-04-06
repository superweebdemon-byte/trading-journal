'use client'

import type { UserSettings } from '@/lib/types'

interface TradingPrefsProps {
  settings: UserSettings
  onUpdate: (patch: Partial<UserSettings>) => void
}

export function TradingPrefs({ settings, onUpdate }: TradingPrefsProps) {
  const revengeMinutes = Math.round(settings.revenge_window_seconds / 60)

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
        Trading Preferences
      </div>
      <div className="text-[11px] mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
        Defaults and behavioral analysis thresholds.
      </div>

      {/* Contract + Timezone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label
            className="font-[family-name:var(--font-display)] text-[11px] font-medium block mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Default Contract
          </label>
          <div className="relative">
            <select
              value={settings.default_contract}
              onChange={(e) => onUpdate({ default_contract: e.target.value })}
              className="w-full text-[12px] font-[family-name:var(--font-mono)] px-3 py-2 rounded appearance-none cursor-pointer"
              style={{
                background: 'rgba(22,27,34,0.8)',
                border: '1px solid rgba(48,54,61,0.15)',
                color: 'var(--color-text-primary)',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23555570' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              <option value="MNQ">MNQ (Micro E-mini Nasdaq)</option>
              <option value="MYM">MYM (Micro E-mini Dow)</option>
              <option value="MES">MES (Micro E-mini S&amp;P)</option>
            </select>
          </div>
        </div>
        <div>
          <label
            className="font-[family-name:var(--font-display)] text-[11px] font-medium block mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Timezone Display
          </label>
          <div className="relative">
            <select
              value={settings.timezone_display}
              onChange={(e) =>
                onUpdate({ timezone_display: e.target.value as UserSettings['timezone_display'] })
              }
              className="w-full text-[12px] font-[family-name:var(--font-mono)] px-3 py-2 rounded appearance-none cursor-pointer"
              style={{
                background: 'rgba(22,27,34,0.8)',
                border: '1px solid rgba(48,54,61,0.15)',
                color: 'var(--color-text-primary)',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23555570' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              <option value="ET">Eastern (ET) — Exchange time</option>
              <option value="CT">Central (CT)</option>
              <option value="PT">Pacific (PT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Behavioral Thresholds */}
      <div
        className="pt-4 mt-4"
        style={{ borderTop: '1px solid rgba(48,54,61,0.12)' }}
      >
        <div
          className="font-[family-name:var(--font-display)] text-[11px] font-semibold mb-3"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Behavioral Thresholds
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className="font-[family-name:var(--font-display)] text-[11px] font-medium block mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Revenge Trade Window
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={revengeMinutes}
                min={1}
                max={60}
                onChange={(e) =>
                  onUpdate({ revenge_window_seconds: parseInt(e.target.value || '2', 10) * 60 })
                }
                className="text-[12px] font-[family-name:var(--font-mono)] px-3 py-2 rounded"
                style={{
                  width: 80,
                  background: 'rgba(22,27,34,0.8)',
                  border: '1px solid rgba(48,54,61,0.15)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                minutes
              </span>
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Entries within this time after a loss are flagged as revenge trades.
            </div>
          </div>
          <div>
            <label
              className="font-[family-name:var(--font-display)] text-[11px] font-medium block mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Overtrade Multiplier
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.overtrade_multiplier}
                min={1}
                max={10}
                step={0.5}
                onChange={(e) =>
                  onUpdate({ overtrade_multiplier: parseFloat(e.target.value || '2') })
                }
                className="text-[12px] font-[family-name:var(--font-mono)] px-3 py-2 rounded"
                style={{
                  width: 80,
                  background: 'rgba(22,27,34,0.8)',
                  border: '1px solid rgba(48,54,61,0.15)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                x avg daily trades
              </span>
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Sessions with trades exceeding this multiple get flagged.
            </div>
          </div>
        </div>
      </div>

      {/* P&L Display Toggle */}
      <div
        className="pt-4 mt-4"
        style={{ borderTop: '1px solid rgba(48,54,61,0.12)' }}
      >
        <div
          className="font-[family-name:var(--font-display)] text-[11px] font-semibold mb-3"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          P&amp;L Display
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div
              className="font-[family-name:var(--font-display)] text-[11px] font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Show Net P&amp;L (after fees)
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              When off, displays gross P&amp;L across all views.
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdate({ pnl_display: settings.pnl_display === 'net' ? 'gross' : 'net' })
            }
            className="relative shrink-0 cursor-pointer transition-all duration-200"
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background:
                settings.pnl_display === 'net'
                  ? 'rgba(0,212,170,0.25)'
                  : 'rgba(22,27,34,0.9)',
              border:
                settings.pnl_display === 'net'
                  ? '1px solid rgba(0,212,170,0.45)'
                  : '1px solid rgba(48,54,61,0.20)',
            }}
          >
            <span
              className="block rounded-full transition-all duration-200"
              style={{
                width: 14,
                height: 14,
                background: settings.pnl_display === 'net' ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                position: 'absolute',
                top: 2,
                left: settings.pnl_display === 'net' ? 18 : 2,
              }}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
