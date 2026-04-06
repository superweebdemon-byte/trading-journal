# Trading Journal — Project State

> Non-derivable context only. For anything derivable from code (active theme, pages, versions, components), Distro runs a boot scan.
>
> **Last updated:** 2026-04-05

---

## Decisions & Context

- **Theme override mismatch:** `registry.ts` has `defaultTheme = 'data-canvas'` but page-level code overrides to `split-cockpit` everywhere. Should be unified but hasn't been prioritized.
- **Hardcoded theme colors:** Some dashboard components still use old Midnight theme hex values instead of Split Cockpit tokens from the theme provider. Check before building any UI component — don't assume it's themed correctly.
- **Equity curve v3 implemented 2026-04-05** — Robinhood-style animated balance header, AreaSeries (single color per period), max drawdown overlay, 4 time ranges (1W/1M/3M/ALL), crosshair updates header. Replaced old BaselineSeries design.
- **Behavioral Signals removed 2026-04-05** — user correctly identified that tilt/revenge/overtrade detection from pure trade data is bogus (emotional factors need journaling). Win/loss streaks moved into Performance Edge. Component deleted.
- **Trade Breakdown card added 2026-04-05** — replaces Behavioral Signals slot. Shows per-setup breakdown (contract x size combos, e.g. "MNQ x 1", "MYM x 4") with win rate, avg P&L, trade count. Single unified concept — user trades different lots per asset.
- **Dashboard layout rebalanced 2026-04-05** — right column uses justify-evenly for balanced spacing. Flex ratio 6/4 (top/bottom rows). Performance Edge tightened padding to fit.
- **Calendar trimmed 2026-04-05** — removed forced 6-row padding, only shows weeks containing current-month days. Week 1/2/etc labels like Topstep X.

## Pending / Not Built

- Add Trade modal (manual entry form) — designed but not built
- Empty state (no trades imported yet) — designed but not built
- Supabase migration `002_settings_display_prefs.sql` — not yet run

## Known Issues / Tech Debt

- No git repo initialized
- Theme colors hardcoded in some components instead of reading from theme provider
- `defaultTheme` in registry.ts doesn't match what pages actually use
