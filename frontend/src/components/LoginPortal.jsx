import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  playClick,
  playHover,
  playSuccess,
  playFailure,
  toggleSound,
  isSoundEnabled
} from "../utils/audioHelper";

/* ─── Facebook OAuth simulation ──────────────────────────────────────────── */
const FB_ACCOUNTS = [
  {
    name: "JULIAN MAURICIO",
    lastName: "MERCADO NARVAEZ",
    email: "julian.mercado@udea.edu.co",
    avatar: "https://i.pravatar.cc/150?img=12"
  },
  {
    name: "Mauricio",
    lastName: "Mercado Narvaez",
    email: "mauros0911@gmail.com",
    avatar: "https://i.pravatar.cc/150?img=33"
  }
];

export default function LoginPortal({ apiBase, onLoginSuccess }) {
  /* ── view state: "login" | "register" | "fb-select" | "google-select" ── */
  const [view, setView] = useState("login");
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  /* Login fields */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  /* Register fields */
  const [regNombre, setRegNombre] = useState("");
  const [regApellido, setRegApellido] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regTelefono, setRegTelefono] = useState("");

  /* Google custom account */
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");

  /* Facebook custom account */
  const [showCustomFb, setShowCustomFb] = useState(false);
  const [customFbEmail, setCustomFbEmail] = useState("");
  const [customFbName, setCustomFbName] = useState("");

  const hasRealClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const cardRef = useRef(null);

  /* ── Load Google SDK ─────────────────────────────────────────────────── */
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (clientId && window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => {
            try {
              const base64Url = res.credential.split(".")[1];
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
              const jsonPayload = decodeURIComponent(
                window.atob(base64).split("").map((c) =>
                  "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                ).join("")
              );
              const payload = JSON.parse(jsonPayload);
              executeOAuthLogin({
                nombre: payload.given_name || payload.name || "GoogleUser",
                apellido: payload.family_name || "",
                email: payload.email,
                avatar_url: payload.picture
              }, "google");
            } catch (e) {
              console.error("Error al decodificar Google JWT", e);
              setError("Error al procesar el token de Google.");
            }
          }
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn-real"),
          { theme: "outline", size: "large", type: "standard", shape: "rectangular" }
        );
      }
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  const clearMessages = () => { setError(""); setMensaje(""); };

  const switchView = (v) => {
    playClick();
    clearMessages();
    setView(v);
    setShowCustomGoogle(false);
    setShowCustomFb(false);
  };

  const handleToggleSound = () => {
    const next = !soundActive;
    toggleSound(next);
    setSoundActive(next);
    if (next) setTimeout(() => playClick(), 100);
  };

  /* ── Standard login ──────────────────────────────────────────────────── */
  const handleStandardLogin = async (e) => {
    e.preventDefault();
    playClick();
    clearMessages();
    if (!loginEmail.trim() || !loginPassword) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setCargando(true);
    try {
      const response = await axios.post(`${apiBase}/api/usuarios/login`, {
        email: loginEmail.trim(),
        contrasena: loginPassword
      });
      playSuccess();
      localStorage.setItem("arkham_investigator", JSON.stringify(response.data));
      onLoginSuccess(response.data);
    } catch (err) {
      playFailure();
      setError(err?.response?.data?.message || "Credenciales incorrectas.");
    } finally {
      setCargando(false);
    }
  };

  /* ── Standard register ───────────────────────────────────────────────── */
  const handleStandardRegister = async (e) => {
    e.preventDefault();
    playClick();
    clearMessages();
    if (!regNombre.trim() || !regApellido.trim() || !regEmail.trim() || !regPassword) {
      setError("Nombre, apellido, email y contraseña son obligatorios.");
      return;
    }
    setCargando(true);
    try {
      const response = await axios.post(`${apiBase}/api/usuarios/registrar`, {
        nombre: regNombre.trim(),
        apellido: regApellido.trim(),
        email: regEmail.trim(),
        contrasena: regPassword,
        telefono: regTelefono.trim() || null
      });
      playSuccess();
      setMensaje("¡Cuenta creada con éxito! Iniciando sesión…");
      setTimeout(() => {
        localStorage.setItem("arkham_investigator", JSON.stringify(response.data));
        onLoginSuccess(response.data);
      }, 1500);
    } catch (err) {
      playFailure();
      setError(err?.response?.data?.message || "Error al registrar la cuenta.");
      setCargando(false);
    }
  };

  /* ── OAuth shared ────────────────────────────────────────────────────── */
  const executeOAuthLogin = async (userInfo, provider) => {
    setCargando(true);
    clearMessages();
    try {
      const response = await axios.post(`${apiBase}/api/usuarios/oauth-login`, {
        email: userInfo.email,
        nombre: userInfo.nombre,
        apellido: userInfo.apellido,
        provider,
        provider_id: `${provider}_${Date.now()}`,
        avatar_url: userInfo.avatar_url
      });
      playSuccess();
      localStorage.setItem("arkham_investigator", JSON.stringify(response.data));
      onLoginSuccess(response.data);
    } catch (err) {
      playFailure();
      setError(err?.response?.data?.message || "No se pudo sincronizar la cuenta.");
    } finally {
      setCargando(false);
    }
  };

  /* ── Google flow ─────────────────────────────────────────────────────── */
  const handleGoogleClick = () => {
    playClick();
    clearMessages();
    if (hasRealClientId && window.google) {
      window.google.accounts.id.prompt();
    } else {
      setView("google-select");
    }
  };

  const handleSelectGoogleAccount = (acc) => {
    playClick();
    executeOAuthLogin({
      nombre: acc.name,
      apellido: acc.lastName,
      email: acc.email,
      avatar_url: acc.avatar
    }, "google");
    setView("login");
  };

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    playClick();
    if (!customGoogleEmail.trim() || !customGoogleName.trim()) return;
    executeOAuthLogin({
      nombre: customGoogleName.trim(),
      apellido: "Google",
      email: customGoogleEmail.trim(),
      avatar_url: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
    }, "google");
    setView("login");
  };

  /* ── Facebook flow ───────────────────────────────────────────────────── */
  const handleFacebookClick = () => {
    playClick();
    clearMessages();
    setView("fb-select");
  };

  const handleSelectFbAccount = (acc) => {
    playClick();
    executeOAuthLogin({
      nombre: acc.name,
      apellido: acc.lastName,
      email: acc.email,
      avatar_url: acc.avatar
    }, "facebook");
    setView("login");
  };

  const handleCustomFbSubmit = (e) => {
    e.preventDefault();
    playClick();
    if (!customFbEmail.trim() || !customFbName.trim()) return;
    executeOAuthLogin({
      nombre: customFbName.trim(),
      apellido: "Facebook",
      email: customFbEmail.trim(),
      avatar_url: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
    }, "facebook");
    setView("login");
  };

  /* ── Particles background ────────────────────────────────────────────── */
  const particles = Array.from({ length: 18 }, (_, i) => i);

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="lp-bg">
      {/* Animated particles */}
      <div className="lp-particles" aria-hidden="true">
        {particles.map((i) => (
          <span key={i} className="lp-particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${(i * 0.7) % 8}s`,
            animationDuration: `${10 + (i * 1.3) % 12}s`,
            width: `${2 + (i % 4)}px`,
            height: `${2 + (i % 4)}px`,
            opacity: 0.15 + (i % 5) * 0.05
          }} />
        ))}
      </div>

      {/* Sound toggle */}
      <button
        className={`lp-sound-btn ${soundActive ? "active" : ""}`}
        onClick={handleToggleSound}
        onMouseEnter={playHover}
        title={soundActive ? "Silenciar audio" : "Activar audio"}
        aria-label="toggle-sound"
      >
        {soundActive ? "🔊" : "🔇"}
      </button>

      {/* ── Main card ── */}
      <div className="lp-card" ref={cardRef}>
        {/* Logo / Brand */}
        <div className="lp-brand">
          <div className="lp-brand-icon">
            <span className="lp-brand-rune">⬡</span>
          </div>
          <h1 className="lp-title glitch" data-text="ARKHAM">ARKHAM</h1>
          <p className="lp-subtitle">EXPEDITIONS</p>
          <div className="lp-brand-line" />
        </div>

        {/* Status messages */}
        {error && (
          <div className="lp-alert lp-alert--error animate-shake">
            <span className="lp-alert-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}
        {mensaje && (
          <div className="lp-alert lp-alert--ok">
            <span className="lp-alert-icon">✓</span>
            <span>{mensaje}</span>
          </div>
        )}

        {/* ─── LOGIN VIEW ─── */}
        {view === "login" && (
          <div className="lp-view fade-in">
            <p className="lp-view-heading">Iniciar Sesión</p>

            <form onSubmit={handleStandardLogin} className="lp-form" noValidate>
              <div className="lp-field">
                <label htmlFor="login-email" className="lp-label">Correo electrónico</label>
                <div className="lp-input-wrap">
                  <span className="lp-input-icon">✉</span>
                  <input
                    id="login-email"
                    type="email"
                    className="lp-input"
                    placeholder="investigador@miskatonic.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={cargando}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="lp-field">
                <label htmlFor="login-pass" className="lp-label">Contraseña</label>
                <div className="lp-input-wrap">
                  <span className="lp-input-icon">🔒</span>
                  <input
                    id="login-pass"
                    type={showPass ? "text" : "password"}
                    className="lp-input"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={cargando}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="lp-eye-btn"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                    aria-label="toggle-password-visibility"
                  >
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="lp-btn lp-btn--primary"
                disabled={cargando}
                onMouseEnter={playHover}
              >
                {cargando ? (
                  <span className="lp-spinner" />
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <span className="lp-btn-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="lp-divider">
              <span>o continúa con</span>
            </div>

            {/* OAuth buttons */}
            <div className="lp-oauth-row">
              {hasRealClientId ? (
                <div id="google-signin-btn-real" className="lp-real-google" />
              ) : (
                <button
                  type="button"
                  className="lp-oauth-btn lp-oauth-btn--google"
                  onClick={handleGoogleClick}
                  onMouseEnter={playHover}
                  disabled={cargando}
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                    alt="Google"
                    className="lp-oauth-logo"
                  />
                  <span>Google</span>
                </button>
              )}

              <button
                type="button"
                className="lp-oauth-btn lp-oauth-btn--facebook"
                onClick={handleFacebookClick}
                onMouseEnter={playHover}
                disabled={cargando}
              >
                <svg className="lp-oauth-logo" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </button>
            </div>

            {/* Register link */}
            <p className="lp-footer-text">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                className="lp-link-btn"
                onClick={() => switchView("register")}
              >
                Crear cuenta nueva
              </button>
            </p>
          </div>
        )}

        {/* ─── REGISTER VIEW ─── */}
        {view === "register" && (
          <div className="lp-view fade-in">
            <p className="lp-view-heading">Crear Cuenta</p>

            <form onSubmit={handleStandardRegister} className="lp-form" noValidate>
              <div className="lp-form-row">
                <div className="lp-field">
                  <label htmlFor="reg-nombre" className="lp-label">Nombre</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon">👤</span>
                    <input
                      id="reg-nombre"
                      className="lp-input"
                      placeholder="Harvey"
                      value={regNombre}
                      onChange={(e) => setRegNombre(e.target.value)}
                      disabled={cargando}
                      required
                    />
                  </div>
                </div>
                <div className="lp-field">
                  <label htmlFor="reg-apellido" className="lp-label">Apellido</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon">👤</span>
                    <input
                      id="reg-apellido"
                      className="lp-input"
                      placeholder="Walters"
                      value={regApellido}
                      onChange={(e) => setRegApellido(e.target.value)}
                      disabled={cargando}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="lp-field">
                <label htmlFor="reg-email" className="lp-label">Correo electrónico</label>
                <div className="lp-input-wrap">
                  <span className="lp-input-icon">✉</span>
                  <input
                    id="reg-email"
                    type="email"
                    className="lp-input"
                    placeholder="email@miskatonic.edu"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    disabled={cargando}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="lp-field">
                <label htmlFor="reg-pass" className="lp-label">Contraseña</label>
                <div className="lp-input-wrap">
                  <span className="lp-input-icon">🔒</span>
                  <input
                    id="reg-pass"
                    type={showRegPass ? "text" : "password"}
                    className="lp-input"
                    placeholder="Mínimo 6 caracteres"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    disabled={cargando}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="lp-eye-btn"
                    onClick={() => setShowRegPass(!showRegPass)}
                    tabIndex={-1}
                    aria-label="toggle-register-password"
                  >
                    {showRegPass ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div className="lp-field">
                <label htmlFor="reg-tel" className="lp-label">
                  Teléfono <span className="lp-optional">(opcional)</span>
                </label>
                <div className="lp-input-wrap">
                  <span className="lp-input-icon">📞</span>
                  <input
                    id="reg-tel"
                    className="lp-input"
                    placeholder="+57 300 000 0000"
                    value={regTelefono}
                    onChange={(e) => setRegTelefono(e.target.value)}
                    disabled={cargando}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="lp-btn lp-btn--primary"
                disabled={cargando}
                onMouseEnter={playHover}
              >
                {cargando ? (
                  <span className="lp-spinner" />
                ) : (
                  <>
                    <span>Crear mi Cuenta</span>
                    <span className="lp-btn-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            <p className="lp-footer-text">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                className="lp-link-btn"
                onClick={() => switchView("login")}
              >
                Iniciar Sesión
              </button>
            </p>
          </div>
        )}

        {/* ─── GOOGLE SELECT VIEW ─── */}
        {view === "google-select" && (
          <div className="lp-view fade-in">
            <div className="lp-oauth-select-header">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                alt="Google"
                className="lp-oauth-select-logo"
              />
              <p className="lp-oauth-select-title">Iniciar sesión con Google</p>
              <p className="lp-oauth-select-sub">Elige una cuenta para continuar en <strong>Arkham Expeditions</strong></p>
            </div>

            {!showCustomGoogle ? (
              <div className="lp-account-list">
                {[
                  { name: "JULIAN MAURICIO", lastName: "MERCADO NARVAEZ", email: "julian.mercado@udea.edu.co", avatar: "https://i.pravatar.cc/150?img=12", initial: "J", color: "#ea4335" },
                  { name: "Mauricio", lastName: "Mercado Narvaez", email: "mauros0911@gmail.com", avatar: "https://i.pravatar.cc/150?img=33", initial: "M", color: "#4285f4" }
                ].map((acc) => (
                  <button
                    key={acc.email}
                    className="lp-account-row"
                    onClick={() => handleSelectGoogleAccount(acc)}
                    onMouseEnter={playHover}
                  >
                    <div className="lp-account-avatar" style={{ background: acc.color }}>
                      {acc.initial}
                    </div>
                    <div className="lp-account-info">
                      <span className="lp-account-name">{acc.name} {acc.lastName}</span>
                      <span className="lp-account-email">{acc.email}</span>
                    </div>
                    <span className="lp-account-chevron">›</span>
                  </button>
                ))}
                <button
                  className="lp-account-row lp-account-row--add"
                  onClick={() => { playClick(); setShowCustomGoogle(true); }}
                  onMouseEnter={playHover}
                >
                  <div className="lp-account-avatar lp-account-avatar--add">+</div>
                  <div className="lp-account-info">
                    <span className="lp-account-name">Usar otra cuenta</span>
                  </div>
                  <span className="lp-account-chevron">›</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit} className="lp-form">
                <div className="lp-field">
                  <label className="lp-label">Tu nombre</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon">👤</span>
                    <input className="lp-input" placeholder="Nombre completo" value={customGoogleName} onChange={(e) => setCustomGoogleName(e.target.value)} required />
                  </div>
                </div>
                <div className="lp-field">
                  <label className="lp-label">Correo Google</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon">✉</span>
                    <input className="lp-input" type="email" placeholder="correo@gmail.com" value={customGoogleEmail} onChange={(e) => setCustomGoogleEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="lp-form-row">
                  <button type="submit" className="lp-btn lp-btn--primary">Continuar</button>
                  <button type="button" className="lp-btn lp-btn--ghost" onClick={() => setShowCustomGoogle(false)}>Volver</button>
                </div>
              </form>
            )}

            <button type="button" className="lp-link-btn lp-link-btn--center" onClick={() => switchView("login")}>
              ← Volver al inicio de sesión
            </button>
          </div>
        )}

        {/* ─── FACEBOOK SELECT VIEW ─── */}
        {view === "fb-select" && (
          <div className="lp-view fade-in">
            <div className="lp-oauth-select-header">
              <svg className="lp-oauth-select-logo" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              <p className="lp-oauth-select-title">Iniciar sesión con Facebook</p>
              <p className="lp-oauth-select-sub">Elige una cuenta para continuar en <strong>Arkham Expeditions</strong></p>
            </div>

            {!showCustomFb ? (
              <div className="lp-account-list">
                {FB_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    className="lp-account-row"
                    onClick={() => handleSelectFbAccount(acc)}
                    onMouseEnter={playHover}
                  >
                    <div className="lp-account-avatar lp-account-avatar--fb">
                      {acc.name.charAt(0)}
                    </div>
                    <div className="lp-account-info">
                      <span className="lp-account-name">{acc.name} {acc.lastName}</span>
                      <span className="lp-account-email">{acc.email}</span>
                    </div>
                    <span className="lp-account-chevron">›</span>
                  </button>
                ))}
                <button
                  className="lp-account-row lp-account-row--add"
                  onClick={() => { playClick(); setShowCustomFb(true); }}
                  onMouseEnter={playHover}
                >
                  <div className="lp-account-avatar lp-account-avatar--add">+</div>
                  <div className="lp-account-info">
                    <span className="lp-account-name">Usar otra cuenta</span>
                  </div>
                  <span className="lp-account-chevron">›</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomFbSubmit} className="lp-form">
                <div className="lp-field">
                  <label className="lp-label">Tu nombre</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon">👤</span>
                    <input className="lp-input" placeholder="Nombre completo" value={customFbName} onChange={(e) => setCustomFbName(e.target.value)} required />
                  </div>
                </div>
                <div className="lp-field">
                  <label className="lp-label">Correo Facebook</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon">✉</span>
                    <input className="lp-input" type="email" placeholder="correo@facebook.com" value={customFbEmail} onChange={(e) => setCustomFbEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="lp-form-row">
                  <button type="submit" className="lp-btn lp-btn--primary">Continuar</button>
                  <button type="button" className="lp-btn lp-btn--ghost" onClick={() => setShowCustomFb(false)}>Volver</button>
                </div>
              </form>
            )}

            <button type="button" className="lp-link-btn lp-link-btn--center" onClick={() => switchView("login")}>
              ← Volver al inicio de sesión
            </button>
          </div>
        )}

        {/* Card footer */}
        <p className="lp-card-legal">
          Al continuar aceptas nuestros{" "}
          <span className="lp-legal-link">Términos de Servicio</span> y la{" "}
          <span className="lp-legal-link">Política de Privacidad</span>
        </p>
      </div>

      {/* Loading overlay */}
      {cargando && (
        <div className="lp-loading-overlay" aria-busy="true">
          <div className="lp-loading-ring" />
        </div>
      )}
    </div>
  );
}
