import BackButton from '../components/BackButton.jsx';
import CornerCard from '../components/CornerCard.jsx';
import { SPORTS, events } from '../data/events.js';
import { bestOddMainMarket, formatDate } from '../lib/predictions.js';
import './Eventos.css';

export default function Eventos({ sport, onBack, onOpenEvent }) {
  const sportLabel = SPORTS.find((s) => s.id === sport)?.label ?? sport;
  const list = events.filter((event) => event.sport === sport);

  return (
    <div className="eventos">
      <header className="eventos__header">
        <BackButton onClick={onBack} />
        <h1 className="eventos__title heading">{sportLabel}</h1>
      </header>
      <p className="eventos__subtitle">
        {list.length} evento{list.length === 1 ? '' : 's'}
      </p>

      <div className="eventos__list">
        {list.map((event) => {
          const { odd } = bestOddMainMarket(event);
          return (
            <CornerCard
              key={event.id}
              className="eventos__card"
              onClick={() => onOpenEvent(event.id)}
              role="button"
              tabIndex={0}
            >
              <span className="tag">{event.competition}</span>
              <div className="eventos__card-title heading">
                {event.teamA} vs {event.teamB}
              </div>
              <div className="eventos__card-bottom">
                <span className="eventos__card-date">{formatDate(event.date)}</span>
                <span className="eventos__card-odd heading">Melhor odd {odd.toFixed(2)}</span>
              </div>
            </CornerCard>
          );
        })}
      </div>
    </div>
  );
}
