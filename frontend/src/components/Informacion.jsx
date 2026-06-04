import { useState } from "react";
import { playClick } from "../utils/audioHelper";

const FEATURES_INVESTIGADOR = [
  {
    icon: "🗺️",
    title: "Explorar Expediciones",
    desc: "Navega el catálogo completo de expediciones internacionales. Filtra por destino, dificultad, fechas y nivel de riesgo."
  },
  {
    icon: "💳",
    title: "Reservar y Pagar",
    desc: "Reserva tu lugar en cualquier expedición con nuestra pasarela segura. Recibe confirmación con referencia única."
  },
  {
    icon: "📍",
    title: "Consultar Ubicaciones",
    desc: "Accede al archivo de ubicaciones clasificadas con nivel de peligro, coordenadas y notas de campo de investigadores anteriores."
  },
  {
    icon: "👤",
    title: "Gestionar tu Perfil",
    desc: "Actualiza tu información personal. Consulta tu reputación, nivel de explorador y expediciones realizadas."
  }
];

const FEATURES_ADMIN = [
  {
    icon: "⚔️",
    title: "Gestión de Investigadores",
    desc: "Reclutar nuevos investigadores, modificar expedientes y administrar todo el registro de agentes activos."
  },
  {
    icon: "🏗️",
    title: "Crear Expediciones",
    desc: "Programa nuevas expediciones internacionales con fechas, precios, cupos, documentación y nivel de riesgo."
  },
  {
    icon: "🗄️",
    title: "Administrar Ubicaciones",
    desc: "Agrega, edita y elimina ubicaciones del archivo clasificado. Actualiza niveles de peligro y notas de campo."
  },
  {
    icon: "📊",
    title: "Panel de Control",
    desc: "Vista global con métricas de investigadores activos, expediciones programadas, pagos y riesgo promedio."
  }
];

const FAQ = [
  {
    q: "¿Qué necesito para unirme a una expedición?",
    a: "Registrarte como investigador y tener la documentación requerida (pasaporte, visa según destino). Cada expedición detalla sus requisitos específicos."
  },
  {
    q: "¿Cómo funciona el sistema de pagos?",
    a: "Al reservar una expedición se genera una referencia única. Los pagos se procesan de forma segura y quedan registrados en tu historial."
  },
  {
    q: "¿Qué diferencia hay entre Investigador y Administrador?",
    a: "Los investigadores pueden explorar y reservar expediciones. Los administradores además pueden crear expediciones, gestionar investigadores y administrar ubicaciones."
  },
  {
    q: "¿Puedo cancelar una reserva?",
    a: "Sí, hasta 48 horas antes del inicio sin penalización. Consulta los términos específicos de cada expedición."
  },
  {
    q: "¿Qué es el nivel de riesgo en las ubicaciones?",
    a: "Una escala del 1 al 10 que indica la peligrosidad operativa del destino. Niveles 8-10 requieren protocolo de seguridad reforzado."
  }
];

