const transporter = require('../../config/mailer');

async function sendResetPasswordEmail(destinatario, link) {
  await transporter.sendMail({
    from: `"Clean Energy" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: 'Redefinição de senha - Clean Energy',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #222;">
        <h2 style="color: #1b814e;">Redefinição de senha</h2>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta na Clean Energy.</p>
        <p>Clique no botão abaixo para escolher uma nova senha. Este link é válido por 1 hora.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background: #1b814e; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Redefinir minha senha
          </a>
        </p>
        <p>Se você não solicitou essa alteração, pode ignorar este e-mail com segurança — sua senha continuará a mesma.</p>
        <p style="font-size: 12px; color: #777;">Se o botão não funcionar, copie e cole este link no navegador:<br>${link}</p>
      </div>
    `,
  });
}

module.exports = { sendResetPasswordEmail };
