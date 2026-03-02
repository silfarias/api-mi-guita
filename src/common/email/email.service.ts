import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { getVerificationEmailHtml, CODIGO_EXPIRA_MINUTOS } from './templates/verification-email.template';

/** Lee una variable de entorno y la normaliza: trim y quita comillas al inicio/final (por si viene "valor" o 'valor'). */
function getEnvNormalized(key: string): string {
  const raw = process.env[key];
  if (raw == null) return '';
  let value = raw.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;
    const host = getEnvNormalized('SMTP_HOST');
    const port = getEnvNormalized('SMTP_PORT');
    const user = getEnvNormalized('SMTP_USER');
    const pass = getEnvNormalized('SMTP_PASS');
    if (!host || !user || !pass) {
      return null;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port: port ? parseInt(port, 10) : 465,
      secure: port !== '587',
      auth: { user, pass },
    });
    return this.transporter;
  }

  /** Envía el correo con el código de verificación. No lanza si SMTP no está configurado (solo log). */
  async sendVerificationEmail(to: string, codigo: string): Promise<void> {
    const trans = this.getTransporter();
    const from = getEnvNormalized('EMAIL_FROM') || getEnvNormalized('SMTP_USER') || 'noreply@miguita.com';
    if (!trans) {
      console.warn('[EmailService] SMTP no configurado. Código de verificación (para pruebas):', codigo);
      return;
    }
    const logoUrl = getEnvNormalized('EMAIL_LOGO_URL') || null;
    const html = getVerificationEmailHtml(codigo, logoUrl);
    try {
      await trans.sendMail({
        from: `"MiGuita" <${from}>`,
        to,
        subject: 'Tu código de verificación - MiGuita',
        text: `Tu código de verificación es: ${codigo}. Válido por ${CODIGO_EXPIRA_MINUTOS} minutos.`,
        html,
      });
    } catch (err) {
      console.error('[EmailService] Error al enviar correo de verificación:', err);
      throw err;
    }
  }
}
