import { useState } from "react";
import axios from "axios";
import {
  playClick,
  playHover,
  playSuccess,
  playFailure,
  toggleSound,
  isSoundEnabled
} from "../utils/audioHelper";

const PRESETS = {
  google: [
    {
      nombre: "Harvey",
      apellido: "Walters",
      email: "harvey.walters@miskatonic.edu",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
      profesion: "Profesor de Miskatonic"
    },
    {
      nombre: "Jenny",
      apellido: "Barnes",
      email: "jenny.barnes@arkham.org",
      avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop",
      profesion: "Dilettante de Boston"
    }
  ],
  facebook: [
    {
      nombre: "Silas",
      apellido: "Marsh",
      email: "silas.marsh@portsmouth.com",
      avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
      profesion: "Marinero del Atlántico"
    },
    {
      nombre: "Marie",
      apellido: "Lambeau",
      email: "marie.lambeau@frenchquarter.org",
      avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop",
      profesion: "Hechicera de Nueva Orleans"
    }
  ]
};

export default function LoginPortal({ apiBase, onLoginSuccess }) {
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [showSim, setShowSim] = useState(false);
  const [loginProvider, setLoginProvider] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Custom Form fields
  const [customNombre, setCustomNombre] = useState("");
  const [customApellido, setCustomApellido] = useState("");
  const [customEmail, setCustomEmail] = useState("");

  const handleToggleSound = () => {
    const newState = !soundActive;
    toggleSound(newState);
    setSoundActive(newState);
    if (newState) {
      setTimeout(() => playClick(), 100);
    }
  };

  const handleStartOAuth = (provider) => {
    playClick();
    setLoginProvider(provider);
    setError("");
    setShowSim(true);
  };

  const executeLogin = async (userInfo) => {
    setCargando(true);
    setError("");
    try {
      const response = await axios.post(`${apiBase}/api/usuarios/oauth-login`, {
        email: userInfo.email,
        nombre: userInfo.nombre,
        apellido: userInfo.apellido,
        provider: loginProvider,
        provider_id: `${loginProvider}_${Date.now()}`,
        avatar_url: userInfo.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
      });

      playSuccess();
      localStorage.setItem("arkham_investigator", JSON.stringify(response.data));
      onLoginSuccess(response.data);
    } catch (err) {
      playFailure();
      setError(err?.response?.data?.message || "No se pudo cruzar el portal de acceso.");
    } finally {
      setCargando(false);
    }
  };

  const handleSelectPreset = (preset) => {
    playClick();
    executeLogin(preset);
    setShowSim(false);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    playClick();
    if (!customNombre.trim() || !customApellido.trim() || !customEmail.trim()) {
      setError("Todos los campos rituales son requeridos.");
      return;
    }
    const avatarNum = Math.floor(Math.random() * 70);
    const customUser = {
      nombre: customNombre.trim(),
      apellido: customApellido.trim(),
      email: customEmail.trim(),
      avatar_url: `https://i.pravatar.cc/150?img=${avatarNum}`
    };
    executeLogin(customUser);
    setShowSim(false);
  };

  const closePortalPopup = () => {
    playClick();
    setShowSim(false);
  };

  return (
    <div className="login-portal-bg">
      <div className="mist-container"></div>
      
      <button 
        className={`sound-toggle-btn ${soundActive ? "active" : ""}`}
        onClick={handleToggleSound}
        onMouseEnter={playHover}
        title={soundActive ? "Desactivar sonidos espectrales" : "Activar sonidos espectrales"}
      >
        {soundActive ? "🔊" : "🔇"}
      </button>

      <div className="login-card-container">
        <div className="login-header">
          <div className="runes-glow"></div>
          <h1 className="horror-title glitch" data-text="ARKHAM EXPEDITIONS">
            ARKHAM EXPEDITIONS
          </h1>
          <p className="subtitle animate-pulse-slow">Consola de Acceso para Investigadores</p>
          <div className="portal-divider"></div>
        </div>

        <p className="login-intro">
          Para acceder a los registros clasificados, expediciones oscuras y ubicaciones malditas, debe sincronizar su identidad.
        </p>

        {error && <div className="status-text error login-err animate-shake">{error}</div>}

        <div className="oauth-buttons">
          <button 
            className="btn-oauth google-btn"
            onClick={() => handleStartOAuth("google")}
            onMouseEnter={playHover}
          >
            <span className="oauth-icon">G</span>
            Sincronizar con Google
          </button>
          
          <button 
            className="btn-oauth facebook-btn"
            onClick={() => handleStartOAuth("facebook")}
            onMouseEnter={playHover}
          >
            <span className="oauth-icon">F</span>
            Sincronizar con Facebook
          </button>
        </div>

        <div className="login-footer">
          <small>El abismo te observa. Tus credenciales serán procesadas y encriptadas de forma segura.</small>
        </div>
      </div>

      {/* Simulated Authorization Popup */}
      {showSim && (
        <div className="oauth-sim-overlay">
          <div className="oauth-sim-window fade-in-scale">
            <div className="sim-header">
              <div className={`sim-indicator ${loginProvider}`}></div>
              <h3>
                {loginProvider === "google" 
                  ? "Portal de Autenticación de Google" 
                  : "Portal de Conectividad de Facebook"}
              </h3>
              <button className="sim-close" onClick={closePortalPopup}>&times;</button>
            </div>
            
            <div className="sim-body">
              <p className="sim-desc">
                Estás conectándote a **Arkham Expeditions** desde tu cuenta de {loginProvider === "google" ? "Google" : "Facebook"}.
                Elige uno de los investigadores predeterminados del club de exploradores o ingresa tus propios datos.
              </p>

              <div className="presets-grid">
                {PRESETS[loginProvider]?.map((p, i) => (
                  <div 
                    key={i} 
                    className="preset-card" 
                    onClick={() => handleSelectPreset(p)}
                    onMouseEnter={playHover}
                  >
                    <img src={p.avatar_url} alt={p.nombre} className="preset-avatar" />
                    <div className="preset-info">
                      <h4>{p.nombre} {p.apellido}</h4>
                      <span className="preset-prof">{p.profesion}</span>
                      <small className="preset-email">{p.email}</small>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sim-divider">
                <span>O crea tu propio Investigador</span>
              </div>

              <form onSubmit={handleCustomSubmit} className="sim-custom-form">
                <div className="form-row">
                  <input 
                    placeholder="Nombre" 
                    value={customNombre} 
                    onChange={e => setCustomNombre(e.target.value)} 
                    required 
                  />
                  <input 
                    placeholder="Apellido" 
                    value={customApellido} 
                    onChange={e => setCustomApellido(e.target.value)} 
                    required 
                  />
                </div>
                <input 
                  type="email" 
                  placeholder="Correo Electrónico" 
                  value={customEmail} 
                  onChange={e => setCustomEmail(e.target.value)} 
                  required 
                />
                
                <button type="submit" className="btn-primary sim-submit" onMouseEnter={playHover}>
                  {cargando ? "Abriendo compuerta..." : "Traspasar Portal con mis Datos"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
