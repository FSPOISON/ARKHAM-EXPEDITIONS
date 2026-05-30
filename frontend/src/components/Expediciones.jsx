import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const emptyForm = {
  titulo: "",
  descripcion: "",
  precio_base: "",
  nivel_dificultad: "",
  id_lugar: "",
  fecha_inicio: "",
  fecha_fin: "",
  capacidad_maxima: "",
  requiere_pasaporte: true,
  requiere_visa: false
};

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
};

const formatMoney = (value) => {
  if (!value) return "Por definir";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Number(value));
};

const toDateInput = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const calculateDays = (start, end) => {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = Math.ceil((endDate - startDate) / 86400000) + 1;
  return diff > 0 ? diff : null;
};

const buildReadiness = (expedition) => {
  const difficulty = Number(expedition.nivel_dificultad) || 0;
  const placeRisk = Number(expedition.tbl_lugares?.nivel_peligro) || 0;
  const days = calculateDays(expedition.fecha_inicio, expedition.fecha_fin);
  const checks = [
    {
      label: "Pasaporte vigente",
      status: expedition.requiere_pasaporte ? "obligatorio" : "opcional"
    },
    {
      label: "Revisión de visa",
      status: expedition.requiere_visa ? "obligatorio" : "según nacionalidad"
    },
    {
      label: "Seguro internacional",
      status: difficulty >= 6 || placeRisk >= 7 ? "prioritario" : "recomendado"
    },
    {
      label: "Plan médico y vacunas",
      status: days && days > 7 ? "prioritario" : "recomendado"
    }
  ];

  const score = checks.reduce((acc, item) => {
    if (item.status === "obligatorio") return acc + 30;
    if (item.status === "prioritario") return acc + 20;
    return acc + 10;
  }, 0);

  return {
    checks,
    score: Math.min(score, 100),
    tone: score >= 80 ? "critical" : score >= 55 ? "medium" : "calm"
  };
};

