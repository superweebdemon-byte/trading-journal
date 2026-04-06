'use client'

import { format, parseISO } from 'date-fns'
import type { NormalizedTrade } from '@/lib/types'

interface PreviewTableProps {
  newTrades: NormalizedTrade[]
  duplicates: NormalizedTrade[]
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function PreviewTable({
  newTrades,
  duplicates,
  onConfirm,
  onCancel,
  isLoading,
}: PreviewTableProps) {
  const allTrades = [...newTrades, ...duplicates]
  const duplicateIds = new Set(duplicates.map((t) => t.topstep_id))

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-theme-text-secondary">
          <span className="text-theme-gain font-medium">{newTrades.length}</span> new trades
        </span>
        {duplicates.length > 0 && (
          <span className="text-theme-text-secondary">
            <span className="text-theme-text-tertiary font-medium">{duplicates.length}</span> duplicates
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[var(--card-radius)] border border-theme-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-theme-bg-tertiary text-theme-text-secondary text-left">
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Contract</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium text-right">Size</th>
              <th className="px-3 py-2 font-medium text-right">Entry</th>
              <th className="px-3 py-2 font-medium text-right">Exit</th>
              <th className="px-3 py-2 font-medium text-right">P&L</th>
              <th className="px-3 py-2 font-medium text-right">Fees</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {allTrades.map((trade) => {
              const isDuplicate = duplicateIds.has(trade.topstep_id)
              const pnl = parseFloat(trade.pnl)
              return (
                <tr
                  key={trade.topstep_id}
                  className={isDuplicate ? 'opacity-40' : 'hover:bg-theme-bg-tertiary/30'}
                >
                  <td className="px-3 py-2">
                    {isDuplicate ? (
                      <span className="inline-flex items-center rounded-full bg-theme-bg-tertiary px-2 py-0.5 text-[10px] text-theme-text-tertiary">
                        Already imported
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-theme-gain-bg px-2 py-0.5 text-[10px] text-theme-gain">
                        New
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-theme-text-secondary tabular-nums whitespace-nowrap">
                    {format(parseISO(trade.entered_at), 'MM/dd/yy HH:mm')}
                  </td>
                  <td className="px-3 py-2 text-theme-text-primary font-medium">
                    {trade.contract_symbol}
                  </td>
                  <td className="px-3 py-2">
                    <span className={trade.trade_type === 'Long' ? 'text-theme-gain' : 'text-theme-loss'}>
                      {trade.trade_type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-theme-text-secondary tabular-nums">
                    {trade.size}
                  </td>
                  <td className="px-3 py-2 text-right text-theme-text-secondary tabular-nums">
                    {parseFloat(trade.entry_price).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right text-theme-text-secondary tabular-nums">
                    {parseFloat(trade.exit_price).toFixed(2)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-medium tabular-nums ${
                      pnl > 0 ? 'text-theme-gain' : pnl < 0 ? 'text-theme-loss' : 'text-theme-neutral'
                    }`}
                  >
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right text-theme-text-tertiary tabular-nums">
                    {parseFloat(trade.fees).toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onPointerDown={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm text-theme-text-secondary rounded-[var(--card-radius)]
            border border-theme-border hover:bg-theme-bg-tertiary transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onPointerDown={onConfirm}
          disabled={isLoading || newTrades.length === 0}
          className="px-4 py-2 text-sm font-medium rounded-[var(--card-radius)]
            bg-theme-accent text-theme-bg-primary hover:bg-theme-accent-bright transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Importing...' : `Import ${newTrades.length} trades`}
        </button>
      </div>
    </div>
  )
}
