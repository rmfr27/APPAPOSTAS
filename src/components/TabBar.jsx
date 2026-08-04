import './TabBar.css';

const TABS = [
  { id: 'inicio', label: 'Início' },
  { id: 'explorar', label: 'Explorar' },
  { id: 'combos', label: 'Combos' },
  { id: 'favoritos', label: 'Favoritos' },
  { id: 'perfil', label: 'Perfil' },
];

export default function TabBar({ active, onSelect }) {
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-bar__item${tab.id === active ? ' tab-bar__item--active' : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export { TABS };
