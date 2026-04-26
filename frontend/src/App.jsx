import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const API_URL = `${API_BASE}/api/usuarios`;

const emptyForm = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: ""
};

function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargarUsuarios = async () => {
    if (!API_BASE) return;
    setCargando(true);
    setError("");
    try {
      const { data } = await axios.get(API_URL);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo listar usuarios.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) =>
      `${u.nombre || ""} ${u.apellido || ""} ${u.email || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [usuarios, busqueda]);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const limpiarFormulario = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!form.nombre.trim() || !form.apellido.trim() || !form.email.trim()) {
      setError("nombre, apellido y email son obligatorios.");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim() || null
    };

    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, payload);
        setMensaje("Usuario actualizado.");
      } else {
        await axios.post(API_URL, payload);
        setMensaje("Usuario creado.");
      }
      limpiarFormulario();
      await cargarUsuarios();
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo guardar el usuario.");
    }
  };

  const editarUsuario = (u) => {
    setEditId(u.id_usuario);
    setForm({
      nombre: u.nombre || "",
      apellido: u.apellido || "",
      email: u.email || "",
      telefono: u.telefono || ""
    });
    setMensaje("");
    setError("");
  };

  const eliminarUsuario = async (id) => {
    const ok = window.confirm("¿Deseas eliminar este usuario?");
    if (!ok) return;

    setMensaje("");
    setError("");
    try {
      await axios.delete(`${API_URL}/${id}`);
      setMensaje("Usuario eliminado.");
      if (editId === id) limpiarFormulario();
      await cargarUsuarios();
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo eliminar el usuario.");
    }
  };

  if (!API_BASE) {
    return (
      <main className="app">
        <h1>Arkham Expeditions - CRUD Usuarios</h1>
        <p className="error">
          Falta configurar VITE_API_URL en el frontend.
        </p>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="top">
        <h1>Arkham Expeditions - CRUD Usuarios</h1>
        <p className="hint">Backend: {API_BASE}</p>
      </header>

      <section className="panel">
        <form onSubmit={guardarUsuario} className="form">
          <input
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            placeholder="Nombre"
            required
          />
          <input
            name="apellido"
            value={form.apellido}
            onChange={onChange}
            placeholder="Apellido"
            required
          />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="Email"
            required
          />
          <input
            name="telefono"
            value={form.telefono}
            onChange={onChange}
            placeholder="Telefono (opcional)"
          />
          <div className="actions">
            <button type="submit">{editId ? "Actualizar" : "Crear"}</button>
            {editId && (
              <button type="button" className="secondary" onClick={limpiarFormulario}>
                Cancelar edicion
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="toolbar">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, apellido o email"
          />
          <button type="button" className="secondary" onClick={cargarUsuarios}>
            Recargar
          </button>
        </div>

        {cargando && <p className="hint">Cargando usuarios...</p>}
        {mensaje && <p className="ok">{mensaje}</p>}
        {error && <p className="error">{error}</p>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty">
                    No hay usuarios para mostrar.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id_usuario}>
                    <td>{u.id_usuario}</td>
                    <td>{u.nombre}</td>
                    <td>{u.apellido}</td>
                    <td>{u.email}</td>
                    <td>{u.telefono || "-"}</td>
                    <td className="row-actions">
                      <button type="button" className="secondary" onClick={() => editarUsuario(u)}>
                        Editar
                      </button>
                      <button type="button" className="danger" onClick={() => eliminarUsuario(u.id_usuario)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default App;
