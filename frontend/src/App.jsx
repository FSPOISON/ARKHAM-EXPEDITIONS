import { useCallback, useState, useEffect } from "react";
import apiClient from "./services/api";
import Usuarios from "./components/Usuarios";
import Lugares from "./components/Lugares";
import Expediciones from "./components/Expediciones";
import Informacion from "./components/Informacion";
import LoginPortal from "./components/LoginPortal";
import { playClick, playHover, playTransition, toggleSound, isSoundEnabled } from "./utils/audioHelper";
import "./App.css";

const monsterAvatar = (user) => {
  const seed = encodeURIComponent(user?.email || `${user?.nombre || "arkham"}-${user?.apellido || "agent"}`);
  return `https://robohash.org/${seed}.png?set=set2&size=120x120`;
};

const NAV_ITEMS = [
  { id: "informacion", icon: "🏠", label: "Inicio" },
  { id: "usuarios", icon: "🔍", label: "Investigadores" },
  { id: "lugares", icon: "👁️", label: "Ubicaciones" },
  { id: "expediciones", icon: "🗺️", label: "Expediciones" },
];

function App() {
  const [tab, setTab] = useState("informacion");
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("arkham_investigator");
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      sessionStorage.removeItem("arkham_investigator");
      return null;
    }
  });
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [metrics, setMetrics] = useState({
    investigatorsCount: 0,
    locationsCount: 0,
    expeditionsCount: 0,
    avgHazard: 0
  });

  const loadMetrics = useCallback(async () => {
    try {
      const [uRes, lRes, eRes] = await Promise.all([
        apiClient.get("/api/usuarios"),
        apiClient.get("/api/lugares"),
        apiClient.get("/api/expediciones")
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
  }, []);

  useEffect(() => {
    if (user) {
      Promise.resolve().then(loadMetrics);
    }
  }, [loadMetrics, user, tab]);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setTab("informacion");
  };

  const handleLogout = () => {
    playClick();
    sessionStorage.removeItem("arkham_investigator");
    setUser(null);
    setTab("informacion");
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

  if (!user) {
    return <LoginPortal onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = user?.rol === "admin";

  return (
    <div className="app">
      <div className="vignette"></div>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar animate-slide-right">
        <div className="brand">
          <h1 className="horror-title glitch" data-text="ARKHAM">ARKHAM</h1>
          <p className="brand-sub">EXPEDITIONS</p>
          <div className="separator"></div>
        </div>

        <nav className="nav-menu">
          {NAV_ITEMS.map(({ id, icon, label }) => (
            <button
              key={id}
              className={`nav-btn ${tab === id ? "active" : ""}`}
              onClick={() => handleTabChange(id)}
              onMouseEnter={playHover}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        {/* Perfil */}
        <div className="sidebar-profile">
          <div className="sidebar-avatar-wrap">
            <img
              src={monsterAvatar(user)}
              alt={user.nombre}
              className="sidebar-avatar"
              onError={(e) => { e.target.src = monsterAvatar(user); }}
            />
            <span className="sidebar-online" title="En línea" />
          </div>
          <div className="sidebar-profile-info">
            <p className="sidebar-name">{user.nombre} {user.apellido}</p>
            <div className="sidebar-role-row">
              <span className={`sidebar-role-badge ${isAdmin ? "admin" : "inv"}`}>
                {isAdmin ? "⚔️ Admin" : "🔰 Investigador"}
              </span>
            </div>
            <div className="sidebar-stats">
              <span>⭐ {user.reputacion || 0}</span>
              <span>Lv.{user.nivel_explorador || 1}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            className="sidebar-sound-btn"
            onClick={handleToggleSound}
            onMouseEnter={playHover}
            title={soundActive ? "Silenciar" : "Activar sonido"}
          >
            <span>{soundActive ? "🔊" : "🔇"}</span>
            <span>{soundActive ? "Sonido activo" : "Silenciado"}</span>
          </button>

          <button
            id="btn-cerrar-sesion"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            onMouseEnter={playHover}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>

          <div className="sidebar-server-row">
            <span className="dot pulse-green" />
            <small>Conectado</small>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content fade-in">
        <div className="fog-overlay"></div>

        {/* Header sólo para tabs con datos */}
        {tab !== "informacion" && (
          <header className="dash-header animate-slide-right">
            <div className="dash-header-title">
              <h2>
                {tab === "usuarios" && "Centro de Control · Investigadores"}
                {tab === "lugares" && "Catálogo · Ubicaciones Oscuras"}
                {tab === "expediciones" && "Portal de Expediciones"}
              </h2>
              <p className="dash-header-sub">
                Agente activo: {user.nombre} {user.apellido}
                {isAdmin && <span className="dash-admin-badge">ADMIN</span>}
              </p>
            </div>

            <div className="dash-metrics">
              <div className="dash-metric" onMouseEnter={playHover}>
                <span className="dash-metric-icon">👥</span>
                <div>
                  <div className="dash-metric-val">{metrics.investigatorsCount}</div>
                  <div className="dash-metric-label">Investigadores</div>
                </div>
              </div>
              <div className="dash-metric" onMouseEnter={playHover}>
                <span className="dash-metric-icon">👁️</span>
                <div>
                  <div className="dash-metric-val">{metrics.locationsCount}</div>
                  <div className="dash-metric-label">Ubicaciones</div>
                </div>
              </div>
              <div className="dash-metric" onMouseEnter={playHover}>
                <span className="dash-metric-icon">🗺️</span>
                <div>
                  <div className="dash-metric-val">{metrics.expeditionsCount}</div>
                  <div className="dash-metric-label">Expediciones</div>
                </div>
              </div>
              <div className="dash-metric" onMouseEnter={playHover}>
                <span className="dash-metric-icon">⚠️</span>
                <div>
                  <div className="dash-metric-val">{metrics.avgHazard.toFixed(1)}</div>
                  <div className="dash-metric-label">Riesgo Prom.</div>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Contenido de tabs */}
        {tab === "informacion" && <Informacion user={user} />}
        {tab === "usuarios" && <Usuarios onDataChange={loadMetrics} user={user} />}
        {tab === "lugares" && <Lugares onDataChange={loadMetrics} user={user} />}
        {tab === "expediciones" && <Expediciones user={user} onDataChange={loadMetrics} />}
      </main>
    </div>
  );
}

export default App;
