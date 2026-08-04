import './Logo.css';

// The app's mark: the same corner-tick "viewfinder" motif used by
// CornerCard throughout the app, framing a single dot — scouting for
// the odd worth taking.
export default function Logo({ className = '' }) {
  return (
    <svg
      className={`logo-mark ${className}`.trim()}
      viewBox="0 0 32 32"
      role="img"
      aria-label="OddScout"
    >
      <path d="M2,10 L2,2 L10,2" className="logo-mark__bracket" />
      <path d="M22,2 L30,2 L30,10" className="logo-mark__bracket" />
      <path d="M2,22 L2,30 L10,30" className="logo-mark__bracket" />
      <path d="M30,22 L30,30 L22,30" className="logo-mark__bracket" />
      <circle cx="16" cy="16" r="4" className="logo-mark__dot" />
    </svg>
  );
}
