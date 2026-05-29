import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { playClick, playHover } from "../utils/audioHelper";

const emptyForm = { nombre: "", direccion: "", descripcion: "", nivel_peligro: "" };

export default function Lugares({ apiBase, onDataChange }) {
  const API_URL = `${apiBase}/api/lugares`;
  const [lugares, setLugares] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargar = async () => {
    setCargando(true);
    setError("");
    try {
      const { data } = await axios.get(API_URL);
      setLugares(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Error al cargar ubicaciones malditas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

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
        await axios.put(`${API_URL}/${editId}`, payload);
        setMensaje("Ubicación actualizada en los archivos.");
      } else {
        await axios.post(API_URL, payload);
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
      await axios.delete(`${API_URL}/${id}`);
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
    const lvl = Number(level);
    if (!lvl) return <span className="hazard-badge unknown">Desconocido</span>;
    if (lvl <= 3) {
      return <span className="hazard-badge low">Riesgo Bajo ({lvl}/10)</span>;
    } else if (lvl <= 7) {
      return <span className="hazard-badge moderate">Riesgo Moderado ({lvl}/10)</span>;
    } else {
      return <span className="hazard-badge extreme pulsing-red">Peligro Extremo ({lvl}/10)</span>;
    }
  };

  return (
    <div className="crud-container fade-in-scale">
      <div className="crud-header">
        <h2>Ubicaciones Clasificadas</h2>
        <p className="subtitle">
          Archiva los lugares más aterradores, embrujados y misteriosos del planeta.
        </p>
      </div>

      <div className="crud-grid">
        {/* Left Column: Form */}
        <div className="form-card-column animate-slide-right">
          <div className="form-panel">
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
              <div className="input-group">
                <textarea
                  name="descripcion"
                  value={form.descripcion || ""}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Notas, avistamientos y horrores ocurridos aquí..."
                ></textarea>
              </div>

              <div className="actions">
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
          <div className="table-panel">
            <div className="toolbar">
              <div className="search-wrapper">
                <span className="search-icon">🔍</span>
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
                    filtrados.map((l) => (
                      <tr key={l.id_lugar} className="table-row-animate">
                        <td className="lugar-nombre-cell">
                          <strong>{l.nombre}</strong>
                        </td>
                        <td>{l.direccion || "Desconocida"}</td>
                        <td>{getHazardBadge(l.nivel_peligro)}</td>
                        <td className="truncate" title={l.descripcion}>
                          {l.descripcion || "Sin reportes oficiales."}
                        </td>
                        <td className="row-actions">
                          <button
                            type="button"
                            className="btn-secondary"
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
                            className="btn-danger"
                            onClick={() => eliminar(l.id_lugar)}
                            onMouseEnter={playHover}
                          >
                            Quemar
                          </button>
                        </td>
                      </tr>
                    ))
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
