import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const emptyForm = { nombre: "", direccion: "", descripcion: "", nivel_peligro: "" };

export default function Lugares({ apiBase }) {
  const API_URL = `${apiBase}/api/lugares`;
  const [lugares, setLugares] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargar = async () => {
    setCargando(true); setError("");
    try {
      const { data } = await axios.get(API_URL);
      setLugares(Array.isArray(data) ? data : []);
    } catch (err) { setError("Error al cargar ubicaciones malditas."); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return lugares;
    return lugares.filter(l => `${l.nombre||""} ${l.direccion||""}`.toLowerCase().includes(q));
  }, [lugares, busqueda]);

  const guardar = async (e) => {
    e.preventDefault(); setMensaje(""); setError("");
    if (!form.nombre.trim()) return setError("El nombre de la ubicación es vital.");
    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, form);
        setMensaje("Ubicación actualizada en los archivos.");
      } else {
        await axios.post(API_URL, form);
        setMensaje("Nueva ubicación maldita registrada.");
      }
      setForm(emptyForm); setEditId(null); await cargar();
    } catch (err) { setError(err?.response?.data?.message || "El horror impidió guardar esto."); }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Olvidar este lugar para siempre? (Cuidado, si tiene expediciones fallará)")) return;
    setMensaje(""); setError("");
    try {
      await axios.delete(`${API_URL}/${id}`);
      setMensaje("Lugar borrado de la memoria.");
      if (editId === id) { setForm(emptyForm); setEditId(null); }
      await cargar();
    } catch (err) { setError(err?.response?.data?.message || "Voces del más allá impidieron borrar esto."); }
  };

  return (
    <div className="crud-container fade-in">
      <h2>Ubicaciones Clasificadas</h2>
      <p className="subtitle">Archiva los lugares más aterradores, embrujados y misteriosos del planeta.</p>
      
      <form onSubmit={guardar} className="form-panel">
        <input name="nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Nombre de la ubicación (Ej. Asilo Pennhurst)" required />
        <input name="direccion" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} placeholder="Coordenadas o Dirección" />
        <input name="nivel_peligro" type="number" min="1" max="10" value={form.nivel_peligro} onChange={e => setForm({...form, nivel_peligro: e.target.value})} placeholder="Nivel de Terror (1-10)" />
        <textarea name="descripcion" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Notas, avistamientos y horrores ocurridos aquí..."></textarea>
        
        <div className="actions">
          <button type="submit" className="btn-primary">{editId ? "Sobreescribir Archivo" : "Archivar Lugar"}</button>
          {editId && <button type="button" className="btn-ghost" onClick={() => {setForm(emptyForm); setEditId(null);}}>Cancelar</button>}
        </div>
      </form>

      <div className="table-panel">
        <div className="toolbar">
          <input className="search-bar" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Investigar archivo de lugares..." />
          <button type="button" className="btn-secondary" onClick={cargar}>Sincronizar</button>
        </div>
        
        {cargando && <p className="status-text">Buscando en los tomos polvorientos...</p>}
        {mensaje && <p className="status-text ok">{mensaje}</p>}
        {error && <p className="status-text error">{error}</p>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Cód.</th><th>Nombre</th><th>Ubicación</th><th>Terror</th><th>Notas</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan="6" className="empty">Ningún lugar maldito hallado con esos términos.</td></tr>
              ) : filtrados.map(l => (
                <tr key={l.id_lugar}>
                  <td>#{l.id_lugar}</td><td>{l.nombre}</td><td>{l.direccion || "-"}</td>
                  <td>{l.nivel_peligro ? `${l.nivel_peligro}/10` : "?"}</td>
                  <td className="truncate" title={l.descripcion}>{l.descripcion || "Sin reportes."}</td>
                  <td className="row-actions">
                    <button type="button" className="btn-secondary" onClick={() => {setEditId(l.id_lugar); setForm(l);}}>Modificar</button>
                    <button type="button" className="btn-danger" onClick={() => eliminar(l.id_lugar)}>Quemar</button>
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
