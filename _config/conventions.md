# Code Conventions

## Language & Framework
- TypeScript strict mode
- Next.js 15 App Router
- React Server Components where possible, client components only when needed (interactivity, hooks)
- Tailwind CSS for all styling — no CSS modules, no styled-components

## Naming
- Files: kebab-case (e.g., `trade-log.tsx`, `kpi-dashboard.tsx`)
- Components: PascalCase (e.g., `TradeLog`, `KpiDashboard`)
- Functions/variables: camelCase
- Database columns: snake_case
- Types/interfaces: PascalCase, no `I` prefix

## File Structure
- `src/app/` — Next.js routes
- `src/components/` — React components
- `src/lib/` — Utilities, helpers, types
- `src/lib/supabase/` — Supabase client and queries
- `src/lib/csv/` — CSV parsing and format adapters

## Data
- All timestamps: UTC in database (timestamptz), local time in UI
- Prices: numeric/decimal type, never float
- Use date-fns for date formatting and manipulation
- Papa Parse for CSV parsing (client-side only)

## Quality
- No `any` types
- No console.log in committed code
- Error boundaries on route segments
- Loading states on async components
