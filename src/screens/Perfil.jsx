import { BOOKMAKERS } from '../data/events.js';
import './Perfil.css';

export default function Perfil({ preferredBooks, onToggleBook }) {
  return (
    <div className="perfil">
      <h1 className="perfil__title heading">Perfil</h1>

      <div className="perfil__account">
        <div className="perfil__avatar heading">JP</div>
        <div>
          <div className="perfil__name heading">João Pereira</div>
          <div className="perfil__email">joao.pereira@email.com</div>
        </div>
      </div>

      <div className="perfil__label">Casas de apostas preferidas</div>
      <div className="perfil__books">
        {BOOKMAKERS.map((book) => (
          <button
            key={book}
            type="button"
            className={`book-toggle${!preferredBooks || preferredBooks.includes(book) ? ' book-toggle--on' : ''}`}
            onClick={() => onToggleBook(book)}
          >
            {book}
          </button>
        ))}
      </div>

      <div className="perfil__responsible">
        <div className="perfil__responsible-title heading">Jogo Responsável</div>
        <p className="perfil__responsible-text">
          O jogo pode ser viciante. Define limites de tempo e valor, e joga sempre com moderação. Apoio: linha SICAD 1414.
        </p>
        <button type="button" className="perfil__limits-button">
          Definir limites
        </button>
      </div>

      <button type="button" className="perfil__signout">
        Terminar sessão
      </button>
      <div className="perfil__footer">OddScout v1.0 · dados apenas ilustrativos</div>
    </div>
  );
}
