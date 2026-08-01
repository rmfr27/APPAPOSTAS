export default function Placeholder({ label }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
        {label} — em breve.
      </p>
    </div>
  );
}
