// Lightweight wrapper to fetch odds from The Odds API and normalize to project format
const BASE = 'https://api.the-odds-api.com/v4';

const MARKET_NAMES = {
  h2h: 'Resultado Final',
  totals: 'Total de Pontos',
  spreads: 'Handicap',
};

// Tennis has no stable "circuit" sport key — the API keys each active
// tournament individually (e.g. "tennis_atp_canadian_open") and that changes
// week to week. Call this to get whichever ATP/WTA keys are live right now.
export async function fetchActiveTennisKeys() {
  const key = process.env.ODDS_API_KEY;
  if (!key) throw new Error('ODDS_API_KEY not set in environment');

  const res = await fetch(`${BASE}/sports?apiKey=${key}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Odds API error ${res.status}: ${txt}`);
  }
  const sports = await res.json();
  return sports.filter((s) => s.active && /^tennis_(atp|wta)_/.test(s.key)).map((s) => s.key);
}

export async function fetchOdds(sportKey, {
  regions = 'eu',
  markets = 'h2h,totals,spreads',
  oddsFormat = 'decimal',
  dateFormat = 'iso',
} = {}) {
  const key = process.env.ODDS_API_KEY;
  if (!key) throw new Error('ODDS_API_KEY not set in environment');

  const url = `${BASE}/sports/${encodeURIComponent(sportKey)}/odds?regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}&dateFormat=${dateFormat}&apiKey=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Odds API error ${res.status}: ${txt}`);
  }
  return res.json();
}

export function normalizeToEvents(apiData) {
  return apiData.map((item) => ({
    id: item.id,
    sport: mapSport(item.sport_key),
    competition: item.sport_title || item.sport_key,
    teamA: item.home_team,
    teamB: item.away_team,
    date: item.commence_time ? item.commence_time.split('T')[0] : item.commence_time,
    markets: flattenMarkets(item.bookmakers || [], item.home_team, item.away_team),
  }));
}

function flattenMarkets(bookmakers, homeTeam, awayTeam) {
  const marketsMap = new Map();
  for (const bm of bookmakers) {
    const bkName = bm.title || bm.key || 'bookmaker';
    for (const mk of bm.markets || []) {
      if (!MARKET_NAMES[mk.key]) continue; // e.g. Betfair Exchange's "h2h_lay" — not a back-odds market
      if (!marketsMap.has(mk.key)) marketsMap.set(mk.key, new Map());
      const outcomeMap = marketsMap.get(mk.key);
      for (const o of mk.outcomes || []) {
        const label = translateOutcomeLabel(mk.key, o.name, homeTeam, awayTeam, o.point);
        let entry = outcomeMap.get(label);
        if (!entry) entry = { label, odds: {} };
        if (o.price != null) entry.odds[bkName] = o.price;
        outcomeMap.set(label, entry);
      }
    }
  }

  return Array.from(marketsMap.entries()).map(([key, outcomeMap]) => {
    const outcomes = Array.from(outcomeMap.values());
    applyDevigProbabilities(outcomes);
    return { name: MARKET_NAMES[key] || key, outcomes };
  });
}

// Placeholder "AI prediction" for real odds: no trained model exists yet, so
// predProb is the bookmakers' own consensus (average implied probability,
// de-vigged by normalizing to 100%). This intentionally yields ~0 edge — see
// README "Integration Notes" for what a real prediction pipeline would need.
function applyDevigProbabilities(outcomes) {
  const impliedAvgs = outcomes.map((o) => {
    const prices = Object.values(o.odds);
    if (prices.length === 0) return 0;
    const impliedSum = prices.reduce((sum, price) => sum + 1 / price, 0);
    return impliedSum / prices.length;
  });
  const total = impliedAvgs.reduce((sum, v) => sum + v, 0);
  outcomes.forEach((o, i) => {
    o.predProb = total > 0 ? impliedAvgs[i] / total : null;
  });
}

function translateOutcomeLabel(marketKey, name, homeTeam, awayTeam, point) {
  if (marketKey === 'h2h') {
    if (name === homeTeam) return 'Casa';
    if (name === awayTeam) return 'Fora';
    if (name === 'Draw') return 'Empate';
    return name;
  }
  if (marketKey === 'totals') {
    const prefix = name === 'Over' ? 'Mais' : name === 'Under' ? 'Menos' : name;
    return point != null ? `${prefix} ${point}` : prefix;
  }
  if (marketKey === 'spreads') {
    const side = name === homeTeam ? 'Casa' : name === awayTeam ? 'Fora' : name;
    return point != null ? `${side} (${point > 0 ? '+' : ''}${point})` : side;
  }
  return name;
}

function mapSport(sportKey) {
  if (!sportKey) return 'futebol';
  if (sportKey.includes('soccer')) return 'futebol';
  if (sportKey.includes('basketball')) return 'basquetebol';
  if (sportKey.includes('tennis')) return 'tenis';
  return sportKey;
}

export default { fetchOdds, fetchActiveTennisKeys, normalizeToEvents };
