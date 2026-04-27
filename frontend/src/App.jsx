import { useState } from "react";
import Usuarios from "./components/Usuarios";
import Lugares from "./components/Lugares";
import Expediciones from "./components/Expediciones";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function App() {
  const [tab, setTab] = useState("usuarios");

  if (!API_BASE) {
    return (
      <div className="app fallback-bg">
        <main className="container fallback-panel">
          <h1 className="horror-title">ARKHAM EXPEDITIONS</h1>
          <p className="error pulse">Señal de comunicación perdida.</p>
          <p className="hint">Configura VITE_API_URL en el comunicador (frontend/.env).</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="vignette"></div>
      
      <aside className="sidebar">
        <div className="brand">
          <h1 className="horror-title">ARKHAM</h1>
          <p className="subtitle">EXPEDITIONS</p>
          <div className="separator"></div>
        </div>
        
        <nav className="nav-menu">
          <button 
            className={`nav-btn ${tab === 'usuarios' ? 'active' : ''}`}
            onClick={() => setTab('usuarios')}
          >
            Investigadores
          </button>
          <button 
            className={`nav-btn ${tab === 'lugares' ? 'active' : ''}`}
            onClick={() => setTab('lugares')}
          >
            Ubicaciones Oscuras
          </button>
          <button 
            className={`nav-btn ${tab === 'expediciones' ? 'active' : ''}`}
            onClick={() => setTab('expediciones')}
          >
            Expediciones
          </button>
        </nav>
        
        <div className="status-footer">
          <div className="server-status">
            <span className="dot pulse-green"></span>
            <small>Conectado al Host Central</small>
          </div>
          <small className="host-url">{API_BASE}</small>
        </div>
      </aside>

      <main className="main-content">
        {tab === "usuarios" && <Usuarios apiBase={API_BASE} />}
        {tab === "lugares" && <Lugares apiBase={API_BASE} />}
        {tab === "expediciones" && <Expediciones apiBase={API_BASE} />}
      </main>
    </div>
  );
}

export default App;
