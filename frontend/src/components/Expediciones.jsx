import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const emptyForm = { titulo: "", descripcion: "", precio_base: "", nivel_dificultad: "", id_lugar: "" };

export default function Expediciones({ apiBase }) {
  const API_URL = `${apiBase}/api/expediciones`;
  const LUGARES_URL = `${apiBase}/api/lugares`;
  
  const [expediciones, setExpediciones] = useState([]);
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
      const [expRes, lugRes] = await Promise.all([
        axios.get(API_URL),
        axios.get(LUGARES_URL)
      ]);
      setExpediciones(Array.isArray(expRes.data) ? expRes.data : []);
      setLugares(Array.isArray(lugRes.data) ? lugRes.data : []);
    } catch (err) { setError("Error al contactar con el abismo."); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return expediciones;
    return expediciones.filter(e => `${e.titulo||""}`.toLowerCase().includes(q));
  }, [expediciones, busqueda]);

  const guardar = async (e) => {
    e.preventDefault(); setMensaje(""); setError("");
    if (!form.titulo.trim()) return setError("Toda expedición debe tener un título maldito.");
    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, form);
        setMensaje("Misión alterada con éxito.");
      } else {
        await axios.post(API_URL, form);
        setMensaje("Nueva misión hacia el vacío autorizada.");
      }
      setForm(emptyForm); setEditId(null); await cargar();
    } catch (err) { setError(err?.response?.data?.message || "Los cultistas bloquearon tu solicitud."); }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Cancelar expedición? Algunos podrían no regresar...")) return;
    setMensaje(""); setError("");
    try {
      await axios.delete(`${API_URL}/${id}`);
      setMensaje("Expedición purgada de los registros.");
      if (editId === id) { setForm(emptyForm); setEditId(null); }
      await cargar();
    } catch (err) { setError(err?.response?.data?.message || "No se pudo purgar."); }
  };

  return (
    <div className="crud-container fade-in">
      <h2>Misiones & Expediciones</h2>
      <p className="subtitle">Planifica expediciones oscuras y asocia grupos a lugares de alto terror.</p>
      
      <form onSubmit={guardar} className="form-panel">
        <input name="titulo" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} placeholder="Título de la Expedición (Ej. El Canto de Cthulhu)" required />
        <textarea name="descripcion" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Objetivos y horrores a documentar..."></textarea>
        <div className="form-row">
          <input name="precio_base" type="number" step="0.01" value={form.precio_base} onChange={e => setForm({...form, precio_base: e.target.value})} placeholder="Presupuesto ($)" />
          <input name="nivel_dificultad" type="number" min="1" max="10" value={form.nivel_dificultad} onChange={e => setForm({...form, nivel_dificultad: e.target.value})} placeholder="Riesgo de Locura (1-10)" />
          <select name="id_lugar" value={form.id_lugar} onChange={e => setForm({...form, id_lugar: e.target.value})}>
            <option value="">Selecciona Ubicación Destino...</option>
            {lugares.map(l => (
              <option key={l.id_lugar} value={l.id_lugar}>{l.nombre}</option>
            ))}
          </select>
        </div>
        
        <div className="actions">
          <button type="submit" className="btn-primary">{editId ? "Reconfigurar Misión" : "Autorizar Misión"}</button>
          {editId && <button type="button" className="btn-ghost" onClick={() => {setForm(emptyForm); setEditId(null);}}>Abortar Edición</button>}
        </div>
      </form>

      <div className="table-panel">
        <div className="toolbar">
          <input className="search-bar" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Rastrear expediciones por título..." />
          <button type="button" className="btn-secondary" onClick={cargar}>Sonar Radares</button>
        </div>
        
        {cargando && <p className="status-text">Escaneando lo desconocido...</p>}
        {mensaje && <p className="status-text ok">{mensaje}</p>}
        {error && <p className="status-text error">{error}</p>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Exp. ID</th><th>Operación</th><th>Destino</th><th>Riesgo</th><th>Costo</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan="6" className="empty">La pizarra está vacía. No hay destinos trazados.</td></tr>
              ) : filtrados.map(e => (
                <tr key={e.id_expedicion}>
                  <td>#{e.id_expedicion}</td>
                  <td><strong>{e.titulo}</strong></td>
                  <td>{e.tbl_lugares?.nombre || "Destino Oculto"}</td>
                  <td>{e.nivel_dificultad ? `Cat. ${e.nivel_dificultad}` : "?"}</td>
                  <td>{e.precio_base ? `$${e.precio_base}` : "Financiado"}</td>
                  <td className="row-actions">
                    <button type="button" className="btn-secondary" onClick={() => {setEditId(e.id_expedicion); setForm({ ...e, id_lugar: e.id_lugar || "" });}}>Modificar</button>
                    <button type="button" className="btn-danger" onClick={() => eliminar(e.id_expedicion)}>Cancelar</button>
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
