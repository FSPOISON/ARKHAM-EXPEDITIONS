import { useState, useEffect } from "react";
import axios from "axios";
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
  const [metrics, setMetrics] = useState({
    investigatorsCount: 0,
    locationsCount: 0,
    expeditionsCount: 0,
    avgHazard: 0
  });

  useEffect(() => {
    // sessionStorage clears when the browser tab/window is closed,
    // ensuring the login screen always shows on a fresh visit.
    const savedUser = sessionStorage.getItem("arkham_investigator");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        sessionStorage.removeItem("arkham_investigator");
      }
    }
  }, []);

  const loadMetrics = async () => {
    try {
      const [uRes, lRes, eRes] = await Promise.all([
        axios.get(`${API_BASE}/api/usuarios`),
        axios.get(`${API_BASE}/api/lugares`),
        axios.get(`${API_BASE}/api/expediciones`)
      ]);
      const uData = Array.isArray(uRes.data) ? uRes.data : [];
      const lData = Array.isArray(lRes.data) ? lRes.data : [];
      const eData = Array.isArray(eRes.data) ? eRes.data : [];
      
      const avg = lData.length > 0 
        ? lData.reduce((acc, curr) => acc + (Number(curr.nivel_peligro) || 0), 0) / lData.length 
        : 0;

      setMetrics({
        investigatorsCount: uData.length,
        locationsCount: lData.length,
        expeditionsCount: eData.length,
        avgHazard: avg
      });
    } catch (err) {
      console.error("Error al cargar métricas", err);
    }
  };

  useEffect(() => {
    if (user) {
      loadMetrics();
    }
  }, [user, tab]);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    playClick();
    sessionStorage.removeItem("arkham_investigator");
    setUser(null);
    setTab("usuarios"); // reset tab on logout
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

        {/* ── Perfil del investigador activo ── */}
        <div className="sidebar-profile-card">
          <div className="sidebar-profile-avatar-wrap">
            <img
              src={user.avatar_url || `https://i.pravatar.cc/80?u=${user.email}`}
              alt={user.nombre}
              className="sidebar-profile-avatar"
              onError={(e) => { e.target.src = `https://i.pravatar.cc/80?u=${user.email}`; }}
            />
            <span className="sidebar-profile-online" title="En línea" />
          </div>
          <div className="sidebar-profile-info">
            <p className="sidebar-profile-name">{user.nombre} {user.apellido}</p>
            <p className="sidebar-profile-role">
              {user.nivel_explorador === 1 ? "🔰 Novicio" : "⚔️ Explorador"}
            </p>
            <div className="sidebar-profile-stats">
              <span>⭐ {user.reputacion || 0}</span>
              <span>Lv.{user.nivel_explorador || 1}</span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          {/* Sound toggle */}
          <button
            className="sidebar-sound-btn"
            onClick={handleToggleSound}
            onMouseEnter={playHover}
            title={soundActive ? "Silenciar" : "Activar sonido"}
          >
            <span className="sidebar-sound-icon">{soundActive ? "🔊" : "🔇"}</span>
            <span>{soundActive ? "Sonido activo" : "Silenciado"}</span>
          </button>

          {/* Logout / Switch account */}
          <button
            id="btn-cerrar-sesion"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            onMouseEnter={playHover}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>

          {/* Server indicator */}
          <div className="sidebar-server-row">
            <span className="dot pulse-green" />
            <small>Conectado</small>
          </div>
        </div>
      </aside>

      <main className="main-content fade-in">
        <div className="fog-overlay"></div>

        {/* Cabecera del Dashboard Profesional */}
        <header className="dashboard-header animate-slide-right">
          <div className="header-title-area">
            <h2>Centro de Control de Investigaciones</h2>
            <p className="welcome-text">Agente activo: <strong>{user.nombre} {user.apellido}</strong> — Monitoreando portales y expediciones.</p>
          </div>

          <div className="metrics-grid">
            <div className="metric-card" onMouseEnter={playHover}>
              <div className="metric-card-inner">
                <span className="metric-icon">👥</span>
                <div className="metric-text-group">
                  <div className="metric-val">{metrics.investigatorsCount}</div>
                  <div className="metric-label">Investigadores</div>
                </div>
              </div>
            </div>

            <div className="metric-card" onMouseEnter={playHover}>
              <div className="metric-card-inner">
                <span className="metric-icon">👁️</span>
                <div className="metric-text-group">
                  <div className="metric-val">{metrics.locationsCount}</div>
                  <div className="metric-label">Lugares Malditos</div>
                </div>
              </div>
            </div>

            <div className="metric-card" onMouseEnter={playHover}>
              <div className="metric-card-inner">
                <span className="metric-icon">🗺️</span>
                <div className="metric-text-group">
                  <div className="metric-val">{metrics.expeditionsCount}</div>
                  <div className="metric-label">Expediciones</div>
                </div>
              </div>
            </div>

            <div className="metric-card" onMouseEnter={playHover}>
              <div className="metric-card-inner">
                <span className="metric-icon">⚠️</span>
                <div className="metric-text-group">
                  <div className="metric-val">{metrics.avgHazard.toFixed(1)}</div>
                  <div className="metric-label">Riesgo Promedio</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {tab === "usuarios" && <Usuarios apiBase={API_BASE} onDataChange={loadMetrics} />}
        {tab === "lugares" && <Lugares apiBase={API_BASE} onDataChange={loadMetrics} />}
        {tab === "expediciones" && <Expediciones apiBase={API_BASE} onDataChange={loadMetrics} />}
      </main>
    </div>
  );
}

export default App;

