const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: '99b4ac001@smtp-brevo.com',
    pass: 'xsmtpsib-1aa816fee38aa18d8f9a3609625556934a250f0b8de91cfcfba6bcf986f53ac9-RErztmXpxJQrbEKf',
  },
});

async function enviarEmail({ para, assunto, mensagemHtml }) {
  const info = await transporter.sendMail({
    from: `"AgendaMed" <cristiandomingues.15@gmail.com}>`,
    to: para,
    subject: assunto,
    html: mensagemHtml,
  });
  return info;
}

module.exports = { enviarEmail };