export default function Expediciones({ apiBase, onDataChange }) {
  const API_URL = `${apiBase}/api/expediciones`;
  const LUGARES_URL = `${apiBase}/api/lugares`;

  const [expediciones, setExpediciones] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [expRes, lugRes] = await Promise.all([
        axios.get(API_URL),
        axios.get(LUGARES_URL)
      ]);
      setExpediciones(Array.isArray(expRes.data) ? expRes.data : []);
      setLugares(Array.isArray(lugRes.data) ? lugRes.data : []);
    } catch {
      setError("No se pudo cargar el tablero de expediciones.");
    } finally {
      setCargando(false);
    }
  }, [API_URL, LUGARES_URL]);

  useEffect(() => {
    Promise.resolve().then(cargar);
  }, [cargar]);

  const expedicionesEnriquecidas = useMemo(
    () =>
      expediciones.map((exp) => ({
        ...exp,
        readiness: buildReadiness(exp),
        dias: calculateDays(exp.fecha_inicio, exp.fecha_fin)
      })),
    [expediciones]
  );

  const estadisticas = useMemo(() => {
    const conVisa = expedicionesEnriquecidas.filter((e) => e.requiere_visa).length;
    const conPasaporte = expedicionesEnriquecidas.filter((e) => e.requiere_pasaporte).length;
    const presupuesto = expedicionesEnriquecidas.reduce(
      (acc, e) => acc + (Number(e.precio_base) || 0),
      0
    );
    const altoRiesgo = expedicionesEnriquecidas.filter(
      (e) => Number(e.nivel_dificultad) >= 7 || Number(e.tbl_lugares?.nivel_peligro) >= 7
    ).length;

    return { conVisa, conPasaporte, presupuesto, altoRiesgo };
  }, [expedicionesEnriquecidas]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return expedicionesEnriquecidas.filter((e) => {
      const text = `${e.titulo || ""} ${e.descripcion || ""} ${e.tbl_lugares?.nombre || ""}`.toLowerCase();
      const matchesText = !q || text.includes(q);
      const matchesFilter =
        filtro === "todas" ||
        (filtro === "visa" && e.requiere_visa) ||
        (filtro === "riesgo" && (Number(e.nivel_dificultad) >= 7 || Number(e.tbl_lugares?.nivel_peligro) >= 7)) ||
        (filtro === "proximas" && e.fecha_inicio && new Date(e.fecha_inicio) >= new Date());

      return matchesText && matchesFilter;
    });
  }, [expedicionesEnriquecidas, busqueda, filtro]);

  const guardar = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    if (!form.titulo.trim()) return setError("La expedición necesita un título.");
    if (form.fecha_inicio && form.fecha_fin && new Date(form.fecha_fin) < new Date(form.fecha_inicio)) {
      return setError("La fecha de regreso no puede ser anterior a la salida.");
    }

    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, form);
        setMensaje("Expedición internacional actualizada.");
      } else {
        await axios.post(API_URL, form);
        setMensaje("Expedición internacional programada.");
      }
      setForm(emptyForm);
      setEditId(null);
      await cargar();
      if (onDataChange) onDataChange();
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo guardar la expedición.");
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Cancelar esta expedición internacional?")) return;
    setMensaje("");
    setError("");
    try {
      await axios.delete(`${API_URL}/${id}`);
      setMensaje("Expedición cancelada.");
      if (editId === id) {
        setForm(emptyForm);
        setEditId(null);
      }
      await cargar();
      if (onDataChange) onDataChange();
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo cancelar.");
    }
  };

  const editar = (exp) => {
    setEditId(exp.id_expedicion);
    setForm({
      titulo: exp.titulo || "",
      descripcion: exp.descripcion || "",
      precio_base: exp.precio_base || "",
      nivel_dificultad: exp.nivel_dificultad || "",
      id_lugar: exp.id_lugar || "",
      fecha_inicio: toDateInput(exp.fecha_inicio),
      fecha_fin: toDateInput(exp.fecha_fin),
      capacidad_maxima: exp.capacidad_maxima || "",
      requiere_pasaporte: Boolean(exp.requiere_pasaporte),
      requiere_visa: Boolean(exp.requiere_visa)
    });
  };

  return (
    <div className="crud-container fade-in expedition-suite">
      <div className="crud-header">
        <h2>Programador de Expediciones Internacionales</h2>
        <p className="subtitle">
          Coordina destinos, documentación migratoria, presupuesto, cupos y riesgo operativo.
        </p>
      </div>

      <div className="expedition-command-grid">
        <div className="expedition-stat">
          <span className="expedition-stat-label">Visa requerida</span>
          <strong>{estadisticas.conVisa}</strong>
          <small>rutas con revisión consular</small>
        </div>
        <div className="expedition-stat">
          <span className="expedition-stat-label">Pasaporte</span>
          <strong>{estadisticas.conPasaporte}</strong>
          <small>salidas internacionales</small>
        </div>
        <div className="expedition-stat">
          <span className="expedition-stat-label">Presupuesto base</span>
          <strong>{formatMoney(estadisticas.presupuesto)}</strong>
          <small>portafolio activo</small>
        </div>
        <div className="expedition-stat danger">
          <span className="expedition-stat-label">Alto riesgo</span>
          <strong>{estadisticas.altoRiesgo}</strong>
          <small>requieren protocolo reforzado</small>
        </div>
      </div>

      <div className="expedition-layout">
        <form onSubmit={guardar} className="form-panel expedition-form">
          <div className="form-section-title">
            <h3>{editId ? "Editar Expedición" : "Nueva Expedición"}</h3>
            <p>Define la misión con requisitos reales de viaje.</p>
          </div>

          <input
            name="titulo"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Ruta internacional, ej. Andes - Patagonia"
            required
          />

          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Objetivo, logística, equipo requerido, aliados locales..."
          />

          <div className="form-row">
            <select
              name="id_lugar"
              value={form.id_lugar}
              onChange={(e) => setForm({ ...form, id_lugar: e.target.value })}
            >
              <option value="">Destino internacional...</option>
              {lugares.map((lugar) => (
                <option key={lugar.id_lugar} value={lugar.id_lugar}>
                  {lugar.nombre}
                </option>
              ))}
            </select>
            <input
              name="capacidad_maxima"
              type="number"
              min="1"
              value={form.capacidad_maxima}
              onChange={(e) => setForm({ ...form, capacidad_maxima: e.target.value })}
              placeholder="Cupos"
            />
          </div>

          <div className="form-row">
            <input
              name="fecha_inicio"
              type="date"
              value={form.fecha_inicio}
              onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
            />
            <input
              name="fecha_fin"
              type="date"
              value={form.fecha_fin}
              onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
            />
          </div>

          <div className="form-row">
            <input
              name="precio_base"
              type="number"
              step="0.01"
              min="0"
              value={form.precio_base}
              onChange={(e) => setForm({ ...form, precio_base: e.target.value })}
              placeholder="Costo base USD"
            />
            <input
              name="nivel_dificultad"
              type="number"
              min="1"
              max="10"
              value={form.nivel_dificultad}
              onChange={(e) => setForm({ ...form, nivel_dificultad: e.target.value })}
              placeholder="Dificultad 1-10"
            />
          </div>

          <div className="travel-requirements">
            <label className="switch-row">
              <input
                type="checkbox"
                checked={form.requiere_pasaporte}
                onChange={(e) => setForm({ ...form, requiere_pasaporte: e.target.checked })}
              />
              <span>Requiere pasaporte vigente</span>
            </label>
            <label className="switch-row">
              <input
                type="checkbox"
                checked={form.requiere_visa}
                onChange={(e) => setForm({ ...form, requiere_visa: e.target.checked })}
              />
              <span>Requiere visa o permiso consular</span>
            </label>
          </div>

          <div className="service-preview">
            <div>
              <strong>Recomendación automática</strong>
              <p>
                {form.requiere_visa
                  ? "Inicia validación consular 45-90 días antes y solicita carta de invitación."
                  : "Verifica exenciones de visa por nacionalidad antes de emitir tiquetes."}
              </p>
            </div>
            <div>
              <strong>Documentos mínimos</strong>
              <p>Pasaporte, seguro médico, contacto de emergencia y comprobantes de alojamiento.</p>
            </div>
          </div>

          <div className="actions">
            <button type="submit" className="btn-primary">
              {editId ? "Guardar Expedición" : "Programar Expedición"}
            </button>
            {editId && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setForm(emptyForm);
                  setEditId(null);
                }}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>

        <div className="expedition-services">
          <div className="service-card">
            <span>01</span>
            <strong>Documentación</strong>
            <p>Control de pasaporte, visa, permisos de entrada y vigencias críticas.</p>
          </div>
          <div className="service-card">
            <span>02</span>
            <strong>Riesgo y salud</strong>
            <p>Priorización de seguros, vacunas, rutas alternas y contactos de emergencia.</p>
          </div>
          <div className="service-card">
            <span>03</span>
            <strong>Logística</strong>
            <p>Fechas, cupos, presupuesto base y destino conectado con el archivo de lugares.</p>
          </div>
        </div>
      </div>

      <div className="table-panel expedition-board">
        <div className="toolbar expedition-toolbar">
          <input
            className="search-bar"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por ruta, destino o descripción..."
          />
          <div className="filter-pills">
            {[
              ["todas", "Todas"],
              ["proximas", "Próximas"],
              ["visa", "Con visa"],
              ["riesgo", "Alto riesgo"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filtro === value ? "active" : ""}
                onClick={() => setFiltro(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="btn-secondary" onClick={cargar}>
            Sincronizar
          </button>
        </div>

        {cargando && <p className="status-text loading-pulse">Actualizando itinerarios...</p>}
        {mensaje && <p className="status-text ok">{mensaje}</p>}
        {error && <p className="status-text error">{error}</p>}

        <div className="expedition-card-grid">
          {filtrados.length === 0 ? (
            <div className="empty expedition-empty">
              No hay expediciones con esos criterios.
            </div>
          ) : (
            filtrados.map((exp) => (
              <article key={exp.id_expedicion} className="expedition-card">
                <div className="expedition-card-head">
                  <div>
                    <span className="route-code">EXP-{exp.id_expedicion}</span>
                    <h3>{exp.titulo}</h3>
                    <p>{exp.tbl_lugares?.nombre || "Destino por confirmar"}</p>
                  </div>
                  <span className={`readiness-badge ${exp.readiness.tone}`}>
                    {exp.readiness.score}% listo
                  </span>
                </div>

                <div className="itinerary-strip">
                  <div>
                    <small>Salida</small>
                    <strong>{formatDate(exp.fecha_inicio)}</strong>
                  </div>
                  <div>
                    <small>Regreso</small>
                    <strong>{formatDate(exp.fecha_fin)}</strong>
                  </div>
                  <div>
                    <small>Duración</small>
                    <strong>{exp.dias ? `${exp.dias} días` : "Pendiente"}</strong>
                  </div>
                </div>

                <div className="expedition-meta-grid">
                  <span>Presupuesto: <strong>{formatMoney(exp.precio_base)}</strong></span>
                  <span>Cupos: <strong>{exp.capacidad_maxima || "Sin límite"}</strong></span>
                  <span>Dificultad: <strong>{exp.nivel_dificultad || "N/D"}/10</strong></span>
                  <span>Riesgo destino: <strong>{exp.tbl_lugares?.nivel_peligro || "N/D"}/10</strong></span>
                </div>

                <div className="document-pills">
                  <span className={exp.requiere_pasaporte ? "required" : ""}>
                    Pasaporte {exp.requiere_pasaporte ? "requerido" : "opcional"}
                  </span>
                  <span className={exp.requiere_visa ? "required" : ""}>
                    Visa {exp.requiere_visa ? "requerida" : "por nacionalidad"}
                  </span>
                </div>

                <div className="readiness-list">
                  {exp.readiness.checks.map((check) => (
                    <div key={check.label}>
                      <span>{check.label}</span>
                      <strong>{check.status}</strong>
                    </div>
                  ))}
                </div>

                {exp.descripcion && <p className="expedition-description">{exp.descripcion}</p>}

                <div className="row-actions">
                  <button type="button" className="btn-secondary" onClick={() => editar(exp)}>
                    Modificar
                  </button>
                  <button type="button" className="btn-danger" onClick={() => eliminar(exp.id_expedicion)}>
                    Cancelar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
