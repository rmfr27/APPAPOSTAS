import { useState } from 'react';
import BackButton from '../components/BackButton.jsx';
import CornerCard from '../components/CornerCard.jsx';
import { SPORTS, events } from '../data/events.js';
import {
  bestOdd,
  bestEdgeForEvent,
  favoriteOutcome,
  impliedProbability,
  confidenceLabel,
  formatDate,
} from '../lib/predictions.js';
import './Detalhe.css';

export default function Detalhe({ eventId, onBack, favorites, onToggleFavorite, preferredBooks = null }) {
  const [activeMarketIndex, setActiveMarketIndex] = useState(0);
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    return (
      <div className="detalhe">
        <header className="detalhe__header">
          <BackButton onClick={onBack} />
        </header>
        <p>Evento não encontrado.</p>
      </div>
    );
  }

  const isFavorite = favorites.includes(event.id);
  const mainMarket = event.markets[0];
  const mainFavorite = favoriteOutcome(mainMarket);
  const recommended = bestEdgeForEvent(event);
  const isValueBet = recommended.edge >= 5;

  const activeMarket = event.markets[activeMarketIndex];
  const heroOutcome = favoriteOutcome(activeMarket);
  const heroOdd = bestOdd(heroOutcome);

  // Bookmaker columns for the odds table: whichever books actually quote
  // this market, most-covered first — sparse handicap/totals lines mean not
  // every book appears on every outcome. `preferredBooks` (from a future
  // Perfil screen) narrows this down when set; until then, show everything.
  const bookCoverage = new Map();
  activeMarket.outcomes.forEach((outcome) => {
    Object.keys(outcome.odds).forEach((book) => {
      bookCoverage.set(book, (bookCoverage.get(book) || 0) + 1);
    });
  });
  const availableBooks = Array.from(bookCoverage.keys()).sort(
    (a, b) => bookCoverage.get(b) - bookCoverage.get(a),
  );
  const visibleBooks = preferredBooks
    ? availableBooks.filter((book) => preferredBooks.includes(book))
    : availableBooks;

  const recommendedImplied = impliedProbability(recommended.odd);
  const rationale = `A IA atribui ${Math.round(recommended.predProb * 100)}% de probabilidade a "${recommended.outcome}" (${recommended.market}), ${
    recommended.edge >= 0 ? 'acima' : 'abaixo'
  } dos ${recommendedImplied.toFixed(0)}% implícitos pela melhor odd disponível, ${recommended.odd.toFixed(2)} na ${recommended.bookmaker}.`;

  return (
    <div className="detalhe">
      <header className="detalhe__header">
        <BackButton onClick={onBack} />
        <button type="button" className="detalhe__fav" onClick={() => onToggleFavorite(event.id)}>
          {isFavorite ? '★ Favorito' : '☆ Favoritar'}
        </button>
      </header>

      <span className="tag">
        {SPORTS.find((s) => s.id === event.sport)?.label} · {event.competition}
      </span>
      <h1 className="detalhe__title heading">
        {event.teamA} vs {event.teamB}
      </h1>
      <div className="detalhe__date">{formatDate(event.date)}</div>

      <CornerCard className="detalhe__card">
        <div className="detalhe__card-header">
          <h2 className="detalhe__card-title heading">Previsão IA</h2>
          <span className="badge">{confidenceLabel(mainFavorite.predProb)}</span>
        </div>
        {mainMarket.outcomes.map((outcome) => (
          <div key={outcome.label} className="prob-row">
            <div className="prob-row__top">
              <span>{outcome.label}</span>
              <span>{Math.round(outcome.predProb * 100)}%</span>
            </div>
            <div className="prob-row__track">
              <div className="prob-row__fill" style={{ width: `${outcome.predProb * 100}%` }} />
            </div>
          </div>
        ))}
      </CornerCard>

      <CornerCard highlighted className="detalhe__card">
        <div className="detalhe__card-header">
          <h2 className="detalhe__card-title heading">Aposta recomendada pela IA</h2>
          {isValueBet && <span className="tag tag--value">Valor</span>}
        </div>
        <div className="recommended__market">
          {recommended.market}: {recommended.outcome}
        </div>
        <div className="recommended__odd heading">
          {recommended.odd.toFixed(2)} · {recommended.bookmaker}
        </div>
        <p className="recommended__rationale">{rationale}</p>
      </CornerCard>

      <div className="hero-stat">
        <span className="hero-stat__label">Melhor odd agora ({activeMarket.name})</span>
        <span className="hero-stat__value heading">{heroOdd.odd.toFixed(2)}</span>
      </div>

      <div className="market-tabs">
        {event.markets.map((market, index) => (
          <button
            key={market.name}
            type="button"
            className={`market-tab${index === activeMarketIndex ? ' market-tab--active' : ''}`}
            onClick={() => setActiveMarketIndex(index)}
          >
            {market.name}
          </button>
        ))}
      </div>

      <CornerCard className="detalhe__card odds-card">
        {visibleBooks.length === 0 ? (
          <p className="odds-empty">
            Sem casas de apostas selecionadas. Ative pelo menos uma em Perfil para comparar odds.
          </p>
        ) : (
          <table className="odds-table">
            <thead>
              <tr>
                <th></th>
                {visibleBooks.map((book) => (
                  <th key={book}>{book}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeMarket.outcomes.map((outcome) => {
                const visibleOdds = visibleBooks
                  .map((book) => outcome.odds[book])
                  .filter((value) => value != null);
                const maxOdd = visibleOdds.length > 0 ? Math.max(...visibleOdds) : null;
                return (
                  <tr key={outcome.label}>
                    <td>{outcome.label}</td>
                    {visibleBooks.map((book) => {
                      const value = outcome.odds[book];
                      if (value == null) return <td key={book}>—</td>;
                      return (
                        <td key={book} className={value === maxOdd ? 'odds-table__best' : ''}>
                          {value.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CornerCard>

      <p className="detalhe__legal">
        As odds são indicativas e podem variar. Aposte com responsabilidade. Proibido a menores de 18 anos.
      </p>
    </div>
  );
}
