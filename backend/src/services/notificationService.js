const { Resend } = require('resend');
require('dotenv').config();

// Inicializa o cliente do Resend com a chave do .env
const resend = new Resend(process.env.RESEND_API_KEY);

const NotificationService = {};

/**
 * Função genérica para enviar e-mails.
 * Usamos um try...catch aqui para que uma falha no envio de e-mail
 * não quebre a aplicação inteira. Apenas registramos o erro no console.
 */
NotificationService.enviarEmail = async ({ para, assunto, mensagemHtml }) => {
  try {
    await resend.emails.send({
      from: 'AgendaMed <onboarding@resend.dev>',
      to: para,
      subject: assunto,
      html: mensagemHtml,
    });
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${para}:`, error);
  }
};

module.exports = NotificationService;
