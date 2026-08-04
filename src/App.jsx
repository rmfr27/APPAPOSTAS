import { useState } from 'react';
import TabBar, { TABS } from './components/TabBar.jsx';
import Home from './screens/Home.jsx';
import Explorar from './screens/Explorar.jsx';
import Eventos from './screens/Eventos.jsx';
import Detalhe from './screens/Detalhe.jsx';
import Combos from './screens/Combos.jsx';
import Placeholder from './screens/Placeholder.jsx';
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
  // Perfil (not built yet) will turn this into per-bookmaker toggle state;
  // null means "no preference set", so Detalhe shows every book the event
  // actually has odds from.
  const preferredBooks = null;

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
        return <Combos onOpenEvent={(eventId) => navigate('detalhe', { eventId })} />;
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
