'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import type { Trade } from '@/lib/types'
import { getTradePnl } from '@/lib/kpi'
import { useTheme } from '@/themes/provider'
import type { ThemeColors } from '@/themes/types'

interface EquityCurveProps {
  trades: Trade[]
  pnlMode: 'net' | 'gross'
  maxDrawdownDollars: number
}

interface CurveDataPoint {
  time: string
  value: number
}

type TimeRange = '1W' | '1M' | '3M' | 'ALL'

const TIME_RANGES: TimeRange[] = ['1W', '1M', '3M', 'ALL']

// ────────────────────────────────────────────────────────
// Data builders
// ────────────────────────────────────────────────────────

function buildCurveData(trades: Trade[], pnlMode: 'net' | 'gross'): CurveDataPoint[] {
  if (trades.length === 0) return []

  const sorted = [...trades].sort((a, b) =>
    new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime()
  )

  let cumPnl = 0
  const points: CurveDataPoint[] = []

  for (const trade of sorted) {
    const pnl = getTradePnl(trade, pnlMode)
    cumPnl += pnl
    const day = trade.trade_day
    const existing = points.find(p => p.time === day)
    if (existing) {
      existing.value = cumPnl
    } else {
      points.push({ time: day, value: cumPnl })
    }
  }

  return points
}

function filterByRange(data: CurveDataPoint[], range: TimeRange): CurveDataPoint[] {
  if (range === 'ALL' || data.length === 0) return data

  const lastDate = new Date(data[data.length - 1].time)
  let daysBack: number
  switch (range) {
    case '1W': daysBack = 7; break
    case '1M': daysBack = 30; break
    case '3M': daysBack = 90; break
    default: return data
  }

  const cutoff = new Date(lastDate)
  cutoff.setDate(cutoff.getDate() - daysBack)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return data.filter(d => d.time >= cutoffStr)
}

function findMaxDrawdown(data: CurveDataPoint[]) {
  let peak = -Infinity
  let peakIdx = 0
  let maxDD = 0
  let troughIdx = 0
  let ddPeakIdx = 0

  for (let i = 0; i < data.length; i++) {
    if (data[i].value > peak) {
      peak = data[i].value
      peakIdx = i
    }
    const dd = peak - data[i].value
    if (dd > maxDD) {
      maxDD = dd
      troughIdx = i
      ddPeakIdx = peakIdx
    }
  }
  return { peakIndex: ddPeakIdx, troughIndex: troughIdx, drawdown: maxDD }
}

function getPeriodColor(data: CurveDataPoint[], colors: ThemeColors) {
  if (data.length < 2) return { up: true, lineColor: colors.gain, fillTop: colors.gainBg, fillBottom: 'transparent' }
  const startVal = data[0].value
  const endVal = data[data.length - 1].value
  const up = endVal >= startVal
  return {
    up,
    lineColor: up ? colors.gain : colors.loss,
    fillTop: up ? colors.gainBg : colors.lossBg,
    fillBottom: 'transparent',
  }
}

function formatDollars(val: number): string {
  return '$' + Math.round(val).toLocaleString('en-US')
}

function formatChange(startVal: number, endVal: number): string {
  const delta = endVal - startVal
  const sign = delta >= 0 ? '+' : '-'
  const absDelta = Math.abs(Math.round(delta))
  if (startVal === 0) {
    return `${sign}$${absDelta.toLocaleString('en-US')}`
  }
  const pct = ((delta / Math.abs(startVal)) * 100).toFixed(2)
  return `${sign}$${absDelta.toLocaleString('en-US')} (${sign}${Math.abs(Number(pct))}%)`
}

