/**
 * Template HTML para el email de verificación de correo.
 * Estética MiGuita: blanco y celeste, limpio y profesional.
 * Logo: usar EMAIL_LOGO_URL en .env con la URL pública del logo (ej. https://tu-dominio.com/logo.png).
 */

const CODIGO_EXPIRA_MINUTOS = 15;

/** Colores de la marca MiGuita */
const COLORS = {
  celesteClaro: '#b8e0f0',
  celeste: '#5eb8dc',
  celesteOscuro: '#2a9ec9',
  blanco: '#ffffff',
  texto: '#333333',
  textoSuave: '#666666',
  borde: '#e0f0f7',
} as const;

/**
 * Genera el HTML del email de verificación.
 * @param codigo Código de 6 dígitos
 * @param logoUrl URL pública del logo (opcional). Si no se pasa, se muestra el texto "MiGuita" estilizado.
 */
export function getVerificationEmailHtml(
  codigo: string,
  logoUrl?: string | null,
): string {
  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="MiGuita" width="160" height="auto" style="display:block;max-width:160px;height:auto;margin:0 auto;" />`
    : `<span style="font-size:26px;font-weight:700;color:${COLORS.celesteOscuro};letter-spacing:-0.5px;">Mi<span style="color:${COLORS.celeste};">Guita</span></span>`;

  const headerContent = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="text-align:center;vertical-align:middle;">
          ${logoBlock}
        </td>
      </tr>
    </table>`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificación de correo - MiGuita</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.celesteClaro};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.celesteClaro};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:${COLORS.blanco};border-radius:12px;box-shadow:0 4px 16px rgba(42,158,201,0.12);overflow:hidden;">
          <!-- Cabecera -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg, ${COLORS.celesteClaro} 0%, ${COLORS.blanco} 50%);padding:32px 32px 24px;border-bottom:2px solid ${COLORS.borde};vertical-align:middle;">
              ${headerContent}
            </td>
          </tr>
          <!-- Contenido -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:${COLORS.texto};">
                Verificá tu correo
              </h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:${COLORS.textoSuave};">
                Ingresá este código en la app para confirmar tu correo electrónico y tener acceso a la recuperación de contraseña.
              </p>
              <!-- Código -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:16px 0 24px;">
                    <span style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg, ${COLORS.celesteClaro} 0%, ${COLORS.borde} 100%);border:2px solid ${COLORS.celeste};border-radius:10px;font-size:28px;font-weight:700;letter-spacing:8px;color:${COLORS.celesteOscuro};">
                      ${escapeHtml(codigo)}
                    </span>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:${COLORS.textoSuave};">
                El código es válido por <strong>${CODIGO_EXPIRA_MINUTOS} minutos</strong>. Si no solicitaste esta verificación, podés ignorar este correo.
              </p>
            </td>
          </tr>
          <!-- Pie -->
          <tr>
            <td style="padding:20px 32px;background-color:${COLORS.borde};border-top:1px solid ${COLORS.borde};text-align:center;">
              <p style="margin:0;font-size:12px;color:${COLORS.textoSuave};">
                MiGuita — Tu dinero, ordenado.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}

export { CODIGO_EXPIRA_MINUTOS };
