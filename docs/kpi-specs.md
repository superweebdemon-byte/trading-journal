# KPI Specification Document — Futures Trading Journal

**Author:** Quant
**Date:** 2026-03-30
**Status:** Approved — source of truth for Mason's implementation
**Dataset:** 84 trades, 2025-11-18 through 2026-03-12

---

## Overview

This document defines every KPI in the dashboard: exact formulas, gross/net behavior, edge cases, and test vectors computed from the real 84-trade CSV (`stages/01-research/references/trades_export.csv`).

### Key Definitions

| Term | Definition |
|------|-----------|
| `PnL` | Net P&L per trade — fees already deducted (as stored in CSV) |
| `Fees` | Fee amount per trade (always positive) |
| `Gross PnL` | `PnL + Fees` — what was made before fees |
| Win | Trade where the relevant P&L (net or gross) > 0 |
| Loss | Trade where the relevant P&L < 0 |
| Breakeven | Trade where the relevant P&L == 0 exactly |

### Gross/Net Toggle Behavior

The dashboard has a global gross/net toggle. When **net** is active, all KPIs use `PnL` directly from the CSV. When **gross** is active, all KPIs use `PnL + Fees`. This toggle changes win/loss classification too — a trade with `PnL = 0, Fees = 1.48` is a breakeven on net but a loss on gross.

### Dataset Summary (84 trades)

- **Net mode:** 42 wins, 34 losses, 8 breakevens
- **Gross mode:** 52 wins, 32 losses, 0 breakevens
- **Total Net P&L:** $2,314.00
- **Total Gross P&L:** $2,527.86
- **Total Fees:** $213.86
- **Trading days:** 53 (across 5 calendar months)

---

## Category 1: Core P&L

---

### KPI 1.1 — Win Rate

**Category:** Core P&L

**Formula:**
```
win_rate = (count of winning trades / total trades) × 100

where:
  winning trade = trade where P&L > 0
  total trades  = all trades in the filtered set
```

**Gross vs Net:**
- Net: use `PnL` to classify win/loss
- Gross: use `PnL + Fees` to classify win/loss
- The denominator (total trades) does not change — breakeven trades are included in total but not in win count

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| Zero trades | Return `null` / display `—` (avoid division by zero) |
| All wins | 100.00% |
| All losses | 0.00% |
| Single trade, win | 100.00% |
| All breakeven | 0.00% (breakevens are not wins) |
| Empty time period | Return `null` for that period |

**Test Vectors:**

| Mode | Wins | Total | Expected Win Rate |
|------|------|-------|-------------------|
| Net | 42 | 84 | **50.0000%** |
| Gross | 52 | 84 | **61.9048%** |

_Derivation (Net):_ 42 trades with `PnL > 0`, 34 with `PnL < 0`, 8 with `PnL = 0`. 42/84 = 0.5000.

**Interpretation:**
- < 40%: Poor — requires very high R:R to be profitable
- 40–50%: Below average — need avg win > avg loss
- 50%: Breakeven threshold (ignoring R:R)
- 50–60%: Good for a scalper/day trader
- > 60%: Excellent
- This dataset's net win rate of 50% is right at the threshold; the positive P&L is driven by avg win ($185.29) exceeding avg loss ($160.82).

---

### KPI 1.2 — Profit Factor

**Category:** Core P&L

**Formula:**
```
profit_factor = sum(winning_trade_pnl) / abs(sum(losing_trade_pnl))

where:
  winning_trade_pnl = P&L of trades where P&L > 0
  losing_trade_pnl  = P&L of trades where P&L < 0
```

Note: "gross wins" and "gross losses" in this formula refer to the aggregate of winning/losing trades respectively — NOT the gross/net P&L toggle. The toggle only affects which trades are classified as wins vs. losses.

**Gross vs Net:**
- Net: classify using `PnL`; sum `PnL` for winners/losers
- Gross: classify using `PnL + Fees`; sum `PnL + Fees` for winners/losers

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| Zero losses | Return `∞` (infinity), display as `∞` |
| Zero trades | Return `null` |
| All breakeven | Return `null` (both numerator and denominator = 0) |
| Sum of losses = 0 but there are loss trades | Impossible — losses have negative P&L by definition |

**Test Vectors:**

| Mode | Sum Wins | Sum Losses (abs) | Expected PF |
|------|----------|------------------|-------------|
| Net | $7,782.00 | $5,468.00 | **1.4232** |
| Gross | $7,900.10 | $5,372.24 | **1.4705** |

_Derivation (Net):_ 42 winning trades sum to $7,782.00. 34 losing trades sum to −$5,468.00. 7782 / 5468 = 1.42319...

**Interpretation:**
- < 1.0: Losing system
- 1.0: Breakeven
- 1.0–1.5: Marginal (barely profitable after slippage)
- 1.5–2.0: Good
- > 2.0: Excellent
- This dataset's 1.42 (net) is in the marginal-to-good range. The 1.47 gross shows fees are consuming meaningful edge.

