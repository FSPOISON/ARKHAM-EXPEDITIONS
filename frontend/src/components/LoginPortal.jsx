import { useState, useEffect } from "react";
import axios from "axios";
import {
  playClick,
  playHover,
  playSuccess,
  playFailure,
  toggleSound,
  isSoundEnabled
} from "../utils/audioHelper";

export default function LoginPortal({ apiBase, onLoginSuccess }) {
  const [view, setView] = useState("login"); // "login" | "register"
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [showGoogleSelect, setShowGoogleSelect] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Email/Password login inputs
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register inputs
  const [regNombre, setRegNombre] = useState("");
  const [regApellido, setRegApellido] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regTelefono, setRegTelefono] = useState("");

  // Custom Google account input (if they click "Usar otra cuenta")
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");

  const hasRealClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Cargar Google Identity Services SDK
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
                window
                  .atob(base64)
                  .split("")
                  .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                  .join("")
              );
              const payload = JSON.parse(jsonPayload);
              const userInfo = {
                nombre: payload.given_name || payload.name || "GoogleUser",
                apellido: payload.family_name || "",
                email: payload.email,
                avatar_url: payload.picture
              };
              executeOAuthLogin(userInfo, "google");
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
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleToggleSound = () => {
    const newState = !soundActive;
    toggleSound(newState);
    setSoundActive(newState);
    if (newState) {
      setTimeout(() => playClick(), 100);
    }
  };

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    playClick();
    setError("");
    setMensaje("");
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
      setError(err?.response?.data?.message || "Credenciales incorrectas o el abismo bloqueó tu ingreso.");
    } finally {
      setCargando(false);
    }
  };

  const handleStandardRegister = async (e) => {
    e.preventDefault();
    playClick();
    setError("");
    setMensaje("");
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
      setMensaje("¡Investigador registrado con éxito! Iniciando sesión...");
      // Auto login
      setTimeout(() => {
        localStorage.setItem("arkham_investigator", JSON.stringify(response.data));
        onLoginSuccess(response.data);
      }, 1500);
    } catch (err) {
      playFailure();
      setError(err?.response?.data?.message || "Error al registrar el investigador en los archivos.");
      setCargando(false);
    }
  };

  const executeOAuthLogin = async (userInfo, provider) => {
    setCargando(true);
    setError("");
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
      setError(err?.response?.data?.message || "No se pudo sincronizar los datos de la cuenta.");
    } finally {
      setCargando(false);
    }
  };

  const handleGoogleClick = () => {
    playClick();
    setError("");
    if (hasRealClientId) {
      // Si está configurado el cliente real, el botón de Google se encarga de renderizar la ventana.
      // O podemos forzar la inicialización si el SDK ya cargó
      if (window.google) {
        window.google.accounts.id.prompt();
      }
    } else {
      // Desplegar el selector de cuentas clon interactivo
      setShowGoogleSelect(true);
      setShowCustomGoogle(false);
    }
  };

  const handleSelectSimulatedAccount = (name, lastName, email, imgId) => {
    playClick();
    const avatarUrl = `https://images.unsplash.com/${imgId}?w=150&h=150&fit=crop`;
    executeOAuthLogin({ nombre: name, apellido: lastName, email, avatar_url: avatarUrl }, "google");
    setShowGoogleSelect(false);
  };

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    playClick();
    if (!customGoogleEmail.trim() || !customGoogleName.trim()) {
      return;
    }
    const avatarUrl = `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`;
    executeOAuthLogin(
      {
        nombre: customGoogleName.trim(),
        apellido: "Google",
        email: customGoogleEmail.trim(),
        avatar_url: avatarUrl
      },
      "google"
    );
    setShowGoogleSelect(false);
  };

  return (
    <div className="login-portal-bg">
      <div className="mist-container"></div>

      <button
        className={`sound-toggle-btn ${soundActive ? "active" : ""}`}
        onClick={handleToggleSound}
        onMouseEnter={playHover}
        title={soundActive ? "Silenciar audio" : "Activar audio"}
      >
        {soundActive ? "🔊" : "🔇"}
      </button>

      <div className="login-card-container">
        <div className="login-header">
          <div className="runes-glow"></div>
          <h1 className="horror-title glitch" data-text="ARKHAM EXPEDITIONS">
            ARKHAM EXPEDITIONS
          </h1>
          <p className="subtitle">Consola de Acceso para Investigadores</p>
          <div className="portal-divider"></div>
        </div>

        {error && <div className="status-text error login-err animate-shake">{error}</div>}
        {mensaje && <div className="status-text ok login-err">{mensaje}</div>}

        {view === "login" ? (
          /* Conventional Login Form */
          <form onSubmit={handleStandardLogin} className="login-form-fields">
            <div className="input-group">
              <label>Dirección de correo electrónico</label>
              <input
                type="email"
                placeholder="Ingresa tu email clasificado"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                disabled={cargando}
              />
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="Contraseña ritual"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                disabled={cargando}
              />
            </div>

            <button type="submit" className="btn-primary login-action-btn" disabled={cargando}>
              {cargando ? "Invocando acceso..." : "Iniciar sesión"}
            </button>

            {/* Divider o */}
            <div className="login-custom-divider">
              <span>o</span>
            </div>

            {/* Google OAuth Login Button */}
            <div className="oauth-buttons-wrapper">
              {hasRealClientId ? (
                <div id="google-signin-btn-real" className="real-google-btn-container"></div>
              ) : (
                <button
                  type="button"
                  className="btn-google-oauth-mock"
                  onClick={handleGoogleClick}
                  onMouseEnter={playHover}
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                    alt="Google Logo"
                    className="google-svg"
                  />
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>

            <div className="toggle-view-link">
              ¿No tienes una credencial de acceso?{" "}
              <button
                type="button"
                className="btn-link-view"
                onClick={() => {
                  playClick();
                  setView("register");
                  setError("");
                }}
              >
                Reclutar Investigador
              </button>
            </div>
          </form>
        ) : (
          /* Conventional Register Form */
          <form onSubmit={handleStandardRegister} className="login-form-fields">
            <div className="form-row">
              <div className="input-group">
                <label>Nombre</label>
                <input
                  placeholder="Ej. Harvey"
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  required
                  disabled={cargando}
                />
              </div>
              <div className="input-group">
                <label>Apellido</label>
                <input
                  placeholder="Ej. Walters"
                  value={regApellido}
                  onChange={(e) => setRegApellido(e.target.value)}
                  required
                  disabled={cargando}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Dirección de correo electrónico</label>
              <input
                type="email"
                placeholder="email@miskatonic.edu"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                disabled={cargando}
              />
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="Contraseña (mínimo 6 caracteres)"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                minLength={6}
                disabled={cargando}
              />
            </div>

            <div className="input-group">
              <label>Teléfono (Opcional)</label>
              <input
                placeholder="+57 300 000 0000"
                value={regTelefono}
                onChange={(e) => setRegTelefono(e.target.value)}
                disabled={cargando}
              />
            </div>

            <button type="submit" className="btn-primary login-action-btn" disabled={cargando}>
              {cargando ? "Registrando expediente..." : "Reclutar Investigador"}
            </button>

            <div className="toggle-view-link">
              ¿Ya posees una credencial registrada?{" "}
              <button
                type="button"
                className="btn-link-view"
                onClick={() => {
                  playClick();
                  setView("login");
                  setError("");
                }}
              >
                Iniciar Sesión
              </button>
            </div>
          </form>
        )}
      </div>

      {/* CLONE DEL SELECTOR DE CUENTAS DE GOOGLE DE LA IMAGEN */}
      {showGoogleSelect && (
        <div className="google-select-overlay">
          <div className="google-select-card fade-in-scale">
            {/* Header / Brand */}
            <div className="google-brand-header">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                alt="Google G"
                className="google-header-logo"
              />
              <span className="google-header-text">Iniciar sesión con Google</span>
            </div>

            <div className="google-card-body">
              {/* Logo de Arkham/Turnitin */}
              <div className="target-app-logo">
                <span className="portal-shield-icon">🛡️</span>
              </div>

              <h2 className="google-select-title">Selecciona una cuenta</h2>
              <p className="google-select-subtitle">
                Ir a <span className="app-link-text">Arkham Expeditions</span>
              </p>

              {!showCustomGoogle ? (
                <div className="google-accounts-list">
                  {/* Cuenta 1: JULIAN MAURICIO MERCADO NARVAEZ */}
                  <div
                    className="google-account-row"
                    onClick={() =>
                      handleSelectSimulatedAccount(
                        "JULIAN MAURICIO",
                        "MERCADO NARVAEZ",
                        "julian.mercado@udea.edu.co",
                        "photo-1472099645785-5658abf4ff4e"
                      )
                    }
                  >
                    <div className="google-avatar-circle initial-j">J</div>
                    <div className="google-account-details">
                      <div className="account-fullname">JULIAN MAURICIO MERCADO NARVAEZ</div>
                      <div className="account-email">julian.mercado@udea.edu.co</div>
                    </div>
                  </div>

                  {/* Cuenta 2: Mauricio Mercado Narvaez */}
                  <div
                    className="google-account-row"
                    onClick={() =>
                      handleSelectSimulatedAccount(
                        "Mauricio",
                        "Mercado Narvaez",
                        "mauros0911@gmail.com",
                        "photo-1506794778202-cad84cf45f1d"
                      )
                    }
                  >
                    <div className="google-avatar-circle initial-m">M</div>
                    <div className="google-account-details">
                      <div className="account-fullname">Mauricio Mercado Narvaez</div>
                      <div className="account-email">mauros0911@gmail.com</div>
                    </div>
                  </div>

                  {/* Cuenta 3: Usar otra cuenta */}
                  <div
                    className="google-account-row"
                    onClick={() => {
                      playClick();
                      setShowCustomGoogle(true);
                    }}
                  >
                    <div className="google-avatar-circle add-account-icon">👤</div>
                    <div className="google-account-details">
                      <div className="use-another-text">Usar otra cuenta</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Formulario para añadir otra cuenta */
                <form onSubmit={handleCustomGoogleSubmit} className="google-custom-account-form">
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    required
                  />
                  <input
                    type="email"
                    placeholder="correo@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    required
                  />
                  <div className="custom-google-form-actions">
                    <button type="submit" className="google-btn-submit">
                      Siguiente
                    </button>
                    <button
                      type="button"
                      className="google-btn-cancel"
                      onClick={() => {
                        playClick();
                        setShowCustomGoogle(false);
                      }}
                    >
                      Volver
                    </button>
                  </div>
                </form>
              )}

              <p className="google-privacy-notice">
                Antes de usar esta aplicación, puedes leer la{" "}
                <span className="notice-link">Política de Privacidad</span> y los{" "}
                <span className="notice-link">Términos del Servicio</span>.
              </p>
            </div>

            {/* Google Select Footer */}
            <div className="google-select-footer">
              <div className="google-footer-left">Español (España) ▾</div>
              <div className="google-footer-right">
                <span>Ayuda</span>
                <span>Privacidad</span>
                <span>Términos</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
