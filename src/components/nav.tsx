'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavProps {
  tradeCount?: number
  dateRange?: string
  platform?: string
  onAddTradeClick?: () => void
}

const tabs = [
  { label: 'Dashboard', href: '/' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Trades', href: '/sessions' },
  { label: 'Settings', href: '/settings' },
] as const

export function Nav({
  tradeCount = 0,
  dateRange,
  platform = 'TOPSTEP X',
  onAddTradeClick,
}: NavProps) {
  const pathname = usePathname()

  return (
    <header
      className="flex flex-wrap items-center justify-between px-5 py-2.5 border-b gap-2"
      style={{
        background: 'rgba(13,17,23,0.95)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center gap-5">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--color-accent)' }}
          />
          <span
            className="font-bold text-sm tracking-tight"
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              color: 'var(--color-text-primary)',
            }}
          >
            TradeLog
          </span>
        </div>

        {/* Tab nav */}
        <nav className="flex items-center gap-1" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="text-xs tracking-wide transition-colors duration-150"
                style={{
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                  background: isActive ? 'rgba(0,212,170,0.12)' : 'transparent',
                  padding: isActive ? '4px 10px' : '4px 10px',
                  borderRadius: '4px',
                  letterSpacing: '0.02em',
                  fontSize: '12px',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--color-text-secondary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--color-text-tertiary)'
                  }
                }}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Right side: context + import button */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-3 tabular-nums" style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
          <span>{platform}</span>
          <span style={{ color: 'var(--color-text-quaternary)' }}>|</span>
          <span>{tradeCount} trades</span>
          {dateRange && (
            <>
              <span style={{ color: 'var(--color-text-quaternary)' }}>|</span>
              <span>{dateRange}</span>
            </>
          )}
        </div>
        <button
          onPointerDown={onAddTradeClick}
          className="font-semibold rounded cursor-pointer"
          style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: '11px',
            padding: '6px 12px',
            background: 'var(--color-accent)',
            border: '1px solid var(--color-accent)',
            color: 'var(--color-bg-secondary)',
          }}
        >
          + Add Trade
        </button>
      </div>
    </header>
  )
}
