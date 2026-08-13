import './CornerCard.css';

// Rounded card, plain border with a soft shadow — `highlighted` adds a gold
// glow for emphasis (recommended bet, etc.).
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
      {children}
    </div>
  );
}
