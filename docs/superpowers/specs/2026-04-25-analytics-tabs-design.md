# Analytics Tabs Design

## Summary

Replace the placeholder analytics tab with a real three-part analytics destination for sari-sari store owners. The screen should help users move from current performance, to recent changes, to forward-looking recommendations without leaving the mobile app or depending on online services for baseline functionality.

The analytics experience is organized into three internal sub-tabs:

- `Overview`
- `Insights`
- `Predictions & AI`

This structure keeps the page simple on small Android screens while still giving analytics clear depth and progression.

## Design Direction

The page should feel practical first, not like a dense BI dashboard. It needs enough visual structure to feel like a meaningful analytics destination, but it should stay readable on low-end phones and remain consistent with the app's current tab-shell design.

The internal navigation pattern is fixed:

- `Analytics` remains one destination in the bottom tab bar.
- Inside that screen, show a three-tab segmented control or pill-style sub-tab row near the top.
- Default to `Overview` on first open.
- Preserve the last active analytics sub-tab during the session.

The content progression is intentional:

- `Overview` answers "What is happening now?"
- `Insights` answers "What is changing?"
- `Predictions & AI` answers "What should I do next?"

## Tab Content

### Overview

`Overview` is the fast business snapshot. It should surface the most useful signals without requiring scrolling through charts first.

Required content:

- sales today
- sales this month
- top-selling products
- low-stock alerts
- fast-moving items
- slow-moving items

Metric behavior:

- Lead with peso revenue when item prices are available.
- If price coverage is incomplete, fall back to units sold and label the revenue signal as estimated or unavailable rather than presenting false precision.

The tab should be immediately useful even with sparse data. If there are no sales yet, the screen still shows zero-value metrics, current low-stock alerts, and setup-oriented empty states.

### Insights

`Insights` is the trend-reading tab. It should reveal how performance is changing over time without becoming chart-heavy.

Required content:

- one lightweight sales trend chart
- one lightweight demand shift chart or sparkline-style comparison
- ranked rising-demand products
- ranked declining-demand products

This tab should focus on directional change, not repeat the same snapshot metrics from `Overview`.

If there is not enough recent history to compute trend changes honestly, the tab should render explicit not-enough-history states rather than synthetic trend claims.

### Predictions & AI

`Predictions & AI` is the forward-looking tab, but for MVP it remains deterministic-first and fully usable offline.

Required content:

- projected near-term demand
- days-until-stockout or restock-soon estimates
- AI-style recommendation cards with actionable language

The "AI" framing is presentation-level for MVP. The baseline experience should not require Gemini or any backend-generated insight to render useful forecasts or recommendations.

If online enhancement is added later, it should enrich the existing layout rather than replace the deterministic baseline.

## Data Rules

Analytics must remain ledger-driven and store-scoped. Computations should derive from the existing schema rather than introducing separate analytics counters.

Primary sources:

- `inventory_items`
- `transactions`
- `transaction_items`
- `inventory_movements`
- `stores.timezone`

Only movement rows representing business outflow should drive sales analytics:

- `sale`
- `utang_sale`

Time windows must be computed in the store timezone. The current schema defaults this to `Asia/Manila`, so all "today" and "this month" values should align with local store time rather than device-local assumptions.

### Overview Rules

- `Sales today`: total sale value for the current local day.
- `Sales this month`: total sale value from the first day of the current local month.
- `Top-selling products`: rank by units sold over the last 30 days.
- `Low-stock alerts`: items where `current_stock <= low_stock_threshold`, sorted by tightest stock position first.
- `Fast-moving items`: highest units sold over the last 7 days.
- `Slow-moving items`: active stocked items with zero or near-zero recent sales over the last 14 to 30 days.

Revenue should prefer `transaction_items.line_total` or equivalent item-value calculation already supported by the ledger-backed schema. When prices are incomplete or unreliable for some items, the UI must fall back to unit-based presentation with honest labels.

