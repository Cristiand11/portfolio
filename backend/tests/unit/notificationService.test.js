// CORREÇÃO: A variável deve começar com 'mock' para ser usada dentro do jest.mock()
const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: mockSendMail,
  }),
}));

const notificationService = require('../../src/services/notificationService');

describe('NotificationService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve enviar e-mail com sucesso e retornar info', async () => {
    // Mock do sucesso do envio
    const mockInfo = { messageId: '12345', response: 'OK' };
    mockSendMail.mockResolvedValue(mockInfo);

    const emailData = {
      para: 'paciente@teste.com',
      assunto: 'Confirmação',
      mensagemHtml: '<p>Olá</p>',
    };

    const resultado = await notificationService.enviarEmail(emailData);

    // Verifica se o nodemailer foi chamado com os parâmetros certos
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'paciente@teste.com',
      subject: 'Confirmação',
      html: '<p>Olá</p>',
      from: expect.stringContaining('AgendaMed')
    }));

    // Verifica o retorno
    expect(resultado).toEqual(mockInfo);
  });

  it('deve lançar erro (throw) se o envio falhar', async () => {
    // Mock do erro (ex: falha de autenticação SMTP)
    const mockError = new Error('Falha na conexão SMTP');
    mockSendMail.mockRejectedValue(mockError);

    const emailData = {
      para: 'erro@teste.com',
      assunto: 'Erro',
      mensagemHtml: '<p>Erro</p>',
    };

    // Espera que a função exploda o erro para ser tratado pelo controller
    await expect(notificationService.enviarEmail(emailData))
      .rejects
      .toThrow('Falha na conexão SMTP');
  });
});