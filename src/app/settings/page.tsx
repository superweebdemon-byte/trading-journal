'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchUserSettings, updateUserSettings } from '@/lib/supabase/queries'
import type { UserSettings } from '@/lib/types'
import { AccountCard } from '@/components/settings/account-card'
import { TradingPrefs } from '@/components/settings/trading-prefs'
import { DisplayPrefs } from '@/components/settings/display-prefs'
import { DataManagement } from '@/components/settings/data-management'

const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'> = {
  revenge_window_seconds: 120,
  overtrade_multiplier: 2,
  pnl_display: 'net',
  theme: 'split-cockpit',
  timeframe_bucket_minutes: 30,
  default_contract: 'MNQ',
  timezone_display: 'ET',
  date_format: 'MM/DD/YYYY',
  currency_format: 'USD',
  relative_dates: true,
  compact_numbers: false,
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) setEmail(user.email)

        const existing = await fetchUserSettings()
        if (existing) {
          setSettings(existing)
        } else {
          // Create default settings row
          const created = await updateUserSettings(DEFAULT_SETTINGS)
          setSettings(created)
        }
      } catch {
        // Fallback with defaults for display
        setSettings({
          ...DEFAULT_SETTINGS,
          user_id: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const saveSettings = useCallback(
    (updated: UserSettings) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setSaveStatus('saving')

      debounceRef.current = setTimeout(async () => {
        try {
          const { user_id, created_at, updated_at, ...patch } = updated
          void user_id; void created_at; void updated_at
          await updateUserSettings(patch)
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 3000)
        } catch {
          setSaveStatus('error')
          setTimeout(() => setSaveStatus('idle'), 3000)
        }
      }, 500)
    },
    []
  )

  const handleUpdate = useCallback(
    (patch: Partial<UserSettings>) => {
      setSettings((prev) => {
        if (!prev) return prev
        const updated = { ...prev, ...patch }
        saveSettings(updated)
        return updated
      })
    },
    [saveSettings]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'var(--color-accent)' }}
          />
          <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            Loading settings...
          </span>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Failed to load settings.
        </p>
      </div>
    )
  }

  return (
    <div className="p-3 w-full max-w-[1024px] mx-auto">
      {/* Page title */}
      <div className="mb-6 mt-2">
        <h1
          className="font-[family-name:var(--font-display)] text-xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Settings
        </h1>
        <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          Manage your account, trading preferences, and data.
        </p>
      </div>

      <AccountCard email={email} />
      <TradingPrefs settings={settings} onUpdate={handleUpdate} />
      <DisplayPrefs settings={settings} onUpdate={handleUpdate} />
      <DataManagement />

      {/* Auto-save indicator */}
      {saveStatus !== 'idle' && (
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background:
                  saveStatus === 'saved'
                    ? 'var(--color-gain)'
                    : saveStatus === 'error'
                      ? 'var(--color-loss)'
                      : 'var(--color-text-tertiary)',
              }}
            />
            <span
              className="font-[family-name:var(--font-display)] text-[11px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                  ? 'Changes saved'
                  : 'Save failed'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
