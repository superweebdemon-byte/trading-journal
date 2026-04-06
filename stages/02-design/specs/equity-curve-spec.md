# Equity Curve — Design Spec (v2)

**Component:** `src/components/dashboard/equity-curve.tsx`
**Theme:** Split Cockpit
**Author:** Prism
**Date:** 2026-04-04

---

## 1. Library Recommendation

**Keep TradingView Lightweight Charts (v4.x).**

Rationale:
- Already in the dependency tree, zero added bundle cost
- Native financial chart behavior: crosshairs, price scales, time scales, zoom
- BaselineSeries is purpose-built for above/below-zero equity curves with dual-color fill
- Canvas-based rendering is buttery smooth even with thousands of data points
- The current implementation's problems are design decisions, not library limitations
- Recharts and Nivo are SVG-based and less performant for large time-series data; D3 would require building all chart primitives by hand for no real gain

The library stays. Everything else changes.

---

## 2. Visual Design Spec

### 2.1 Line

| Property | Value |
|----------|-------|
| Series type | `BaselineSeries` with `baseValue: { type: 'price', price: 0 }` |
| Line weight | `2` (up from 1.5 — more presence, still refined) |
| Top line color (above zero) | `#10B981` (theme `gain`) |
| Bottom line color (below zero) | `#EF4444` (theme `loss`) |
| Line style | Solid, no dashing |

### 2.2 Gradient Fills

The fills beneath the line are the single biggest visual upgrade. The current fills are too transparent and create no visual weight. The new fills use a stronger near-line opacity that fades to near-transparent at the zero line.

| Property | Value |
|----------|-------|
| `topFillColor1` (near line) | `rgba(16, 185, 129, 0.28)` |
| `topFillColor2` (near zero) | `rgba(16, 185, 129, 0.02)` |
| `bottomFillColor1` (near zero) | `rgba(239, 68, 68, 0.02)` |
| `bottomFillColor2` (near line) | `rgba(239, 68, 68, 0.22)` |

The gradient should visually "pool" near the line and dissolve toward the baseline. This creates a soft glow effect that reinforces gain/loss without overwhelming the chart area.

### 2.3 Background

| Property | Value |
|----------|-------|
| Card background | `#141820` (theme `bgCard`) |
| Chart area background | `transparent` (inherits card bg) |
| No inner border or inset shadow on chart area | |

### 2.4 Grid & Axes

| Property | Value |
|----------|-------|
| Horizontal grid lines | `rgba(255, 255, 255, 0.04)` — Solid, subtle |
| Vertical grid lines | **Hidden** (`visible: false`) |
| Right price scale border | `transparent` |
| Time scale border | `transparent` |
| Scale margins | `top: 0.1, bottom: 0.1` (slightly more breathing room than current 0.08) |
| Axis label font | `IBM Plex Mono`, 10px, weight 400 |
| Axis label color | `#4A5568` (theme `textTertiary`) |
| Price format | Custom: `$926`, `$1.4k`, `-$350` (no decimals, k-suffix at 1000+) |
| Time format | `timeVisible: false` — show dates only, no hours |

### 2.5 Zero Line

| Property | Value |
|----------|-------|
| Implementation | `series.createPriceLine()` |
| Color | `rgba(255, 255, 255, 0.06)` |
| Width | `1` |
| Style | `LineStyle.Dashed` (change from Solid — distinguishes it from grid lines) |
| Axis label | Hidden (`axisLabelVisible: false`) |

The dashed style at a slightly lower opacity than grid lines creates a subtle but findable reference point. It should be visible but never compete with the data line.

### 2.6 Crosshair

| Property | Value |
|----------|-------|
| Vertical line color | `rgba(45, 212, 191, 0.20)` (theme `accentMuted`, slightly stronger) |
| Vertical line width | `1` |
| Vertical line style | `LineStyle.Solid` |
| Vertical label | Hidden (`labelVisible: false`) |
| Horizontal line color | `rgba(45, 212, 191, 0.20)` |
| Horizontal line width | `1` |
| Horizontal line style | `LineStyle.Dashed` |
| Horizontal label | Hidden (`labelVisible: false`) |

The teal crosshair ties to the accent color without being distracting. Dashed horizontal differentiates it from the vertical, creating a professional TradingView feel. Both axis labels are hidden because the custom tooltip (below) handles data display.

### 2.7 Custom Tooltip (NEW)

A floating tooltip appears on hover, positioned near the crosshair. This is the biggest UX addition.

**Trigger:** `chart.subscribeCrosshairMove()` event

**Position:**
- Anchored 12px to the right of the crosshair vertical line
- Vertically centered on the data point
- Flips to left side if within 200px of the right edge
- Never overlaps the card header or exits the chart area

