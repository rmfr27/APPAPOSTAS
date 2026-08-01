import { useState } from 'react';
import TabBar, { TABS } from './components/TabBar.jsx';
import Home from './screens/Home.jsx';
import Placeholder from './screens/Placeholder.jsx';
import './App.css';

// Only Início is fully implemented so far — the other tab roots render a
// placeholder until their own screens land. The design handoff's full nav
// model also has a `history` push/pop stack for drilling into Eventos and
// Detalhe; that arrives with those screens.
function App() {
  const [screen, setScreen] = useState('inicio');

  function setTab(tabId) {
    setScreen(tabId);
  }

  function renderScreen() {
    switch (screen) {
      case 'inicio':
        return <Home onSelectSport={() => {}} />;
      default:
        return <Placeholder label={TABS.find((t) => t.id === screen)?.label ?? screen} />;
    }
  }

  return (
    <div className="phone-frame">
      {renderScreen()}
      <TabBar active={screen} onSelect={setTab} />
    </div>
  );
}

export default App;
