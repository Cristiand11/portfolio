const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP || 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL, // pode manter seu Gmail aqui
    pass: process.env.BREVO_SMTP_KEY, // ⚠️ troque para a SMTP key nova
  },
});

async function enviarEmail({ para, assunto, mensagemHtml }) {
  try {
    console.log('📨 Tentando autenticar no SMTP da Brevo com:', process.env.BREVO_EMAIL);
    const info = await transporter.sendMail({
      from: `"AgendaMed" <cristiandomingues.15@gmail.com>`,
      to: para,
      subject: assunto,
      html: mensagemHtml,
    });
    console.log('E-mail enviado com sucesso:', info.messageId);
    return info;
  } catch (error) {
    throw error;
  }
}

module.exports = { enviarEmail };