**Container:**
- Background: `rgba(10, 12, 16, 0.92)` (theme `bgSecondary` at 92% opacity)
- Border: `1px solid rgba(255, 255, 255, 0.08)`
- Border radius: `6px`
- Padding: `8px 12px`
- Backdrop filter: `blur(8px)` — frosted glass effect
- Box shadow: `0 4px 12px rgba(0, 0, 0, 0.4)`
- Min width: `140px`
- Pointer events: `none` (non-interactive overlay)

**Content layout (top to bottom):**

1. **Date** — IBM Plex Mono, 10px, weight 500, color `#8B95A8`
   - Format: `Mar 28, 2026`
2. **Cumulative P&L value** — Sora, 18px, weight 600, color `#10B981` (gain) or `#EF4444` (loss)
   - Format: `+$1,426` or `-$350`
   - 4px gap below date
3. **Day P&L** (if available) — IBM Plex Mono, 10px, weight 400, color `#34D399` (gainBright) or `#F87171` (lossBright)
   - Format: `Day: +$185`
   - 2px gap below cumulative value
   - Only show if the data model supports per-day P&L extraction

**Fade animation:**
- Enter: opacity 0 to 1, 120ms ease-out
- Exit: opacity 1 to 0, 80ms ease-out
- Use CSS transition on the tooltip wrapper div

### 2.8 Last Value Marker (NEW)

A persistent marker at the rightmost data point showing the current cumulative P&L.

| Property | Value |
|----------|-------|
| Visibility | Always visible (not just on hover) |
| Implementation | Lightweight Charts `lastValueVisible: true` on the series |
| Label background | `#10B981` (gain) or `#EF4444` (loss) — determined by current value sign |
| Label text color | `#FFFFFF` |
| Label font | IBM Plex Mono, 10px, weight 500 |
| Price line | Hidden (`priceLineVisible: false`) — the marker label alone is sufficient |

This gives an at-a-glance current reading without hovering.

### 2.9 Max Drawdown Annotation (NEW)

Visual callout of the worst drawdown trough. Uses the `maxDrawdownDollars` prop already passed to the component.

**Implementation:** A small marker at the trough point of the max drawdown.

| Property | Value |
|----------|-------|
| Marker type | `series.setMarkers()` — single downward triangle |
| Marker position | The data point where cumulative P&L was furthest below its preceding peak |
| Marker color | `#EF4444` (theme `loss`) |
| Marker shape | `arrowDown` |
| Marker size | `1` (small, unobtrusive) |
| Marker text | Empty string (no text label on the marker itself) |

On hover (when crosshair is within 2 data points of the marker), the tooltip appends an extra line:

- **Drawdown label** — IBM Plex Mono, 10px, weight 500, color `#EF4444`
- Format: `Max DD: -$1,388`

This keeps the chart clean while making the drawdown discoverable.

---

## 3. Layout & Sizing

### 3.1 Grid Position

| Property | Value |
|----------|-------|
| Grid span | `col-span-1 lg:col-span-8` (unchanged — 8/12 on desktop) |
| Height behavior | `flex-1` within its parent flex column, with `min-h-0` for proper flex shrink |
| Self alignment | `self-stretch` |

### 3.2 Card Structure

```
[Card wrapper]
  [Header row — 18px horizontal padding, 14px top padding, 0 bottom padding]
    [Left: title + subtitle]
    [Right: time range toggle]
  [Chart area — flex-1, min-h-0]
    [Lightweight Charts canvas — fills container]
    [Tooltip overlay div — absolute positioned within chart area]
```

### 3.3 Specific Dimensions

| Element | Value |
|---------|-------|
| Card border | `1px solid rgba(255, 255, 255, 0.06)` |
| Card border-radius | `10px` (theme `cardRadius`) |
| Card overflow | `hidden` |
| Header padding | `px-[18px] pt-[14px] pb-0` |
| Chart area padding | `px-[12px] pb-[10px] pt-[4px]` |
| Chart area position | `relative` (for tooltip absolute positioning) |
| Minimum chart height | `200px` (fallback for extremely small viewports) |

---

## 4. Interaction Design

### 4.1 Hover Behavior

1. On mouse enter into chart area: crosshair appears immediately (native lightweight-charts behavior)
2. Custom tooltip fades in (120ms) showing date, cumulative P&L, and day P&L
3. Tooltip tracks the crosshair horizontally, snapping to data points (not free-floating)
4. On mouse leave: tooltip fades out (80ms), crosshair disappears

### 4.2 Time Range Controls

**Current toggles (keep, expand):**

| Range | Label | Behavior |
|-------|-------|----------|
| 1W | `1W` | Last 7 calendar days of data |
| 1M | `1M` | Last 30 calendar days of data |
| 3M | `3M` | Last 90 calendar days of data |
| ALL | `ALL` | Full dataset |

