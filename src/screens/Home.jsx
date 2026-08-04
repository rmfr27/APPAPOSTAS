import CornerCard from '../components/CornerCard.jsx';
import { SPORTS, events } from '../data/events.js';
import { getValueHighlights, getUpcoming, formatDate } from '../lib/predictions.js';
import './Home.css';

export default function Home({ onSelectSport }) {
  const highlights = getValueHighlights(events);
  const upcoming = getUpcoming(events).slice(0, 5);

  return (
    <div className="home">
      <header className="home__header">
        <span className="home__wordmark heading">OddScout</span>
        <button type="button" className="home__avatar" aria-label="Perfil">
          JP
        </button>
      </header>
      <p className="home__subtitle">Compare odds, siga a IA, monte o seu combinado.</p>

      <div className="home__sport-row">
        {SPORTS.map((sport) => (
          <button
            key={sport.id}
            type="button"
            className="sport-chip"
            onClick={() => onSelectSport(sport.id)}
          >
            {sport.label}
          </button>
        ))}
      </div>

      <section className="home__section">
        <h2 className="home__section-title heading">Destaques de valor</h2>
        <div className="home__highlights">
          {highlights.map(({ event, best }) => (
            <CornerCard key={event.id} className="highlight-card">
              <div className="highlight-card__top">
                <span className="tag">{event.competition}</span>
                <span className="tag tag--value">
                  {best.market}: {best.outcome} · +{best.edge.toFixed(0)}pp
                </span>
              </div>
              <div className="highlight-card__title heading">
                {event.teamA} vs {event.teamB}
              </div>
              <div className="highlight-card__date">{formatDate(event.date)}</div>
              <div className="highlight-card__bottom">
                <span className="highlight-card__prediction">
                  IA: {best.outcome} ({Math.round(best.predProb * 100)}%)
                </span>
                <span className="highlight-card__odd heading">
                  {best.odd.toFixed(2)} · {best.bookmaker}
                </span>
              </div>
            </CornerCard>
          ))}
        </div>
      </section>

      <section className="home__section">
        <h2 className="home__section-title heading">Próximos eventos</h2>
        <div className="upcoming-list">
          {upcoming.map(({ event, best }) => (
            <div key={event.id} className="upcoming-row">
              <div className="upcoming-row__meta">
                {SPORTS.find((s) => s.id === event.sport)?.label} · {event.competition}
              </div>
              <div className="upcoming-row__title">
                {event.teamA} vs {event.teamB}
              </div>
              <div className="upcoming-row__date">{formatDate(event.date)}</div>
              <div className="upcoming-row__odd heading">{best.odd.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
