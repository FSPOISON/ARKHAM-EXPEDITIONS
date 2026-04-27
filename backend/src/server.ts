import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usuariosRouter from "./routes/usuarios.routes";
import expedicionesRouter from "./routes/expediciones.routes";
import lugaresRouter from "./routes/lugares.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "arkham-backend" });
});

app.use("/api/usuarios", usuariosRouter);
app.use("/api/expediciones", expedicionesRouter);
app.use("/api/lugares", lugaresRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Error capturado en el backend:", err);
  res.status(500).json({ 
    message: err.message || "Error interno del servidor",
    stack: err.stack
  });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`API corriendo en http://localhost:${port}`);
});
