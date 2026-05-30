import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  playClick,
  playHover,
  playSuccess,
  playFailure,
  toggleSound,
  isSoundEnabled
} from "../utils/audioHelper";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID || "";

const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

export default function LoginPortal({ apiBase, onLoginSuccess }) {
  const [view, setView] = useState("login");
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [cargando, setCargando] = useState(false);
  const [oauthLoading, setOauthLoading] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [facebookReady, setFacebookReady] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regNombre, setRegNombre] = useState("");
  const [regApellido, setRegApellido] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regTelefono, setRegTelefono] = useState("");

  const googleButtonRef = useRef(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${((i * 37) % 100) + 0.5}%`,
        animationDelay: `${(i * 0.7) % 8}s`,
        animationDuration: `${10 + (i * 1.3) % 12}s`,
        size: `${2 + (i % 4)}px`,
        opacity: 0.15 + (i % 5) * 0.05
      })),
    []
  );

  const clearMessages = () => {
    setError("");
    setMensaje("");
  };

  const finishLogin = useCallback((usuario) => {
    playSuccess();
    sessionStorage.setItem("arkham_investigator", JSON.stringify(usuario));
    onLoginSuccess(usuario);
  }, [onLoginSuccess]);

  const executeOAuthLogin = useCallback(async (payload, providerLabel) => {
    setCargando(true);
    setOauthLoading(providerLabel);
    clearMessages();
    try {
      const response = await axios.post(`${apiBase}/api/usuarios/oauth-login`, payload);
      finishLogin(response.data);
    } catch (err) {
      playFailure();
      setError(getErrorMessage(err, `No se pudo iniciar sesión con ${providerLabel}.`));
    } finally {
      setOauthLoading("");
      setCargando(false);
    }
  }, [apiBase, finishLogin]);

  useEffect(() => {
    if (!googleClientId) return;

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (res) => {
          if (!res?.credential) {
            setError("No fue posible completar el acceso con Google. Inténtalo nuevamente.");
            return;
          }
          executeOAuthLogin(
            {
              provider: "google",
              id_token: res.credential
            },
            "Google"
          );
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });
      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const scriptId = "google-identity-services";
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener("load", initializeGoogle, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => setError("No se pudo cargar el inicio de sesión de Google.");
    document.body.appendChild(script);
  }, [executeOAuthLogin]);

  useEffect(() => {
    if (!googleReady || !googleButtonRef.current || !window.google?.accounts?.id) return;
    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "rectangular",
      text: "continue_with",
      width: Math.min(390, googleButtonRef.current.offsetWidth || 390)
    });
  }, [googleReady]);

  useEffect(() => {
    if (!facebookAppId) return;

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: facebookAppId,
        cookie: true,
        xfbml: false,
        version: "v19.0"
      });
      setFacebookReady(true);
    };

    if (window.FB) {
      window.fbAsyncInit();
      return;
    }

    const scriptId = "facebook-jssdk";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src = "https://connect.facebook.net/es_LA/sdk.js";
    script.onerror = () => setError("No se pudo cargar el inicio de sesión de Facebook.");
    document.body.appendChild(script);
  }, []);

  const switchView = (nextView) => {
    playClick();
    clearMessages();
    setView(nextView);
  };

  const handleToggleSound = () => {
    const next = !soundActive;
    toggleSound(next);
    setSoundActive(next);
    if (next) setTimeout(() => playClick(), 100);
  };

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
      finishLogin(response.data);
    } catch (err) {
      playFailure();
      setError(getErrorMessage(err, "Credenciales incorrectas."));
    } finally {
      setCargando(false);
    }
  };

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
      setMensaje("Cuenta creada. Entrando al centro de control...");
      setTimeout(() => finishLogin(response.data), 650);
    } catch (err) {
      playFailure();
      setError(getErrorMessage(err, "Error al registrar la cuenta."));
      setCargando(false);
    }
  };

  const handleGoogleClick = () => {
    playClick();
    clearMessages();
    if (!googleClientId) {
      setError("El acceso con Google no está disponible en este momento.");
      return;
    }
    if (!window.google?.accounts?.id) {
      setError("Estamos preparando el acceso con Google. Inténtalo de nuevo en unos segundos.");
      return;
    }
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setMensaje("Selecciona el botón oficial de Google para continuar.");
      }
    });
  };

  const handleFacebookClick = () => {
    playClick();
    clearMessages();
    if (!facebookAppId) {
      setError("El acceso con Facebook no está disponible en este momento.");
      return;
    }
    if (!facebookReady || !window.FB) {
      setError("Estamos preparando el acceso con Facebook. Inténtalo de nuevo en unos segundos.");
      return;
    }

    setOauthLoading("Facebook");
    window.FB.login(
      (response) => {
        if (response?.authResponse?.accessToken) {
          executeOAuthLogin(
            {
              provider: "facebook",
              access_token: response.authResponse.accessToken
            },
            "Facebook"
          );
          return;
        }
        setOauthLoading("");
        setError("Inicio de sesión con Facebook cancelado.");
      },
      {
        scope: "public_profile,email",
        return_scopes: true,
        auth_type: "rerequest"
      }
    );
  };

  const isBusy = cargando || Boolean(oauthLoading);

  return (
    <div className="lp-bg">
      <div className="lp-particles" aria-hidden="true">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="lp-particle"
            style={{
              left: particle.left,
              animationDelay: particle.animationDelay,
              animationDuration: particle.animationDuration,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity
            }}
          />
        ))}
      </div>

      <button
        className={`lp-sound-btn ${soundActive ? "active" : ""}`}
        onClick={handleToggleSound}
        onMouseEnter={playHover}
        title={soundActive ? "Silenciar audio" : "Activar audio"}
        aria-label="toggle-sound"
      >
        {soundActive ? "🔊" : "🔇"}
      </button>

      <div className="lp-card">
        <div className="lp-brand">
          <div className="lp-brand-icon">
            <span className="lp-brand-rune">⬡</span>
          </div>
          <h1 className="lp-title glitch" data-text="ARKHAM">ARKHAM</h1>
          <p className="lp-subtitle">EXPEDITIONS</p>
          <div className="lp-brand-line" />
        </div>

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
                    disabled={isBusy}
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
                    disabled={isBusy}
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
                disabled={isBusy}
                onMouseEnter={playHover}
              >
                {isBusy && !oauthLoading ? (
                  <span className="lp-spinner" />
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <span className="lp-btn-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="lp-divider">
              <span>o continúa con</span>
            </div>

            <div className="lp-oauth-stack">
              <div
                ref={googleButtonRef}
                className={`lp-real-google ${googleReady ? "ready" : ""}`}
                aria-label="Continuar con Google"
              />
              {!googleReady && (
                <button
                  type="button"
                  className="lp-oauth-btn lp-oauth-btn--google"
                  onClick={handleGoogleClick}
                  onMouseEnter={playHover}
                  disabled={isBusy}
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                    alt=""
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
                disabled={isBusy}
              >
                <svg className="lp-oauth-logo" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </button>
            </div>

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
                      disabled={isBusy}
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
                      disabled={isBusy}
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
                    disabled={isBusy}
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
                    disabled={isBusy}
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
                    disabled={isBusy}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="lp-btn lp-btn--primary"
                disabled={isBusy}
                onMouseEnter={playHover}
              >
                {isBusy ? (
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

        <p className="lp-card-legal">
          Al continuar aceptas nuestros{" "}
          <span className="lp-legal-link">Términos de Servicio</span> y la{" "}
          <span className="lp-legal-link">Política de Privacidad</span>
        </p>
      </div>

      {isBusy && (
        <div className="lp-loading-overlay" aria-busy="true">
          <div className="lp-loading-content">
            <div className="lp-loading-ring" />
            <p>{oauthLoading ? `Conectando con ${oauthLoading}...` : "Procesando acceso..."}</p>
          </div>
        </div>
      )}
    </div>
  );
}
