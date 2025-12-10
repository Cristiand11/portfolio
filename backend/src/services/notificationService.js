const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: '99b4ac001@smtp-brevo.com',
    pass: process.env.BREVO_SMTP_KEY,
  },
});

async function enviarEmail({ para, assunto, mensagemHtml }) {
  const info = await transporter.sendMail({
    from: `"AgendaMed" <cristiandomingues.15@gmail.com>`,
    to: para,
    subject: assunto,
    html: mensagemHtml,
  });
  return info;
}

module.exports = { enviarEmail };
