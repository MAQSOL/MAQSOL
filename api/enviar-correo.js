/* global process */
// Función serverless (Vercel): envía un correo con adjuntos desde la app.
// Variables de entorno requeridas en Vercel:
//   SMTP_USER  correo remitente (ej. contacto@maqsol.com.mx)
//   SMTP_PASS  contraseña de aplicación del correo
//   SMTP_HOST  (opcional, default smtp.gmail.com)   SMTP_PORT (opcional, default 465)
//   SMTP_FROM  (opcional, default "MAQSISTEM <SMTP_USER>")
import nodemailer from "nodemailer";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

const MAX_ADJUNTOS_B64 = 3.5 * 1024 * 1024;
const RE_CORREO = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

async function usuarioValido(token) {
  if (!token) return false;
  try {
    const r = await fetch(`${process.env.VITE_SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    return r.ok;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!(await usuarioValido(token))) return res.status(401).json({ error: "Sesión no válida. Vuelve a iniciar sesión." });

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ error: "El servidor no tiene configurado el correo remitente (SMTP_USER / SMTP_PASS)." });
  }

  const { to, subject, text, attachments } = req.body || {};
  const destinatarios = String(to || "").split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean);
  if (!destinatarios.length || destinatarios.length > 5 || !destinatarios.every((c) => RE_CORREO.test(c))) {
    return res.status(400).json({ error: "Correo del destinatario no válido." });
  }
  const adj = Array.isArray(attachments) ? attachments : [];
  const tam = adj.reduce((s, a) => s + String(a?.content || "").length, 0);
  if (tam > MAX_ADJUNTOS_B64) return res.status(413).json({ error: "Los adjuntos pesan demasiado (máx. ~2.5 MB en total)." });

  try {
    const puerto = Number(process.env.SMTP_PORT) || 465;
    const transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: puerto,
      secure: puerto === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporte.sendMail({
      from: process.env.SMTP_FROM || `MAQSISTEM <${process.env.SMTP_USER}>`,
      to: destinatarios,
      subject: String(subject || "").slice(0, 200) || "(sin asunto)",
      text: String(text || ""),
      attachments: adj.map((a) => ({
        filename: String(a.filename || "archivo").replace(/[\\/]/g, "_"),
        content: a.content,
        encoding: "base64",
      })),
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: "No se pudo enviar el correo: " + (e.message || "error desconocido") });
  }
}
