import { useState } from 'react';
import CornerCard from '../components/CornerCard.jsx';
import { events } from '../data/events.js';
import {
  loadBankrollState,
  saveBankrollState,
  generateDailyTips,
  regenerateDailyTips,
  settleTip,
  setupBankroll,
  getCurrentBankroll,
  todayStr,
  isDrawdownActive,
  getStats,
  DRAWDOWN_THRESHOLD,
} from '../lib/bankroll.js';
import './Banca.css';

const POOL_LABELS = { segura: 'Segura', valor: 'Arriscada' };

export default function Banca() {
  const [state, setState] = useState(() => {
    const loaded = loadBankrollState();
    if (loaded.startingBankroll == null) return loaded;
    const withTips = generateDailyTips(events, loaded);
    if (withTips !== loaded) saveBankrollState(withTips);
    return withTips;
  });

  function persist(next) {
    setState(next);
    saveBankrollState(next);
  }

  if (state.startingBankroll == null) {
    return (
      <BancaSetup
        onSetup={(bankroll, stakePercent) => {
          persist(generateDailyTips(events, setupBankroll(state, bankroll, stakePercent)));
        }}
      />
    );
  }

  const currentBankroll = getCurrentBankroll(state);
  const profit = currentBankroll - state.startingBankroll;
  const settled = state.tips.filter((tip) => tip.status !== 'pendente');
  const wins = settled.filter((tip) => tip.status === 'ganhou').length;
  const today = todayStr();
  const todayTips = state.tips.filter((tip) => tip.date === today);
  const pastTips = state.tips.filter((tip) => tip.date !== today);
  const drawdown = isDrawdownActive(state);
  const stats = getStats(state);

  const canRegenerate = todayTips.length > 0 && todayTips.every((tip) => tip.status === 'pendente');

  function handleRegenerate() {
    persist(regenerateDailyTips(events, state));
  }

  function handleSettle(tipId, won) {
    persist(settleTip(state, tipId, won));
  }

  return (
    <div className="banca">
      <h1 className="banca__title heading">Banca</h1>
      <p className="banca__disclaimer">Ferramenta de disciplina e registo — não é garantia de lucro.</p>

      {drawdown && (
        <p className="banca__drawdown-banner">
          Modo de proteção ativo — a banca está abaixo de {Math.round(DRAWDOWN_THRESHOLD * 100)}% da inicial, por
          isso as tips de hoje usam metade do stake habitual até recuperar.
        </p>
      )}

      <div className="banca__stats">
        <div className="banca__stat">
          <span className="banca__stat-label">Banca atual</span>
          <span className="banca__stat-value heading">{currentBankroll.toFixed(2)}€</span>
        </div>
        <div className="banca__stat">
          <span className="banca__stat-label">Resultado acumulado</span>
          <span
            className={`banca__stat-value heading ${profit >= 0 ? 'banca__stat-value--positive' : 'banca__stat-value--negative'}`}
          >
            {profit >= 0 ? '+' : ''}
            {profit.toFixed(2)}€
          </span>
        </div>
        <div className="banca__stat">
          <span className="banca__stat-label">Tips resolvidas</span>
          <span className="banca__stat-value heading">
            {wins}/{settled.length}
          </span>
        </div>
      </div>

      <div className="banca__section-header">
        <h2 className="banca__section-title heading">Tips de hoje (eventos de amanhã)</h2>
        {canRegenerate && (
          <button type="button" className="banca__regenerate-btn" onClick={handleRegenerate}>
            ↻ Gerar novas
          </button>
        )}
      </div>
      {todayTips.length === 0 ? (
        <p className="banca__empty">Sem eventos suficientes amanhã para gerar tips.</p>
      ) : (
        <div className="banca__tips">
          {todayTips.map((tip) => (
            <TipCard key={tip.id} tip={tip} onSettle={handleSettle} />
          ))}
        </div>
      )}

      {stats.overall.settled > 0 && (
        <>
          <h2 className="banca__section-title heading">Estatísticas</h2>
          <div className="banca__stats-grid">
            <StatRow label="Geral" stat={stats.overall} minSampleSize={stats.minSampleSize} />
            <StatRow label="Segura" stat={stats.byPool.segura} minSampleSize={stats.minSampleSize} />
            <StatRow label="Arriscada" stat={stats.byPool.valor} minSampleSize={stats.minSampleSize} />
          </div>
        </>
      )}

      {pastTips.length > 0 && (
        <>
          <h2 className="banca__section-title heading">Histórico</h2>
          <div className="banca__history">
            {pastTips.map((tip) => (
              <HistoryRow key={tip.id} tip={tip} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TipCard({ tip, onSettle }) {
  return (
    <CornerCard className="banca__tip-card">
      <div className="banca__tip-header">
        <span className="tag">{POOL_LABELS[tip.pool]}</span>
        <span className="banca__tip-stake heading">
          {tip.stake.toFixed(2)}€{tip.stakeReduced ? ' (reduzido)' : ''}
        </span>
      </div>
      <div className="combo-legs">
        {tip.legs.map((leg, index) => (
          <div key={`${leg.event}-${index}`} className="combo-leg">
            <div className="combo-leg__top">
              <span className="combo-leg__event">{leg.event}</span>
            </div>
            <div className="combo-leg__bottom">
              <span className="combo-leg__pick heading">
                {leg.market}: {leg.outcome}
              </span>
              <span className="combo-leg__odd heading">{leg.odd.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="combo-total">
        <span className="combo-total__label">Odd total</span>
        <span className="combo-total__value heading">{tip.totalOdd.toFixed(2)}</span>
      </div>
      {tip.status === 'pendente' ? (
        <div className="banca__settle-buttons">
          <button
            type="button"
            className="banca__settle-btn banca__settle-btn--win"
            onClick={() => onSettle(tip.id, true)}
          >
            ✓ Acertei
          </button>
          <button
            type="button"
            className="banca__settle-btn banca__settle-btn--loss"
            onClick={() => onSettle(tip.id, false)}
          >
            ✗ Falhei
          </button>
        </div>
      ) : (
        <div className={`banca__result banca__result--${tip.status === 'ganhou' ? 'win' : 'loss'}`}>
          {tip.status === 'ganhou'
            ? `Ganhou +${(tip.stake * (tip.totalOdd - 1)).toFixed(2)}€`
            : `Perdeu -${tip.stake.toFixed(2)}€`}
        </div>
      )}
    </CornerCard>
  );
}

function HistoryRow({ tip }) {
  const effect =
    tip.status === 'ganhou' ? tip.stake * (tip.totalOdd - 1) : tip.status === 'perdeu' ? -tip.stake : 0;
  return (
    <div className="banca__history-row">
      <div className="banca__history-info">
        <span className="banca__history-date">
          {tip.date} · {POOL_LABELS[tip.pool]}
        </span>
        <span className="banca__history-legs">
          {tip.legs.length} pernas · odd {tip.totalOdd.toFixed(2)}
        </span>
      </div>
      <span
        className={`banca__history-effect ${effect >= 0 ? 'banca__history-effect--positive' : 'banca__history-effect--negative'}`}
      >
        {tip.status === 'pendente' ? 'Pendente' : `${effect >= 0 ? '+' : ''}${effect.toFixed(2)}€`}
      </span>
    </div>
  );
}

function StatRow({ label, stat, minSampleSize }) {
  if (stat.settled === 0) return null;
  return (
    <div className="banca__stats-row">
      <div className="banca__stats-row-top">
        <span className="banca__stats-row-label heading">{label}</span>
        <span className="banca__stats-row-count">
          {stat.wins}/{stat.settled} acertos
        </span>
      </div>
      <div className="banca__stats-row-bottom">
        <span
          className={`banca__stats-row-value ${stat.roi >= 0 ? 'banca__stats-row-value--positive' : 'banca__stats-row-value--negative'}`}
        >
          ROI {stat.roi >= 0 ? '+' : ''}
          {(stat.roi * 100).toFixed(1)}%
        </span>
        <span className="banca__stats-row-value">Taxa de acerto {(stat.winRate * 100).toFixed(0)}%</span>
      </div>
      {stat.lowSample && (
        <p className="banca__stats-row-caveat">
          Amostra ainda pequena ({stat.settled}/{minSampleSize}+) — estes números ainda não são conclusivos.
        </p>
      )}
    </div>
  );
}

function BancaSetup({ onSetup }) {
  const [bankroll, setBankroll] = useState('');
  const [stakePercent, setStakePercent] = useState('5');

  function handleSubmit(e) {
    e.preventDefault();
    const bankrollNum = parseFloat(bankroll);
    const stakeNum = parseFloat(stakePercent);
    if (!(bankrollNum > 0) || !(stakeNum > 0)) return;
    onSetup(bankrollNum, stakeNum);
  }

  return (
    <div className="banca">
      <h1 className="banca__title heading">Banca</h1>
      <p className="banca__disclaimer">Ferramenta de disciplina e registo — não é garantia de lucro.</p>
      <form className="banca__setup" onSubmit={handleSubmit}>
        <label className="banca__setup-label" htmlFor="banca-inicial">
          Banca inicial (€)
        </label>
        <input
          id="banca-inicial"
          className="banca__setup-input"
          type="number"
          min="1"
          step="0.01"
          value={bankroll}
          onChange={(e) => setBankroll(e.target.value)}
          required
        />
        <label className="banca__setup-label" htmlFor="stake-percent">
          % da banca por aposta
        </label>
        <input
          id="stake-percent"
          className="banca__setup-input"
          type="number"
          min="1"
          max="100"
          step="0.5"
          value={stakePercent}
          onChange={(e) => setStakePercent(e.target.value)}
          required
        />
        <button type="submit" className="banca__setup-submit">
          Começar
        </button>
      </form>
    </div>
  );
}
