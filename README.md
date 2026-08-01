# Handoff: OddScout — Sports Odds Comparison & Prediction App

## Overview
Mobile-first prototype for a Portuguese sports-betting-odds comparison app. Users browse football (and basketball/tennis) events, see an AI-style prediction with a recommended bet across multiple markets, compare odds across 5 licensed Portuguese bookmakers, build accumulator ("combinado") bets from "safe" and "value" picks, and manage favorites/preferred bookmakers.

## About the Design Files
The file in this bundle (`OddScout.dc.html`) is a **design reference prototype** built in HTML/JS (a self-contained "Design Component" runtime, not a production framework). It is not production code to copy directly — the task is to **recreate this design and its interactions in your target codebase's environment** (React Native, Flutter, native iOS/Android, or web React/Vue — whichever the project uses), following its existing component/design-system patterns. If no environment exists yet, React Native or a responsive React web app are natural fits for this UI.

To view it: open `OddScout.dc.html` in a browser.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and all screen layouts are final. All copy (Portuguese) is final. All data (teams, odds, predictions) is **illustrative placeholder data** — see "Data — Important" below.

## Data — Important
- **Odds are fictional.** There is no live connection to any bookmaker. Recreate the UI with real odds wired to a real data source (see Integration Notes).
- **Team/competition names are real** (Premier League, Serie A, La Liga, Brasileirão, Liga Profesional Argentina fixtures for 2026/27) but **dates for the Brazilian/Argentine fixtures are approximate** ("Agosto 2026") since exact matchday scheduling wasn't confirmed at build time — replace with real fixture data from a fixtures API.
- **AI predictions/recommendations are a simple placeholder heuristic**, not a real model: each event has hand-authored `predProbs` (predicted probability per outcome per market). The "recommended bet" logic scans every market/outcome, computes `edge = predictedProb - impliedProbability(bestOdd)` where `impliedProbability = 100/odd`, and picks the outcome with the highest edge. A "value bet" badge shows when edge ≥ 5 percentage points. A "safe bet" is the outcome with the single highest predicted probability, shown only if ≥ 60%.
- **Bookmakers shown**: Bet365, Betano, Betclic, Placard, Solverde (5 real operators licensed in Portugal, used only as labels — no logos/branding recreated).

## Screens / Views
All screens live inside a fixed mobile-frame container (412×860px card, 22px corner radius, centered on the page background). Content area scrolls; a 5-item tab bar is pinned to the bottom.

### 1. Início (Home) — tab root
- **Purpose**: Dashboard — quick sport filter, top value-bet highlights, upcoming events.
- **Layout**: 22px/20px padding. Header row: app wordmark "OddScout" (Barlow Condensed 700, 26px, color `#1d2d3d`) + circular avatar button (36px, `#eef6ff` bg, `#2c455d` text "JP") linking to Perfil.
- Subtitle line (13px, `rgba(29,31,32,0.6)`).
- Horizontal-scroll sport chip row (pill buttons, 1px `#5980a6` border, transparent bg, `#416180` text, 20px radius) — tapping navigates to Eventos list for that sport.
- "Destaques de valor" section: cards for the top 2 events by value edge. Each card: hairline border (`rgba(29,31,32,0.16)`) with four small **corner tick marks** (11×11px "+"-style registration marks drawn at each corner — see Design Tokens) — competition tag + "market: outcome · +Npp" value tag, matchup title (Barlow Condensed 600, 17px), date, AI prediction line, best odd + bookmaker (right-aligned, Barlow Condensed 700, 16px, `#416180`).
- "Próximos eventos" section: simple divided list rows (11px sport/competition label, 15px matchup, 11px date, right-aligned best odd).

