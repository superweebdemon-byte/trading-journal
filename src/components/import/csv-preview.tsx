'use client'

import type { NormalizedTrade } from '@/lib/types'

interface CsvPreviewProps {
  filename: string
  totalRows: number
  trades: NormalizedTrade[]
}

const PREVIEW_ROWS = 3

export function CsvPreview({ filename, totalRows, trades }: CsvPreviewProps) {
  const previewTrades = trades.slice(0, PREVIEW_ROWS)
  const remaining = totalRows - PREVIEW_ROWS

  return (
    <div className="mb-3">
      {/* Preview header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span
            className="font-semibold"
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: '11px',
              color: '#E6EDF3',
            }}
          >
            Preview
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: '2px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'inline-block',
              background: 'rgba(52,211,153,0.10)',
              color: '#34D399',
            }}
          >
            {filename}
          </span>
        </div>
        <span
          className="tabular-nums"
          style={{ fontSize: '10px', color: '#6E7681' }}
        >
          {totalRows} rows detected
        </span>
      </div>

      {/* Preview table */}
      <div
        className="rounded overflow-hidden"
        style={{ border: '1px solid rgba(48,54,61,0.12)' }}
      >
        <table className="w-full" style={{ fontSize: '10px' }}>
          <thead>
            <tr style={{ background: 'rgba(22,27,34,0.8)' }}>
              <th className="text-left font-medium px-3 py-2 uppercase tracking-wider" style={{ color: '#6E7681', fontSize: '10px' }}>Trade Id</th>
              <th className="text-left font-medium px-3 py-2 uppercase tracking-wider" style={{ color: '#6E7681', fontSize: '10px' }}>Account</th>
              <th className="text-left font-medium px-3 py-2 uppercase tracking-wider" style={{ color: '#6E7681', fontSize: '10px' }}>Contract</th>
              <th className="text-left font-medium px-3 py-2 uppercase tracking-wider" style={{ color: '#6E7681', fontSize: '10px' }}>Side</th>
              <th className="text-right font-medium px-3 py-2 uppercase tracking-wider" style={{ color: '#6E7681', fontSize: '10px' }}>P&amp;L</th>
              <th className="text-left font-medium px-3 py-2 uppercase tracking-wider" style={{ color: '#6E7681', fontSize: '10px' }}>Trade Day</th>
            </tr>
          </thead>
          <tbody>
            {previewTrades.map((trade) => {
              const pnl = parseFloat(trade.pnl)
              const pnlColor = pnl > 0 ? '#34D399' : pnl < 0 ? '#EF4444' : '#6E7681'
              const sideColor = trade.trade_type === 'Long' ? '#34D399' : '#8B949E'
              const isMnq = trade.contract_symbol === 'MNQ'

              return (
                <tr
                  key={trade.topstep_id}
                  className="border-t"
                  style={{ borderColor: 'rgba(48,54,61,0.08)' }}
                >
                  <td className="px-3 py-1.5 tabular-nums" style={{ color: '#8B949E' }}>
                    TRD-{trade.topstep_id}
                  </td>
                  <td className="px-3 py-1.5" style={{ color: '#6E7681' }}>
                    {trade.raw_csv_row.ContractName ? `TSX-150K` : 'TSX-150K'}
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '2px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        display: 'inline-block',
                        background: isMnq ? 'rgba(0,212,170,0.12)' : 'rgba(48,54,61,0.12)',
                        color: isMnq ? '#00D4AA' : '#8B949E',
                      }}
                    >
                      {trade.contract_symbol}
                    </span>
                  </td>
                  <td className="px-3 py-1.5" style={{ color: sideColor }}>
                    {trade.trade_type}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums font-medium" style={{ color: pnlColor }}>
                    {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                  </td>
                  <td className="px-3 py-1.5 tabular-nums" style={{ color: '#8B949E' }}>
                    {trade.trade_day}
                  </td>
                </tr>
              )
            })}

            {remaining > 0 && (
              <tr className="border-t" style={{ borderColor: 'rgba(48,54,61,0.08)' }}>
                <td className="px-3 py-1.5 tabular-nums" colSpan={6} style={{ color: '#6E7681' }}>
                  ... {remaining} more rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
