import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

const toId = (value: string): number | null => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};

const serialize = (payload: unknown) =>
  JSON.parse(
    JSON.stringify(payload, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );

router.get("/", async (_req, res, next) => {
  try {
    const lugares = await prisma.tbl_lugares.findMany({
      orderBy: { id_lugar: "desc" }
    });
    res.json(serialize(lugares));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });

  try {
    const lugar = await prisma.tbl_lugares.findUnique({
      where: { id_lugar: id }
    });
    if (!lugar) return res.status(404).json({ message: "Lugar no encontrado" });
    res.json(serialize(lugar));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  const { nombre, direccion, descripcion, nivel_peligro } = req.body;
  if (!nombre) {
    return res.status(400).json({ message: "El nombre es obligatorio" });
  }

  try {
    const nuevo = await prisma.tbl_lugares.create({
      data: {
        nombre,
        direccion: direccion || null,
        descripcion: descripcion || null,
        nivel_peligro: nivel_peligro ? parseInt(nivel_peligro, 10) : null,
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
  if (req.body.nombre !== undefined) data.nombre = req.body.nombre;
  if (req.body.direccion !== undefined) data.direccion = req.body.direccion;
  if (req.body.descripcion !== undefined) data.descripcion = req.body.descripcion;
  if (req.body.nivel_peligro !== undefined) {
    data.nivel_peligro = req.body.nivel_peligro ? parseInt(req.body.nivel_peligro, 10) : null;
  }

  try {
    const actualizado = await prisma.tbl_lugares.update({
      where: { id_lugar: id },
      data
    });
    res.json(serialize(actualizado));
  } catch (error: any) {
    if (error?.code === "P2025") return res.status(404).json({ message: "Lugar no encontrado" });
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });

  try {
    await prisma.tbl_lugares.delete({ where: { id_lugar: id } });
    res.status(204).send();
  } catch (error: any) {
    if (error?.code === "P2025") return res.status(404).json({ message: "Lugar no encontrado" });
    if (error?.code === "P2003") return res.status(409).json({ message: "No se puede eliminar porque esta en uso" });
    next(error);
  }
});

export default router;
