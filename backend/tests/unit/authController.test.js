const authController = require('../../src/controllers/authController');
const db = require('../../src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dateUtils = require('../../src/utils/dateUtils');
const notificationService = require('../../src/services/notificationService');

// Mocks
jest.mock('../../src/config/database');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/utils/dateUtils');
jest.mock('../../src/services/notificationService');

// Mock Manual de Req/Res
const mockRequest = () => ({ body: {} });
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController Unit Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret'; // Garante segredo para o teste
  });

  // ---------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------
  describe('login', () => {
    it('deve logar com sucesso e retornar token (200)', async () => {
      req.body = { email: 'test@test.com', senha: '123', perfil: 'paciente' };
      
      // Mock User Database
      db.query.mockResolvedValue({ 
        rows: [{ id: 1, nome: 'User', senha: 'hashed_password' }] 
      });
      
      // Mock Password Check
      bcrypt.compare.mockResolvedValue(true);
      
      // Mock Token Generation
      jwt.sign.mockReturnValue('token_jwt_valido');

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        token: 'token_jwt_valido'
      }));
    });

    it('deve retornar 401 se senha estiver incorreta', async () => {
      req.body = { email: 'test@test.com', senha: 'errada', perfil: 'paciente' };
      
      db.query.mockResolvedValue({ 
        rows: [{ id: 1, senha: 'hashed_password' }] 
      });
      
      bcrypt.compare.mockResolvedValue(false); // Senha não bate

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringMatching(/incorretos/)
      }));
    });

    it('deve bloquear médico Inativo (403)', async () => {
      req.body = { email: 'med@test.com', senha: '123', perfil: 'medico' };

      // Mock Médico Inativo
      db.query.mockResolvedValue({ 
        rows: [{ id: 1, status: 'Inativo' }] 
      });

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringMatching(/conta foi inativada/)
      }));
    });

    it('deve inativar médico automaticamente após 5 dias úteis (403)', async () => {
      req.body = { email: 'med@test.com', senha: '123', perfil: 'medico' };

      // Mock Médico Aguardando Inativação
      db.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, status: 'Aguardando Inativação', inativacaoSolicitadaEm: '2023-01-01' }] 
      });

      // Mock Dias Úteis > 5
      dateUtils.getDiasUteis.mockReturnValue(6);

      await authController.login(req, res);

      // Verifica se chamou o UPDATE para inativar
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE medico SET status'),
        expect.any(Array)
      );
      expect(res.status).toHaveBeenCalledWith(403);
    });
    
    it('deve permitir médico Aguardando Inativação se <= 5 dias úteis', async () => {
        req.body = { email: 'med@test.com', senha: '123', perfil: 'medico' };

        // Mock 1: Verifica status especial (retorna médico)
        db.query.mockResolvedValueOnce({ 
          rows: [{ id: 1, status: 'Aguardando Inativação', inativacaoSolicitadaEm: '2023-01-01', senha: 'hash' }] 
        });

        // Mock 2: Busca usuário para login (retorna mesmo médico)
        db.query.mockResolvedValueOnce({ 
            rows: [{ id: 1, senha: 'hash', nome: 'Dr' }] 
        });

        dateUtils.getDiasUteis.mockReturnValue(3); // Dentro do prazo
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('token');
  
        await authController.login(req, res);
  
        // NÃO deve chamar update de inativação
        expect(db.query).not.toHaveBeenCalledWith(expect.stringContaining('UPDATE'), expect.any(Array));
        // Deve logar
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'token' }));
    });
  });

  // ---------------------------------------------------------
  // FORGOT PASSWORD
  // ---------------------------------------------------------
  describe('forgotPassword', () => {
    it('deve enviar email e salvar token (200)', async () => {
      req.body = { email: 'user@test.com', perfil: 'paciente' };

      // Mock User Exists
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'user@test.com' }] });
      
      // Mock Insert Token
      db.query.mockResolvedValueOnce({}); 

      await authController.forgotPassword(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO PASSWORD_RESET_TOKENS'),
        expect.arrayContaining([1, 'paciente'])
      );
      expect(notificationService.enviarEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 200 mesmo se usuário não existir (Segurança)', async () => {
      req.body = { email: 'fake@test.com', perfil: 'paciente' };
      
      // Mock User Not Found
      db.query.mockResolvedValue({ rows: [] });

      await authController.forgotPassword(req, res);

      expect(notificationService.enviarEmail).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200); // Retorno genérico
    });
  });

  // ---------------------------------------------------------
  // RESET PASSWORD
  // ---------------------------------------------------------
  describe('resetPassword', () => {
    it('deve redefinir senha com sucesso (200)', async () => {
      req.body = { token: 'valid-token', novaSenha: 'new-pass' };

      // Mock Find Token
      db.query.mockResolvedValueOnce({ 
        rows: [{ id: 99, user_id: 1, perfil: 'paciente' }] 
      });

      // Mock Update Password
      db.query.mockResolvedValueOnce({});

      // Mock Delete Token
      db.query.mockResolvedValueOnce({});

      // --- CORREÇÃO AQUI ---
      // Precisamos mockar o genSalt para retornar uma string, senão o 'salt' fica undefined
      bcrypt.genSalt.mockResolvedValue('salt_teste'); 
      bcrypt.hash.mockResolvedValue('new_hash');

      await authController.resetPassword(req, res);

      // Agora o segundo argumento será 'salt_teste', que é uma String, e o teste passará
      expect(bcrypt.hash).toHaveBeenCalledWith('new-pass', 'salt_teste');
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE PACIENTE SET senha'),
        expect.any(Array)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 400 se token for inválido ou expirado', async () => {
      req.body = { token: 'invalid', novaSenha: '123' };

      // Mock Token Not Found
      db.query.mockResolvedValue({ rows: [] });

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});