'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (isSignUp) {
      setError('Check your email to confirm your account.')
      setLoading(false)
      return
    }

    window.location.href = '/'
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div
        className="w-full max-w-sm space-y-6 p-8"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--card-radius)',
        }}
      >
        <div className="text-center">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            Trading Journal
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono), monospace' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm outline-none transition-colors focus:ring-1"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-body), monospace',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono), monospace' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm outline-none transition-colors focus:ring-1"
              style={{
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-body), monospace',
              }}
            />
          </div>

          {error && (
            <p
              className="text-xs"
              style={{ color: error.includes('Check your email') ? 'var(--color-gain)' : 'var(--color-loss)' }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-bg-primary)',
              fontFamily: 'var(--font-display), sans-serif',
            }}
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
            className="text-xs transition-colors hover:underline"
            style={{ color: 'var(--color-accent)' }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}
