import { Router } from "express";
import { prisma } from "../prisma";
import crypto from "crypto";

const router = Router();

const toId = (value: string): bigint | null => {
  try {
    return BigInt(value);
  } catch {
    return null;
  }
};

const serialize = (payload: any) => {
  const clean = JSON.parse(
    JSON.stringify(payload, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
  if (clean && typeof clean === "object") {
    if (Array.isArray(clean)) {
      clean.forEach(u => { if (u) delete u.contrasena; });
    } else {
      delete clean.contrasena;
    }
  }
  return clean;
};

type OAuthProfile = {
  email: string;
  nombre: string;
  apellido: string;
  provider: "google" | "facebook";
  provider_id: string;
  avatar_url?: string | null;
};

const splitName = (fullName?: string | null) => {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  return {
    nombre: parts[0] || "Investigador",
    apellido: parts.slice(1).join(" ") || "Anónimo"
  };
};

const verifyGoogleToken = async (idToken: string): Promise<OAuthProfile> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const error: any = new Error("Google OAuth no está configurado en el backend.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!response.ok) {
    const error: any = new Error("La sesión de Google no pudo verificarse.");
    error.statusCode = 401;
    throw error;
  }

  const payload: any = await response.json();
  if (payload.aud !== clientId || payload.email_verified !== "true" || !payload.email || !payload.sub) {
    const error: any = new Error("La cuenta de Google no es válida para esta aplicación.");
    error.statusCode = 401;
    throw error;
  }

  const fallback = splitName(payload.name);
  return {
    email: payload.email,
    nombre: payload.given_name || fallback.nombre,
    apellido: payload.family_name || fallback.apellido,
    provider: "google",
    provider_id: payload.sub,
    avatar_url: payload.picture || null
  };
};

const verifyFacebookToken = async (accessToken: string): Promise<OAuthProfile> => {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) {
    const error: any = new Error("Facebook OAuth no está configurado en el backend.");
    error.statusCode = 503;
    throw error;
  }

  const appAccessToken = `${appId}|${appSecret}`;
  const debugResponse = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appAccessToken)}`
  );
  const debugPayload: any = await debugResponse.json();
  if (
    !debugResponse.ok ||
    !debugPayload?.data?.is_valid ||
    String(debugPayload.data.app_id) !== String(appId)
  ) {
    const error: any = new Error("La sesión de Facebook no pudo verificarse.");
    error.statusCode = 401;
    throw error;
  }

  const profileResponse = await fetch(
    `https://graph.facebook.com/me?fields=id,first_name,last_name,name,email,picture.width(240).height(240)&access_token=${encodeURIComponent(accessToken)}`
  );
  const profile: any = await profileResponse.json();
  if (!profileResponse.ok || !profile.id || !profile.email) {
    const error: any = new Error("Facebook no entregó un correo verificable para esta cuenta.");
    error.statusCode = 401;
    throw error;
  }

  const fallback = splitName(profile.name);
  return {
    email: profile.email,
    nombre: profile.first_name || fallback.nombre,
    apellido: profile.last_name || fallback.apellido,
    provider: "facebook",
    provider_id: profile.id,
    avatar_url: profile.picture?.data?.url || null
  };
};

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

router.post("/oauth-login", async (req, res, next) => {
  const { provider, id_token, access_token } = req.body;
  if (!provider) {
    return res.status(400).json({ message: "El proveedor OAuth es requerido." });
  }

  try {
    let profile: OAuthProfile;
    if (provider === "google") {
      if (!id_token) return res.status(400).json({ message: "Falta el token de Google." });
      profile = await verifyGoogleToken(id_token);
    } else if (provider === "facebook") {
      if (!access_token) return res.status(400).json({ message: "Falta el token de Facebook." });
      profile = await verifyFacebookToken(access_token);
    } else {
      return res.status(400).json({ message: "Proveedor OAuth no soportado." });
    }

    let usuario = await prisma.tbl_usuarios.findUnique({
      where: { email: profile.email }
    });

    if (usuario) {
      usuario = await prisma.tbl_usuarios.update({
        where: { email: profile.email },
        data: {
          nombre: usuario.nombre || profile.nombre,
          apellido: usuario.apellido || profile.apellido,
          provider: profile.provider,
          provider_id: profile.provider_id,
          avatar_url: profile.avatar_url || usuario.avatar_url || null,
          actualizado_en: new Date()
        }
      });
    } else {
      usuario = await prisma.tbl_usuarios.create({
        data: {
          email: profile.email,
          nombre: profile.nombre,
          apellido: profile.apellido,
          provider: profile.provider,
          provider_id: profile.provider_id,
          avatar_url: profile.avatar_url || null,
          reputacion: 0,
          nivel_explorador: 1,
          creado_en: new Date(),
          actualizado_en: new Date()
        }
      });
    }

    res.json(serialize(usuario));
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
});

router.post("/registrar", async (req, res, next) => {
  const { nombre, apellido, email, contrasena, telefono } = req.body;
  if (!nombre || !apellido || !email || !contrasena) {
    return res.status(400).json({ message: "Nombre, apellido, email y contraseña son requeridos." });
  }

  try {
    const existe = await prisma.tbl_usuarios.findUnique({
      where: { email }
    });
    if (existe) {
      return res.status(409).json({ message: "El correo electrónico ya está registrado." });
    }

    const hashed = crypto.createHash("sha256").update(contrasena).digest("hex");
    const avatarNum = Math.floor(Math.random() * 70);

    const nuevo = await prisma.tbl_usuarios.create({
      data: {
        nombre,
        apellido,
        email,
        contrasena: hashed,
        telefono: telefono || null,
        avatar_url: `https://i.pravatar.cc/150?img=${avatarNum}`,
        reputacion: 0,
        nivel_explorador: 1,
        creado_en: new Date(),
        actualizado_en: new Date()
      }
    });

    res.status(201).json(serialize(nuevo));
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "El correo electrónico ya está registrado." });
    }
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  const { email, contrasena } = req.body;
  if (!email || !contrasena) {
    return res.status(400).json({ message: "Email y contraseña son obligatorios." });
  }

  try {
    const usuario = await prisma.tbl_usuarios.findUnique({
      where: { email }
    });

    if (!usuario || !usuario.contrasena) {
      return res.status(401).json({ message: "Credenciales incorrectas o inexistentes." });
    }

    const hashed = crypto.createHash("sha256").update(contrasena).digest("hex");
    if (usuario.contrasena !== hashed) {
      return res.status(401).json({ message: "Credenciales incorrectas o inexistentes." });
    }

    res.json(serialize(usuario));
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
  if (req.body.provider !== undefined) data.provider = req.body.provider;
  if (req.body.provider_id !== undefined) data.provider_id = req.body.provider_id;
  if (req.body.avatar_url !== undefined) data.avatar_url = req.body.avatar_url;

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
