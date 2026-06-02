import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

const serialize = (payload: unknown) =>
  JSON.parse(
    JSON.stringify(payload, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );

const toId = (value: unknown): bigint | null => {
  try {
    if (value === undefined || value === null || value === "") return null;
    return BigInt(String(value));
  } catch {
    return null;
  }
};

const toAmount = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const ensureMetodoPago = async (nombre: string) => {
  const existing = await prisma.tbl_metodos_pago.findFirst({ where: { nombre } });
  if (existing) return existing.id_metodo_pago;

  const created = await prisma.tbl_metodos_pago.create({ data: { nombre } });
  return created.id_metodo_pago;
};

const ensureEstadoPago = async (nombre: string) => {
  const existing = await prisma.tbl_estado_pago.findFirst({ where: { nombre } });
  if (existing) return existing.id_estado_pago;

  const created = await prisma.tbl_estado_pago.create({ data: { nombre } });
  return created.id_estado_pago;
};

const buildGatewayReference = (expeditionId: bigint) =>
  `ARK-${expeditionId.toString().padStart(5, "0")}-${Date.now().toString(36).toUpperCase()}`;

router.get("/", async (req, res, next) => {
  try {
    const where = req.query.id_expedicion
      ? { id_expedicion: toId(req.query.id_expedicion) || undefined }
      : undefined;

    const pagos = await prisma.tbl_pagos.findMany({
      where,
      orderBy: { creado_en: "desc" },
      include: {
        tbl_expediciones: { include: { tbl_lugares: true } },
        tbl_metodos_pago: true,
        tbl_estado_pago: true,
        tbl_pago_detalle: true,
        tbl_usuarios: true
      }
    });

    res.json(serialize(pagos));
  } catch (error) {
    next(error);
  }
});

router.post("/checkout", async (req, res, next) => {
  const {
    id_usuario,
    id_expedicion,
    cantidad = 1,
    metodo = "Tarjeta ritual",
    moneda = "USD",
    titular,
    email,
    cardLast4
  } = req.body;

  const expeditionId = toId(id_expedicion);
  const userId = toId(id_usuario);
  const qty = Math.max(1, parseInt(String(cantidad), 10) || 1);

  if (!expeditionId) {
    return res.status(400).json({ message: "La expedición es obligatoria para iniciar el pago." });
  }

  try {
    const expedition = await prisma.tbl_expediciones.findUnique({
      where: { id_expedicion: expeditionId },
      include: { tbl_lugares: true }
    });

    if (!expedition) return res.status(404).json({ message: "Expedición no encontrada." });

    const unitPrice = toAmount(expedition.precio_base);
    if (!unitPrice) {
      return res.status(409).json({ message: "La expedición no tiene precio base configurado." });
    }

    const subtotal = unitPrice * qty;
    const riskFee = Number(expedition.nivel_dificultad || expedition.tbl_lugares?.nivel_peligro || 0) >= 7
      ? subtotal * 0.08
      : 0;
    const serviceFee = subtotal * 0.035;
    const total = Number((subtotal + riskFee + serviceFee).toFixed(2));

    const idMetodoPago = await ensureMetodoPago(String(metodo).slice(0, 50));
    const idEstadoPago = await ensureEstadoPago("Aprobado");
    const referencia = buildGatewayReference(expeditionId);

    const pago = await prisma.tbl_pagos.create({
      data: {
        id_usuario: userId,
        id_expedicion: expeditionId,
        monto_total: total,
        moneda: String(moneda || "USD").slice(0, 3).toUpperCase(),
        id_metodo_pago: idMetodoPago,
        id_estado_pago: idEstadoPago,
        referencia_externa: referencia,
        pagado_en: new Date(),
        creado_en: new Date(),
        actualizado_en: new Date(),
        tbl_pago_detalle: {
          create: [
            {
              tipo_item: "expedicion",
              id_item: expeditionId,
              precio: unitPrice,
              cantidad: qty,
              subtotal
            },
            ...(riskFee > 0
              ? [{
                  tipo_item: "protocolo_riesgo",
                  id_item: expeditionId,
                  precio: riskFee,
                  cantidad: 1,
                  subtotal: riskFee
                }]
              : []),
            {
              tipo_item: "servicio_pasarela",
              id_item: expeditionId,
              precio: serviceFee,
              cantidad: 1,
              subtotal: serviceFee
            }
          ]
        }
      },
      include: {
        tbl_expediciones: { include: { tbl_lugares: true } },
        tbl_metodos_pago: true,
        tbl_estado_pago: true,
        tbl_pago_detalle: true,
        tbl_usuarios: true
      }
    });

    res.status(201).json(serialize({
      pago,
      gateway: {
        provider: "Arkham Gateway Sandbox",
        status: "approved",
        reference: referencia,
        cardLast4: cardLast4 ? String(cardLast4).slice(-4) : null,
        receiptEmail: email || null,
        holder: titular || null
      }
    }));
  } catch (error) {
    next(error);
  }
});

export default router;
