# Stage 03: Build

**Owner:** Mason
**Status:** In Progress

## Inputs
- PRD: `docs/prd.md`
- Final mockups: `stages/02-design/output/mockup-final.html` (dashboard), `mockup-calendar.html`, `mockup-sessions.html`, `mockup-settings.html`, `mockup-import-modal.html`
- Design system: `_config/design-system.md`
- Code conventions: `_config/conventions.md`
- Split Cockpit theme: `src/themes/split-cockpit.ts`
- Existing data layer: `src/lib/csv/`, `src/lib/kpi/`, `src/lib/supabase/`, `src/lib/types/`
- DB schema: `supabase/migrations/001_initial_schema.sql`

## What Already Exists
- Next.js 16.2 project initialized (TypeScript, Tailwind 4, Supabase, PapaParse, TradingView Lightweight Charts)
- Types: `src/lib/types/trade.ts` (Trade, Session, ImportBatch, UserSettings, TradeFilters)
- CSV pipeline: parser, Topstep adapter, dedup, contract specs
- KPI engine: core P&L, time-based, behavioral, risk modules
- Supabase: client/server setup, queries module
- Auth middleware + login page
- 6 theme files + theme provider
- Basic import page stub

## Build Tasks (in order)

### Task 1: Layout Shell + Nav + Theme (Foundation)
**Files:** `src/app/layout.tsx`, `src/app/globals.css`, `src/components/nav.tsx`, `src/components/footer.tsx`
- Wire Split Cockpit theme as default
- Build top nav matching mockup: TradeLog logo (green dot + text), Dashboard|Calendar|Sessions|Settings tabs with active state, right side: TOPSTEP X | trade count | date range | "+ Import CSV" button
- Footer: "TradeLog v1.0" left, "Last Import: [date] · Connected" right
- Page routing: `/` = Dashboard, `/calendar`, `/sessions`, `/settings`
- Import CSV button opens modal overlay (Task 2)

### Task 2: Import Modal
**Files:** `src/components/import/import-modal.tsx`, `src/components/import/csv-preview.tsx`, `src/components/import/import-history.tsx`
- Modal overlay with backdrop blur (matches mockup)
- Drag-drop zone with "browse files" link
- CSV preview table (3 rows + "N more rows")
- Import summary line: new trades, duplicates, sessions, date range
- "Import N Trades" CTA button
- Import history list (past successful imports)
- Wire to existing CSV parser + Topstep adapter + dedup logic
- Supabase insert with import_batch tracking

### Task 3: Dashboard Page (heaviest)
**Files:** `src/app/page.tsx`, `src/components/dashboard/kpi-ribbon.tsx`, `src/components/dashboard/equity-curve.tsx`, `src/components/dashboard/behavioral-signals.tsx`, `src/components/dashboard/pnl-time.tsx`, `src/components/dashboard/pnl-day.tsx`, `src/components/dashboard/monthly-pnl.tsx`
- 7-tile KPI ribbon: Net P&L, Win Rate, Profit Factor, Avg Win/Loss, Total Trades, Max Drawdown, Avg Duration
- Equity curve: Dual Tone style (teal above $0, red below $0) using TradingView Lightweight Charts baseline series. -$397 drawdown badge.
- Behavioral Signals panel: Pattern detected callout, 5 signal rows (revenge trades, overtrade days, win/loss streaks, tilt indicator), Focus This Week
- Bottom row (2 cols): P&L by Time of Day + P&L by Day of Week (stacked left), Monthly P&L card grid (right)
- All data from KPI engine via Supabase queries
- Must fit 1440x900 zero scroll

### Task 4: Sessions Page
**Files:** `src/app/sessions/page.tsx`, `src/components/sessions/filter-bar.tsx`, `src/components/sessions/month-summary.tsx`, `src/components/sessions/session-card.tsx`, `src/components/sessions/trade-row.tsx`
- Filter bar: All Dates, MYM, MNQ, Long, Short, Win, Loss, Breakeven (pill toggles)
- Monthly summary tabs with P&L + trade/session counts
- Session cards: date, P&L, WIN/LOSS badge, trades, win rate, duration, contracts
- Accordion expansion showing inline trade log (time, contract, side, entry, exit, P&L, duration)
- "Load more sessions (N remaining)" pagination
- Wire to Supabase queries with TradeFilters

### Task 5: Calendar Page
**Files:** `src/app/calendar/page.tsx`, `src/components/calendar/month-grid.tsx`, `src/components/calendar/day-cell.tsx`, `src/components/calendar/month-summary.tsx`
- Month navigation arrows + quick-jump pills (Nov '25 through Mar '26)
- 7-column grid (Mon-Sun), cells show: date, P&L, trade count, contract badges
- Color intensity scales with P&L magnitude (deeper teal = bigger win, red border = loss)
- Trailing dates from adjacent months dimmed
- Bottom summary strip: Month P&L, Trades, Win Rate, Best Day, Worst Day, Avg P&L/Day

### Task 6: Settings Page
**Files:** `src/app/settings/page.tsx`, `src/components/settings/account-card.tsx`, `src/components/settings/trading-prefs.tsx`, `src/components/settings/display-prefs.tsx`, `src/components/settings/data-management.tsx`
- Account card (email, password change)
- Trading Preferences: Default Contract dropdown, Timezone Display, Behavioral Thresholds (revenge window, overtrade multiplier), P&L Display toggle (net/gross)
- Display Preferences: Date Format, Currency Format, Relative Dates toggle, Compact Numbers toggle
- Data Management: Export CSV, Export PDF, Clear All Data (red destructive button)
- Auto-save pattern: "Changes saved" indicator with green dot, no save button
- Wire to user_settings table via Supabase

## Out of Scope
- AI pattern detection (v2)
- Universal CSV mapper (v2)
- Trade notes/journaling (v2)
- Mobile layout (v2)
- Multi-account (v2)

## Checkpoints
- [ ] Layout shell renders with nav, theme, routing
- [ ] CSV import works end-to-end with real Topstep X data
- [ ] Dashboard shows all panels with real KPI data
- [ ] Sessions page filters and expands correctly
- [ ] Calendar renders with color-coded days
- [ ] Settings auto-saves to Supabase
- [ ] Zero scroll on dashboard at 1440x900
