import { useState } from 'react';
import CornerCard from '../components/CornerCard.jsx';
import { SPORTS, events } from '../data/events.js';
import { searchEvents, getRankedPredictions, bestOddMainMarket, confidenceLabel, formatDate } from '../lib/predictions.js';
import './Explorar.css';

export default function Explorar({ onSelectSport, onOpenEvent }) {
  const [query, setQuery] = useState('');
  const hasQuery = query.trim().length > 0;
  const results = hasQuery ? searchEvents(events, query) : [];
  const ranked = hasQuery ? [] : getRankedPredictions(events);
  const sportCounts = SPORTS.map((sport) => ({
    ...sport,
    count: events.filter((event) => event.sport === sport.id).length,
  }));

  return (
    <div className="explorar">
      <h1 className="explorar__title heading">Explorar</h1>
      <input
        type="text"
        className="explorar__search"
        placeholder="Procurar equipa ou jogador"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {hasQuery ? (
        <>
          <div className="explorar__results-count">
            {results.length} resultado{results.length === 1 ? '' : 's'}
          </div>
          <div className="search-list">
            {results.map((event) => {
              const { odd } = bestOddMainMarket(event);
              return (
                <div
                  key={event.id}
                  className="search-row"
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
                  <div className="search-row__meta">
                    {SPORTS.find((s) => s.id === event.sport)?.label} · {event.competition}
                  </div>
                  <div className="search-row__title">
                    {event.teamA} vs {event.teamB}
                  </div>
                  <div className="search-row__date">{formatDate(event.date)}</div>
                  <div className="search-row__odd heading">{odd.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="explorar__section-header">
            <h2 className="explorar__section-title heading">Melhores previsões da IA</h2>
            <span className="explorar__section-hint">ordenadas por confiança + valor</span>
          </div>
          <div className="ranked-list">
            {ranked.map(({ event, favorite, recommended }) => (
              <CornerCard
                key={event.id}
                className="ranked-card"
                onClick={() => onOpenEvent(event.id)}
                role="button"
                tabIndex={0}
              >
                <div className="ranked-card__top">
                  <span className="ranked-card__sport">
                    {SPORTS.find((s) => s.id === event.sport)?.label}
                  </span>
                  <span className="confidence-badge">Confiança {confidenceLabel(favorite.predProb)}</span>
                </div>
                <div className="ranked-card__title heading">
                  {event.teamA} vs {event.teamB}
                </div>
                <div className="ranked-card__rec">
                  Melhor aposta: {recommended.market} — {recommended.outcome}
                </div>
                <div className="ranked-card__bottom">
                  <span className="ranked-card__pred">
                    IA: <strong>{recommended.outcome} ({Math.round(recommended.predProb * 100)}%)</strong>
                  </span>
                  {recommended.edge >= 5 && (
                    <span className="tag tag--value">+{recommended.edge.toFixed(0)}pp valor</span>
                  )}
                </div>
              </CornerCard>
            ))}
          </div>

          <div className="explorar__sport-label">ou escolhe uma modalidade</div>
          <div className="sport-list">
            {sportCounts.map((sport) => (
              <CornerCard
                key={sport.id}
                className="sport-card"
                onClick={() => onSelectSport(sport.id)}
                role="button"
                tabIndex={0}
              >
                <span className="sport-card__name heading">{sport.label}</span>
                <span className="sport-card__count">{sport.count} eventos</span>
              </CornerCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