Adding `1W` and `3M` gives finer control. Most futures traders care about recent performance.

**Toggle styling (unchanged from siblings):**

| Property | Value |
|----------|-------|
| Container bg | `rgba(255, 255, 255, 0.03)` |
| Container radius | `6px` |
| Container padding | `2px` |
| Button font | IBM Plex Mono, 10px, weight 500 |
| Button padding | `3px 10px` |
| Button radius | `4px` |
| Active bg | `rgba(45, 212, 191, 0.12)` |
| Active text | `#E8ECF2` |
| Inactive text | `#4A5568` |
| Hover (inactive) text | `#8B95A8` |
| Transition | `all 0.15s ease` |

**On range change:**
- `series.setData()` with filtered dataset
- `chart.timeScale().fitContent()` to refit
- No animation/transition on the chart itself (instant data swap is cleaner)

### 4.3 Scroll & Zoom

| Property | Value |
|----------|-------|
| `handleScroll` | `false` |
| `handleScale` | `false` |

Keep these disabled. The chart is a dashboard summary, not an interactive trading chart. Scroll/zoom would conflict with page scroll and confuse the UX. The time range toggles provide all the temporal navigation needed.

### 4.4 Resize

- `ResizeObserver` on the chart container (keep current implementation)
- On resize: `chart.applyOptions({ width, height })` with container dimensions
- Debounce not needed — lightweight-charts handles this efficiently

---

## 5. What to Remove

| Item | Reason |
|------|--------|
| Solid zero-line style | Replacing with dashed for differentiation from grid lines |
| `lastValueVisible: false` | Replacing with `true` — the current endpoint label is valuable |
| `lineWidth: 1.5` | Bumping to `2` for better visual weight |
| Undifferentiated crosshair lines | Horizontal now dashed, vertical remains solid |
| Missing tooltip | Was the biggest gap — now added |
| Only 2 time ranges (1M/ALL) | Expanding to 4 (1W/1M/3M/ALL) |

---

## 6. What to Add

| Addition | Purpose |
|----------|---------|
| **Custom hover tooltip** | Date, cumulative P&L, day P&L — the chart becomes informative on interaction |
| **Last value marker** | Persistent right-edge label showing current equity — instant readability |
| **Max drawdown marker** | Small triangle at the trough — makes the worst drawdown discoverable without cluttering |
| **1W and 3M time ranges** | Finer temporal control for recent performance analysis |
| **Dashed zero line** | Visual distinction from grid lines |
| **Stronger gradient fills** | More visual weight beneath the line — the curve "owns" its space |
| **Frosted glass tooltip** | `backdrop-filter: blur(8px)` on tooltip — premium feel matching the cockpit theme |
| **Dashed horizontal crosshair** | Differentiates axes, matches TradingView conventions |

---

## 7. What NOT to Add

These were considered and intentionally excluded to keep the chart clean:

| Excluded | Reason |
|----------|--------|
| Volume bars | This is an equity curve, not a price chart. Trade count per day could be useful but belongs in a separate component |
| Moving averages / trend lines | Adds complexity without clear value for a personal journal — the trader knows their own trend |
| Clickable data points | Navigating to individual trades from the equity curve adds interaction complexity; the Sessions page handles this |
| Animated line drawing on load | Looks flashy but delays time-to-insight. The data should appear immediately |
| Pan/zoom gestures | Conflicts with page scroll, confuses the dashboard context. Time range toggles are sufficient |
| Multiple series (gross vs net overlay) | The global pnlMode toggle already controls this — overlaying both would be noisy |

---

## 8. Implementation Notes for Mason

1. **Tooltip positioning logic** — Use `chart.subscribeCrosshairMove(param)` callback. The `param.point` gives pixel coordinates. Create an absolutely-positioned div inside the chart container wrapper (not inside the canvas). Track `param.seriesData.get(series)` for the value.

2. **Day P&L in tooltip** — The component receives `trades: Trade[]`. To show day P&L, group trades by `trade_day`, sum each day's P&L, and look up the hovered day. This is a lightweight computation that can be memoized with `useMemo`.

3. **Max drawdown point** — The `findDrawdownPoint()` function already exists in the current component. Use it to place a single marker via `series.setMarkers()`.

4. **Last value color** — Check the sign of the final data point's value to determine whether the marker background should be `gain` or `loss` color.

5. **Tooltip flip logic** — Compare `param.point.x` against `chartContainerRef.current.clientWidth - 200`. If within 200px of the right edge, position tooltip to the left of the crosshair instead.

6. **Keep the same props interface** — `trades: Trade[]`, `pnlMode: 'net' | 'gross'`, `maxDrawdownDollars: number`. No new props needed.

7. **Time range state** — Expand from `'1M' | 'ALL'` to `'1W' | '1M' | '3M' | 'ALL'`.
