// edge = predicted probability − implied probability of the best available odd.
// A "value bet" is an outcome where edge >= 5 percentage points.
// See README "Data — Important" for the full rules this mirrors.

export function impliedProbability(odd) {
  return 100 / odd;
}

export function bestOdd(outcome) {
  let bookmaker = null;
  let odd = -Infinity;
  for (const [book, value] of Object.entries(outcome.odds)) {
    if (value > odd) {
      odd = value;
      bookmaker = book;
    }
  }
  return { odd, bookmaker };
}

export function bestEdgeForEvent(event) {
  let best = null;
  for (const market of event.markets) {
    for (const outcome of market.outcomes) {
      const { odd, bookmaker } = bestOdd(outcome);
      const edge = outcome.predProb * 100 - impliedProbability(odd);
      if (!best || edge > best.edge) {
        best = { market: market.name, outcome: outcome.label, odd, bookmaker, edge, predProb: outcome.predProb };
      }
    }
  }
  return best;
}

export function getValueHighlights(events, count = 2) {
  return events
    .map((event) => ({ event, best: bestEdgeForEvent(event) }))
    .filter(({ best }) => best.edge >= 5)
    .sort((a, b) => b.best.edge - a.best.edge)
    .slice(0, count);
}

// The main market is always the event's first market (Resultado Final /
// Vencedor). The "favourite" is its highest predicted-probability outcome.
export function mainMarket(event) {
  return event.markets[0];
}

export function favoriteOutcome(market) {
  return market.outcomes.reduce((a, b) => (b.predProb > a.predProb ? b : a));
}

// Plain "melhor odd" shown on list rows (Home upcoming, Eventos) — the best
// available odd for the main market's favourite, independent of the
// AI value/edge logic used for highlight cards and the recommended bet.
export function bestOddMainMarket(event) {
  return bestOdd(favoriteOutcome(mainMarket(event)));
}

export function getUpcoming(events) {
  return [...events]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((event) => ({ event, best: bestOddMainMarket(event) }));
}

export function searchEvents(events, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return events.filter((event) => `${event.teamA} ${event.teamB}`.toLowerCase().includes(q));
}

// "Confidence-weighted score" per the README: rank by how sure the AI is of
// its main-market favourite, boosted when the recommended bet also has
// positive edge (a confident AND valuable pick ranks above a merely
// confident one).
export function getRankedPredictions(events, count = 5) {
  return events
    .map((event) => {
      const favorite = favoriteOutcome(mainMarket(event));
      const recommended = bestEdgeForEvent(event);
      const score = favorite.predProb + Math.max(recommended.edge, 0) / 100;
      return { event, favorite, recommended, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

// A "safe bet" is the single highest-predicted-probability outcome across
// all markets, only surfaced when that probability is >= 60% (the "Apostas
// Seguras" threshold from the design handoff).
export function bestSafeBet(event) {
  let best = null;
  for (const market of event.markets) {
    for (const outcome of market.outcomes) {
      if (!best || outcome.predProb > best.predProb) {
        const { odd, bookmaker } = bestOdd(outcome);
        best = { market: market.name, outcome: outcome.label, predProb: outcome.predProb, odd, bookmaker };
      }
    }
  }
  return best && best.predProb >= 0.6 ? best : null;
}

export function getSafeBets(events) {
  return events
    .map((event) => ({ event, bet: bestSafeBet(event) }))
    .filter(({ bet }) => bet)
    .sort((a, b) => b.bet.predProb - a.bet.predProb);
}

export function getValueBets(events) {
  return events
    .map((event) => ({ event, bet: bestEdgeForEvent(event) }))
    .filter(({ bet }) => bet.edge >= 5)
    .sort((a, b) => b.bet.edge - a.bet.edge);
}

// Combo/accumulator generation, per the README's four pools:
// "segura"/"valor" pull straight from the respective sorted list (no
// duplicate events); "mista" interleaves both lists; "ia" scores every safe
// pick by its probability (0-100) and every value pick by 50 + edge, then
// takes the top N by score across both pools — ties keep list order (JS
// sort is stable).
export function generateCombo(events, pool, count) {
  const safe = getSafeBets(events);
  const value = getValueBets(events);
  const legFromSafe = ({ event, bet }) => ({
    event: `${event.teamA} vs ${event.teamB}`,
    market: bet.market,
    outcome: bet.outcome,
    odd: bet.odd,
    tag: 'Segura',
  });
  const legFromValue = ({ event, bet }) => ({
    event: `${event.teamA} vs ${event.teamB}`,
    market: bet.market,
    outcome: bet.outcome,
    odd: bet.odd,
    tag: 'Valor',
  });

  const used = new Set();
  const chosen = [];

  if (pool === 'segura') {
    for (const x of safe) {
      if (used.has(x.event.id)) continue;
      used.add(x.event.id);
      chosen.push(legFromSafe(x));
      if (chosen.length >= count) break;
    }
  } else if (pool === 'valor') {
    for (const x of value) {
      if (used.has(x.event.id)) continue;
      used.add(x.event.id);
      chosen.push(legFromValue(x));
      if (chosen.length >= count) break;
    }
  } else if (pool === 'mista') {
    let i = 0;
    let j = 0;
    while (chosen.length < count && (i < safe.length || j < value.length)) {
      if (i < safe.length) {
        if (!used.has(safe[i].event.id)) {
          used.add(safe[i].event.id);
          chosen.push(legFromSafe(safe[i]));
        }
        i += 1;
        if (chosen.length >= count) break;
      }
      if (j < value.length) {
        if (!used.has(value[j].event.id)) {
          used.add(value[j].event.id);
          chosen.push(legFromValue(value[j]));
        }
        j += 1;
        if (chosen.length >= count) break;
      }
      if (i >= safe.length && j >= value.length) break;
    }
  } else {
    const scored = [
      ...safe.map((x) => ({ x, score: x.bet.predProb * 100, type: 'safe' })),
      ...value.map((x) => ({ x, score: 50 + x.bet.edge, type: 'value' })),
    ].sort((a, b) => b.score - a.score);
    for (const s of scored) {
      if (used.has(s.x.event.id)) continue;
      used.add(s.x.event.id);
      chosen.push(s.type === 'safe' ? legFromSafe(s.x) : legFromValue(s.x));
      if (chosen.length >= count) break;
    }
  }

  const totalOdd = chosen.reduce((acc, leg) => acc * leg.odd, 1);
  return { legs: chosen, totalOdd: chosen.length ? totalOdd.toFixed(2) : null };
}

export function confidenceLabel(predProb) {
  if (predProb >= 0.6) return 'Alta';
  if (predProb >= 0.45) return 'Média';
  return 'Baixa';
}

export function formatDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}
