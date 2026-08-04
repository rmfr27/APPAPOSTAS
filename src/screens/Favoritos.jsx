import CornerCard from '../components/CornerCard.jsx';
import { SPORTS, events } from '../data/events.js';
import { bestOddMainMarket, formatDate } from '../lib/predictions.js';
import './Favoritos.css';

export default function Favoritos({ favorites, onOpenEvent }) {
  const list = events.filter((event) => favorites.includes(event.id));

  return (
    <div className="favoritos">
      <h1 className="favoritos__title heading">Favoritos</h1>

      {list.length > 0 ? (
        <div className="favoritos__list">
          {list.map((event) => {
            const { odd } = bestOddMainMarket(event);
            return (
              <CornerCard
                key={event.id}
                className="favoritos__card"
                onClick={() => onOpenEvent(event.id)}
                role="button"
                tabIndex={0}
              >
                <span className="tag">
                  {SPORTS.find((s) => s.id === event.sport)?.label} · {event.competition}
                </span>
                <div className="favoritos__card-title heading">
                  {event.teamA} vs {event.teamB}
                </div>
                <div className="favoritos__card-bottom">
                  <span className="favoritos__card-date">{formatDate(event.date)}</span>
                  <span className="favoritos__card-odd heading">{odd.toFixed(2)}</span>
                </div>
              </CornerCard>
            );
          })}
        </div>
      ) : (
        <div className="favoritos__empty">
          Ainda sem favoritos.
          <br />
          Toca em "☆ Favoritar" num evento para o guardar aqui.
        </div>
      )}
    </div>
  );
}