export default function Informacion({ user }) {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (i) => {
    playClick();
    setExpandedFaq(expandedFaq === i ? null : i);
  };

  const isAdmin = user?.rol === "admin";

  return (
    <div className="info-page fade-in">

      {/* ── WELCOME HERO ── */}
      <section className="info-hero-banner">
        <div className="info-hero-glow" aria-hidden="true" />
        <div className="info-hero-body">
          <div className="info-hero-badge">
            <span className="info-hero-rune">⬡</span>
            <span>Portal Activo</span>
          </div>
          <h1 className="info-hero-title glitch" data-text="ARKHAM EXPEDITIONS">
            ARKHAM EXPEDITIONS
          </h1>
          <p className="info-hero-sub">Plataforma de Investigación Paranormal Internacional</p>
          {user && (
            <div className="info-welcome-chip">
              <span className={`info-welcome-role ${isAdmin ? "admin" : "inv"}`}>
                {isAdmin ? "⚔️ Administrador" : "🔰 Investigador"}
              </span>
              <span className="info-welcome-name">
                Bienvenido, <strong>{user.nombre} {user.apellido}</strong>
              </span>
            </div>
          )}
          <p className="info-hero-desc">
            Coordina expediciones internacionales, gestiona investigadores, archiva ubicaciones de alto riesgo
            y procesa reservas — todo desde un único centro de control.
          </p>
        </div>
      </section>

      {/* ── QUÉ PUEDES HACER ── */}
      <section className="info-section">
        <div className="info-section-label">TU ACCESO</div>
        <h2 className="info-section-title">
          {isAdmin ? "Capacidades de Administrador" : "Capacidades de Investigador"}
        </h2>
        <div className="info-features-grid">
          {(isAdmin ? FEATURES_ADMIN : FEATURES_INVESTIGADOR).map((f) => (
            <div key={f.title} className="info-feature-card">
              <div className="info-feature-icon">{f.icon}</div>
              <div className="info-feature-body">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="info-section">
        <div className="info-section-label">FLUJO DE USO</div>
        <h2 className="info-section-title">Cómo Usar la Plataforma</h2>
        <div className="info-steps-row">
          {[
            { n: "01", title: "Inicia Sesión", desc: "Accede con tu cuenta. El sistema detecta tu rol automáticamente." },
            { n: "02", title: "Explora Secciones", desc: "Usa el menú lateral para navegar: Investigadores, Ubicaciones o Expediciones." },
            { n: "03", title: "Opera y Gestiona", desc: "Consulta, crea, edita o reserva según tu nivel de acceso." },
            { n: "04", title: "Sincroniza", desc: "Todos los datos se sincronizan en tiempo real con la base de datos." }
          ].map((s, i) => (
            <div key={s.n} className="info-step">
              <div className="info-step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < 3 && <div className="info-step-arrow" aria-hidden="true">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="info-section">
        <div className="info-section-label">SISTEMA DE ROLES</div>
        <h2 className="info-section-title">Investigador vs Administrador</h2>
        <div className="info-roles-grid">
          <div className={`info-role-card ${!isAdmin ? "info-role-card--active" : ""}`}>
            <div className="info-role-icon">🔰</div>
            <h3>Investigador</h3>
            <ul>
              <li>✓ Ver expediciones activas</li>
              <li>✓ Reservar y pagar expediciones</li>
              <li>✓ Consultar ubicaciones clasificadas</li>
              <li>✓ Editar su propio perfil</li>
              <li>✗ Crear/editar expediciones</li>
              <li>✗ Gestionar otros usuarios</li>
            </ul>
          </div>
          <div className={`info-role-card ${isAdmin ? "info-role-card--active" : ""}`}>
            <div className="info-role-icon">⚔️</div>
            <h3>Administrador</h3>
            <ul>
              <li>✓ Todo lo del Investigador</li>
              <li>✓ Crear y editar expediciones</li>
              <li>✓ Gestionar todos los investigadores</li>
              <li>✓ Agregar y editar ubicaciones</li>
              <li>✓ Ver métricas globales</li>
              <li>✓ Acceso total al sistema</li>
            </ul>
          </div>
        </div>
        <p className="info-roles-note">
          Tu rol actual: <strong className={isAdmin ? "text-admin" : "text-inv"}>
            {isAdmin ? "Administrador ⚔️" : "Investigador 🔰"}
          </strong>.
          El rol es asignado por el equipo directivo de Arkham Expeditions.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="info-section">
        <div className="info-section-label">SOPORTE</div>
        <h2 className="info-section-title">Preguntas Frecuentes</h2>
        <div className="info-faq-list">
          {FAQ.map((item, i) => (
            <div key={i} className={`info-faq-item ${expandedFaq === i ? "open" : ""}`}>
              <button className="info-faq-q" onClick={() => toggleFaq(i)}>
                <span>{item.q}</span>
                <span className="info-faq-chevron">{expandedFaq === i ? "−" : "+"}</span>
              </button>
              {expandedFaq === i && (
                <div className="info-faq-a">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACTO ── */}
      <section className="info-section info-section--last">
        <div className="info-section-label">CONTACTO</div>
        <h2 className="info-section-title">Centro de Operaciones</h2>
        <div className="info-contact-grid">
          {[
            { icon: "📧", label: "Correo", value: "investigadores@arkhamexpeditions.com" },
            { icon: "📍", label: "Sede", value: "Miskatonic, Massachusetts, USA" },
            { icon: "📞", label: "Línea directa", value: "+1 (978) ARKHAM-1" },
            { icon: "🌐", label: "Portal", value: "www.arkhamexpeditions.com" }
          ].map((c) => (
            <div key={c.label} className="info-contact-item">
              <span className="info-contact-icon">{c.icon}</span>
              <div>
                <div className="info-contact-label">{c.label}</div>
                <div className="info-contact-value">{c.value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="info-footer">
        <p>© 1923–{new Date().getFullYear()} Arkham Expeditions. Todos los derechos reservados.</p>
        <div className="info-footer-links">
          <span>Términos de Servicio</span>
          <span>·</span>
          <span>Política de Privacidad</span>
          <span>·</span>
          <span>Aviso de Seguridad</span>
        </div>
      </footer>
    </div>
  );
}