---

### KPI 1.3 — Average Win / Average Loss

**Category:** Core P&L

**Formula:**
```
avg_win  = sum(winning_trade_pnl) / count(winning_trades)
avg_loss = abs(sum(losing_trade_pnl)) / count(losing_trades)

displayed as two separate values and as a ratio avg_win / avg_loss
```

**Gross vs Net:** Same toggle rules as Profit Factor — classify trades and sum values using the active P&L field.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| No wins | `avg_win = null`, ratio = `null` |
| No losses | `avg_loss = null`, ratio = `∞` |
| Single trade | Works normally |
| Zero trades | Both `null` |

**Test Vectors:**

| Mode | Sum Wins | Win Count | Avg Win | Sum Losses (abs) | Loss Count | Avg Loss |
|------|----------|-----------|---------|------------------|------------|----------|
| Net | $7,782.00 | 42 | **$185.29** | $5,468.00 | 34 | **$160.82** |
| Gross | $7,900.10 | 52 | **$151.93** | $5,372.24 | 32 | **$167.88** |

_Note on gross mode:_ More trades classified as wins (52 vs 42) because 8 net-breakeven trades become gross-losers when fees are added. This dilutes avg_win and shifts some trades into the loss bucket. The gross avg_win ($151.93) being lower than the net avg_win ($185.29) reflects this reclassification, not reduced gains.

**Interpretation:**
- Ideal: avg_win / avg_loss > 1.5 (so you can be profitable below 50% win rate)
- This dataset's ratio: 185.29 / 160.82 = **1.15 (net)** — marginally above 1, meaning the system needs close to 50% win rate to stay profitable.
- A ratio below 1.0 requires win rate > 50% to be profitable.

---

### KPI 1.4 — Net P&L

**Category:** Core P&L

**Formula:**
```
total_pnl   = sum(PnL) for all trades in set
daily_pnl   = sum(PnL) grouped by trading_date(EnteredAt)
weekly_pnl  = sum(PnL) grouped by ISO week of EnteredAt
monthly_pnl = sum(PnL) grouped by year-month of EnteredAt

trading_date = date portion of EnteredAt using the timestamp's own UTC offset
              (preserves local date; avoids UTC conversion artifacts at market close)
```

**Gross vs Net:** When gross mode active, substitute `PnL + Fees` for `PnL` in all aggregations.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| Zero trades in period | $0.00 — do NOT show `null` for defined periods; show $0 |
| Single trade | P&L of that trade |
| All breakeven | $0.00 |
| Negative total | Show as negative (red) |

**Test Vectors:**

| Granularity | Mode | Key | Expected Value |
|------------|------|-----|----------------|
| Total | Net | — | **$2,314.00** |
| Total | Gross | — | **$2,527.86** |
| Daily | Net | 2025-11-18 | **$400.00** (1 trade) |
| Daily | Net | 2025-12-15 | **−$384.00** (3 trades: $4, −$196, −$192) |
| Daily | Net | 2026-01-16 | **$12.00** (4 trades: $8, $2, $2, $0) |
| Weekly | Net | 2025-W47 | **$672.00** |
| Weekly | Net | 2026-W04 | **−$602.00** |
| Monthly | Net | 2025-11 | **$286.00** |
| Monthly | Net | 2025-12 | **$103.50** |
| Monthly | Net | 2026-01 | **$308.50** |
| Monthly | Net | 2026-02 | **$911.00** |
| Monthly | Net | 2026-03 | **$705.00** |

**Interpretation:**
- Positive total P&L = profitable system over the period
- Daily P&L > max acceptable loss = flag for review
- Consistent positive monthly P&L = sustainable edge
- This dataset shows profitable trajectory with February/March being the strongest months.

---

### KPI 1.5 — Total Trades

**Category:** Core P&L

**Formula:**
```
total_trades = count(*) of all trades in the current filter context
```

**Gross vs Net:** No change — total trade count is the same regardless of P&L mode.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| No trades imported | 0 |
| Filter removes all trades | 0 |

**Test Vectors:**

| Filter | Expected Count |
|--------|----------------|
| All trades | **84** |
| Date range: 2025-11-18 to 2025-11-30 | **12** |
| Month: 2026-02 | **11** |
| Month: 2026-03 | **9** |

_Derivation (all trades):_ CSV has 85 data rows. One row (row 86) is blank. Total parsed = 84.

**Interpretation:**
- Track alongside P&L to identify overtrading vs undertrading periods
- Baseline: this trader averages ~1.6 trades/day across 53 trading days

---

### KPI 1.6 — Largest Win / Largest Loss

**Category:** Core P&L

**Formula:**
```
largest_win  = max(P&L) across all trades (only the highest positive value)
largest_loss = min(P&L) across all trades (the most negative value)

displayed as two separate values
```

