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
  const { titulo, descripcion, precio_base, nivel_dificultad, id_lugar } = req.body;
  if (!titulo) {
    return res.status(400).json({ message: "El titulo es obligatorio" });
  }

  try {
    const nuevo = await prisma.tbl_expediciones.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        precio_base: precio_base ? parseFloat(precio_base) : null,
        nivel_dificultad: nivel_dificultad ? parseInt(nivel_dificultad, 10) : null,
        id_lugar: id_lugar ? parseInt(id_lugar, 10) : null,
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
  if (req.body.precio_base !== undefined) data.precio_base = req.body.precio_base ? parseFloat(req.body.precio_base) : null;
  if (req.body.nivel_dificultad !== undefined) data.nivel_dificultad = req.body.nivel_dificultad ? parseInt(req.body.nivel_dificultad, 10) : null;
  if (req.body.id_lugar !== undefined) data.id_lugar = req.body.id_lugar ? parseInt(req.body.id_lugar, 10) : null;

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
