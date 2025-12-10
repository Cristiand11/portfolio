const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP || 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

async function enviarEmail({ para, assunto, mensagemHtml }) {
  const info = await transporter.sendMail({
    from: `"AgendaMed" <${process.env.BREVO_EMAIL}>`,
    to: para,
    subject: assunto,
    html: mensagemHtml,
  });
  return info;
}

module.exports = { enviarEmail };