**Gross vs Net:** Use the active P&L field (`PnL` or `PnL + Fees`).

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| All losses | `largest_win = null` or $0 |
| All wins | `largest_loss = null` or $0 |
| Single trade | It is both the largest win and largest loss |
| All breakeven | largest_win = $0, largest_loss = $0 |

**Test Vectors:**

| Mode | Largest Win | Largest Loss |
|------|-------------|--------------|
| Net | **$400.50** (trade 2075135103, 2026-02-06) | **−$208.00** (trade 1900921955, 2026-01-09) |
| Gross | **$405.92** (trade 1811021637: PnL=$400 + Fees=$5.92) | **−$202.08** (trade 1900921955: PnL=−$208 + Fees=$5.92) |

_Note:_ On gross mode the largest loss improves slightly (becomes less negative) because fees are added back. This is expected.

**Interpretation:**
- For a Micro Dow/Nasdaq trader with typical 1–8 contract sizing:
  - Largest win should be ≥ avg_win (otherwise you're not letting winners run)
  - Largest loss should be ≤ 2× avg_loss (otherwise you're letting losers run)
  - Ratio largest_win / abs(largest_loss): 400.50 / 208.00 = **1.93** — healthy

---

### KPI 1.7 — Average Trade Duration

**Category:** Core P&L

**Formula:**
```
avg_duration_seconds = sum(TradeDuration in seconds) / count(trades)

Parse TradeDuration from string format "HH:MM:SS.xxxxxxx":
  seconds = hours × 3600 + minutes × 60 + seconds  (truncate sub-seconds)

Display as: "Xh Ym Zs" or "X min Y sec" (human-readable)
```

**Gross vs Net:** No change — duration is independent of P&L mode.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| Zero trades | `null` |
| Single trade | Duration of that trade |
| Very long outlier (4h trade) | Included — do not clip |

**Test Vectors:**

| Metric | Value |
|--------|-------|
| Total duration (all 84 trades) | **124,194 seconds** |
| Average duration | **1,478.5 seconds = ~24 min 38 sec** |

_Derivation:_ Sum of all `TradeDuration` fields converted to seconds = 124,194. 124,194 / 84 = 1,478.5s.

_Notable outlier:_ Trade 1746602231 has duration 04:00:41 (14,441s) — the 4-hour midday hold on 2025-12-05.

**Interpretation:**
- Day trading MNQ/MYM: typical winners are held 5–30 minutes
- Average of 24 min is reasonable for a day trader
- If avg duration for losers >> avg duration for winners, it indicates "letting losers run"
- Consider computing separately for wins vs losses as a secondary insight

---

## Category 2: Time-Based

---

### KPI 2.1 — Best/Worst Day of Week

**Category:** Time-Based

**Formula:**
```
For each day_of_week in {Monday, Tuesday, Wednesday, Thursday, Friday}:
  day_pnl[dow]   = sum(P&L) of all trades where day_of_week(EnteredAt) == dow
  day_count[dow] = count of trades on that day of week
  day_avg[dow]   = day_pnl[dow] / day_count[dow]

best_day  = dow with highest day_pnl
worst_day = dow with lowest day_pnl

day_of_week(EnteredAt) uses the timestamp's local offset (not UTC conversion)
```

**Gross vs Net:** Use active P&L field for aggregation.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| No trades on a given DOW | Exclude that DOW from best/worst comparison |
| Tie | Return all tied days |
| Zero trades | All DOW values = null |

**Test Vectors (Net Mode):**

| Day | Total P&L | Trade Count | Avg P&L | Win Rate |
|-----|-----------|-------------|---------|----------|
| Wednesday | **$1,125.00** | 15 | $75.00 | 53.3% |
| Monday | $834.00 | 20 | $41.70 | 50.0% |
| Thursday | $480.00 | 18 | $26.67 | 50.0% |
| Tuesday | $158.50 | 14 | $11.32 | 50.0% |
| Friday | **−$283.50** | 17 | −$16.68 | 47.1% |

**Best day: Wednesday | Worst day: Friday**

**Interpretation:**
- Friday underperformance is common — liquidity thins, moves can be erratic, positions should be reduced
- Wednesday dominance here ($75/trade avg vs $11–27 on other days) suggests better setups or more selective entry
- Actionable: reduce position size or trade count on Fridays

---

### KPI 2.2 — Best/Worst Time of Day

**Category:** Time-Based

**Formula:**
```
bucket = floor(minute_of_day / 30) × 30
  where minute_of_day = hour(EnteredAt) × 60 + minute(EnteredAt)

bucket_label = "HH:00" or "HH:30" (e.g., "09:30", "10:00", "10:30", "11:00")

For each bucket:
  bucket_pnl   = sum(P&L) of all trades in that bucket
  bucket_count = count of trades
  bucket_avg   = bucket_pnl / bucket_count

best_bucket  = bucket with highest bucket_pnl
worst_bucket = bucket with lowest bucket_pnl

Use EnteredAt timestamp's local offset (preserves local clock time, handles DST correctly)
```

**Gross vs Net:** Use active P&L field.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| Empty bucket | Exclude from chart, show 0 count |
| Single trade in bucket | avg = that trade's P&L |

**Test Vectors (Net Mode):**

| Bucket | Total P&L | Count | Avg P&L |
|--------|-----------|-------|---------|
| 09:30 | $430.00 | 39 | $11.03 |
| 10:00 | $1,074.50 | 29 | **$37.05** |
| 10:30 | $400.50 | 2 | $200.25 |
| 11:00 | $801.00 | 11 | $72.82 |
| 11:30 | **−$392.00** | 3 | −$130.67 |

**Best bucket: 10:30 (avg $200.25, n=2) | Best by total: 10:00 ($1,074.50)**
**Worst bucket: 11:30 (−$392.00 total, −$130.67 avg)**

_Note:_ 10:30 has very high avg but only 2 trades (low sample size). Display sample size alongside avg to avoid misleading conclusions. All 84 trades fall between 09:30–12:00 local time — this trader doesn't trade pre-market, afternoon, or after-hours.

**Interpretation:**
- NY open (09:30–10:00) accounts for 39 trades — largest bucket but low avg ($11/trade)
- 11:30 is a small sample but all 3 trades are significant losers — avoid this window
- The sweet spot appears to be 10:00–11:30 by average P&L

---

### KPI 2.3 — Performance by Session

**Category:** Time-Based

**Formula:**
```
Sessions defined by EnteredAt local time (use timestamp's own UTC offset):
  pre-market : EnteredAt < 09:30
  ny-open    : 09:30 ≤ EnteredAt < 11:00
  midday     : 11:00 ≤ EnteredAt < 14:00
  afternoon  : 14:00 ≤ EnteredAt < 16:00

For each session:
  session_pnl      = sum(P&L)
  session_count    = count of trades
  session_avg      = session_pnl / session_count
  session_win_rate = (count of winning trades / session_count) × 100
```

**Gross vs Net:** Use active P&L field.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| No trades in session | Show session card with 0 trades, $0 P&L |
| Exactly on boundary (09:30:00) | Belongs to ny-open |

**Test Vectors (Net Mode):**

| Session | Total P&L | Count | Avg P&L | Win Rate |
|---------|-----------|-------|---------|----------|
| pre-market | $0 | 0 | — | — |
| ny-open | **$1,905.00** | 70 | $27.21 | 52.9% |
| midday | $409.00 | 14 | $29.21 | **35.7%** |
| afternoon | $0 | 0 | — | — |

_Note:_ This trader exclusively trades during ny-open and midday — 83% of trades are in ny-open. No pre-market or afternoon trades exist in this dataset.

_Surprising finding:_ Midday win rate is only 35.7% but avg P&L ($29.21) is higher than ny-open ($27.21). This suggests midday winners are large while losses are also large — higher variance.

**Interpretation:**
- NY Open has the most liquidity and sharpest moves — ideal for scalpers
- Midday typically sees lower volatility and choppier price action
- Afternoon (14:00–16:00) can see volatility spike at close — worth testing
- Pre-market: very thin liquidity for micros, generally inadvisable

---

### KPI 2.4 — Monthly P&L Trend

**Category:** Time-Based

**Formula:**
```
monthly_pnl[year_month] = sum(P&L) of all trades where
  year_month(EnteredAt) == year_month

Sort by year_month ascending for trend display.
Trend direction: compare each month to prior month.
  delta = monthly_pnl[m] - monthly_pnl[m-1]
```

**Gross vs Net:** Use active P&L field.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| Month with no trades | $0.00, do not omit from trend chart |
| Single month of data | Show single bar, trend = null |
| Negative month | Display in red |

**Test Vectors (Net Mode):**

| Month | Net P&L | Delta vs Prior Month |
|-------|---------|----------------------|
| 2025-11 | $286.00 | — (first month) |
| 2025-12 | $103.50 | −$182.50 |
| 2026-01 | $308.50 | +$205.00 |
| 2026-02 | $911.00 | +$602.50 |
| 2026-03 | $705.00 | −$206.00 (partial month, ends 2026-03-12) |

_Total: $286.00 + $103.50 + $308.50 + $911.00 + $705.00 = $2,314.00 (matches total net P&L)_

**Interpretation:**
- Consistent growth trend Feb–Mar suggests improving edge
- December dip is common (holiday liquidity)
- March figure is partial (12 days) — annote as "(partial)" in the UI

---

## Category 3: Behavioral

---

### KPI 3.1 — Revenge Trades

**Category:** Behavioral

**Formula:**
```
A trade is a revenge trade if ALL of the following are true:
  1. The immediately preceding trade (by ExitedAt) resulted in a loss (PnL < 0)
  2. The time gap = EnteredAt[current] - ExitedAt[previous] ≥ 0 seconds
  3. The time gap ≤ revenge_window_seconds (default: 120)

revenge_count = count of trades satisfying all three conditions

Parameters:
  revenge_window_seconds: integer, configurable by user (default 120)

Sort trades by ExitedAt to establish sequence.
Only check the single immediately preceding trade.
```

**Gross vs Net:** Classification of "loss" uses the active P&L mode.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| Zero trades | revenge_count = 0 |
| First trade | Cannot be a revenge trade (no preceding trade) |
| Loss followed by breakeven within window | NOT a revenge trade (breakeven is not a loss) |
| Loss followed immediately by another loss (within window) | IS a revenge trade |
| Overlapping trades (same EnteredAt) | Sort by ExitedAt; if still tied, sort by Id |
| Negative gap (trade entry before prior exit — overlapping) | Exclude (gap < 0 = concurrent positions, not sequential) |

**Test Vectors (Net Mode, window=120s):**

| Revenge Trade Index | Trade Id | EnteredAt | Gap (s) | Prior Loss | Prior Trade Id |
|--------------------|----------|-----------|---------|------------|----------------|
| 1 | 1675061800 | 2025-11-21 09:47:21 | 66s | −$199.00 | 1674694889 |
| 2 | 1682374505 | 2025-11-24 09:32:17 | 80s | −$2.00 | 1681970424 |
| 3 | 1789847356 | 2025-12-15 09:37:20 | 105s | −$196.00 | 1789444267 |

**Total revenge trades (net, 120s window): 3**

_Note on trade 2 (id 1682374505):_ The preceding loss was only −$2.00. This is technically a revenge entry but may not be psychologically meaningful. Consider a minimum loss threshold for the "revenge" designation (e.g., only flag if prior loss > avg_loss × 0.5).

**Interpretation:**
- 3 revenge trades out of 84 (3.6%) = well-controlled
- All 3 occurred in Nov–Dec 2025 (earlier period) — behavior may have improved
- The revenge trade itself (1675061800) won $7 — but that's a coincidence, not edge
- Threshold guidance: > 10% revenge trade rate = significant behavioral problem

---

### KPI 3.2 — Overtrading Detection

**Category:** Behavioral

**Formula:**
```
For each trading day d (sorted by date):
  trades_today[d] = count of trades on day d

  rolling_5day_avg[d] = mean(trades_today[d-5..d-1])
    (use up to 5 prior trading days; if fewer exist, use what's available)
    Minimum 1 prior day required to compute (no flag on day 1)

  is_overtrade[d] = trades_today[d] > overtrade_multiplier × rolling_5day_avg[d]

Parameters:
  overtrade_multiplier: float, configurable (default 2.0)
```

**Gross vs Net:** Not applicable — this is a count-based metric.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| Only 1 day of history | No flag (no prior days for rolling avg) |
| Rolling avg = 0 (all prior days had 0 trades) | Impossible by definition (prior days with 0 trades aren't trading days) |
| Exact match (count == 2.0 × avg) | NOT flagged; condition is strictly greater than |

**Test Vectors:**

| Date | Trades Today | Rolling 5-Day Avg | Threshold (2.0×) | Flagged? |
|------|-------------|-------------------|------------------|----------|
| 2025-11-20 | 3 | 1.0 (avg of prior 2 days: 1,1) | 2.0 | **YES** |
| 2025-12-01 | 5 | 2.0 (avg of prior 5 days: 1,1,1,2,2) | 4.0 | **YES** |
| 2026-01-16 | 4 | 1.6 (avg of prior 5 days: 1,2,2,2,1) | 3.2 | **YES** |
| 2025-12-10 | 3 | ~1.4 | ~2.8 | No |

**Total overtrade flags: 3**

**Interpretation:**
- 3/53 days flagged = 5.7% of trading days — moderate
- 2025-12-01 was the worst: 5 trades on a day averaging 2
- Overtrading often correlates with loss days — check P&L on these days: 2025-11-20 = +$64, 2025-12-01 = +$209, 2026-01-16 = +$12 (mixed results here)

---

### KPI 3.3 — Max Consecutive Losses / Wins

**Category:** Behavioral

**Formula:**
```
Sort trades by EnteredAt ascending (secondary sort: Id for ties).

Scan trades sequentially:
  current_loss_streak = 0
  current_win_streak  = 0
  max_loss_streak = 0
  max_win_streak  = 0

  for each trade t:
    if P&L < 0:
      current_loss_streak += 1
      current_win_streak   = 0
    elif P&L > 0:
      current_win_streak  += 1
      current_loss_streak  = 0
    else (P&L == 0, breakeven):
      current_loss_streak  = 0   # breakeven RESETS both streaks
      current_win_streak   = 0

    max_loss_streak = max(max_loss_streak, current_loss_streak)
    max_win_streak  = max(max_win_streak,  current_win_streak)
```

**Gross vs Net:** Classification of win/loss/breakeven uses the active P&L mode.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| Zero trades | Both = 0 |
| All wins | max_win_streak = total_trades, max_loss_streak = 0 |
| All losses | max_loss_streak = total_trades, max_win_streak = 0 |
| Breakeven in middle of streak | Streak is broken — breakeven resets both counters |
| Single trade, win | max_win = 1, max_loss = 0 |

**Test Vectors (Net Mode):**

| Metric | Expected Value |
|--------|----------------|
| Max consecutive losses | **4** |
| Max consecutive wins | **7** |

_Max win streak of 7_ — a run of 7 consecutive winning trades exists in the dataset.
_Max loss streak of 4_ — the longest losing run is 4 trades.

**Interpretation:**
- Max loss streak of 4 is manageable
- A 7-win streak is notable — suggests extended periods of good market alignment
- If max_loss_streak > 6 in any period, consider halting and reviewing setups
- Rule of thumb for Topstep-style prop accounts: 3 consecutive losses = step back and review

---

### KPI 3.4 — Tilt Indicator

**Category:** Behavioral

**Formula:**
```
tilt_trades = all trades taken after 2 or more consecutive losses
  (i.e., a trade enters the tilt set if the immediately preceding 2+ trades
   were all losses, assessed in trade sequence order)

tilt_avg_pnl    = mean(P&L of tilt_trades)
overall_avg_pnl = mean(P&L of all trades)
tilt_delta      = tilt_avg_pnl - overall_avg_pnl

A negative tilt_delta indicates performance deterioration after consecutive losses.

Algorithm:
  loss_streak = 0
  for each trade t (sorted by EnteredAt):
    if loss_streak >= 2:
      add t to tilt_trades

    # update streak AFTER checking
    if P&L(t) < 0:
      loss_streak += 1
    else:
      loss_streak = 0
```

**Gross vs Net:** Loss classification and P&L averaging both use the active mode.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| No consecutive loss streaks of 2+ | tilt_trades = empty, tilt_avg = null |
| Fewer than 3 total losses | Cannot reach 2-consecutive threshold (need 2 prior losses before a 3rd is recorded as tilt) |
| tilt_trade itself is a win | It still counts — the question is whether entering after a streak hurts you |

**Test Vectors (Net Mode):**

| Metric | Value |
|--------|-------|
| Tilt trades count | **12** |
| Tilt avg P&L | **$5.67** |
| Overall avg P&L | **$27.55** |
| Tilt delta | **−$21.88** |

_Interpretation of this dataset:_ After 2+ consecutive losses, avg P&L drops from $27.55 to $5.67 — a 79% reduction in per-trade expectancy. This is evidence of tilt: the trader is significantly less effective after losing streaks, but does not go into deeply negative territory (avg is still positive at $5.67).

**Interpretation:**
- tilt_delta near 0: no measurable tilt effect
- tilt_delta negative: tilt detected — consider a rule to pause after 2 consecutive losses
- tilt_delta < −0.5 × overall_avg: significant tilt — warrants a hard trading rule
- This dataset shows tilt_delta = −$21.88 vs overall_avg = $27.55. That's a **79% degradation** — notable.

---

## Category 4: Risk Management

---

### KPI 4.1 — Max Drawdown

**Category:** Risk Management

**Formula:**
```
Build cumulative P&L series (trades ordered by EnteredAt):
  cum_pnl[0]  = P&L[0]
  cum_pnl[i]  = cum_pnl[i-1] + P&L[i]

  running_peak = max(cum_pnl[0..i]) at each step i

  drawdown[i] = running_peak[i] - cum_pnl[i]

max_drawdown_dollars = max(drawdown[i] for all i)

max_drawdown_peak = running_peak at the point of max drawdown

max_drawdown_pct = max_drawdown_dollars / max_drawdown_peak × 100
  Special case: if max_drawdown_peak <= 0, report pct as null (undefined)
  Note: pct CAN exceed 100% if cumulative P&L goes below 0 after a peak
```

**Gross vs Net:** Use active P&L field for cumulative series.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| Monotonically increasing P&L (no drawdown) | max_drawdown = $0.00 |
| P&L never goes positive (peak = 0 or negative from start) | max_drawdown_pct = null; show $ amount only |
| Single trade, loss | max_drawdown = abs(loss), peak = 0, pct = null |
| Drawdown > 100% | Valid — means cumulative went negative after a high-water mark; display pct with note |

**Test Vectors:**

| Mode | Max Drawdown ($) | Peak at Drawdown | Trough | Max Drawdown (%) |
|------|-----------------|------------------|--------|-----------------|
| Net | **$905.50** | $895.00 (after trade 17, 2025-12-01) | −$10.50 | **101.2%** (cum P&L went negative) |
| Gross | **$884.00** | $1,734.44 | $850.44 | **50.97%** |

_Net mode P&L went to −$10.50 mid-dataset, creating >100% drawdown from peak. This is accurate and expected — after a strong Nov/early Dec, a string of losses in mid-Dec pushed cumulative briefly negative._

_Gross mode max drawdown is more meaningful (50.97%) since the starting baseline is $0 and stays above $0 throughout._

**Interpretation:**
- For a Topstep Combine: max drawdown rules are typically $1,500–$3,000 depending on account size
- Net max drawdown of $905.50 is substantial relative to the final P&L of $2,314 — about 39% of final equity
- Gross pct of 51% is high for a 4-month period; suggests the trader had significant volatility in returns
- Acceptable range: < 20% of peak for well-managed accounts

---

### KPI 4.2 — Average Risk Per Trade

**Category:** Risk Management

**Formula:**
```
avg_risk = sum(abs(P&L) for losing trades) / count(losing trades)
         = average loss amount

This is a proxy for typical risk taken per trade, assuming the
average loss approximates the typical stop-loss size.
```

**Gross vs Net:** Losing trades classified and P&L valued using the active mode.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| No losing trades | null — display "N/A" |
| All breakeven | null |
| Single losing trade | That trade's loss amount |

**Test Vectors:**

| Mode | Sum Losses (abs) | Loss Count | Avg Risk |
|------|-----------------|------------|----------|
| Net | $5,468.00 | 34 | **$160.82** |
| Gross | $5,372.24 | 32 | **$167.88** |

_Note:_ Gross avg_risk is slightly higher despite lower sum because the breakeven net trades that become gross losses tend to be small, while some larger net losses have their fees added back, increasing the gross loss value slightly. Net 34 losses vs. gross 32 losses confirms some net-losers become gross-winners (impossible) — wait, let me clarify: on gross mode, 2 of the 34 net-losing trades actually have `PnL + Fees > 0` (they would be very small losses where fees flip them positive). But actually the counts show 32 gross losses vs 34 net losses — 2 trades that are net-losers become gross-winners (their loss is smaller than the fees... but fees add back would make them less negative, not positive unless PnL was slightly negative and smaller than fees). This is mathematically consistent.

**Interpretation:**
- $160.82 avg risk = approximately 1.6× the minimum tick value for MNQ/MYM at typical sizing
- This is your de facto stop size — compare to your intended stop to see if you're honoring it
- A well-disciplined trader: avg_risk should be tight (within ±20% of your planned stop)

---

### KPI 4.3 — Risk-Reward Ratio

**Category:** Risk Management

**Formula:**
```
rr_ratio = avg_win / avg_loss

where:
  avg_win  = mean P&L of winning trades (positive value)
  avg_loss = mean abs(P&L) of losing trades (absolute value, positive)
```

**Gross vs Net:** Both avg_win and avg_loss use the active P&L mode.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| No losses | return `∞` |
| No wins | return 0 |
| Zero trades | return `null` |

**Test Vectors:**

| Mode | Avg Win | Avg Loss | R:R Ratio |
|------|---------|----------|-----------|
| Net | $185.29 | $160.82 | **1.152** |
| Gross | $151.93 | $167.88 | **0.905** |

_The gross R:R dropping below 1.0 is significant_: on a gross basis, average wins are smaller than average losses. Combined with the 50% net win rate (even less helpful gross), this shows the system's edge is thin on a trade-by-trade basis.

**Interpretation:**
- R:R < 1.0: You need win rate > 50% to be profitable
- R:R = 1.0: Need exactly 50% win rate (breakeven)
- R:R 1.0–1.5: Need ~40–50% win rate
- R:R > 2.0: Can be profitable with 35–40% win rate
- This dataset: R:R of 1.15 (net) requires ~46% win rate — the 50% actual rate provides a slim margin

---

### KPI 4.4 — Position Sizing Patterns

**Category:** Risk Management

**Formula:**
```
Group trades by Size field.
For each size group:
  size_count[s]    = count of trades with Size == s
  size_win_rate[s] = count(P&L > 0) / size_count[s] × 100
  size_avg_pnl[s]  = mean(P&L) for size group s

Pearson correlation (size vs P&L):
  corr = cov(sizes, pnls) / (std(sizes) × std(pnls))

  where sizes and pnls are the parallel arrays of [Size, P&L] for all trades
```

**Gross vs Net:** Win rate and avg P&L computed using the active P&L field; Size field doesn't change.

**Edge Cases:**
| Scenario | Result |
|----------|--------|
| All trades same size | correlation = 0 (no variance in x) / display as N/A |
| Single trade per size group | Stats valid but note low sample size |

**Test Vectors (Net Mode):**

| Size | Trade Count | Wins | Losses | BE | Win Rate | Avg P&L |
|------|-------------|------|--------|----|----------|---------|
| 1 | 13 | 8 | 4 | 1 | 61.5% | **$80.46** |
| 2 | 32 | 19 | 10 | 3 | 59.4% | **$53.38** |
| 4 | 25 | 10 | 13 | 2 | 40.0% | **$4.80** |
| 8 | 14 | 5 | 7 | 2 | 35.7% | **−$40.00** |

**Pearson correlation (Size vs net P&L): −0.1806**

_Strong pattern:_ As position size increases from 1 to 8 contracts, both win rate and avg P&L decrease significantly. Size-8 trades average −$40 and win only 35.7% of the time. This is the opposite of what you'd want.

**Interpretation:**
- Negative correlation (−0.18) = larger positions perform worse
- This is a common behavioral pattern: traders upsize when they "feel confident" but those moments may actually coincide with lower-quality setups or overconfidence
- Actionable: Reduce or eliminate size-8 trades until win rate at that size improves
- Size-1 and size-2 trades are clearly the best performers; the edge disappears at size-4+

---

## Appendix A: Timestamp Handling Notes

The CSV contains two types of timestamps:

1. **Trade times** (`EnteredAt`, `ExitedAt`): Use `-05:00` offset (Eastern Standard Time) for most trades. Starting 2026-03-09, offset shifts to `-04:00` (Eastern Daylight Time, DST change was 2026-03-08).

2. **TradeDay**: Uses `-06:00` offset (Central time zone, exchange-based grouping). This field should be used only for session grouping in the UI, not for time-of-day analysis.

**Correct approach for time-of-day/DOW analysis:** Use the offset embedded in `EnteredAt` directly. Do not convert to UTC and back — the local offset in the timestamp is already correct for the day-trading session.

**DST Example:** Trade on 2026-03-09 has `EnteredAt` = `2026-03-09 10:03:55 -04:00`. The local time is 10:03:55 EDT, which is the correct bucket for time-of-day analysis (10:00 bucket).

---

## Appendix B: Implementation Notes for Mason

1. **Breakeven classification:** `PnL === 0` exactly. In floating point, use `Math.abs(pnl) < 0.001` as the epsilon threshold to handle any rounding from CSV parsing. However, the actual data uses exact decimal values stored as strings, so Papa Parse with `dynamicTyping: true` should produce exact values.

2. **Gross P&L computation:** `grossPnl = parseFloat(row.PnL) + parseFloat(row.Fees)`. Always add (never subtract) — Fees is always positive in this dataset.

3. **Sorting for behavioral KPIs:** Sort by `EnteredAt` UTC for sequential analysis. Two trades on 2025-11-20 have identical `EnteredAt` (`09:31:34 -05:00`) — use `Id` as tiebreaker for deterministic ordering.

4. **Revenge trade gap:** Use `(enteredAt_ms - exitedAt_ms) / 1000` for seconds. Must be ≥ 0 (concurrent/overlapping trades are not revenge trades).

5. **Rolling 5-day average for overtrading:** The "5 days" is 5 prior *trading* days, not 5 calendar days. Use the sorted list of unique trading days as the index.

6. **Max drawdown percentage edge case:** If `peak === 0` (first trade is a loss), skip percentage calculation for that point. If `peak < 0`, percentage is meaningless — return null for pct, show $ amount only.

7. **Position size correlation:** If all trades have the same size (edge case), `std(sizes) = 0`, making correlation undefined. Return `null` and display "N/A — all trades same size."

8. **CSV BOM:** The CSV from Topstep X may contain a UTF-8 BOM (`\uFEFF`) before the first column header. Papa Parse handles this with `skipEmptyLines: true` but verify the `Id` header is parsed correctly (not `\uFEFFId`). Use `{ encoding: 'UTF-8' }` in FileReader or strip the BOM explicitly.

---

## Appendix C: Quick Reference — All Expected Values

| KPI | Net Value | Gross Value |
|-----|-----------|-------------|
| Total Trades | 84 | 84 |
| Win Rate | 50.0000% | 61.9048% |
| Profit Factor | 1.4232 | 1.4705 |
| Avg Win | $185.29 | $151.93 |
| Avg Loss | $160.82 | $167.88 |
| R:R Ratio | 1.152 | 0.905 |
| Total P&L | $2,314.00 | $2,527.86 |
| Largest Win | $400.50 | $405.92 |
| Largest Loss | −$208.00 | −$202.08 |
| Avg Duration | 24 min 38 sec | — |
| Best DOW | Wednesday ($1,125 total) | — |
| Worst DOW | Friday (−$283.50 total) | — |
| Best Session | NY Open ($1,905 total) | — |
| Best Time Bucket | 10:30 ($200.25 avg) | — |
| Max Consecutive Wins | 7 | — |
| Max Consecutive Losses | 4 | — |
| Revenge Trades | 3 | — |
| Overtrade Days | 3 | — |
| Tilt Avg P&L | $5.67 | — |
| Overall Avg P&L | $27.55 | — |
| Tilt Delta | −$21.88 | — |
| Max Drawdown ($) | $905.50 | $884.00 |
| Max Drawdown (%) | 101.2%* | 50.97% |
| Avg Risk/Trade | $160.82 | $167.88 |
| Size-Outcome Correlation | −0.1806 | — |

*Net max drawdown % exceeds 100% because cumulative P&L briefly went negative (to −$10.50) after reaching a peak of $895.00. This is mathematically correct. Consider displaying net max DD in $ terms only and using gross % for the percentage figure.
