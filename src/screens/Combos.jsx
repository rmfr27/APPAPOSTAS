import { useState } from 'react';
import CornerCard from '../components/CornerCard.jsx';
import { events } from '../data/events.js';
import { getSafeBets, getValueBets, generateCombo } from '../lib/predictions.js';
import './Combos.css';

const POOL_OPTIONS = [
  { key: 'segura', label: 'Seguras' },
  { key: 'valor', label: 'Valor' },
  { key: 'mista', label: 'Misturado' },
  { key: 'ia', label: 'IA escolhe' },
];

export default function Combos({ onOpenEvent }) {
  const [comboPool, setComboPool] = useState('mista');
  const [comboCount, setComboCount] = useState(3);
  const [combo, setCombo] = useState({ legs: [], totalOdd: null, totalProb: null });

  const safeBets = getSafeBets(events);
  const valueBets = getValueBets(events);

  function selectPool(pool) {
    setComboPool(pool);
    setCombo({ legs: [], totalOdd: null, totalProb: null });
  }

  function handleGenerate() {
    setCombo(generateCombo(events, comboPool, comboCount));
  }

  function removeLeg(index) {
    setCombo((prev) => {
      const legs = prev.legs.filter((_, i) => i !== index);
      if (legs.length === 0) return { legs: [], totalOdd: null, totalProb: null };
      const totalOdd = legs.reduce((acc, leg) => acc * leg.odd, 1);
      const totalProb = legs.reduce((acc, leg) => acc * leg.predProb, 1);
      return { legs, totalOdd: totalOdd.toFixed(2), totalProb };
    });
  }

  return (
    <div className="combos">
      <h1 className="combos__title heading">Seguras &amp; Valor</h1>
      <p className="combos__subtitle">Zonas de apostas e construtor de combinados</p>

      <div className="combos__section-header">
        <h2 className="combos__section-title heading">🛡 Apostas Seguras</h2>
        <span className="combos__section-hint">confiança IA ≥ 60%</span>
      </div>
      <div className="bet-list">
        {safeBets.map(({ event, bet }) => (
          <div
            key={event.id}
            className="bet-row"
            onClick={() => onOpenEvent(event.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenEvent(event.id);
              }
            }}
          >
            <div>
              <div className="bet-row__matchup">
                {event.teamA} vs {event.teamB}
              </div>
              <div className="bet-row__pick heading">
                {bet.market}: {bet.outcome}
              </div>
            </div>
            <div className="bet-row__stats">
              <div className="bet-row__prob">{Math.round(bet.predProb * 100)}%</div>
              <div className="bet-row__odd heading">{bet.odd.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="combos__section-header">
        <h2 className="combos__section-title heading">📈 Apostas de Valor</h2>
        <span className="combos__section-hint">vantagem ≥ 5pp vs. mercado</span>
      </div>
      <div className="bet-list bet-list--spaced">
        {valueBets.map(({ event, bet }) => (
          <div
            key={event.id}
            className="bet-row"
            onClick={() => onOpenEvent(event.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenEvent(event.id);
              }
            }}
          >
            <div>
              <div className="bet-row__matchup">
                {event.teamA} vs {event.teamB}
              </div>
              <div className="bet-row__pick heading">
                {bet.market}: {bet.outcome}
              </div>
            </div>
            <div className="bet-row__stats">
              <div className="bet-row__prob">+{bet.edge.toFixed(0)}pp</div>
              <div className="bet-row__odd heading">{bet.odd.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>

      <CornerCard className="combo-builder">
        <h2 className="combo-builder__title heading">Construtor de Combinados</h2>

        <div className="combo-builder__label">Origem das apostas</div>
        <div className="combo-builder__pools">
          {POOL_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`pool-button${option.key === comboPool ? ' pool-button--active' : ''}`}
              onClick={() => selectPool(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="combo-builder__stepper-row">
          <div className="combo-builder__label">Número de apostas no combinado</div>
          <div className="stepper">
            <button
              type="button"
              className="stepper__button"
              onClick={() => setComboCount((n) => Math.max(2, n - 1))}
            >
              −
            </button>
            <span className="stepper__count heading">{comboCount}</span>
            <button
              type="button"
              className="stepper__button"
              onClick={() => setComboCount((n) => Math.min(20, n + 1))}
            >
              +
            </button>
          </div>
        </div>

        <button type="button" className="combo-builder__generate" onClick={handleGenerate}>
          Gerar combinado
        </button>

        {combo.legs.length > 0 ? (
          <>
            <div className="combo-legs">
              {combo.legs.map((leg, index) => (
                <div key={`${leg.event}-${index}`} className="combo-leg">
                  <div className="combo-leg__top">
                    <span className="combo-leg__event">{leg.event}</span>
                    <span className="combo-leg__top-right">
                      <span className="combo-leg__tag">
                        {leg.tag} · {Math.round(leg.predProb * 100)}%
                      </span>
                      <button
                        type="button"
                        className="combo-leg__remove"
                        onClick={() => removeLeg(index)}
                        aria-label={`Remover ${leg.event} do combinado`}
                      >
                        ×
                      </button>
                    </span>
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
              <span className="combo-total__label">Odd total do combinado</span>
              <span className="combo-total__value heading">{combo.totalOdd}</span>
            </div>
            <div className="combo-total combo-total--prob">
              <span className="combo-total__label">
                Probabilidade combinada
                <span className="combo-total__hint"> (segundo o mercado/IA, pernas independentes)</span>
              </span>
              <span className="combo-total__value combo-total__value--prob heading">
                {Math.round(combo.totalProb * 100)}%
              </span>
            </div>
          </>
        ) : (
          <p className="combo-builder__empty">
            Escolhe a origem e o número de apostas, depois toca em "Gerar combinado".
          </p>
        )}
      </CornerCard>
    </div>
  );
}
