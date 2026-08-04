import './BackButton.css';

export default function BackButton({ onClick }) {
  return (
    <button type="button" className="back-button" onClick={onClick} aria-label="Voltar">
      ←
    </button>
  );
}