### 2. Explorar (Explore) — tab root
- **Purpose**: Search any event by team/player name, browse AI's top-ranked predictions, or pick a sport.
- Search input (40px min-height, `#e9e9ea` bg, hairline border).
- If query non-empty: filtered results list (same row style as home's upcoming list).
- If empty: "Melhores previsões da IA" ranked list (top 5 events by confidence-weighted score, each card shows sport tag, confidence badge, matchup, recommended market/outcome line, AI prediction %, value badge if applicable) — then a 3-card sport picker (Futebol / Basquetebol / Ténis with event counts).

### 3. Eventos (Event List)
- **Purpose**: All events for one sport.
- Back button (32×32px, hairline border, "←") + sport name (20px) header, event count subline.
- Vertical list of bordered, corner-marked cards: competition tag, matchup (16px), date, "Melhor odd X.XX" right-aligned.

### 4. Detalhe (Event Detail)
- **Purpose**: Full breakdown of one event — prediction, recommended bet, odds comparison.
- Header: back button + favorite toggle button (text switches "☆ Favoritar" / "★ Favorito").
- Sport/competition label, matchup title (24px), date.
- **"Previsão IA" card** (bordered, corner marks): confidence badge (Alta/Média/Baixa), one probability bar per main-market outcome (6px height track, `#5980a6` fill, width = live percentage), short rationale sentence.
- **"Aposta recomendada pela IA" card** (highlighted, `#eef6ff` bg, `#5980a6` border): market name, outcome, best odd + bookmaker, value badge if edge ≥ 5pp, one-sentence stats-based rationale (unique per event).
- "Melhor odd agora ({market name})" hero stat row.
- Market tabs (segmented row) — one per market the event has (football events have 4: Resultado Final / +2.5 Golos / Ambas Marcam / Golos 1ª Parte; basketball/tennis have 2).
- Odds comparison table: one row per outcome, one column per **preferred bookmaker only** (filtered by the user's Perfil settings); best odd per row highlighted (`#eef6ff` bg, bold, `#2c455d` text). If the user has deselected all bookmakers, an inline empty-state message shows instead.
- Legal footer line (odds are indicative, bet responsibly, 18+).

### 5. Combos (Safe/Value zones + accumulator builder) — tab root
- **Purpose**: Two curated lists (Apostas Seguras: predicted-probability ≥ 60%; Apostas de Valor: edge ≥ 5pp) plus a combo/accumulator generator.
- Each list: clickable rows (matchup, market:outcome, and either probability% or +edge pp, plus odd) — tap opens Detalhe.
- **Combo builder** (bordered card with corner marks): 4-way pool selector (Seguras / Valor / Misturado / IA escolhe — segmented buttons), a stepper for number of legs (2–20, − / count / + buttons), a primary "Gerar combinado" button. Result: one row per leg (event name, tag "Segura"/"Valor", market:outcome, odd) plus a combined-odds total (product of all leg odds, 2 decimals).
- Generation logic: "Seguras"/"Valor" pull straight from the respective sorted list (no duplicate events); "Misturado" interleaves both lists; "IA escolhe" scores every safe pick by its probability and every value pick by `50 + edge`, then takes the top N by score across both pools — ties resolved by list order.

### 6. Favoritos — tab root
- **Purpose**: Saved events.
- Empty state: dashed border box with instructional copy. Populated: same bordered/corner-marked card list as Eventos.

### 7. Perfil — tab root
- **Purpose**: Account info, preferred-bookmaker toggles (drives the Detalhe odds table filter), responsible-gambling messaging, sign out.
- Avatar circle (52px) + name/email placeholder.
- "Casas de apostas preferidas": one toggle-pill button per bookmaker (on = `#eef6ff` bg / `#5980a6` border / `#2c455d` text; off = transparent / hairline border / 50%-opacity text).
- "Jogo Responsável" bordered card: static safety copy + "Definir limites" button (decorative in this prototype).
- "Terminar sessão" full-width outline button (decorative).
- Footer: version + "dados apenas ilustrativos" disclaimer.

## Interactions & Behavior
- **Navigation model**: a simple screen-name + history-stack pattern. Tab bar taps (`setTab`) reset history to `[]` (tab roots have no back button). Drilling into Eventos or Detalhe (`navigate`) pushes the current screen onto history; the back button (`goBack`) pops it. No animated transitions between screens in this prototype — recreate with your framework's standard push/pop or fade, per your app's existing navigation conventions.
- **Sport chips / sport cards**: tapping sets `selectedSport` and navigates to Eventos.
- **Search** (Explorar): live-filters events by matching the query (case-insensitive) against `teamA + ' ' + teamB`.
- **Market tabs** (Detalhe): tapping switches which market's outcomes/odds table is shown; does not affect the "Previsão IA" card (always shows the main/first market) or the "Aposta recomendada" card (always shows the single best-edge bet across ALL markets, independent of the selected tab).
- **Favorite toggle**: adds/removes the current event id from a `favorites` array; Favoritos screen reads from that array.
- **Preferred bookmakers** (Perfil): toggling a bookmaker adds/removes it from `preferredBooks`; the Detalhe odds table only renders columns for bookmakers currently in that set, and "best odd" highlighting is recomputed against only the visible columns.
- **Combo builder**: selecting a pool or changing the leg-count stepper does NOT auto-regenerate — the user must tap "Gerar combinado" each time. Regenerating replaces the previous result.
- No loading states, error states, or real form validation are implemented (all data is synchronous local mock data).

## State Management
Minimal flat state (see `OddScout.dc.html`'s logic class for the exact shape):
- `screen` (string) + `history` (array) — nav stack, described above.
- `selectedSport` (string), `selectedEventId` (string) — drive Eventos/Detalhe content.
- `activeMarketIndex` (number) — which market tab is selected in Detalhe.
- `favorites` (array of event ids).
- `searchQuery` (string) — Explorar search box.
- `preferredBooks` (array of bookmaker names) — Perfil toggles, defaults to all 5.
- `comboPool` ('segura'|'valor'|'mista'|'ia'), `comboCount` (number 2–20), `comboLegs` (array), `comboTotalOdd` (string|null) — Combos screen.

## Design Tokens
Colors (from a bound "Industry" wireframe-style design system — light/technical, single steel-blue accent):
- Background: `#f2f2f3` · Surface/inputs: `#e9e9ea` · Text: `#1d1f20`
- Accent: `#5980a6` (base) — light tint `#eef6ff` (badge/highlight backgrounds), mid `#416180` (odds/link text), dark `#2c455d` (text on tinted fill), darkest `#1d2d3d` (wordmark/emphasis)
- Divider/border: `rgba(29,31,32,0.16)` · Muted text: `rgba(29,31,32,0.5–0.6)`
- Neutral tag bg: `#f5f5f8` / text `#424244`

Typography:
- Headings/numerals/buttons: **Barlow Condensed**, weights 600/700
- Body/UI text: **Barlow**, weights 400/500/600
- Loaded via Google Fonts (`family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700`)

Spacing/shape:
- Card padding: 14–16px · Section gaps: 22–28px
- Corner registration marks ("blueprint" motif): four 11×11px `<i>` elements per bordered card, each drawing a 1px "+"-shaped tick at a corner via two absolutely-positioned lines (`rgba(29,31,32,0.55)`), offset −6px outside the card's border box.
- All interactive cards/buttons are **square-cornered** (no border-radius) except the phone-frame container itself (22px) and circular avatars/toggles (50%).
- Standard hairline border: `1px solid rgba(29,31,32,0.16)`.

## Assets
No images or icons — the design uses text, colored tags, thin borders, and the corner-tick motif only. No logos are used for bookmakers (text labels only, to avoid trademark recreation).

## Integration Notes (for real data)
Discussed with the client during design; not implemented here:
- **Fixtures/stats**: football-data.org (free tier) or API-Football for real fixtures, results, standings.
- **Odds**: The Odds API (has a free tier) or Betfair Exchange API — no free tier exists for most bookmaker-odds aggregators.
- **Predictions**: Current build uses a simple rule (`edge = predictedProbability − 100/bestOdd`) with hand-authored probabilities. A real version needs either a trained model on historical odds/results data or, as a starting point, a similar rules-based heuristic fed by the stats API above.
- Recommend caching odds/fixture API responses server-side (free-tier request limits are low) — e.g. Cloudflare Workers/Vercel functions + Supabase free tier.

## Files
- `OddScout.dc.html` — the full prototype (open directly in a browser). All markup, styles, and logic are in this single file.
