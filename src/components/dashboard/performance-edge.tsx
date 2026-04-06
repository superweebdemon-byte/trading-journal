import type { PerformanceEdgeKpis } from '@/lib/kpi'

interface PerformanceEdgeProps {
  edge: PerformanceEdgeKpis
}

function formatDollar(value: number): string {
  const abs = Math.abs(value)
  const sign = value >= 0 ? '+' : '-'
  return `${sign}$${Math.round(abs)}`
}

function getRecoveryColor(rating: PerformanceEdgeKpis['recoveryRating']): string {
  if (rating === 'EXCELLENT') return '#34D399'
  if (rating === 'GOOD') return '#34D399'
  if (rating === 'MODERATE') return '#FFD600'
  return '#EF4444'
}

function getRecoveryBg(rating: PerformanceEdgeKpis['recoveryRating']): string {
  if (rating === 'EXCELLENT') return 'rgba(52,211,153,0.10)'
  if (rating === 'GOOD') return 'rgba(52,211,153,0.10)'
  if (rating === 'MODERATE') return 'rgba(255,214,0,0.10)'
  return 'rgba(239,68,68,0.10)'
}

function getRecoveryBorder(rating: PerformanceEdgeKpis['recoveryRating']): string {
  if (rating === 'EXCELLENT') return 'rgba(52,211,153,0.15)'
  if (rating === 'GOOD') return 'rgba(52,211,153,0.15)'
  if (rating === 'MODERATE') return 'rgba(255,214,0,0.15)'
  return 'rgba(239,68,68,0.15)'
}

