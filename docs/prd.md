# PRD: Futures Trading Journal

**Date:** 2026-03-29
**Author:** Distro
**Status:** Approved

---

## Problem

Futures day traders generate trade data daily but have no easy way to analyze patterns in their performance. Broker exports (CSV) sit unused. Without structured KPIs and pattern visibility, traders repeat the same mistakes — overtrading, revenge trading, trading at bad times — without realizing it.

## Goal

A personal web app where you drag-drop your Topstep X CSV export and instantly see a KPI dashboard that reveals your trading patterns — strengths, weaknesses, and blind spots.

## Target User

The user: a futures day trader on Topstep X, trading Micro Dow (MYM) and Micro Nasdaq (MNQ). Wants data-driven insight into trading performance. Secondary user: a friend on a different broker platform (v2).

## Core Features (v1)

1. **CSV Import (Topstep X)** — Drag-and-drop CSV upload. Auto-detects Topstep X format, parses all 13 columns, shows preview before committing. Handles timezone offsets (CST/CDT), multi-lot fill duplicates, and 9-decimal precision. Deduplicates on re-import (composite key: Id field). Tracks import batches for undo/re-import.

2. **Manual Trade Entry** — Form to add individual trades when CSV isn't available. Same fields as the CSV: contract, entry/exit time, entry/exit price, size, type (long/short), fees.

3. **Trade Log** — Sortable, filterable table of all trades. Filter by date range, contract, direction (long/short), outcome (win/loss/breakeven). Grouped by trading session (TradeDay).

4. **KPI Dashboard** — Four category panels computed on the fly from raw trades:

   **Core P&L:**
   - Win rate (%)
   - Profit factor (gross wins / gross losses)
   - Average win / average loss
   - Net P&L (total, daily, weekly, monthly)
   - Total trades
   - Largest win / largest loss
   - Average trade duration

   **Time-Based:**
   - Best/worst day of week
   - Best/worst time of day (30-min buckets)
   - Performance by session (pre-market, NY open, midday, afternoon)
   - Monthly P&L trend

   **Behavioral:**
   - Revenge trades (loss followed by entry within 2 minutes)
   - Overtrading detection (trades per day exceeding rolling average by 2x)
   - Max consecutive losses / wins
   - Tilt indicator (drawdown acceleration after consecutive losses)

   **Risk Management:**
   - Max drawdown (peak-to-trough)
   - Average risk per trade (estimated from loss distribution)
   - Risk-reward ratio (avg win / avg loss)
   - Position sizing patterns (size vs. outcome correlation)

5. **Session Grouping** — Trades automatically grouped by TradeDay. Session-level summary cards showing net P&L, trade count, win rate, duration, and contract mix per day.

## Out of Scope (v1)

- AI pattern detection and automated insights (v2)
- Universal CSV import / column mapper (v2 — for friend on different broker)
- Trade journaling / notes per session (v2)
- Account balance tracking / equity curve (v2)
- Mobile-optimized layout (v2 — desktop-first)
- Multi-account support (v2)
- Social / sharing features (v2)

## Constraints

- **Stack:** Next.js 15 + Supabase (Postgres) + Vercel — all free tier
- **Styling:** Tailwind CSS
- **CSV Parsing:** Papa Parse, client-side (Vercel 10s function timeout constraint)
- **Platform:** Web, desktop-first
- **Data source:** Topstep X CSV export (13 columns: Id, ContractName, EnteredAt, ExitedAt, EntryPrice, ExitPrice, Fees, PnL, Size, Type, TradeDay, TradeDuration, Commissions)
- **Auth:** Supabase Auth (email/password) — simple, single user for now but don't hardcode single-user assumptions
- **Timestamps:** Store as UTC (timestamptz), display in user's local time. Use date-fns for parsing/formatting.
- **Schema:** Store raw CSV row alongside normalized columns. Include import_batch_id on every trade. Session concept from day one (group by TradeDay).

## Topstep X CSV Format Reference

```
Id,ContractName,EnteredAt,ExitedAt,EntryPrice,ExitPrice,Fees,PnL,Size,Type,TradeDay,TradeDuration,Commissions
1649735311,MYMZ5,11/18/2025 09:45:25 -05:00,11/18/2025 09:56:16 -05:00,46356.000000000,46156.000000000,2.96000,400.000000000,4,Short,11/18/2025 00:00:00 -06:00,00:10:51.2472910,
```

**Known quirks:**
- Timestamps include UTC offset that shifts with DST (CST -06:00 → CDT -05:00)
- TradeDay offset (-06:00) differs from trade time offset (-05:00) — exchange vs. local time
- Commissions column is always empty — Fees covers it
- Multi-lot fills may appear as duplicate rows with different IDs but same timestamps and prices
- Prices have 9 decimal places (store as numeric/decimal, not float)

## Success Criteria

- [ ] Drag-drop a Topstep X CSV and see all trades populated correctly within 3 seconds
- [ ] KPI dashboard shows all four categories with accurate calculations
- [ ] Trade log is filterable and grouped by session
- [ ] Re-importing same CSV doesn't create duplicates
- [ ] Works on Vercel free tier without hitting limits
- [ ] User says "this is useful" after importing their real data

## Resolved Decisions

- **Behavioral KPI thresholds:** Configurable in v1 (user settings). Default values: revenge trade = entry within 2 min of a loss, overtrade = 2x rolling daily average.
- **Contract name parsing:** Decode expiry codes into readable labels (MNQZ5 → "MNQ Dec 2025", MYMH6 → "MYM Mar 2026").
- **Theme:** Light/dark toggle, dark mode default.
- **Design direction:** v3b "Midnight" — true black (#000000), neon magenta (#E040FB) accent, Space Grotesk + Fira Code typography, data-visualization-forward layout (equity curve, heatmap, P&L distribution, tiled panels), max density. Mockup at `/home/andyn/projects/trading-journal-mockup-v3b.html`.
- **Design system:** Neon green (#00E676) for gains, neon red (#FF1744) for losses. Gaussian blur glow on equity curve. Oscilloscope grid texture. 6px border radius, tight gaps. "Quant's personal weapon" energy.

## Open Questions

(None — all resolved.)

---

*Generated by Distro. Approved by user before build begins.*
