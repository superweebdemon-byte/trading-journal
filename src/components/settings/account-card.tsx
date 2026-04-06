'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AccountCardProps {
  email: string
}

export function AccountCard({ email }: AccountCardProps) {
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  async function handleChangePassword() {
    setChangingPassword(true)
    setPasswordMsg(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`,
      })
      if (error) throw error
      setPasswordMsg('Password reset email sent.')
    } catch {
      setPasswordMsg('Failed to send reset email.')
    } finally {
      setChangingPassword(false)
    }
  }

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
        Account
      </div>
      <div className="text-[11px] mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
        Your login credentials and profile. Powered by Supabase Auth (email/password).
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label
            className="font-[family-name:var(--font-display)] text-[11px] font-medium block mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Email
          </label>
          <input
            type="email"
            readOnly
            value={email}
            className="w-full text-[12px] font-[family-name:var(--font-mono)] px-3 py-2 rounded"
            style={{
              background: 'rgba(22,27,34,0.8)',
              border: '1px solid rgba(48,54,61,0.15)',
              color: 'var(--color-text-primary)',
              cursor: 'default',
            }}
          />
        </div>
        <div>
          <label
            className="font-[family-name:var(--font-display)] text-[11px] font-medium block mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Password
          </label>
          <div className="flex items-center gap-2">
            <input
              type="password"
              readOnly
              value="••••••••••"
              className="w-full text-[12px] font-[family-name:var(--font-mono)] px-3 py-2 rounded"
              style={{
                background: 'rgba(22,27,34,0.8)',
                border: '1px solid rgba(48,54,61,0.15)',
                color: 'var(--color-text-primary)',
                cursor: 'default',
              }}
            />
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="font-[family-name:var(--font-display)] text-[12px] font-medium whitespace-nowrap px-3.5 py-2 rounded cursor-pointer transition-colors"
              style={{
                background: 'rgba(22,27,34,0.8)',
                border: '1px solid rgba(48,54,61,0.15)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {changingPassword ? '...' : 'Change'}
            </button>
          </div>
          {passwordMsg && (
            <div className="text-[10px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {passwordMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
