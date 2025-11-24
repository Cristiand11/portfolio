const auxiliarController = require('../../src/controllers/auxiliarController');
const Auxiliar = require('../../src/models/auxiliarModel');
const db = require('../../src/config/database');

// Mocks Manuais
const mockRequest = () => ({
  body: {},
  query: {},
  params: {},
  user: { id: 'medico-id-123', perfil: 'medico' },
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mocks das dependências
jest.mock('../../src/models/auxiliarModel');
jest.mock('../../src/config/database');
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('AuxiliarController Unit Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // Create Auxiliar
  // ---------------------------------------------------------
  describe('createAuxiliar', () => {
    it('deve criar auxiliar com sucesso (201)', async () => {
      req.body = { nome: 'Auxiliar 1', email: 'aux@teste.com' };
      Auxiliar.create.mockResolvedValue({ id: 1, ...req.body });

      await auxiliarController.createAuxiliar(req, res);

      expect(Auxiliar.create).toHaveBeenCalledWith(expect.objectContaining({
        idMedico: 'medico-id-123'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve retornar 409 se email já existe', async () => {
      const error = new Error('Duplicado');
      error.code = '23505';
      error.constraint = 'auxiliar_email_key';
      Auxiliar.create.mockRejectedValue(error);

      await auxiliarController.createAuxiliar(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringMatching(/e-mail já está em uso/)
      }));
    });

    it('deve retornar 500 em caso de erro genérico', async () => {
      Auxiliar.create.mockRejectedValue(new Error('Erro DB'));
      await auxiliarController.createAuxiliar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Get All Auxiliares
  // ---------------------------------------------------------
  describe('getAllAuxiliares', () => {
    it('deve listar auxiliares com paginação (200)', async () => {
      Auxiliar.findPaginated.mockResolvedValue({ contents: [] });
      await auxiliarController.getAllAuxiliares(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 500 em caso de erro', async () => {
      Auxiliar.findPaginated.mockRejectedValue(new Error('Erro DB'));
      await auxiliarController.getAllAuxiliares(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Update Auxiliar
  // ---------------------------------------------------------
  describe('updateAuxiliar', () => {
    it('deve impedir atualização se não for o próprio auxiliar (403)', async () => {
      req.params = { id: 'auxiliar-id-999' };
      req.user = { id: 'outro-id', perfil: 'auxiliar' };

      await auxiliarController.updateAuxiliar(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('deve retornar 400 se não houver campos para atualizar', async () => {
      req.params = { id: 'meu-id' };
      req.user = { id: 'meu-id', perfil: 'auxiliar' };
      req.body = {}; 

      await auxiliarController.updateAuxiliar(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve atualizar com sucesso (200)', async () => {
      req.params = { id: 'meu-id' };
      req.user = { id: 'meu-id', perfil: 'auxiliar' };
      req.body = { nome: 'Novo Nome' };

      db.query.mockResolvedValue({ rows: [{ id: 'meu-id', nome: 'Novo Nome' }] });

      await auxiliarController.updateAuxiliar(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE AUXILIAR'),
        expect.any(Array)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 409 em conflito de email no update', async () => {
      req.params = { id: 'meu-id' };
      req.user = { id: 'meu-id', perfil: 'auxiliar' };
      req.body = { email: 'existe@teste.com' };

      const error = new Error('Duplicado');
      error.code = '23505';
      error.constraint = 'auxiliar_email_key';
      db.query.mockRejectedValue(error);

      await auxiliarController.updateAuxiliar(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('deve retornar 500 em caso de erro genérico no update', async () => {
      req.params = { id: 'meu-id' };
      req.user = { id: 'meu-id', perfil: 'auxiliar' };
      req.body = { nome: 'Novo' };
      db.query.mockRejectedValue(new Error('Erro DB'));

      await auxiliarController.updateAuxiliar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Delete Auxiliar
  // ---------------------------------------------------------
  describe('deleteAuxiliar', () => {
    it('deve deletar com sucesso se for médico dono (200)', async () => {
      req.params = { id: 'aux-id' };
      req.user = { id: 'medico-id-1', perfil: 'medico' };
      
      Auxiliar.findById.mockResolvedValue({ id: 'aux-id', idMedico: 'medico-id-1' });

      await auxiliarController.deleteAuxiliar(req, res);

      expect(Auxiliar.delete).toHaveBeenCalledWith('aux-id');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve negar exclusão se médico não for dono (403)', async () => {
      req.params = { id: 'aux-id' };
      req.user = { id: 'medico-invasor', perfil: 'medico' };
      
      Auxiliar.findById.mockResolvedValue({ id: 'aux-id', idMedico: 'medico-dono' });

      await auxiliarController.deleteAuxiliar(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('deve retornar 404 se auxiliar não existir', async () => {
      Auxiliar.findById.mockResolvedValue(null);
      await auxiliarController.deleteAuxiliar(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deve retornar 500 em caso de erro', async () => {
      req.params = { id: 'aux-id' };
      Auxiliar.findById.mockRejectedValue(new Error('Erro DB'));
      await auxiliarController.deleteAuxiliar(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Delete Vários (Batch)
  // ---------------------------------------------------------
  describe('deleteVariosAuxiliares', () => {
    it('deve deletar lista de IDs com sucesso (200)', async () => {
      req.body = { ids: ['1', '2'] };
      req.user = { id: 'medico-1', perfil: 'medico' };

      db.query.mockResolvedValue({ 
        rows: [{ idMedico: 'medico-1' }, { idMedico: 'medico-1' }] 
      });

      Auxiliar.deleteByIds.mockResolvedValue(2);

      await auxiliarController.deleteVariosAuxiliares(req, res);

      expect(Auxiliar.deleteByIds).toHaveBeenCalledWith(['1', '2']);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve impedir deleção se um dos auxiliares não for do médico (403)', async () => {
      req.body = { ids: ['1', '2'] };
      req.user = { id: 'medico-1', perfil: 'medico' };

      db.query.mockResolvedValue({ 
        rows: [{ idMedico: 'medico-1' }, { idMedico: 'medico-OUTRO' }] 
      });

      await auxiliarController.deleteVariosAuxiliares(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('deve retornar 400 se lista de IDs for inválida', async () => {
      req.body = { ids: [] };
      await auxiliarController.deleteVariosAuxiliares(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve retornar 500 em caso de erro', async () => {
      req.body = { ids: ['1'] };
      req.user = { id: 'medico-1', perfil: 'medico' };
      db.query.mockRejectedValue(new Error('Erro DB'));
      await auxiliarController.deleteVariosAuxiliares(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Get Me
  // ---------------------------------------------------------
  describe('getMe', () => {
    it('deve retornar dados do auxiliar logado (200)', async () => {
      req.user = { id: 'aux-1' };
      Auxiliar.findById.mockResolvedValue({ id: 'aux-1' });
      await auxiliarController.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 404 se não encontrado', async () => {
      req.user = { id: 'aux-1' };
      Auxiliar.findById.mockResolvedValue(null);
      await auxiliarController.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deve retornar 500 em erro', async () => {
      req.user = { id: 'aux-1' };
      Auxiliar.findById.mockRejectedValue(new Error('Erro'));
      await auxiliarController.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Get Meu Medico Vinculado
  // ---------------------------------------------------------
  describe('getMeuMedicoVinculado', () => {
    it('deve retornar dados do médico vinculado (200)', async () => {
      req.user = { id: 'aux-1' };
      
      db.query.mockResolvedValueOnce({ rows: [{ idMedico: 'med-1' }] });
      db.query.mockResolvedValueOnce({ rows: [{ nome: 'Dr. House', crm: '123' }] });

      await auxiliarController.getMeuMedicoVinculado(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Dr. House' }));
    });

    it('deve retornar 404 se auxiliar não tiver médico vinculado', async () => {
      req.user = { id: 'aux-solto' };
      db.query.mockResolvedValueOnce({ rows: [{ idMedico: null }] });

      await auxiliarController.getMeuMedicoVinculado(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deve retornar 404 se médico vinculado não existir mais', async () => {
      req.user = { id: 'aux-1' };
      db.query.mockResolvedValueOnce({ rows: [{ idMedico: 'med-fantasma' }] });
      db.query.mockResolvedValueOnce({ rows: [] }); // Médico não achado

      await auxiliarController.getMeuMedicoVinculado(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deve retornar 500 em erro', async () => {
      req.user = { id: 'aux-1' };
      db.query.mockRejectedValue(new Error('Erro'));
      await auxiliarController.getMeuMedicoVinculado(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});