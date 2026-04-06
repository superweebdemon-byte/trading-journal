interface FooterProps {
  lastImportDate?: string
  connected?: boolean
}

export function Footer({
  lastImportDate,
  connected = true,
}: FooterProps) {
  return (
    <footer
      className="flex items-center justify-between px-5 py-1.5 border-t"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
        TradeLog v1.0
      </span>
      <div className="flex items-center gap-3">
        <span className="tabular-nums" style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
          Last Import: {lastImportDate || 'No imports yet'}
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: connected ? 'var(--color-gain)' : 'var(--color-loss)' }}
          />
          <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </footer>
  )
}
