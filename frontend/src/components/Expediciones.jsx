import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../services/api";

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

const emptyPayment = {
  cantidad: 1,
  metodo: "Tarjeta ritual",
  titular: "",
  email: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
  terms: false
};

const LOCAL_PAYMENTS_KEY = "arkham_gateway_sandbox_payments";

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

const calculateCheckout = (expedition, quantity = 1) => {
  const qty = Math.max(1, Number(quantity) || 1);
  const unitPrice = Number(expedition?.precio_base) || 0;
  const subtotal = unitPrice * qty;
  const risk = Math.max(
    Number(expedition?.nivel_dificultad) || 0,
    Number(expedition?.tbl_lugares?.nivel_peligro) || 0
  );
  const riskFee = risk >= 7 ? subtotal * 0.08 : 0;
  const serviceFee = subtotal * 0.035;

  return {
    qty,
    subtotal,
    riskFee,
    serviceFee,
    total: subtotal + riskFee + serviceFee
  };
};

const readLocalPayments = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PAYMENTS_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveLocalPayment = (payment) => {
  const next = [payment, ...readLocalPayments()].slice(0, 60);
  localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(next));
  return next;
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

export default function Expediciones({ apiBase, user, onDataChange }) {
  const API_URL = "/api/expediciones";
  const LUGARES_URL = "/api/lugares";
  const PAGOS_URL = "/api/pagos";

  const [expediciones, setExpediciones] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [payment, setPayment] = useState(emptyPayment);
  const [checkoutExpedition, setCheckoutExpedition] = useState(null);
  const [editId, setEditId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [cargando, setCargando] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [copiadoId, setCopiadoId] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [expRes, lugRes] = await Promise.all([
        apiClient.get(API_URL),
        apiClient.get(LUGARES_URL)
      ]);
      setExpediciones(Array.isArray(expRes.data) ? expRes.data : []);
      setLugares(Array.isArray(lugRes.data) ? lugRes.data : []);
    } catch {
      setError("No se pudo cargar el tablero de expediciones.");
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarPagos = useCallback(async () => {
    try {
      const { data } = await apiClient.get(PAGOS_URL);
      const remotePayments = Array.isArray(data) ? data : [];
      setPagos([...readLocalPayments(), ...remotePayments]);
    } catch {
      setPagos(readLocalPayments());
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(async () => {
      await cargar();
      await cargarPagos();
    });
  }, [cargar, cargarPagos]);

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

    const ingresos = pagos.reduce((acc, pago) => acc + (Number(pago.monto_total) || 0), 0);

    return { conVisa, conPasaporte, presupuesto, altoRiesgo, pagos: pagos.length, ingresos };
  }, [expedicionesEnriquecidas, pagos]);

  const pagosPorExpedicion = useMemo(
    () =>
      pagos.reduce((acc, pago) => {
        const key = String(pago.id_expedicion || "");
        if (!key) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    [pagos]
  );

  const formPreview = useMemo(() => {
    const selectedPlace = lugares.find((lugar) => String(lugar.id_lugar) === String(form.id_lugar));
    const days = calculateDays(form.fecha_inicio, form.fecha_fin);
    const cost = Number(form.precio_base) || 0;
    const capacity = Number(form.capacidad_maxima) || 0;
    const risk = Math.max(Number(form.nivel_dificultad) || 0, Number(selectedPlace?.nivel_peligro) || 0);

    return {
      selectedPlace,
      days,
      totalEstimate: cost && capacity ? cost * capacity : cost,
      risk
    };
  }, [form, lugares]);

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
        await apiClient.put(`${API_URL}/${editId}`, form);
        setMensaje("Expedición internacional actualizada.");
      } else {
        await apiClient.post(API_URL, form);
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
      await apiClient.delete(`${API_URL}/${id}`);
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

  const copiarBrief = async (exp) => {
    const brief = [
      `BRIEF OPERATIVO ${exp.titulo}`,
      `Destino: ${exp.tbl_lugares?.nombre || "Por confirmar"}`,
      `Fechas: ${formatDate(exp.fecha_inicio)} - ${formatDate(exp.fecha_fin)}`,
      `Duración: ${exp.dias ? `${exp.dias} días` : "Pendiente"}`,
      `Presupuesto base: ${formatMoney(exp.precio_base)}`,
      `Cupos: ${exp.capacidad_maxima || "Sin límite"}`,
      `Dificultad: ${exp.nivel_dificultad || "N/D"}/10`,
      `Riesgo destino: ${exp.tbl_lugares?.nivel_peligro || "N/D"}/10`,
      `Documentos: pasaporte ${exp.requiere_pasaporte ? "requerido" : "opcional"}, visa ${exp.requiere_visa ? "requerida" : "según nacionalidad"}`,
      `Preparación: ${exp.readiness.score}%`,
      exp.descripcion ? `Notas: ${exp.descripcion}` : "Notas: Sin descripción operativa."
    ].join("\n");

    try {
      await navigator.clipboard.writeText(brief);
      setCopiadoId(exp.id_expedicion);
      setMensaje("Brief operativo copiado al portapapeles.");
      setTimeout(() => setCopiadoId(null), 1800);
    } catch {
      setError("No se pudo copiar el brief en este navegador.");
    }
  };

  const abrirCheckout = (exp) => {
    setCheckoutExpedition(exp);
    setPayment({
      ...emptyPayment,
      titular: `${user?.nombre || ""} ${user?.apellido || ""}`.trim(),
      email: user?.email || "",
      cantidad: 1
    });
    setMensaje("");
    setError("");
  };

  const cerrarCheckout = () => {
    setCheckoutExpedition(null);
    setPayment(emptyPayment);
    setProcesandoPago(false);
  };

  const checkoutSummary = useMemo(
    () => calculateCheckout(checkoutExpedition, payment.cantidad),
    [checkoutExpedition, payment.cantidad]
  );

  const confirmarPago = async (e) => {
    e.preventDefault();
    if (!checkoutExpedition) return;
    setMensaje("");
    setError("");

    const cleanCard = payment.cardNumber.replace(/\D/g, "");
    if (!payment.titular.trim() || !payment.email.trim()) {
      return setError("Completa titular y correo de recibo para continuar.");
    }
    if (payment.metodo.includes("Tarjeta") && cleanCard.length < 12) {
      return setError("La tarjeta de prueba debe tener al menos 12 dígitos.");
    }
    if (!payment.terms) {
      return setError("Debes aceptar las condiciones de reserva.");
    }

    setProcesandoPago(true);
    try {
      const { data } = await apiClient.post(`${PAGOS_URL}/checkout`, {
        id_usuario: user?.id_usuario,
        id_expedicion: checkoutExpedition.id_expedicion,
        cantidad: checkoutSummary.qty,
        metodo: payment.metodo,
        titular: payment.titular,
        email: payment.email,
        cardLast4: cleanCard.slice(-4)
      });

      setMensaje(`Pago aprobado. Referencia ${data.gateway?.reference || data.pago?.referencia_externa}.`);
      await cargarPagos();
      cerrarCheckout();
      if (onDataChange) onDataChange();
    } catch (err) {
      const canUseLocalSandbox = !err?.response || err?.response?.status === 404;
      if (!canUseLocalSandbox) {
        setError(err?.response?.data?.message || "La pasarela rechazó la operación.");
        return;
      }

      const reference = `ARK-SBX-${checkoutExpedition.id_expedicion}-${Date.now().toString(36).toUpperCase()}`;
      const localPayment = {
        id_pago: reference,
        id_usuario: user?.id_usuario,
        id_expedicion: checkoutExpedition.id_expedicion,
        monto_total: checkoutSummary.total,
        moneda: "USD",
        referencia_externa: reference,
        creado_en: new Date().toISOString(),
        tbl_expediciones: checkoutExpedition,
        tbl_metodos_pago: { nombre: payment.metodo },
        tbl_estado_pago: { nombre: "Aprobado sandbox" },
        tbl_pago_detalle: []
      };
      setPagos(saveLocalPayment(localPayment));
      setMensaje(`Pago sandbox aprobado. Referencia ${reference}.`);
      cerrarCheckout();
    } finally {
      setProcesandoPago(false);
    }
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
        <div className="expedition-stat payment-stat">
          <span className="expedition-stat-label">Pagos</span>
          <strong>{estadisticas.pagos}</strong>
          <small>{formatMoney(estadisticas.ingresos)} confirmados</small>
        </div>
      </div>

      <div className="expedition-layout">
        <form onSubmit={guardar} className="form-panel expedition-form">
          <div className="panel-kicker">Mesa de operaciones</div>
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

          <div className="operations-preview">
            <div>
              <span>Destino</span>
              <strong>{formPreview.selectedPlace?.nombre || "Por asignar"}</strong>
            </div>
            <div>
              <span>Duración</span>
              <strong>{formPreview.days ? `${formPreview.days} días` : "Pendiente"}</strong>
            </div>
            <div>
              <span>Riesgo operativo</span>
              <strong>{formPreview.risk ? `${formPreview.risk}/10` : "N/D"}</strong>
            </div>
            <div>
              <span>Estimado total</span>
              <strong>{formatMoney(formPreview.totalEstimate)}</strong>
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
          <div className="search-wrapper">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              className="search-bar"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por ruta, destino o descripción..."
            />
          </div>
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
          <button type="button" className="btn-secondary sync-btn" onClick={cargar}>
            <span aria-hidden="true">↻</span>
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

                <div className="readiness-progress" aria-hidden="true">
                  <span style={{ width: `${exp.readiness.score}%` }} />
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
                  <span className={pagosPorExpedicion[String(exp.id_expedicion)] ? "required paid" : ""}>
                    {pagosPorExpedicion[String(exp.id_expedicion)] || 0} pagos
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
                  <button type="button" className="btn-primary action-btn" onClick={() => abrirCheckout(exp)}>
                    Reservar y pagar
                  </button>
                  <button type="button" className="btn-secondary action-btn" onClick={() => copiarBrief(exp)}>
                    {copiadoId === exp.id_expedicion ? "Copiado" : "Copiar brief"}
                  </button>
                  <button type="button" className="btn-secondary action-btn" onClick={() => editar(exp)}>
                    Modificar
                  </button>
                  <button type="button" className="btn-danger action-btn" onClick={() => eliminar(exp.id_expedicion)}>
                    Cancelar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {checkoutExpedition && (
        <div className="payment-overlay" role="dialog" aria-modal="true" aria-labelledby="payment-title">
          <form className="payment-modal" onSubmit={confirmarPago}>
            <div className="payment-modal-head">
              <div>
                <span className="panel-kicker">Pasarela segura</span>
                <h3 id="payment-title">Reserva de Expedición</h3>
                <p>{checkoutExpedition.titulo} · {checkoutExpedition.tbl_lugares?.nombre || "Destino reservado"}</p>
              </div>
              <button type="button" className="payment-close" onClick={cerrarCheckout} aria-label="Cerrar pago">
                ×
              </button>
            </div>

            <div className="payment-grid">
              <section className="gateway-panel">
                <div className="gateway-brand">
                  <span>ARKHAM GATEWAY</span>
                  <strong>{formatMoney(checkoutSummary.total)}</strong>
                </div>

                <div className="payment-methods">
                  {["Tarjeta ritual", "Transferencia bancaria", "Crédito expedicionario"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      className={payment.metodo === method ? "active" : ""}
                      onClick={() => setPayment({ ...payment, metodo: method })}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                <div className="form-row">
                  <input
                    value={payment.titular}
                    onChange={(e) => setPayment({ ...payment, titular: e.target.value })}
                    placeholder="Titular de la reserva"
                  />
                  <input
                    type="email"
                    value={payment.email}
                    onChange={(e) => setPayment({ ...payment, email: e.target.value })}
                    placeholder="Correo para recibo"
                  />
                </div>

                <input
                  inputMode="numeric"
                  value={payment.cardNumber}
                  onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })}
                  placeholder="Número de tarjeta de prueba"
                  disabled={!payment.metodo.includes("Tarjeta")}
                />

                <div className="form-row">
                  <input
                    value={payment.expiry}
                    onChange={(e) => setPayment({ ...payment, expiry: e.target.value })}
                    placeholder="MM/AA"
                    disabled={!payment.metodo.includes("Tarjeta")}
                  />
                  <input
                    inputMode="numeric"
                    value={payment.cvc}
                    onChange={(e) => setPayment({ ...payment, cvc: e.target.value })}
                    placeholder="CVC"
                    disabled={!payment.metodo.includes("Tarjeta")}
                  />
                  <input
                    type="number"
                    min="1"
                    value={payment.cantidad}
                    onChange={(e) => setPayment({ ...payment, cantidad: e.target.value })}
                    placeholder="Cupos"
                  />
                </div>

                <label className="switch-row payment-terms">
                  <input
                    type="checkbox"
                    checked={payment.terms}
                    onChange={(e) => setPayment({ ...payment, terms: e.target.checked })}
                  />
                  <span>Acepto políticas de cancelación, riesgo operativo y verificación documental.</span>
                </label>
              </section>

              <aside className="payment-summary">
                <h4>Resumen de cobro</h4>
                <div>
                  <span>Cupos</span>
                  <strong>{checkoutSummary.qty}</strong>
                </div>
                <div>
                  <span>Subtotal</span>
                  <strong>{formatMoney(checkoutSummary.subtotal)}</strong>
                </div>
                <div>
                  <span>Protocolo de riesgo</span>
                  <strong>{formatMoney(checkoutSummary.riskFee)}</strong>
                </div>
                <div>
                  <span>Servicio de pasarela</span>
                  <strong>{formatMoney(checkoutSummary.serviceFee)}</strong>
                </div>
                <div className="payment-total">
                  <span>Total</span>
                  <strong>{formatMoney(checkoutSummary.total)}</strong>
                </div>
                <p>La transacción se procesa en modo sandbox y genera una referencia rastreable en el archivo de pagos.</p>
              </aside>
            </div>

            <div className="payment-actions">
              <button type="button" className="btn-ghost" onClick={cerrarCheckout}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={procesandoPago}>
                {procesandoPago ? "Procesando..." : "Confirmar pago"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
