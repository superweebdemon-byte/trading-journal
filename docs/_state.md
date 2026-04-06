# Trading Journal — Project State

> Non-derivable context only. For anything derivable from code (active theme, pages, versions, components), Distro runs a boot scan.
>
> **Last updated:** 2026-04-06

---

## Decisions & Context

- **Theme override mismatch:** `registry.ts` has `defaultTheme = 'data-canvas'` but page-level code overrides to `split-cockpit` everywhere. Should be unified but hasn't been prioritized.
- **Hardcoded theme colors:** Some dashboard components still use old Midnight theme hex values instead of Split Cockpit tokens from the theme provider. Check before building any UI component — don't assume it's themed correctly.
- **Equity curve v3 implemented 2026-04-05** — Robinhood-style animated balance header, AreaSeries (single color per period), max drawdown overlay, 4 time ranges (1W/1M/3M/ALL), crosshair updates header. Replaced old BaselineSeries design.
- **Behavioral Signals removed 2026-04-05** — user correctly identified that tilt/revenge/overtrade detection from pure trade data is bogus (emotional factors need journaling). Win/loss streaks moved into Performance Edge. Component deleted.
- **Trade Breakdown card added 2026-04-05** — replaces Behavioral Signals slot. Shows per-setup breakdown (contract x size combos, e.g. "MNQ x 1", "MYM x 4") with win rate, avg P&L, trade count. Single unified concept — user trades different lots per asset.
- **Dashboard layout rebalanced 2026-04-05** — right column uses justify-evenly for balanced spacing. Flex ratio 6/4 (top/bottom rows). Performance Edge tightened padding to fit.
- **Calendar uniform months 2026-04-06** — always renders 6 weeks (42 days) so every month has identical grid height (510px). Overflow week logic removed. Replaced prior "trimmed" behavior.

## Pending / Not Built

- Supabase migration `002_settings_display_prefs.sql` — not yet run
- Mobile Safari: client-side JS doesn't execute over WSL2 LAN — shelved until Vercel deploy

## Infrastructure (2026-04-06 overhaul)

- **Git initialized** — `master` branch, 11 commits. All source committed.
- **Pre-commit hooks live** — husky + lint-staged, runs ESLint + tsc on every commit
- **Theme tokens cleaned** — 347 hardcoded hex values replaced with `var(--color-*)` tokens. 5 new tokens added (warning, warningBright, warningBg, borderSubtle, textQuaternary). Zero TODO color comments remain.
- **ESLint hex ban rule** — warns on hardcoded hex in JSX style attributes. Prevents regression.
- **Component templates** — 4 scaffolds in `templates/components/` (dashboard-card, data-table, modal, stat-row)
- **Test suite** — 144 tests (8 files) covering KPI engine, CSV parsing, dedup, risk metrics. All passing.
- **CI pipeline** — GitHub Actions: lint → typecheck → test → build on every push/PR.
- **BackstopJS** — visual regression configured, 5 pages × 3 viewports. Run `backstop:ref` to create baselines.
- **PostToolUse hook** — auto ESLint fix on every Edit/Write of .ts/.tsx files
- **Agent Teams** — experimental flag enabled in settings
- **Worktree config** — node_modules symlinked for parallel agent worktrees

## Installed CLI Tools (2026-04-06)

- knip 6.3.0 (dead code), backstopjs 6.3.25 (visual regression), madge 8.0.0 (circular deps), jscpd 4.0.8 (duplication), lost-pixel 3.22.0 (component regression), size-limit 12.0.1 (bundle budgets), trufflehog 3.94.2 (secrets), trivy 0.69.3 (security scanner)

## MCP Servers Added (2026-04-06)

- Serena (semantic code navigation), shadcn/ui (component context), SVGMaker (SVG generation)

## Known Issues / Tech Debt

- `defaultTheme` in registry.ts is 'data-canvas' but page-level code may still override to split-cockpit — hasn't been unified
- 7 remaining hardcoded hex values are all SVG fill/stroke attributes (CSS vars don't work there) — acceptable
- 13 ESLint unused-var warnings across source — pre-existing, not from this session
- Supabase migration `002_settings_display_prefs.sql` — not yet run

## Session 2026-04-06 (Evening) Changes

- **Calendar Topstep-style overhaul** — saturated green/maroon cell fills, 6-week grid, week numbering resets at month boundaries, monthly summary above grid, overflow days dimmed
- **Dashboard equity curve bg fix** — changed from bg-primary to bg-tertiary to match other cards
- **Nav renamed** — "Sessions" → "Trades" across all user-facing text
- **Visual polish** — KPI tile radius 10px, nowrap on Total Trades subtitle, Performance Edge sub-headers use Fira Code, dark scrollbars, Time/Day panel overflow-auto
- **Responsive mobile** — dashboard and calendar layouts for 375px, month summary 2-col grid on mobile, equity curve min-height, flex-basis auto for stacked rows
- **Next.js LAN config** — allowedDevOrigins with exact IPs for mobile testing
- **Skills created** — /visual-qa and /boot (in .claude/skills/)
- **Sandbox permission** — Bash(dangerouslyDisableSandbox:true) added to settings.local.json for agent access
