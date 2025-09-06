// src/utils/mailer.js
import nodemailer from "nodemailer";

export function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: false,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export async function sendResetEmail({ to, empresa, username, link }) {
  const transporter = getTransport();
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || "no-reply@local",
    to,
    subject: `Restablecer contraseña — ${empresa}`,
    html: `
      <p>Hola ${username},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña de <b>${empresa}</b>.</p>
      <p>
        <a href="${link}">Haz clic aquí para crear una nueva contraseña</a>
        (expira en ${process.env.RESET_TOKEN_MINUTES || 15} minutos).
      </p>
      <p>Si no fuiste tú, ignora este correo.</p>
    `,
  });
  return info;
}
