# Design System — Shared Foundation

This defines what's consistent across ALL 6 themes. Each theme defines its own colors, typography, and layout personality on top of this foundation.

## Spacing Scale
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px
- 3xl: 48px
- Panel gaps: gap-2 to gap-3 (dense data layouts)
- Card padding: p-3 to p-4

## Border Radius
- Default: rounded-lg (8px)
- Themes may override for their own personality

## Data Display Rules
- All numbers use `tabular-nums` for column alignment (regardless of font)
- P&L colors: green for gains, red for losses — ALWAYS paired with +/- prefix (accessibility)
- Percentages: 1 decimal place (e.g., 67.3%)
- Currency: 2 decimal places, no symbol in tables (e.g., 1,234.56), $ symbol in summary cards
- Dates: relative when recent ("Today", "Yesterday"), absolute otherwise (Mar 28)
- Durations: human-readable (e.g., "10m 51s" not "00:10:51")

## Responsive Breakpoints
- Desktop: 1440px (primary)
- Tablet: 768px
- Mobile: 375px (v2 — desktop-first for v1)

## Accessibility
- WCAG AA contrast minimum on all text
- Focus rings on all interactive elements
- Color is never the only indicator (always paired with icon, prefix, or label)
- Screen reader labels on chart components

## Charting
- Library: TradingView Lightweight Charts (equity curve, P&L bars, baseline charts)
- Heatmap: Pure React/Tailwind div grid (no extra dependency)
- Fallback: @nivo/calendar if Tailwind heatmap proves insufficient
- All charts respect the active theme's color tokens
- `attributionLogo: false` (permitted under Apache 2.0)

## Interaction Patterns
- Drag-and-drop for CSV import (with click fallback)
- Sortable table columns (click header)
- Filter chips for trade log (contract, direction, outcome, date range)
- Theme switcher: accessible from settings or top nav
- Gross/Net P&L toggle: global, applies to all KPI displays

---

## Theme Roster

Each theme gets its own token file at `src/themes/[name].ts` defining: colors, typography, layout grid, and any unique visual effects.

| Theme | Source Mockup | Key Vibe |
|-------|--------------|----------|
| TradeLog | v1 | The original — clean, functional baseline |
| Data Canvas | v3 | Dark charcoal + teal, data-viz-forward, dense panels |
| The Trading Record | v5 | Newspaper editorial, structured columns |
| Notion + Apple | v7 | Clean minimalist, lots of whitespace |
| Signal | v10 | — |
| Split Cockpit | v11 | — |

**Layout reference:** Topo (v15) — borrow structure/grid, not the topography theme.

Typography, colors, and effects are defined per theme — NOT shared. This lets each theme feel genuinely different, not just a color swap.
