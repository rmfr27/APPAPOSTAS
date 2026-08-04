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

export function getUpcoming(events) {
  return [...events]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((event) => ({ event, best: bestEdgeForEvent(event) }));
}

export function formatDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}
