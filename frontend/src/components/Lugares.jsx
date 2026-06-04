import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../services/api";
import { playClick, playHover } from "../utils/audioHelper";

const emptyForm = { nombre: "", direccion: "", descripcion: "", nivel_peligro: "" };

const getRiskMeta = (level) => {
  const lvl = Number(level) || 0;
  if (!lvl) return { className: "unknown", label: "Sin evaluar", detail: "N/D", value: 0 };
  if (lvl <= 3) return { className: "low", label: "Controlado", detail: `${lvl}/10`, value: lvl };
  if (lvl <= 7) return { className: "moderate", label: "Inestable", detail: `${lvl}/10`, value: lvl };
  return { className: "extreme", label: "Crítico", detail: `${lvl}/10`, value: lvl };
};

export default function Lugares({ apiBase, onDataChange, user }) {
  const API_URL = "/api/lugares";
  const [lugares, setLugares] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const { data } = await apiClient.get(API_URL);
      setLugares(Array.isArray(data) ? data : []);
    } catch {
      setError("Error al cargar ubicaciones malditas.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(cargar);
  }, [cargar]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return lugares;
    return lugares.filter(
      (l) =>
        `${l.nombre || ""} ${l.direccion || ""}`
          .toLowerCase()
          .includes(q)
    );
  }, [lugares, busqueda]);

  const estadisticas = useMemo(() => {
    const evaluados = lugares.filter((l) => Number(l.nivel_peligro));
    const riesgoAlto = lugares.filter((l) => Number(l.nivel_peligro) >= 8).length;
    const documentados = lugares.filter((l) => (l.descripcion || "").trim()).length;
    const promedio = evaluados.length
      ? evaluados.reduce((acc, l) => acc + Number(l.nivel_peligro), 0) / evaluados.length
      : 0;

    return {
      total: lugares.length,
      riesgoAlto,
      documentados,
      promedio
    };
  }, [lugares]);

  const guardar = async (e) => {
    e.preventDefault();
    playClick();
    setMensaje("");
    setError("");
    if (!form.nombre.trim()) return setError("El nombre de la ubicación es vital.");
    
    const payload = { 
      ...form, 
      nivel_peligro: form.nivel_peligro ? Number(form.nivel_peligro) : null 
    };

    try {
      if (editId) {
        await apiClient.put(`${API_URL}/${editId}`, payload);
        setMensaje("Ubicación actualizada en los archivos.");
      } else {
        await apiClient.post(API_URL, payload);
        setMensaje("Nueva ubicación maldita registrada.");
      }
      setForm(emptyForm);
      setEditId(null);
      await cargar();
      if (onDataChange) onDataChange();
    } catch (err) {
      setError(err?.response?.data?.message || "El horror impidió guardar esto.");
    }
  };

  const eliminar = async (id) => {
    playClick();
    if (
      !window.confirm(
        "¿Olvidar este lugar para siempre? (Cuidado, si tiene expediciones activas fallará)"
      )
    ) {
      return;
    }
    setMensaje("");
    setError("");
    try {
      await apiClient.delete(`${API_URL}/${id}`);
      setMensaje("Lugar borrado de la memoria.");
      if (editId === id) {
        setForm(emptyForm);
        setEditId(null);
      }
      await cargar();
      if (onDataChange) onDataChange();
    } catch (err) {
      setError(err?.response?.data?.message || "Voces del más allá impidieron borrar esto.");
    }
  };

  const getHazardBadge = (level) => {
    const risk = getRiskMeta(level);
    return (
      <div className={`risk-meter risk-meter--${risk.className}`}>
        <div className="risk-meter-head">
          <span>{risk.label}</span>
          <strong>{risk.detail}</strong>
        </div>
        <div className="risk-meter-track">
          <span style={{ width: `${risk.value * 10}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="crud-container locations-crud fade-in-scale">
      <div className="crud-header">
        <h2>Ubicaciones Clasificadas</h2>
        <p className="subtitle">
          Archiva los lugares más aterradores, embrujados y misteriosos del planeta.
        </p>
      </div>

      <div className="intel-grid">
        <div className="intel-card">
          <span>Archivo</span>
          <strong>{estadisticas.total}</strong>
          <small>ubicaciones registradas</small>
        </div>
        <div className="intel-card danger">
          <span>Críticas</span>
          <strong>{estadisticas.riesgoAlto}</strong>
          <small>requieren contención</small>
        </div>
        <div className="intel-card">
          <span>Promedio</span>
          <strong>{estadisticas.promedio.toFixed(1)}</strong>
          <small>nivel de riesgo global</small>
        </div>
        <div className="intel-card">
          <span>Con notas</span>
          <strong>{estadisticas.documentados}</strong>
          <small>expedientes documentados</small>
        </div>
      </div>

      <div className="crud-grid">
        {/* Left Column: Form */}
        <div className="form-card-column animate-slide-right">
          <div className="form-panel location-form-panel">
            <div className="panel-kicker">Cartografía anómala</div>
            <h3>{editId ? "Modificar Archivo" : "Archivar Ubicación"}</h3>
            <p className="form-desc-text">Registra datos topográficos del horror.</p>
            <form onSubmit={guardar}>
              <div className="input-group">
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre de la ubicación (Ej. Asilo Pennhurst)"
                  required
                />
              </div>
              <div className="input-group">
                <input
                  name="direccion"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Coordenadas o Dirección"
                />
              </div>
              <div className="input-group">
                <input
                  name="nivel_peligro"
                  type="number"
                  min="1"
                  max="10"
                  value={form.nivel_peligro}
                  onChange={(e) => setForm({ ...form, nivel_peligro: e.target.value })}
                  placeholder="Nivel de Terror (1-10)"
                />
              </div>
              <div className="risk-quickset" aria-label="Niveles rápidos de riesgo">
                {[
                  ["3", "Bajo"],
                  ["6", "Medio"],
                  ["9", "Crítico"]
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={String(form.nivel_peligro) === value ? "active" : ""}
                    onClick={() => {
                      playClick();
                      setForm({ ...form, nivel_peligro: value });
                    }}
                    onMouseEnter={playHover}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="input-group">
                <textarea
                  name="descripcion"
                  value={form.descripcion || ""}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Notas, avistamientos y horrores ocurridos aquí..."
                ></textarea>
              </div>

              <div className="actions user-form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  onMouseEnter={playHover}
                >
                  {editId ? "Sobreescribir" : "Archivar"}
                </button>
                {editId && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      playClick();
                      setForm(emptyForm);
                      setEditId(null);
                    }}
                    onMouseEnter={playHover}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Table */}
        <div className="table-card-column">
          <div className="table-panel locations-panel">
            <div className="toolbar">
              <div className="search-wrapper">
                <span className="search-icon" aria-hidden="true">⌕</span>
                <input
                  className="search-bar"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Investigar archivo de lugares..."
                />
              </div>
              <button
                type="button"
                className="btn-secondary sync-btn"
                onClick={() => {
                  playClick();
                  cargar();
                }}
                onMouseEnter={playHover}
              >
                <span aria-hidden="true">↻</span>
                Sincronizar
              </button>
            </div>

            {cargando && <p className="status-text loading-pulse">Buscando en tomos antiguos...</p>}
            {mensaje && <p className="status-text ok">{mensaje}</p>}
            {error && <p className="status-text error">{error}</p>}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Lugar maldito</th>
                    <th>Dirección</th>
                    <th>Nivel de Riesgo</th>
                    <th>Notas de Campo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty">
                        Ningún lugar maldito hallado con esos términos.
                      </td>
                    </tr>
                  ) : (
                    filtrados.map((l) => {
                      const risk = getRiskMeta(l.nivel_peligro);

                      return (
                      <tr key={l.id_lugar} className="table-row-animate">
                        <td className="lugar-nombre-cell">
                          <div className="location-title-cell">
                            <span className={`location-sigil location-sigil--${risk.className}`}>
                              {risk.value >= 8 ? "!" : risk.value ? risk.value : "?"}
                            </span>
                            <div>
                              <strong>{l.nombre}</strong>
                              <small>Archivo L-{String(l.id_lugar).padStart(3, "0")}</small>
                            </div>
                          </div>
                        </td>
                        <td className="muted-cell">{l.direccion || "Desconocida"}</td>
                        <td>{getHazardBadge(l.nivel_peligro)}</td>
                        <td className="truncate" title={l.descripcion}>
                          {l.descripcion || "Sin reportes oficiales."}
                        </td>
                        <td className="row-actions">
                          <button
                            type="button"
                            className="btn-secondary action-btn"
                            onClick={() => {
                              playClick();
                              setEditId(l.id_lugar);
                              setForm(l);
                            }}
                            onMouseEnter={playHover}
                          >
                            Modificar
                          </button>
                          <button
                            type="button"
                            className="btn-danger action-btn"
                            onClick={() => eliminar(l.id_lugar)}
                            onMouseEnter={playHover}
                          >
                            Quemar
                          </button>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
