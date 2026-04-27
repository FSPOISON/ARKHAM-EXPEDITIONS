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
    const usuarios = await prisma.tbl_usuarios.findMany({
      orderBy: { id_usuario: "desc" }
    });
    res.json(serialize(usuarios));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });

  try {
    const usuario = await prisma.tbl_usuarios.findUnique({
      where: { id_usuario: id }
    });
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(serialize(usuario));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  const { nombre, apellido, email, telefono } = req.body;
  if (!nombre || !apellido || !email) {
    return res.status(400).json({ message: "nombre, apellido y email son obligatorios" });
  }

  try {
    const nuevo = await prisma.tbl_usuarios.create({
      data: {
        nombre,
        apellido,
        email,
        telefono: telefono || null,
        creado_en: new Date(),
        actualizado_en: new Date()
      }
    });
    res.status(201).json(serialize(nuevo));
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "Email duplicado" });
    }
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });

  const data: any = { actualizado_en: new Date() };
  if (req.body.nombre !== undefined) data.nombre = req.body.nombre;
  if (req.body.apellido !== undefined) data.apellido = req.body.apellido;
  if (req.body.email !== undefined) data.email = req.body.email;
  if (req.body.telefono !== undefined) data.telefono = req.body.telefono;

  if (req.body.fecha_nacimiento !== undefined) {
    data.fecha_nacimiento = req.body.fecha_nacimiento
      ? new Date(`${req.body.fecha_nacimiento}T00:00:00.000Z`)
      : null;
  }

  if (req.body.id_pais_residencia !== undefined) data.id_pais_residencia = req.body.id_pais_residencia;
  if (req.body.reputacion !== undefined) data.reputacion = req.body.reputacion;
  if (req.body.nivel_explorador !== undefined) data.nivel_explorador = req.body.nivel_explorador;
  if (req.body.id_estado !== undefined) data.id_estado = req.body.id_estado;

  try {
    const actualizado = await prisma.tbl_usuarios.update({
      where: { id_usuario: id },
      data
    });
    res.json(serialize(actualizado));
  } catch (error: any) {
    if (error?.code === "P2025") return res.status(404).json({ message: "Usuario no encontrado" });
    if (error?.code === "P2002") return res.status(409).json({ message: "Email duplicado" });
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID invalido" });

  try {
    await prisma.tbl_usuarios.delete({ where: { id_usuario: id } });
    res.status(204).send();
  } catch (error: any) {
    if (error?.code === "P2025") return res.status(404).json({ message: "Usuario no encontrado" });
    if (error?.code === "P2003") return res.status(409).json({ message: "No se puede eliminar por relaciones" });
    next(error);
  }
});

export default router;
