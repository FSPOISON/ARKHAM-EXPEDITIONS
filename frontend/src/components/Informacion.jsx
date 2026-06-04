import { useState } from "react";
import { playClick } from "../utils/audioHelper";

export default function Informacion() {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (index) => {
    playClick();
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqItems = [
    {
      pregunta: "¿Qué requisitos tengo para unirme a una expedición?",
      respuesta: "Debes estar registrado como investigador. Algunas expediciones requieren pasaporte válido, visa de ciertos países, y certificados de salud mental. Consulta los detalles específicos de cada expedición."
    },
    {
      pregunta: "¿Qué sucede si encuentro evidencia paranormal?",
      respuesta: "Puedes cargar evidencia multimedia (fotos, videos, archivos de audio) directamente en el portal. Nuestro equipo de expertos revisará todo el material para análisis."
    },
    {
      pregunta: "¿Cuáles son los niveles de dificultad?",
      respuesta: "Tenemos 5 niveles: Novato (nivel 1), Explorador (2), Veterano (3), Experto (4), y Maestro Investigador (5). Comienza con expediciones de tu nivel."
    },
    {
      pregunta: "¿Puedo retractarme de una expedición?",
      respuesta: "Sí, pero depende de la fase. Hasta 48 horas antes del inicio puedes cancelar sin penalización. Después de eso, se aplicarán políticas según los términos de la expedición."
    },
    {
      pregunta: "¿Cómo se calcula la reputación?",
      respuesta: "Ganas puntos de reputación por completar expediciones, proporcionar evidencia valiosa, y obtener buenas calificaciones de otros investigadores. La reputación abre acceso a expediciones exclusivas."
    },
    {
      pregunta: "¿Es seguro investigar lugares malditos?",
      respuesta: "Nuestras expediciones están diseñadas con protocolos de seguridad. Sin embargo, la investigación paranormal siempre conlleva riesgos. Asumes los riesgos por tu propia cuenta."
    }
  ];

  return (
    <div className="info-container fade-in-scale">
      {/* Hero Section */}
      <section className="info-hero">
        <div className="info-hero-content">
          <h1>ARKHAM EXPEDITIONS</h1>
          <p className="info-hero-subtitle">Explorando los Misterios del Más Allá</p>
          <div className="info-divider"></div>
          <p className="info-hero-description">
            Somos una agencia internacional dedicada a investigar, documentar y comprender los fenómenos paranormales,
            las ubicaciones prohibidas y los misterios que desafían la explicación científica convencional.
          </p>
        </div>
      </section>

      {/* Quiénes Somos */}
      <section className="info-section">
        <div className="info-section-header">
          <h2>¿Quiénes Somos?</h2>
          <div className="info-section-divider"></div>
        </div>
        <div className="info-section-content">
          <p>
            Fundada en 1923 en Miskatonic, Arkham Expeditions se ha convertido en la organización líder en investigación paranormal
            a nivel global. Nuestro equipo está compuesto por investigadores, académicos, ocultistas y aventureros dedicados a
            desentrañar los secretos de lo inexplicable.
          </p>
          <p>
            A lo largo de más de un siglo, hemos catalogado miles de ubicaciones anómalas, recopilado evidencia de fenómenos
            sobrenaturales y documentado encuentros que desafían la comprensión humana. Cada investigador en nuestro registro
            contribuye a una base de conocimiento sin precedentes.
          </p>
        </div>
      </section>

      {/* Servicios */}
      <section className="info-section">
        <div className="info-section-header">
          <h2>Nuestros Servicios</h2>
          <div className="info-section-divider"></div>
        </div>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">🗺️</div>
            <h3>Expediciones Paranormales</h3>
            <p>Participa en expediciones organizadas a ubicaciones de alto interés paranormal alrededor del mundo.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">📸</div>
            <h3>Análisis de Evidencia</h3>
            <p>Sube y comparte evidencia multimedia de tus investigaciones. Nuestros expertos la analizan exhaustivamente.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">📚</div>
            <h3>Archivo de Conocimiento</h3>
            <p>Acceso a nuestra extensa base de datos sobre fenómenos paranormales, ubicaciones malditas y casos documentados.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">🎓</div>
            <h3>Capacitación</h3>
            <p>Obtén certificaciones en investigación paranormal, protocolo de campo y análisis de evidencia.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">👥</div>
            <h3>Red Global</h3>
            <p>Conecta con investigadores de todo el mundo, comparte hallazgos y colabora en proyectos especiales.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">🔐</div>
            <h3>Confidencialidad</h3>
            <p>Tus investigaciones están protegidas. Información clasificada permanece segura en nuestros archivos.</p>
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section className="info-section">
        <div className="info-section-header">
          <h2>Cómo Funciona</h2>
          <div className="info-section-divider"></div>
        </div>
        <div className="how-it-works">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Regístrate</h3>
              <p>Crea tu perfil de investigador. Proporciona información básica y acepta los términos de participación.</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Explora Expediciones</h3>
              <p>Navega nuestro catálogo de expediciones disponibles. Filtra por ubicación, dificultad y fecha.</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Únete y Prepárate</h3>
              <p>Completa el registro en la expedición. Recibe instrucciones, requisitos y equipo necesario.</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-item">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Investiga</h3>
              <p>Participa en la expedición. Documenta hallazgos, recopila evidencia y sigue protocolos de seguridad.</p>
            </div>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-item">
            <div className="step-number">5</div>
            <div className="step-content">
              <h3>Reporta y Gana</h3>
              <p>Sube tu informe y evidencia. Gana reputación y acceso a investigaciones más exclusivas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Requisitos */}
      <section className="info-section">
        <div className="info-section-header">
          <h2>Requisitos Generales</h2>
          <div className="info-section-divider"></div>
        </div>
        <div className="requirements-grid">
          <div className="requirement-item">
            <span className="req-icon">✓</span>
            <h3>Edad Mínima</h3>
            <p>Debes tener al menos 18 años. Se requiere documentación de identidad válida.</p>
          </div>
          <div className="requirement-item">
            <span className="req-icon">✓</span>
            <h3>Capacidad Física</h3>
            <p>Buen estado de salud. Algunas expediciones requieren certificado médico.</p>
          </div>
          <div className="requirement-item">
            <span className="req-icon">✓</span>
            <h3>Pasaporte</h3>
            <p>Válido por al menos 6 meses para expediciones internacionales.</p>
          </div>
          <div className="requirement-item">
            <span className="req-icon">✓</span>
            <h3>Seguro</h3>
            <p>Cobertura de viaje internacional. Se puede contratar a través de nuestra plataforma.</p>
          </div>
          <div className="requirement-item">
            <span className="req-icon">✓</span>
            <h3>Equipamiento</h3>
            <p>Equipo básico de investigación. Proporcionamos lista de recomendaciones.</p>
          </div>
          <div className="requirement-item">
            <span className="req-icon">✓</span>
            <h3>Compromiso</h3>
            <p>Adherencia a protocolos de seguridad y confidencialidad. Firma de acuerdos legales.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="info-section">
        <div className="info-section-header">
          <h2>Preguntas Frecuentes</h2>
          <div className="info-section-divider"></div>
        </div>
        <div className="faq-container">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className={`faq-item ${expandedFaq === index ? "expanded" : ""}`}
              onMouseEnter={playHover}
            >
              <button
                className="faq-question"
                onClick={() => toggleFaq(index)}
              >
                <span className="faq-toggle">
                  {expandedFaq === index ? "−" : "+"}
                </span>
                <span>{item.pregunta}</span>
              </button>
              {expandedFaq === index && (
                <div className="faq-answer fade-in-fast">
                  {item.respuesta}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contacto */}
      <section className="info-section info-section-last">
        <div className="info-section-header">
          <h2>Ponte en Contacto</h2>
          <div className="info-section-divider"></div>
        </div>
        <div className="contact-content">
          <div className="contact-item">
            <span className="contact-icon">📧</span>
            <div>
              <h3>Correo Electrónico</h3>
              <p>investigadores@arkhamexpeditions.com</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">📍</span>
            <div>
              <h3>Oficina Principal</h3>
              <p>Miskatonic, Massachusetts, USA</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">📞</span>
            <div>
              <h3>Línea de Investigaciones</h3>
              <p>+1 (978) ARKHAM-1</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">🌐</span>
            <div>
              <h3>Portal Web</h3>
              <p>www.arkhamexpeditions.com</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="info-footer">
        <p>© 1923-2026 Arkham Expeditions. Todos los derechos reservados.</p>
        <p className="info-footer-legal">
          <span style={{ cursor: "pointer" }}>Términos de Servicio</span>
          {" • "}
          <span style={{ cursor: "pointer" }}>Política de Privacidad</span>
          {" • "}
          <span style={{ cursor: "pointer" }}>Aviso de Seguridad</span>
        </p>
      </footer>
    </div>
  );
}
