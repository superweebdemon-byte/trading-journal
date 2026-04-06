'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Session } from '@/lib/types'
import { fetchTradesBySession } from '@/lib/supabase/queries'
import { SessionsClient } from '@/components/sessions/sessions-client'

function SessionsContent() {
  const searchParams = useSearchParams()
  const initialDate = searchParams.get('date') ?? undefined
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTradesBySession()
      .then(setSessions)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Loading trades...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <p className="text-sm" style={{ color: 'var(--color-loss)' }}>
          Failed to load trades: {error}
        </p>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          No trades yet. Import to get started.
        </p>
      </div>
    )
  }

  return <SessionsClient sessions={sessions} initialDate={initialDate} />
}

export default function SessionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Loading trades...</p>
      </div>
    }>
      <SessionsContent />
    </Suspense>
  )
}
