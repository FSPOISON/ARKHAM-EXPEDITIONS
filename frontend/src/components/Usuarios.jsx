import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { playClick, playHover } from "../utils/audioHelper";

const emptyForm = { nombre: "", apellido: "", email: "", telefono: "" };
const creatureStyles = ["wendigo", "deep-one", "night-gaunt", "shoggoth"];

const getCreatureProfile = (user) => {
  const seed = encodeURIComponent(`${user.id_usuario}-${user.email || user.nombre || "arkham"}`);
  const variant = creatureStyles[Number(user.id_usuario || 0) % creatureStyles.length];

  return {
    variant,
    avatar: `https://robohash.org/${seed}.png?set=set2&size=160x160`,
  };
};

export default function Usuarios({ apiBase, onDataChange }) {
  const API_URL = `${apiBase}/api/usuarios`;
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const { data } = await axios.get(API_URL);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Error al cargar investigadores.");
    } finally {
      setCargando(false);
    }
  }, [API_URL]);

  useEffect(() => {
    Promise.resolve().then(cargarUsuarios);
  }, [cargarUsuarios]);

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter(
      (u) =>
        `${u.nombre || ""} ${u.apellido || ""} ${u.email || ""}`
          .toLowerCase()
          .includes(q)
    );
  }, [usuarios, busqueda]);

  const guardar = async (e) => {
    e.preventDefault();
    playClick();
    setMensaje("");
    setError("");
    if (!form.nombre.trim() || !form.apellido.trim() || !form.email.trim()) {
      return setError("Nombre, apellido y email son obligatorios.");
    }
    const payload = { ...form };
    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, payload);
        setMensaje("Investigador actualizado.");
      } else {
        await axios.post(API_URL, payload);
        setMensaje("Nuevo investigador reclutado.");
      }
      setForm(emptyForm);
      setEditId(null);
      await cargarUsuarios();
      if (onDataChange) onDataChange();
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo guardar.");
    }
  };

  const eliminar = async (id) => {
    playClick();
    if (!window.confirm("¿Desterrar a este investigador permanentemente?")) return;
    setMensaje("");
    setError("");
    try {
      await axios.delete(`${API_URL}/${id}`);
      setMensaje("Investigador desterrado.");
      if (editId === id) {
        setForm(emptyForm);
        setEditId(null);
      }
      await cargarUsuarios();
      if (onDataChange) onDataChange();
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo eliminar.");
    }
  };

  return (
    <div className="crud-container users-crud fade-in-scale">
      <div className="crud-header">
        <h2>Registro de Investigadores</h2>
        <p className="subtitle">
          Administra a los valientes o insensatos que se adentran en lo desconocido.
        </p>
      </div>

      <div className="crud-grid">
        {/* Left Column: Form Card */}
        <div className="form-card-column animate-slide-right">
          <div className="form-panel investigator-form-panel">
            <div className="panel-kicker">Expediente confidencial</div>
            <h3>{editId ? "Modificar Expediente" : "Reclutar Investigador"}</h3>
            <p className="form-desc-text">Completa los datos del nuevo miembro del club.</p>
            <form onSubmit={guardar}>
              <div className="input-group">
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre"
                  required
                />
              </div>
              <div className="input-group">
                <input
                  name="apellido"
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                  placeholder="Apellido"
                  required
                />
              </div>
              <div className="input-group">
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Correo de Contacto"
                  required
                />
              </div>
              <div className="input-group">
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="Teléfono (Opcional)"
                />
              </div>

              <div className="actions user-form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  onMouseEnter={playHover}
                >
                  {editId ? "Guardar Cambios" : "Reclutar"}
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

        {/* Right Column: Table Card */}
        <div className="table-card-column">
          <div className="table-panel investigators-panel">
            <div className="toolbar">
              <div className="search-wrapper">
                <span className="search-icon" aria-hidden="true">⌕</span>
                <input
                  className="search-bar"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, apellido o email..."
                />
              </div>
              <button
                type="button"
                className="btn-secondary sync-btn"
                onClick={() => {
                  playClick();
                  cargarUsuarios();
                }}
                onMouseEnter={playHover}
              >
                <span aria-hidden="true">↻</span>
                Sincronizar
              </button>
            </div>

            {cargando && <p className="status-text loading-pulse">Invocando registros...</p>}
            {mensaje && <p className="status-text ok">{mensaje}</p>}
            {error && <p className="status-text error">{error}</p>}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Investigador</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty">
                        El abismo está vacío. No hay investigadores registrados.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u) => {
                      const creature = getCreatureProfile(u);

                      return (
                      <tr key={u.id_usuario} className="table-row-animate">
                        <td>
                          <div className="user-profile-cell">
                            <span className={`avatar-frame avatar-frame--${creature.variant}`}>
                              <img
                                src={creature.avatar}
                                alt={`Retrato de ${u.nombre} ${u.apellido}`}
                                className="table-user-avatar"
                                loading="lazy"
                              />
                            </span>
                            <div className="user-profile-cell-details">
                              <span className="user-fullname">
                                {u.nombre} {u.apellido}
                              </span>
                              <span className="user-badge">
                                {u.nivel_explorador === 1 ? "Novicio" : "Explorador"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="muted-cell">{u.email}</td>
                        <td className="muted-cell">{u.telefono || "Sin registrar"}</td>
                        <td className="row-actions">
                          <button
                            type="button"
                            className="btn-secondary action-btn"
                            onClick={() => {
                              playClick();
                              setEditId(u.id_usuario);
                              setForm(u);
                            }}
                            onMouseEnter={playHover}
                          >
                            Modificar
                          </button>
                          <button
                            type="button"
                            className="btn-danger action-btn"
                            onClick={() => eliminar(u.id_usuario)}
                            onMouseEnter={playHover}
                          >
                            Desterrar
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
