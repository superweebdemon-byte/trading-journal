# Trading Journal

Futures day trading journal — CSV import (Topstep X), KPI dashboard, behavioral analysis.

## Stack
Next.js 15 + Supabase (Postgres) + Vercel + Tailwind CSS. All free tier.

## Design
"Midnight" theme — true black, neon magenta accent, data-visualization-forward. Mockup: `stages/02-design/output/mockup-midnight.html`

## Docs
- PRD: `docs/prd.md`
- Design system: `_config/design-system.md`
- Conventions: `_config/conventions.md`

## Key Decisions
- CSV parsing: client-side with Papa Parse (Vercel 10s timeout constraint)
- KPIs: computed on the fly from raw trades, no pre-computation
- Timestamps: stored as UTC (timestamptz), displayed in user's local time
- Dedup: composite key on Topstep trade Id field
- Sessions: grouped by TradeDay field from CSV
