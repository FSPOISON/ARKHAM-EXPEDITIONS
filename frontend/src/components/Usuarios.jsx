import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../services/api";
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

export default function Usuarios({ apiBase, onDataChange, user }) {
  const API_URL = "/api/usuarios";
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
      const { data } = await apiClient.get(API_URL);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Error al cargar investigadores.");
    } finally {
      setCargando(false);
    }
  }, []);

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

  const canManageUser = (targetId) => {
    return user?.rol === "admin" || user?.id_usuario === targetId;
  };

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
        if (!canManageUser(editId)) {
          return setError("No tienes permiso para modificar este investigador.");
        }
        await apiClient.put(`${API_URL}/${editId}`, payload);
        setMensaje("Investigador actualizado.");
      } else {
        if (user?.rol !== "admin") {
          return setError("Solo administradores pueden reclutar nuevos investigadores.");
        }
        await apiClient.post(API_URL, payload);
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
    if (!canManageUser(id)) {
      setError("No tienes permiso para eliminar este investigador.");
      return;
    }
    if (!window.confirm("¿Desterrar a este investigador permanentemente?")) return;
    setMensaje("");
    setError("");
    try {
      await apiClient.delete(`${API_URL}/${id}`);
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
          {user?.rol === "admin" || editId ? (
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
          ) : (
            <div className="form-panel investigator-form-panel no-permission">
              <div className="panel-kicker">Permisos Limitados</div>
              <p className="form-desc-text">
                Solo los administradores pueden reclutar nuevos investigadores.
                Contacta con el equipo directivo si deseas añadir miembros.
              </p>
            </div>
          )}
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
                    <th>Rol</th>
                    <th>Teléfono</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty">
                        El abismo está vacío. No hay investigadores registrados.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u) => {
                      const creature = getCreatureProfile(u);
                      const canManage = canManageUser(u.id_usuario);

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
                        <td className="muted-cell">
                          <span className={`role-badge ${u.rol === "admin" ? "role-admin" : "role-investigador"}`}>
                            {u.rol === "admin" ? "⚔️ Admin" : "🔰 Investigador"}
                          </span>
                        </td>
                        <td className="muted-cell">{u.telefono || "Sin registrar"}</td>
                        <td className="row-actions">
                          <button
                            type="button"
                            className={`btn-secondary action-btn ${!canManage ? "disabled" : ""}`}
                            onClick={() => {
                              if (canManage) {
                                playClick();
                                setEditId(u.id_usuario);
                                setForm(u);
                              }
                            }}
                            onMouseEnter={canManage ? playHover : null}
                            disabled={!canManage}
                            title={!canManage ? "Sin permisos para modificar este usuario" : "Modificar este investigador"}
                          >
                            Modificar
                          </button>
                          <button
                            type="button"
                            className={`btn-danger action-btn ${!canManage ? "disabled" : ""}`}
                            onClick={() => canManage && eliminar(u.id_usuario)}
                            onMouseEnter={canManage ? playHover : null}
                            disabled={!canManage}
                            title={!canManage ? "Sin permisos para eliminar este usuario" : "Desterrar este investigador"}
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
