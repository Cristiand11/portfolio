const authMiddleware = require('../../src/middleware/authorizationMiddleware');
const db = require('../../src/config/database');

// Mock do Banco de Dados
jest.mock('../../src/config/database');

// Mock Manual Req/Res/Next
const mockRequest = (user, params = {}) => ({
  user,
  params,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('AuthorizationMiddleware Unit Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    res = mockResponse();
    next = mockNext;
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // TESTES SIMPLES (Role Check)
  // ---------------------------------------------------------
  describe('Verificações de Papel Único', () => {
    // Admin
    it('adminAuth: deve permitir administrador', () => {
      req = mockRequest({ perfil: 'administrador' });
      authMiddleware.adminAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('adminAuth: deve bloquear outros perfis', () => {
      req = mockRequest({ perfil: 'medico' });
      authMiddleware.adminAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    // Médico
    it('medicoAuth: deve permitir medico', () => {
      req = mockRequest({ perfil: 'medico' });
      authMiddleware.medicoAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    // Paciente
    it('pacienteAuth: deve permitir paciente', () => {
      req = mockRequest({ perfil: 'paciente' });
      authMiddleware.pacienteAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------
  // TESTES COMPOSTOS (Role A OR Role B)
  // ---------------------------------------------------------
  describe('medicoOuAuxiliarAuth', () => {
    it('deve permitir medico', () => {
      req = mockRequest({ perfil: 'medico' });
      authMiddleware.medicoOuAuxiliarAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('deve permitir auxiliar', () => {
      req = mockRequest({ perfil: 'auxiliar' });
      authMiddleware.medicoOuAuxiliarAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('deve bloquear paciente', () => {
      req = mockRequest({ perfil: 'paciente' });
      authMiddleware.medicoOuAuxiliarAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ---------------------------------------------------------
  // TESTES DE PROPRIEDADE (ID Logado == ID Param)
  // ---------------------------------------------------------
  describe('adminOuMedicoDonoAuth', () => {
    it('deve permitir administrador sempre', () => {
      req = mockRequest({ id: 'admin-1', perfil: 'administrador' }, { id: 'qualquer' });
      authMiddleware.adminOuMedicoDonoAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('deve permitir medico se for o dono (IDs iguais)', () => {
      req = mockRequest({ id: 'med-1', perfil: 'medico' }, { id: 'med-1' });
      authMiddleware.adminOuMedicoDonoAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('deve bloquear medico se tentar acessar outro ID', () => {
      req = mockRequest({ id: 'med-1', perfil: 'medico' }, { id: 'med-2' });
      authMiddleware.adminOuMedicoDonoAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ---------------------------------------------------------
  // TESTES COMPLEXOS (Acesso ao Banco de Dados)
  // ---------------------------------------------------------
  describe('medicoOuSeuAuxiliarAuth', () => {
    it('deve permitir medico dono da consulta', async () => {
      req = mockRequest({ id: 'med-1', perfil: 'medico' }, { id: 'consulta-1' });

      // Mock Consulta retornando que pertence ao med-1
      db.query.mockResolvedValue({ rows: [{ medico_id: 'med-1' }] });

      await authMiddleware.medicoOuSeuAuxiliarAuth(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('deve permitir auxiliar vinculado ao medico da consulta', async () => {
      req = mockRequest({ id: 'aux-1', perfil: 'auxiliar' }, { id: 'consulta-1' });

      // 1. Mock Consulta (pertence ao med-1)
      db.query.mockResolvedValueOnce({ rows: [{ medico_id: 'med-1' }] });

      // 2. Mock Auxiliar (vinculado ao med-1)
      db.query.mockResolvedValueOnce({ rows: [{ idMedico: 'med-1' }] });

      await authMiddleware.medicoOuSeuAuxiliarAuth(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('deve bloquear auxiliar de outro medico', async () => {
      req = mockRequest({ id: 'aux-1', perfil: 'auxiliar' }, { id: 'consulta-1' });

      // 1. Consulta do med-1
      db.query.mockResolvedValueOnce({ rows: [{ medico_id: 'med-1' }] });

      // 2. Auxiliar do med-2
      db.query.mockResolvedValueOnce({ rows: [{ idMedico: 'med-2' }] });

      await authMiddleware.medicoOuSeuAuxiliarAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('deve retornar 404 se consulta nao existir', async () => {
      req = mockRequest({ id: 'med-1', perfil: 'medico' }, { id: '999' });
      db.query.mockResolvedValue({ rows: [] });

      await authMiddleware.medicoOuSeuAuxiliarAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('auxiliarUpdateAuth', () => {
    it('deve permitir o próprio auxiliar se editar', async () => {
      req = mockRequest({ id: 'aux-1', perfil: 'auxiliar' }, { id: 'aux-1' });
      // Não chama banco nesse caso
      await authMiddleware.auxiliarUpdateAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('deve permitir o medico chefe editar seu auxiliar', async () => {
      req = mockRequest({ id: 'med-1', perfil: 'medico' }, { id: 'aux-1' });

      // Mock Auxiliar pertence ao med-1
      db.query.mockResolvedValue({ rows: [{ idMedico: 'med-1' }] });

      await authMiddleware.auxiliarUpdateAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('deve bloquear medico estranho', async () => {
      req = mockRequest({ id: 'med-2', perfil: 'medico' }, { id: 'aux-1' });

      // Mock Auxiliar pertence ao med-1
      db.query.mockResolvedValue({ rows: [{ idMedico: 'med-1' }] });

      await authMiddleware.auxiliarUpdateAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
