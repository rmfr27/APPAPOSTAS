import './CornerCard.css';

// Bordered card with four 11x11px "+" registration marks at each corner —
// the recurring "blueprint" motif used across OddScout's cards.
export default function CornerCard({ children, className = '', highlighted = false, ...rest }) {
  const classes = ['corner-card', highlighted ? 'corner-card--highlight' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      <i className="corner-tick corner-tick--tl" />
      <i className="corner-tick corner-tick--tr" />
      <i className="corner-tick corner-tick--bl" />
      <i className="corner-tick corner-tick--br" />
      {children}
    </div>
  );
}
