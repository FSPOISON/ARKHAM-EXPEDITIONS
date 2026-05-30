import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usuariosRouter from "./routes/usuarios.routes";
import expedicionesRouter from "./routes/expediciones.routes";
import lugaresRouter from "./routes/lugares.routes";

dotenv.config();

const app = express();

const configuredOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || "").split(",")
]
  .filter(Boolean)
  .map((origin) => origin!.trim().replace(/\/$/, ""));

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, "");
    const isAllowed =
      configuredOrigins.includes(normalized) ||
      /^https:\/\/[a-z0-9-]+(-git-[a-z0-9-]+)?-[a-z0-9-]+\.vercel\.app$/i.test(normalized) ||
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalized);

    if (isAllowed) return callback(null, true);
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  }
}));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "arkham-backend" });
});

app.use("/api/usuarios", usuariosRouter);
app.use("/api/expediciones", expedicionesRouter);
app.use("/api/lugares", lugaresRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Error capturado en el backend:", err);
  const isDatabaseTimeout =
    String(err?.message || "").toLowerCase().includes("pool timeout") ||
    String(err?.message || "").toLowerCase().includes("failed to retrieve a connection");

  if (isDatabaseTimeout) {
    return res.status(503).json({
      message: "No se pudo conectar con la base de datos. Intenta nuevamente en unos segundos."
    });
  }

  res.status(500).json({ 
    message: err.message || "Error interno del servidor"
  });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`API corriendo en http://localhost:${port}`);
});