### Insights Rules

- Main sales trend chart: daily totals over the last 7 to 14 days.
- Rising demand: items whose recent 7-day sales meaningfully exceed the prior 7-day window.
- Declining demand: items whose recent 7-day sales meaningfully trail the prior 7-day window.

Trend logic should stay simple and deterministic. The goal is understandable movement detection, not statistical sophistication.

### Predictions & AI Rules

- Demand forecast: rolling average of recent daily units sold per item.
- Stockout estimate: `current_stock / average_daily_units_sold` when demand is nonzero.
- Restock recommendation: trigger when projected stockout falls within a short planning horizon.
- Recommendation cards: rule-generated summary statements based on stock level, recent movement, and projected depletion.

Example recommendation style:

`Coke Mismo is trending up this week. Restock within 3 days if sales continue.`

These recommendations should sound helpful and concise, but they must remain deterministic and reproducible from local data.

## Runtime Behavior

The analytics screen must remain useful with local-first data and no network. All three sub-tabs should render from local inventory and transaction state, including pending local transactions that have not synced yet.

The page must not block on backend requests:

- use cached or local-first data on first render
- avoid full-screen loading states once local data exists
- do not gate the analytics page behind online AI or sync completion

The UI should stay explicit about certainty:

- `Estimated Revenue`
- `Units Sold`
- `Low Stock`
- `Trending Up`
- `Trending Down`
- `Restock Soon`

When data is insufficient, the app should say so directly:

- no sales yet
- not enough history for trend detection
- add prices to unlock better revenue estimates

## Empty-State And Fallback Rules

- No sales yet: show zero metrics and setup-oriented empty states.
- Missing item prices: prefer unit-based summaries and label revenue as estimated or unavailable.
- Not enough history: suppress trend and forecast claims instead of inventing them.
- Low stock with no history: still show low-stock alerts, but do not produce demand forecasts.
- Mixed synced and pending local activity: include both in analytics so the page matches what the user just logged offline.

## Implementation Boundaries

This feature should stay local to the client analytics surface and avoid introducing backend dependencies for MVP.

Expected structure:

- `AnalyticsScreen` becomes the main container for analytics sub-tabs and shared analytics state.
- Add a small analytics component set for metric cards, ranked lists, alert cards, and lightweight chart blocks.
- Keep analytics computations in a dedicated data module separate from presentation.
- Reuse the existing app shell and visual language rather than creating a separate dashboard framework.

State guidance:

- derive analytics view data from local-first inventory and transaction state
- keep only active sub-tab selection as local UI state
- do not add mutation behavior to this page

## Acceptance Criteria

The design is complete when implementation produces the following behavior:

- `Overview` updates after local inventory-changing actions without waiting for sync.
- `Insights` distinguishes correctly between trend-ready and insufficient-history states.
- `Predictions & AI` renders deterministic stockout and restock guidance from local data only.
- Revenue and units labeling stay honest when price coverage is partial.
- Low-stock alerts appear from current ledger-backed stock state.
- The screen remains readable and usable on a small Android device.
- The page is useful offline and does not require backend calls to render core analytics.

## Testing Notes

Implementation should include coverage for:

- analytics view-model computation from ledger-backed data
- revenue fallback behavior when prices are missing or zero
- trend detection with enough-history and insufficient-history cases
- prediction and stockout estimation rules
- screen rendering for each analytics sub-tab
- offline and pending-local-transaction scenarios

Manual verification should confirm:

- the three internal sub-tabs are clear and stable on small screens
- charts stay lightweight and do not overwhelm the layout
- analytics reflects locally recorded actions immediately

## Assumptions

- The MVP analytics page is implemented in the existing React Native client.
- The current Supabase schema is the source of truth for analytics entities and ledger semantics.
- MVP analytics remains deterministic-first even if online AI enhancement is added later.
- No new backend endpoint is required for baseline analytics rendering.
