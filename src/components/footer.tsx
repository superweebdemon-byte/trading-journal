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
      style={{ borderColor: 'rgba(92,92,122,0.12)' }}
    >
      <span style={{ fontSize: '10px', color: '#6E7681' }}>
        TradeLog v1.0
      </span>
      <div className="flex items-center gap-3">
        <span className="tabular-nums" style={{ fontSize: '10px', color: '#6E7681' }}>
          Last Import: {lastImportDate || 'No imports yet'}
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: connected ? '#34D399' : '#EF4444' }}
          />
          <span style={{ fontSize: '10px', color: '#6E7681' }}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </footer>
  )
}
