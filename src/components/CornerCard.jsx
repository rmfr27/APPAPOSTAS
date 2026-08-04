import './CornerCard.css';

// Bordered card with four 11x11px "+" registration marks at each corner —
// the recurring "blueprint" motif used across OddScout's cards.
export default function CornerCard({ children, className = '', highlighted = false, onClick, ...rest }) {
  const classes = ['corner-card', highlighted ? 'corner-card--highlight' : '', className]
    .filter(Boolean)
    .join(' ');

  function handleKeyDown(e) {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  }

  return (
    <div className={classes} onClick={onClick} onKeyDown={onClick ? handleKeyDown : undefined} {...rest}>
      <i className="corner-tick corner-tick--tl" />
      <i className="corner-tick corner-tick--tr" />
      <i className="corner-tick corner-tick--bl" />
      <i className="corner-tick corner-tick--br" />
      {children}
    </div>
  );
}
