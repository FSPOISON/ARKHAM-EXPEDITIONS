import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

const toId = (value: string): bigint | null => {
  try {
    return BigInt(value);
  } catch {
    return null;
  }
};

const serialize = (payload: unknown) =>
  JSON.parse(
    JSON.stringify(payload, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );

const toNullableFloat = (value: unknown) =>
  value === undefined || value === null || value === "" ? null : Number(value);

const toNullableInt = (value: unknown) =>
  value === undefined || value === null || value === "" ? null : parseInt(String(value), 10);

const toNullableDate = (value: unknown) =>
  value === undefined || value === null || value === "" ? null : new Date(`${value}T00:00:00.000Z`);

const toNullableBoolean = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value;
  return ["true", "1", "si", "sí", "yes"].includes(String(value).toLowerCase());
};

router.get("/", async (_req, res, next) => {
  try {
    const expediciones = await prisma.tbl_expediciones.findMany({
      orderBy: { id_expedicion: "desc" },
      include: { tbl_lugares: true }
    });
    res.json(serialize(expediciones));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });

  try {
    const exp = await prisma.tbl_expediciones.findUnique({
      where: { id_expedicion: id },
      include: { tbl_lugares: true }
    });
    if (!exp) return res.status(404).json({ message: "Expedicion no encontrada" });
    res.json(serialize(exp));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  const {
    titulo,
    descripcion,
    precio_base,
    nivel_dificultad,
    id_lugar,
    fecha_inicio,
    fecha_fin,
    capacidad_maxima,
    requiere_pasaporte,
    requiere_visa
  } = req.body;
  if (!titulo) {
    return res.status(400).json({ message: "El titulo es obligatorio" });
  }

  try {
    const nuevo = await prisma.tbl_expediciones.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        precio_base: toNullableFloat(precio_base),
        nivel_dificultad: toNullableInt(nivel_dificultad),
        id_lugar: toNullableInt(id_lugar),
        fecha_inicio: toNullableDate(fecha_inicio),
        fecha_fin: toNullableDate(fecha_fin),
        capacidad_maxima: toNullableInt(capacidad_maxima),
        requiere_pasaporte: toNullableBoolean(requiere_pasaporte),
        requiere_visa: toNullableBoolean(requiere_visa),
        creado_en: new Date(),
        actualizado_en: new Date()
      }
    });
    res.status(201).json(serialize(nuevo));
  } catch (error: any) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });

  const data: any = { actualizado_en: new Date() };
  if (req.body.titulo !== undefined) data.titulo = req.body.titulo;
  if (req.body.descripcion !== undefined) data.descripcion = req.body.descripcion;
  if (req.body.precio_base !== undefined) data.precio_base = toNullableFloat(req.body.precio_base);
  if (req.body.nivel_dificultad !== undefined) data.nivel_dificultad = toNullableInt(req.body.nivel_dificultad);
  if (req.body.id_lugar !== undefined) data.id_lugar = toNullableInt(req.body.id_lugar);
  if (req.body.fecha_inicio !== undefined) data.fecha_inicio = toNullableDate(req.body.fecha_inicio);
  if (req.body.fecha_fin !== undefined) data.fecha_fin = toNullableDate(req.body.fecha_fin);
  if (req.body.capacidad_maxima !== undefined) data.capacidad_maxima = toNullableInt(req.body.capacidad_maxima);
  if (req.body.requiere_pasaporte !== undefined) data.requiere_pasaporte = toNullableBoolean(req.body.requiere_pasaporte);
  if (req.body.requiere_visa !== undefined) data.requiere_visa = toNullableBoolean(req.body.requiere_visa);

  try {
    const actualizado = await prisma.tbl_expediciones.update({
      where: { id_expedicion: id },
      data
    });
    res.json(serialize(actualizado));
  } catch (error: any) {
    if (error?.code === "P2025") return res.status(404).json({ message: "Expedicion no encontrada" });
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });

  try {
    await prisma.tbl_expediciones.delete({ where: { id_expedicion: id } });
    res.status(204).send();
  } catch (error: any) {
    if (error?.code === "P2025") return res.status(404).json({ message: "Expedicion no encontrada" });
    if (error?.code === "P2003") return res.status(409).json({ message: "No se puede eliminar porque esta en uso" });
    next(error);
  }
});

export default router;