export function PerformanceEdge({ edge }: PerformanceEdgeProps) {
  const {
    expectancy,
    totalTrades,
    winRateDecimal,
    lossRateDecimal,
    avgWin,
    avgLoss,
    directionSplit,
    strongerDirection,
    longPercent,
    winPercent,
    lossPercent,
    breakevenPercent,
    recoveryFactor,
    recoveryRating,
  } = edge

  const longStats = directionSplit.find(d => d.direction === 'Long')
  const shortStats = directionSplit.find(d => d.direction === 'Short')

  // Expectancy color
  const expectancyColor = expectancy !== null && expectancy >= 0 ? '#34D399' : '#EF4444'

  // Formula breakdown text
  const winRatePct = winRateDecimal !== null ? Math.round(winRateDecimal * 100) : 0
  const lossRatePct = lossRateDecimal !== null ? Math.round(lossRateDecimal * 100) : 0
  const avgWinRounded = avgWin !== null ? Math.round(avgWin) : 0
  const avgLossRounded = avgLoss !== null ? Math.round(avgLoss) : 0

  return (
    <div
      className="flex flex-col flex-shrink-0 rounded-[6px]"
      style={{
        background: '#161B22',
        border: '1px solid rgba(92,92,122,0.12)',
        overflow: 'visible',
      }}
    >
      {/* Header */}
      <div
        className="px-4 pt-2 pb-0.5"
        style={{
          fontFamily: "'Fira Code', monospace",
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#6E7681',
        }}
      >
        Performance Edge
      </div>

      <div className="px-4 pb-2 flex flex-col" style={{ gap: '5px' }}>

        {/* 1. EXPECTANCY — Hero metric */}
        <div
          className="rounded px-2.5 py-1.5"
          style={{
            background: 'rgba(0,212,170,0.05)',
            border: '1px solid rgba(0,212,170,0.10)',
          }}
        >
          <div className="flex items-center justify-between mb-0.5">
            <span
              style={{
                fontSize: '10px',
                color: '#6E7681',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Expectancy / Trade
            </span>
            <span
              style={{
                fontSize: '9px',
                color: '#6E7681',
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '0.04em',
              }}
            >
              {totalTrades} trades
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="tabular-nums"
              style={{
                fontSize: '18px',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: expectancyColor,
              }}
            >
              {expectancy !== null ? `${expectancy >= 0 ? '+' : ''}$${Math.abs(expectancy).toFixed(2)}` : '—'}
            </span>
            <span
              style={{
                fontSize: '10px',
                color: '#6E7681',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              /trade
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              style={{
                fontSize: '9px',
                fontFamily: "'Space Grotesk', sans-serif",
                color: '#8B949E',
                opacity: 0.7,
              }}
            >
              {winRatePct}% WR &times; ${avgWinRounded} avg win &minus; {lossRatePct}% &times; ${avgLossRounded} avg loss
            </span>
          </div>
        </div>

        {/* 2. LONG VS SHORT */}
        <div>
          <div
            style={{
              fontSize: '10px',
              color: '#6E7681',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            Long vs Short
          </div>

          {/* Long row */}
          {longStats && (
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1L9 7H1L5 1Z" fill="#34D399" opacity={0.9} />
                </svg>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    color: '#34D399',
                    letterSpacing: '0.06em',
                  }}
                >
                  LONG
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums" style={{ fontSize: '11px', color: '#E6EDF3', fontWeight: 500 }}>
                  {Math.round(longStats.winRate)}%
                </span>
                <span style={{ fontSize: '10px', color: '#6E7681' }}>|</span>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: longStats.avgPnl >= 0 ? '#34D399' : '#EF4444',
                  }}
                >
                  {formatDollar(longStats.avgPnl)}
                </span>
                <span style={{ fontSize: '10px', color: '#6E7681' }}>avg</span>
                <span style={{ fontSize: '10px', color: '#6E7681' }}>|</span>
                <span className="tabular-nums" style={{ fontSize: '11px', color: '#8B949E' }}>
                  {longStats.tradeCount}
                </span>
              </div>
            </div>
          )}

          {/* Short row */}
          {shortStats && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 9L1 3H9L5 9Z" fill="#EF4444" opacity={0.9} />
                </svg>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    color: '#EF4444',
                    letterSpacing: '0.06em',
                  }}
                >
                  SHORT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums" style={{ fontSize: '11px', color: '#E6EDF3', fontWeight: 500 }}>
                  {Math.round(shortStats.winRate)}%
                </span>
                <span style={{ fontSize: '10px', color: '#6E7681' }}>|</span>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: shortStats.avgPnl >= 0 ? '#34D399' : '#EF4444',
                  }}
                >
                  {formatDollar(shortStats.avgPnl)}
                </span>
                <span style={{ fontSize: '10px', color: '#6E7681' }}>avg</span>
                <span style={{ fontSize: '10px', color: '#6E7681' }}>|</span>
                <span className="tabular-nums" style={{ fontSize: '11px', color: '#8B949E' }}>
                  {shortStats.tradeCount}
                </span>
              </div>
            </div>
          )}

          {/* Strength indicator bar */}
          {strongerDirection && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div
                className="flex-1 overflow-hidden rounded-full"
                style={{ height: '4px', background: 'rgba(92,92,122,0.08)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${longPercent.toFixed(1)}%`,
                    background: 'linear-gradient(90deg, #34D399 0%, #00D4AA 100%)',
                    opacity: 0.8,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '9px',
                  color: '#00D4AA',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 500,
                }}
              >
                {strongerDirection.toLowerCase()} edge
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(92,92,122,0.15)' }} />

        {/* 3. BREAKEVEN RATE */}
        <div>
          <div
            style={{
              fontSize: '10px',
              color: '#6E7681',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            Win / Loss / Breakeven
          </div>

          {/* Segmented bar */}
          <div className="flex overflow-hidden rounded-full" style={{ height: '5px', gap: '1px' }}>
            <div
              style={{
                width: `${winPercent}%`,
                background: '#34D399',
                opacity: 0.8,
              }}
            />
            <div
              style={{
                width: `${lossPercent}%`,
                background: '#EF4444',
                opacity: 0.8,
              }}
            />
            <div
              style={{
                width: `${breakevenPercent}%`,
                background: '#6E7681',
                opacity: 0.6,
              }}
            />
          </div>

          {/* Labels below bar */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#34D399' }} />
              <span className="tabular-nums" style={{ fontSize: '11px', color: '#34D399', fontWeight: 500 }}>
                {winPercent.toFixed(winPercent % 1 === 0 ? 0 : 1)}%
              </span>
              <span style={{ fontSize: '10px', color: '#6E7681' }}>W</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#EF4444' }} />
              <span className="tabular-nums" style={{ fontSize: '11px', color: '#EF4444', fontWeight: 500 }}>
                {lossPercent.toFixed(lossPercent % 1 === 0 ? 0 : 1)}%
              </span>
              <span style={{ fontSize: '10px', color: '#6E7681' }}>L</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6E7681' }} />
              <span className="tabular-nums" style={{ fontSize: '11px', color: '#8B949E', fontWeight: 500 }}>
                {breakevenPercent.toFixed(breakevenPercent % 1 === 0 ? 0 : 1)}%
              </span>
              <span style={{ fontSize: '10px', color: '#6E7681' }}>BE</span>
            </div>
          </div>
        </div>

        {/* 3b. STREAKS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M8 1C6.5 4 5 6.5 5 9a3 3 0 006 0c0-2.5-1.5-5-3-8z" fill="#34D399" opacity="0.85"/>
            </svg>
            <span style={{ fontSize: '10px', color: '#E6EDF3', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}>
              Best win streak
            </span>
          </div>
          <span className="tabular-nums" style={{ fontSize: '11px', fontWeight: 700, color: '#34D399' }}>
            {edge.maxConsecutiveWins}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <polyline points="2,4 6,8 10,5 14,12" stroke="#EF4444" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '10px', color: '#E6EDF3', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}>
              Worst loss streak
            </span>
          </div>
          <span className="tabular-nums" style={{ fontSize: '11px', fontWeight: 700, color: '#EF4444' }}>
            {edge.maxConsecutiveLosses}
          </span>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(92,92,122,0.15)' }} />

        {/* 4. RECOVERY FACTOR */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              style={{
                fontSize: '10px',
                color: '#6E7681',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Recovery Factor
            </span>
            <span
              style={{
                fontSize: '9px',
                color: '#6E7681',
                fontFamily: "'Space Grotesk', sans-serif",
                opacity: 0.6,
              }}
            >
              net P&L / max DD
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="tabular-nums"
              style={{
                fontSize: '14px',
                fontWeight: 700,
                lineHeight: 1,
                color: getRecoveryColor(recoveryRating),
              }}
            >
              {recoveryFactor !== null ? `${recoveryFactor.toFixed(1)}x` : '—'}
            </span>
            <span
              className="rounded"
              style={{
                fontSize: '9px',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                color: getRecoveryColor(recoveryRating),
                background: getRecoveryBg(recoveryRating),
                border: `1px solid ${getRecoveryBorder(recoveryRating)}`,
                letterSpacing: '0.08em',
                padding: '2px 7px',
                marginLeft: '4px',
              }}
            >
              {recoveryRating}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
