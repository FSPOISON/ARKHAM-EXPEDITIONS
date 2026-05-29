import { useState, useEffect } from "react";
import Usuarios from "./components/Usuarios";
import Lugares from "./components/Lugares";
import Expediciones from "./components/Expediciones";
import LoginPortal from "./components/LoginPortal";
import { playClick, playHover, playTransition, toggleSound, isSoundEnabled } from "./utils/audioHelper";
import "./App.css";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function App() {
  const [tab, setTab] = useState("usuarios");
  const [user, setUser] = useState(null);
  const [soundActive, setSoundActive] = useState(isSoundEnabled());

  useEffect(() => {
    const savedUser = localStorage.getItem("arkham_investigator");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("arkham_investigator");
      }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    playClick();
    localStorage.removeItem("arkham_investigator");
    setUser(null);
  };

  const handleTabChange = (newTab) => {
    if (tab !== newTab) {
      playTransition();
      setTab(newTab);
    }
  };

  const handleToggleSound = () => {
    const newState = !soundActive;
    toggleSound(newState);
    setSoundActive(newState);
    if (newState) {
      setTimeout(() => playClick(), 100);
    }
  };

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

  if (!user) {
    return <LoginPortal apiBase={API_BASE} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      <div className="vignette"></div>
      
      <aside className="sidebar animate-slide-right">
        <div className="brand">
          <h1 className="horror-title glitch" data-text="ARKHAM">ARKHAM</h1>
          <p className="subtitle">EXPEDITIONS</p>
          <div className="separator"></div>
        </div>
        
        <nav className="nav-menu">
          <button 
            className={`nav-btn ${tab === 'usuarios' ? 'active' : ''}`}
            onClick={() => handleTabChange('usuarios')}
            onMouseEnter={playHover}
          >
            <span className="nav-icon">🔍</span>
            Investigadores
          </button>
          <button 
            className={`nav-btn ${tab === 'lugares' ? 'active' : ''}`}
            onClick={() => handleTabChange('lugares')}
            onMouseEnter={playHover}
          >
            <span className="nav-icon">👁️</span>
            Ubicaciones Oscuras
          </button>
          <button 
            className={`nav-btn ${tab === 'expediciones' ? 'active' : ''}`}
            onClick={() => handleTabChange('expediciones')}
            onMouseEnter={playHover}
          >
            <span className="nav-icon">🗺️</span>
            Expediciones
          </button>
        </nav>

        {/* Investigador Activo Panel */}
        <div className="active-investigator-card">
          <div className="investigator-avatar-wrap">
            <img src={user.avatar_url} alt={user.nombre} className="investigator-avatar" />
            <span className="online-indicator"></span>
          </div>
          <div className="investigator-details">
            <p className="investigator-name">{user.nombre} {user.apellido}</p>
            <p className="investigator-meta">Rango: {user.nivel_explorador === 1 ? "Novicio" : "Explorador"}</p>
            <div className="investigator-stats">
              <span title="Reputación">⭐ {user.reputacion || 0}</span>
              <span title="Nivel">Lv. {user.nivel_explorador || 1}</span>
            </div>
          </div>
        </div>
        
        <div className="status-footer">
          <div className="sound-control-row">
            <button 
              className="sound-sidebar-btn" 
              onClick={handleToggleSound} 
              title={soundActive ? "Silenciar audio espectral" : "Activar audio espectral"}
            >
              {soundActive ? "🔊 Sonido Activo" : "🔇 Sonido Silenciado"}
            </button>
          </div>
          <button className="logout-btn" onClick={handleLogout} onMouseEnter={playHover}>
            🚪 Cerrar Portal
          </button>
          <div className="server-status">
            <span className="dot pulse-green"></span>
            <small>Portal Sincronizado</small>
          </div>
          <small className="host-url">{API_BASE}</small>
        </div>
      </aside>

      <main className="main-content fade-in">
        <div className="fog-overlay"></div>
        {tab === "usuarios" && <Usuarios apiBase={API_BASE} />}
        {tab === "lugares" && <Lugares apiBase={API_BASE} />}
        {tab === "expediciones" && <Expediciones apiBase={API_BASE} />}
      </main>
    </div>
  );
}

export default App;