function formatDate(timeStr: string): string {
  const d = new Date(timeStr + 'T00:00:00')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// ────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────

export function EquityCurve({ trades, pnlMode, maxDrawdownDollars: _maxDrawdownDollars }: EquityCurveProps) {
  const { theme } = useTheme()
  const themeColors = theme.colors
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof import('lightweight-charts').createChart> | null>(null)
  const seriesRef = useRef<unknown>(null)
  const ddOverlayRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const [timeRange, setTimeRange] = useState<TimeRange>('ALL')

  // Header state
  const [displayBalance, setDisplayBalance] = useState<string>('$0')
  const [changeLine, setChangeLine] = useState<string>('')
  const [changeClass, setChangeClass] = useState<'gain' | 'loss' | 'drawdown'>('gain')
  const [hoverDate, setHoverDate] = useState<string>('')

  // Animated balance counter refs
  const animFrameRef = useRef<number | null>(null)
  const currentBalRef = useRef(0)

  const allCurveData = useMemo(() => buildCurveData(trades, pnlMode), [trades, pnlMode])

  const visibleData = useMemo(() => filterByRange(allCurveData, timeRange), [allCurveData, timeRange])
  const visibleDD = useMemo(() => findMaxDrawdown(visibleData), [visibleData])

  const animateBalance = useCallback((target: number) => {
    const start = currentBalRef.current
    const diff = target - start
    if (Math.abs(diff) < 2) {
      currentBalRef.current = target
      setDisplayBalance(formatDollars(target))
      return
    }
    const duration = 120
    const startTime = performance.now()

    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - progress) * (1 - progress)
      const current = start + diff * eased
      currentBalRef.current = current
      setDisplayBalance(formatDollars(current))
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step)
      } else {
        currentBalRef.current = target
        setDisplayBalance(formatDollars(target))
      }
    }

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(step)
  }, [])

  const updateHeaderDefault = useCallback(() => {
    if (visibleData.length === 0) return
    const startVal = visibleData[0].value
    const endVal = visibleData[visibleData.length - 1].value
    const delta = endVal - startVal
    animateBalance(endVal)
    setChangeLine(formatChange(startVal, endVal))
    setChangeClass(delta >= 0 ? 'gain' : 'loss')
    setHoverDate('')
  }, [visibleData, animateBalance])

  // Main chart effect
  useEffect(() => {
    if (!chartContainerRef.current) return
    let cancelled = false

    async function initChart() {
      const lc = await import('lightweight-charts')
      const { createChart, AreaSeries, LineStyle } = lc

      if (cancelled || !chartContainerRef.current) return

      // Clean up previous chart
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }

      const container = chartContainerRef.current
      const colors = getPeriodColor(visibleData, themeColors)

      const chart = createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        layout: {
          background: { color: 'transparent' },
          textColor: themeColors.textTertiary,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          attributionLogo: false,
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { color: 'rgba(255,255,255,0.04)', style: LineStyle.Solid },
        },
        rightPriceScale: {
          borderVisible: false,
          scaleMargins: { top: 0.08, bottom: 0.08 },
        },
        timeScale: {
          borderVisible: false,
          timeVisible: false,
          rightOffset: 2,
          fixLeftEdge: true,
          fixRightEdge: true,
        },
        crosshair: {
          vertLine: {
            color: 'rgba(45,212,191,0.25)',
            width: 1,
            style: LineStyle.Solid,
            labelVisible: false,
          },
          horzLine: {
            visible: false,
          },
        },
        handleScroll: false,
        handleScale: false,
        localization: {
          priceFormatter: (price: number) => '$' + Math.round(price).toLocaleString('en-US'),
        },
      })

      chartRef.current = chart

      // AreaSeries — single color based on period direction
      const series = chart.addSeries(AreaSeries, {
        lineColor: colors.lineColor,
        lineWidth: 2,
        topColor: colors.fillTop,
        bottomColor: colors.fillBottom,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: colors.lineColor,
        crosshairMarkerBackgroundColor: themeColors.bgPrimary,
        crosshairMarkerBorderWidth: 2,
      })

      seriesRef.current = series
      series.setData(visibleData as Array<{ time: string; value: number }>)

      // Period reference line — dashed at start value
      if (visibleData.length > 0) {
        series.createPriceLine({
          price: visibleData[0].value,
          color: 'rgba(255,255,255,0.06)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
        })
      }

      chart.timeScale().fitContent()

      // Drawdown overlay positioning
      function updateDrawdownOverlay() {
        const overlay = ddOverlayRef.current
        if (!overlay) return
        if (visibleDD.drawdown === 0) { overlay.style.display = 'none'; return }

        const peakTime = visibleData[visibleDD.peakIndex]?.time
        const troughTime = visibleData[visibleDD.troughIndex]?.time
        if (!peakTime || !troughTime) { overlay.style.display = 'none'; return }

        const ts = chart.timeScale()
        const leftCoord = ts.timeToCoordinate(peakTime)
        const rightCoord = ts.timeToCoordinate(troughTime)
        if (leftCoord === null || rightCoord === null) { overlay.style.display = 'none'; return }

        overlay.style.left = Math.min(leftCoord, rightCoord) + 'px'
        overlay.style.width = Math.abs(rightCoord - leftCoord) + 'px'
        overlay.style.display = 'block'
      }

      requestAnimationFrame(updateDrawdownOverlay)

      // Crosshair — Robinhood-style header update
      chart.subscribeCrosshairMove((param) => {
        if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
          // Left chart — reset to default
          if (visibleData.length > 0) {
            const startVal = visibleData[0].value
            const endVal = visibleData[visibleData.length - 1].value
            const delta = endVal - startVal
            animateBalance(endVal)
            setChangeLine(formatChange(startVal, endVal))
            setChangeClass(delta >= 0 ? 'gain' : 'loss')
            setHoverDate('')
          }
          return
        }

        const seriesData = param.seriesData.get(series)
        if (!seriesData || !('value' in seriesData)) {
          return
        }

        const value = (seriesData as { value: number }).value
        const time = param.time as string
        const startVal = visibleData[0].value
        const delta = value - startVal
        const up = delta >= 0

        animateBalance(value)
        setHoverDate(formatDate(time))

        // Check drawdown zone
        const ddPeakTime = visibleData[visibleDD.peakIndex]?.time
        const ddTroughTime = visibleData[visibleDD.troughIndex]?.time

        if (visibleDD.drawdown > 0 && ddPeakTime && ddTroughTime && time >= ddPeakTime && time <= ddTroughTime) {
          setChangeLine('Max DD: -$' + Math.round(visibleDD.drawdown).toLocaleString('en-US'))
          setChangeClass('drawdown')
        } else {
          setChangeLine(formatChange(startVal, value))
          setChangeClass(up ? 'gain' : 'loss')
        }
      })

      // Resize observer
      resizeObserverRef.current?.disconnect()
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          chart.applyOptions({ width, height })
          requestAnimationFrame(updateDrawdownOverlay)
        }
      })
      resizeObserverRef.current = resizeObserver
      resizeObserver.observe(container)
    }

    initChart()

    return () => {
      cancelled = true
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [visibleData, visibleDD, animateBalance, themeColors])

  // Set header default when visible data changes
  useEffect(() => {
    updateHeaderDefault()
  }, [updateHeaderDefault])

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const changeColorMap = {
    gain: themeColors.gain,
    loss: themeColors.loss,
    drawdown: themeColors.loss,
  }

  return (
    <div
      className="col-span-1 lg:col-span-8 lg:h-full overflow-hidden flex flex-col rounded-[10px] self-stretch"
      style={{
        background: 'var(--color-bg-tertiary)',
        border: '1px solid rgba(255,255,255,0.06)',
        minHeight: '280px',
      }}
    >
      {/* Robinhood-style header */}
      <div className="flex items-start justify-between" style={{ padding: '20px 22px 0 22px' }}>
        <div className="flex flex-col" style={{ gap: '2px' }}>
          <div className="flex items-baseline" style={{ gap: '8px' }}>
            <span
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                transition: 'color 0.15s ease',
              }}
            >
              {displayBalance}
            </span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--color-text-tertiary)',
                opacity: hoverDate ? 1 : 0,
                transition: 'opacity 0.15s ease',
              }}
            >
              {hoverDate}
            </span>
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '12px',
              fontWeight: 500,
              color: changeColorMap[changeClass],
              marginTop: '2px',
              transition: 'color 0.15s ease',
              minHeight: '18px',
            }}
          >
            {changeLine}
          </div>
        </div>

        {/* Time range toggle pills */}
        <div
          className="flex items-center"
          role="tablist"
          aria-label="Time range"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '6px',
            padding: '2px',
            marginTop: '4px',
          }}
        >
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              role="tab"
              aria-selected={timeRange === range}
              onPointerDown={(e) => {
                e.preventDefault()
                setTimeRange(range)
              }}
              className="cursor-pointer"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '10px',
                fontWeight: 500,
                padding: '3px 10px',
                borderRadius: '4px',
                border: 'none',
                background: timeRange === range ? 'rgba(45,212,191,0.12)' : 'transparent',
                color: timeRange === range ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                transition: 'all 0.15s ease',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (timeRange !== range) {
                  (e.target as HTMLButtonElement).style.color = 'var(--color-text-secondary)'
                }
              }}
              onMouseLeave={(e) => {
                if (timeRange !== range) {
                  (e.target as HTMLButtonElement).style.color = 'var(--color-text-tertiary)'
                }
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 relative" style={{ padding: '4px 12px 10px 12px', minHeight: '180px' }}>
        <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        {/* Max drawdown overlay */}
        <div
          ref={ddOverlayRef}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            pointerEvents: 'none',
            background: 'rgba(239, 68, 68, 0.08)',
            borderLeft: '1px solid rgba(239, 68, 68, 0.12)',
            borderRight: '1px solid rgba(239, 68, 68, 0.12)',
            zIndex: 1,
            display: 'none',
          }}
        />
      </div>
    </div>
  )
}
