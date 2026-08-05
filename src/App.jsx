import { useState } from 'react';
import TabBar, { TABS } from './components/TabBar.jsx';
import Home from './screens/Home.jsx';
import Explorar from './screens/Explorar.jsx';
import Eventos from './screens/Eventos.jsx';
import Detalhe from './screens/Detalhe.jsx';
import Combos from './screens/Combos.jsx';
import Favoritos from './screens/Favoritos.jsx';
import Perfil from './screens/Perfil.jsx';
import Placeholder from './screens/Placeholder.jsx';
import { BOOKMAKERS } from './data/events.js';
import './App.css';

// Navigation model per the design handoff: `nav` (current screen + params)
// plus a `history` stack. Tab taps reset history (tab roots have no back
// button); `navigate` pushes the current nav onto history so `goBack` can
// pop it. Eventos and Detalhe are the only drill-down (non tab-root) screens
// implemented so far.
function App() {
  const [nav, setNav] = useState({ screen: 'inicio', params: {} });
  const [, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  // null = no preference set, so Detalhe shows every book an event actually
  // has odds from (real events don't use the fixed PT bookmaker names below,
  // so defaulting to BOOKMAKERS here would filter every live event's table
  // down to nothing). Perfil's toggles only narrow this once the user
  // actually turns one off — see toggleBook.
  const [preferredBooks, setPreferredBooks] = useState(null);
  // Lifted out of Combos so it survives tapping into Detalhe (e.g. to check
  // an event before picking it) and back — Combos itself unmounts on
  // navigation, which would otherwise wipe an in-progress combo.
  const [comboPool, setComboPool] = useState('mista');
  const [comboCount, setComboCount] = useState(3);
  const [combo, setCombo] = useState({ legs: [], totalOdd: null, totalProb: null });

  function setTab(tabId) {
    setHistory([]);
    setNav({ screen: tabId, params: {} });
  }

  function navigate(screen, params = {}) {
    setHistory((h) => [...h, nav]);
    setNav({ screen, params });
  }

  function goBack() {
    setHistory((h) => {
      if (h.length === 0) return h;
      setNav(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }

  function toggleFavorite(eventId) {
    setFavorites((favs) =>
      favs.includes(eventId) ? favs.filter((id) => id !== eventId) : [...favs, eventId],
    );
  }

  function toggleBook(book) {
    setPreferredBooks((books) => {
      // null reads as "every PT bookmaker is on" — the first toggle turns
      // that into a real list instead of computing against an empty set.
      const current = books ?? BOOKMAKERS;
      return current.includes(book) ? current.filter((b) => b !== book) : [...current, book];
    });
  }

  function renderScreen() {
    switch (nav.screen) {
      case 'inicio':
        return (
          <Home
            onSelectSport={(sport) => navigate('eventos', { sport })}
            onOpenEvent={(eventId) => navigate('detalhe', { eventId })}
          />
        );
      case 'explorar':
        return (
          <Explorar
            onSelectSport={(sport) => navigate('eventos', { sport })}
            onOpenEvent={(eventId) => navigate('detalhe', { eventId })}
          />
        );
      case 'eventos':
        return (
          <Eventos
            sport={nav.params.sport}
            onBack={goBack}
            onOpenEvent={(eventId) => navigate('detalhe', { eventId })}
          />
        );
      case 'detalhe':
        return (
          <Detalhe
            eventId={nav.params.eventId}
            onBack={goBack}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            preferredBooks={preferredBooks}
          />
        );
      case 'combos':
        return (
          <Combos
            onOpenEvent={(eventId) => navigate('detalhe', { eventId })}
            comboPool={comboPool}
            onComboPoolChange={setComboPool}
            comboCount={comboCount}
            onComboCountChange={setComboCount}
            combo={combo}
            onComboChange={setCombo}
          />
        );
      case 'favoritos':
        return (
          <Favoritos
            favorites={favorites}
            onOpenEvent={(eventId) => navigate('detalhe', { eventId })}
          />
        );
      case 'perfil':
        return <Perfil preferredBooks={preferredBooks} onToggleBook={toggleBook} />;
      default:
        return <Placeholder label={TABS.find((t) => t.id === nav.screen)?.label ?? nav.screen} />;
    }
  }

  return (
    <div className="phone-frame">
      {renderScreen()}
      <TabBar active={nav.screen} onSelect={setTab} />
    </div>
  );
}

export default App;
