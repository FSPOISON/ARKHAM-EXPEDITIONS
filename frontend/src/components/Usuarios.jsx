import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const emptyForm = { nombre: "", apellido: "", email: "", telefono: "" };

export default function Usuarios({ apiBase }) {
  const API_URL = `${apiBase}/api/usuarios`;
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargarUsuarios = async () => {
    setCargando(true); setError("");
    try {
      const { data } = await axios.get(API_URL);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Error al cargar usuarios.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter(u => `${u.nombre||""} ${u.apellido||""} ${u.email||""}`.toLowerCase().includes(q));
  }, [usuarios, busqueda]);

  const guardar = async (e) => {
    e.preventDefault(); setMensaje(""); setError("");
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
      setForm(emptyForm); setEditId(null); await cargarUsuarios();
    } catch (err) { setError(err?.response?.data?.message || "No se pudo guardar."); }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Desterrar a este investigador permanentemente?")) return;
    setMensaje(""); setError("");
    try {
      await axios.delete(`${API_URL}/${id}`);
      setMensaje("Investigador desterrado.");
      if (editId === id) { setForm(emptyForm); setEditId(null); }
      await cargarUsuarios();
    } catch (err) { setError(err?.response?.data?.message || "No se pudo eliminar."); }
  };

  return (
    <div className="crud-container fade-in">
      <h2>Registro de Investigadores</h2>
      <p className="subtitle">Administra a los valientes o insensatos que se adentran en lo desconocido.</p>
      
      <form onSubmit={guardar} className="form-panel">
        <input name="nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Nombre" required />
        <input name="apellido" value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} placeholder="Apellido" required />
        <input name="email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Correo de Contacto" required />
        <input name="telefono" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="Teléfono (Opcional)" />
        <div className="actions">
          <button type="submit" className="btn-primary">{editId ? "Actualizar Datos" : "Reclutar"}</button>
          {editId && <button type="button" className="btn-ghost" onClick={() => {setForm(emptyForm); setEditId(null);}}>Cancelar</button>}
        </div>
      </form>

      <div className="table-panel">
        <div className="toolbar">
          <input className="search-bar" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, apellido o email..." />
          <button type="button" className="btn-secondary" onClick={cargarUsuarios}>Sincronizar</button>
        </div>
        
        {cargando && <p className="status-text">Invocando registros...</p>}
        {mensaje && <p className="status-text ok">{mensaje}</p>}
        {error && <p className="status-text error">{error}</p>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Apellido</th><th>Email</th><th>Teléfono</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr><td colSpan="6" className="empty">El abismo está vacío. No hay investigadores.</td></tr>
              ) : usuariosFiltrados.map(u => (
                <tr key={u.id_usuario}>
                  <td>#{u.id_usuario}</td><td>{u.nombre}</td><td>{u.apellido}</td><td>{u.email}</td><td>{u.telefono || "Desconocido"}</td>
                  <td className="row-actions">
                    <button type="button" className="btn-secondary" onClick={() => {setEditId(u.id_usuario); setForm(u);}}>Modificar</button>
                    <button type="button" className="btn-danger" onClick={() => eliminar(u.id_usuario)}>Desterrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
