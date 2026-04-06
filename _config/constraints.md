# Constraints

## Platform
- Vercel free tier: 10s serverless function timeout, 100GB bandwidth/month
- Supabase free tier: 500MB database, 50K monthly active users, 1GB storage
- All CSV parsing must be client-side (Vercel timeout constraint)

## Performance
- CSV import: 85+ trades parsed and previewed within 3 seconds
- KPI dashboard: all metrics computed and rendered within 1 second for 1000 trades
- No unnecessary re-renders — memoize expensive computations

## Accessibility
- WCAG AA contrast minimum on all text
- P&L colors always paired with +/- sign prefix (never color-only)
- Keyboard navigable: trade log, filters, settings
- Focus states on all interactive elements

## Security
- Supabase Row Level Security on all tables
- No API keys in client-side code
- Auth required for all data access
