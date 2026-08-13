import { generateCombo, getValueBets, makeComboLeg, comboTotals } from './predictions.js';

const STORAGE_KEY = 'oddscout_bankroll_v1';

// Thin/rarely-quoted markets (e.g. a boxing "Empate" a couple of books
// happen to price at 30+) can show a huge apparent edge without being a real
// bet anyone would place. Capping the odd per leg keeps the auto-generated
// "arriscada" tip risky-but-sane instead of accidentally combining several
// longshots into a combo with a nonsense total odd.
const MAX_RISKY_LEG_ODD = 8;

function buildRiskyCombo(events, count) {
  const used = new Set();
  const legs = [];
  for (const { event, bet } of getValueBets(events)) {
    if (bet.odd > MAX_RISKY_LEG_ODD) continue;
    if (used.has(event.id)) continue;
    used.add(event.id);
    legs.push(makeComboLeg(event, bet, 'Valor'));
    if (legs.length >= count) break;
  }
  return { legs, ...comboTotals(legs) };
}

const EMPTY_STATE = {
  startingBankroll: null,
  stakePercent: 5,
  tips: [],
};

// Safety throttle, not a "strategy" — it only ever shrinks stakes after
// losses, never grows them after wins. If the bankroll falls below 70% of
// where it started, new tips stake at half the usual %, until it recovers.
// This is the opposite of chasing losses (martingale-style stake escalation
// is exactly what this project explicitly will not build).
export const DRAWDOWN_THRESHOLD = 0.7;
export const DRAWDOWN_STAKE_MULTIPLIER = 0.5;

// Minimum settled tips before win-rate/ROI numbers are treated as meaningful
// rather than noise — see getStats().
const MIN_SAMPLE_SIZE = 20;

export function loadBankrollState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STATE };
    const parsed = JSON.parse(raw);
    return { ...EMPTY_STATE, ...parsed };
  } catch {
    // Corrupted/unavailable localStorage (private browsing, quota, bad JSON)
    // — fall back to a fresh state rather than crashing the screen.
    return { ...EMPTY_STATE };
  }
}

export function saveBankrollState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write failures (e.g. private browsing) — state stays in memory
    // for the rest of this session even if it can't persist.
  }
}

// Always derived from history, never stored as a standalone number — avoids
// the current bankroll drifting out of sync with what the settled tips
// actually say happened.
export function getCurrentBankroll(state) {
  const base = state.startingBankroll ?? 0;
  return state.tips.reduce((total, tip) => {
    if (tip.status === 'ganhou') return total + tip.stake * (tip.totalOdd - 1);
    if (tip.status === 'perdeu') return total - tip.stake;
    return total;
  }, base);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// True once the bankroll has dropped below DRAWDOWN_THRESHOLD of where it
// started — the point at which new tips stake at a reduced %.
export function isDrawdownActive(state) {
  if (!state.startingBankroll) return false;
  return getCurrentBankroll(state) < state.startingBankroll * DRAWDOWN_THRESHOLD;
}

// Idempotent — safe to call on every visit to the Banca screen. Only
// generates a new pair when today doesn't already have tips.
export function generateDailyTips(events, state) {
  const today = todayStr();
  if (state.tips.some((tip) => tip.date === today)) return state;

  const bankroll = getCurrentBankroll(state);
  const stakeReduced = isDrawdownActive(state);
  const effectivePercent = stakeReduced ? state.stakePercent * DRAWDOWN_STAKE_MULTIPLIER : state.stakePercent;
  const stake = Math.round(bankroll * (effectivePercent / 100) * 100) / 100;

  const generators = [
    { pool: 'segura', build: () => generateCombo(events, 'segura', 4) },
    { pool: 'valor', build: () => buildRiskyCombo(events, 7) },
  ];

  const newTips = generators
    .map(({ pool, build }) => {
      const combo = build();
      if (combo.legs.length === 0) return null;
      return {
        id: `${today}-${pool}`,
        date: today,
        pool,
        legs: combo.legs,
        totalOdd: Number(combo.totalOdd),
        totalProb: combo.totalProb,
        stake,
        stakeReduced,
        status: 'pendente',
        settledAt: null,
      };
    })
    .filter(Boolean);

  return { ...state, tips: [...newTips, ...state.tips] };
}

export function settleTip(state, tipId, won) {
  return {
    ...state,
    tips: state.tips.map((tip) =>
      tip.id === tipId
        ? { ...tip, status: won ? 'ganhou' : 'perdeu', settledAt: new Date().toISOString() }
        : tip,
    ),
  };
}

export function setupBankroll(state, startingBankroll, stakePercent) {
  return { ...state, startingBankroll, stakePercent };
}

function summarize(tips) {
  const settled = tips.filter((tip) => tip.status !== 'pendente');
  const wins = settled.filter((tip) => tip.status === 'ganhou');
  const totalStaked = settled.reduce((sum, tip) => sum + tip.stake, 0);
  const profit = settled.reduce(
    (sum, tip) => sum + (tip.status === 'ganhou' ? tip.stake * (tip.totalOdd - 1) : -tip.stake),
    0,
  );
  return {
    settled: settled.length,
    wins: wins.length,
    winRate: settled.length > 0 ? wins.length / settled.length : null,
    profit,
    roi: totalStaked > 0 ? profit / totalStaked : null,
    lowSample: settled.length < MIN_SAMPLE_SIZE,
  };
}

// Win rate / ROI per pool, plus overall — each flagged with `lowSample` below
// MIN_SAMPLE_SIZE settled tips so the UI can caveat numbers that aren't
// meaningful yet instead of presenting early noise as a trend.
export function getStats(state) {
  return {
    overall: summarize(state.tips),
    byPool: {
      segura: summarize(state.tips.filter((tip) => tip.pool === 'segura')),
      valor: summarize(state.tips.filter((tip) => tip.pool === 'valor')),
    },
    minSampleSize: MIN_SAMPLE_SIZE,
  };
}
