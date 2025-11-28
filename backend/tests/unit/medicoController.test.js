const medicoController = require('../../src/controllers/medicoController');
const Medico = require('../../src/models/medicoModel');
const Auxiliar = require('../../src/models/auxiliarModel');
const HorarioTrabalho = require('../../src/models/horarioTrabalhoModel');
const db = require('../../src/config/database');
const dateUtils = require('../../src/utils/dateUtils');
const agendaHelper = require('../../src/utils/agendaHelper');
const queryUtils = require('../../src/utils/queryUtils');

// Mocks Manuais
const mockRequest = () => ({
  body: {},
  query: {},
  params: {},
  user: { id: 'medico-123', perfil: 'medico' },
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mocks das dependências
jest.mock('../../src/models/medicoModel');
jest.mock('../../src/models/auxiliarModel');
jest.mock('../../src/models/horarioTrabalhoModel');
jest.mock('../../src/config/database');
jest.mock('../../src/utils/dateUtils');
jest.mock('../../src/utils/agendaHelper');
jest.mock('../../src/utils/queryUtils');

describe('MedicoController Unit Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // Create Medico
  // ---------------------------------------------------------
  describe('createMedico', () => {
    it('deve criar médico com CRM válido (201)', async () => {
      req.body = { nome: 'Dr. Teste', crm: '12345/SC', senha: '123' };
      Medico.create.mockResolvedValue({ id: 1, ...req.body });

      await medicoController.createMedico(req, res);

      expect(Medico.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve rejeitar CRM com formato inválido (400)', async () => {
      req.body = { nome: 'Dr. Teste', crm: '12345' }; // Sem UF
      await medicoController.createMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve retornar 500 em caso de erro no servidor', async () => {
      req.body = { nome: 'Dr. Teste', crm: '12345/SC' };
      Medico.create.mockRejectedValue(new Error('Erro DB'));
      await medicoController.createMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Get All Medicos
  // ---------------------------------------------------------
  describe('getAllMedicos', () => {
    it('deve listar médicos com paginação (200)', async () => {
      Medico.findPaginated.mockResolvedValue({ contents: [], totalElements: 0 });
      await medicoController.getAllMedicos(req, res);
      expect(Medico.findPaginated).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 500 se falhar', async () => {
      Medico.findPaginated.mockRejectedValue(new Error('Erro'));
      await medicoController.getAllMedicos(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Update Medico
  // ---------------------------------------------------------
  describe('updateMedico', () => {
    it('deve atualizar médico com sucesso (200)', async () => {
      req.params = { id: '1' };
      req.body = { nome: 'Novo Nome', crm: '12345/SC' };

      Medico.update.mockResolvedValue({ id: '1', nome: 'Novo Nome' });

      await medicoController.updateMedico(req, res);

      expect(Medico.update).toHaveBeenCalledWith('1', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 400 para CRM inválido no update', async () => {
      req.body = { crm: 'invalido' };
      await medicoController.updateMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve retornar 404 se médico não for encontrado', async () => {
      req.params = { id: '99' };
      req.body = { crm: '12345/SC' };

      Medico.update.mockResolvedValue(null);

      await medicoController.updateMedico(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deve retornar 500 em erro', async () => {
      req.params = { id: '1' };
      req.body = { crm: '12345/SC' };

      Medico.update.mockRejectedValue(new Error('Erro'));

      await medicoController.updateMedico(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Delete Medico
  // ---------------------------------------------------------
  describe('deleteMedico', () => {
    it('deve deletar com sucesso (200)', async () => {
      req.params = { id: '1' };
      Medico.delete.mockResolvedValue(1); // 1 linha afetada
      await medicoController.deleteMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 404 se não deletar nada', async () => {
      req.params = { id: '1' };
      Medico.delete.mockResolvedValue(0);
      await medicoController.deleteMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deve retornar 500 em erro', async () => {
      req.params = { id: '1' };
      Medico.delete.mockRejectedValue(new Error('Erro'));
      await medicoController.deleteMedico(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Solicitar Inativação
  // ---------------------------------------------------------
  describe('solicitarInativacao', () => {
    it('deve solicitar inativação com sucesso (200)', async () => {
      req.params = { id: '1' };
      db.query.mockResolvedValue({ rows: [{ id: '1', inativacaoSolicitadaEm: null }] });
      Medico.solicitarInativacao.mockResolvedValue({ id: '1', status: 'Aguardando' });

      await medicoController.solicitarInativacao(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 404 se médico não existir', async () => {
      req.params = { id: '1' };
      db.query.mockResolvedValue({ rows: [] });
      await medicoController.solicitarInativacao(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deve negar se já houver solicitação pendente (409)', async () => {
      req.params = { id: '1' };
      db.query.mockResolvedValue({ rows: [{ id: '1', inativacaoSolicitadaEm: new Date() }] });
      await medicoController.solicitarInativacao(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('deve retornar 500 em erro', async () => {
      req.params = { id: '1' };
      db.query.mockRejectedValue(new Error('Erro'));
      await medicoController.solicitarInativacao(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Reverter Inativação
  // ---------------------------------------------------------
  describe('reverterInativacao', () => {
    it('deve reverter se estiver dentro do prazo (200)', async () => {
      req.params = { id: '1' };
      db.query.mockResolvedValue({ rows: [{ id: '1', inativacaoSolicitadaEm: '2023-10-01' }] });
      dateUtils.getDiasUteis.mockReturnValue(2);
      Medico.reverterInativacao.mockResolvedValue({ id: '1', status: 'Ativo' });

      await medicoController.reverterInativacao(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 404 se médico não encontrado', async () => {
      db.query.mockResolvedValue({ rows: [] });
      await medicoController.reverterInativacao(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deve retornar 404 se não houver solicitação pendente', async () => {
      db.query.mockResolvedValue({ rows: [{ inativacaoSolicitadaEm: null }] });
      await medicoController.reverterInativacao(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deve negar reversão se prazo expirou (409)', async () => {
      req.params = { id: '1' };
      db.query.mockResolvedValue({ rows: [{ id: '1', inativacaoSolicitadaEm: '2023-10-01' }] });
      dateUtils.getDiasUteis.mockReturnValue(6);

      await medicoController.reverterInativacao(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('deve retornar 500 em erro', async () => {
      db.query.mockRejectedValue(new Error('Erro'));
      await medicoController.reverterInativacao(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Get Pacientes Atendidos
  // ---------------------------------------------------------
  describe('getPacientesAtendidos', () => {
    it('deve retornar lista de pacientes (200)', async () => {
      Medico.findPacientesAtendidos.mockResolvedValue({ contents: [] });
      await medicoController.getPacientesAtendidos(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 500 em caso de erro', async () => {
      Medico.findPacientesAtendidos.mockRejectedValue(new Error('Erro'));
      await medicoController.getPacientesAtendidos(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Get Me (Dados do Médico Logado)
  // ---------------------------------------------------------
  describe('getMe', () => {
    it('deve retornar dados do médico logado (200)', async () => {
      Medico.findById.mockResolvedValue({ id: '1', nome: 'Dr' });
      await medicoController.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 404 se médico não encontrado', async () => {
      Medico.findById.mockResolvedValue(null);
      await medicoController.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('deve retornar 500 em caso de erro', async () => {
      Medico.findById.mockRejectedValue(new Error('Erro'));
      await medicoController.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Definir Horários
  // ---------------------------------------------------------
  describe('definirMeusHorarios', () => {
    it('deve retornar 400 se body não for array', async () => {
      req.body = {}; // Objeto, não array
      await medicoController.definirMeusHorarios(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve retornar 400 se campos obrigatórios faltarem', async () => {
      req.body = [{ dia_semana: 1, hora_inicio: '08:00' }]; // Falta hora_fim
      await medicoController.definirMeusHorarios(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve retornar 400 se formato de hora inválido', async () => {
      req.body = [{ dia_semana: 1, hora_inicio: '8h', hora_fim: '12:00' }];
      await medicoController.definirMeusHorarios(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve retornar 400 se hora_inicio >= hora_fim', async () => {
      req.body = [{ dia_semana: 1, hora_inicio: '12:00', hora_fim: '11:00' }];
      await medicoController.definirMeusHorarios(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve retornar 409 se houver conflito', async () => {
      req.body = [{ dia_semana: 1, hora_inicio: '08:00', hora_fim: '10:00' }];
      agendaHelper.verificaConflitosNoDia.mockReturnValue(true);
      await medicoController.definirMeusHorarios(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('deve salvar horários com sucesso (200)', async () => {
      req.body = [{ dia_semana: 1, hora_inicio: '08:00', hora_fim: '12:00' }];
      agendaHelper.verificaConflitosNoDia.mockReturnValue(false);
      await medicoController.definirMeusHorarios(req, res);
      expect(HorarioTrabalho.definirHorarios).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 500 em erro', async () => {
      req.body = []; // Válido (array vazio limpa horários)
      HorarioTrabalho.definirHorarios.mockRejectedValue(new Error('Erro'));
      await medicoController.definirMeusHorarios(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Get Horários
  // ---------------------------------------------------------
  describe('getHorarios', () => {
    it('getHorariosByMedicoId: deve retornar sucesso (200)', async () => {
      req.params = { id: '1' };
      HorarioTrabalho.findByMedicoId.mockResolvedValue([]);
      await medicoController.getHorariosByMedicoId(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getHorariosByMedicoId: deve retornar 500 em erro', async () => {
      HorarioTrabalho.findByMedicoId.mockRejectedValue(new Error('Erro'));
      await medicoController.getHorariosByMedicoId(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('getMeusHorarios: deve retornar sucesso (200)', async () => {
      HorarioTrabalho.findByMedicoId.mockResolvedValue([]);
      await medicoController.getMeusHorarios(req, res);
      expect(HorarioTrabalho.findByMedicoId).toHaveBeenCalledWith('medico-123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getMeusHorarios: deve retornar 500 em erro', async () => {
      HorarioTrabalho.findByMedicoId.mockRejectedValue(new Error('Erro'));
      await medicoController.getMeusHorarios(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Get Pacientes By Medico Id (Admin/Outros)
  // ---------------------------------------------------------
  describe('getPacientesByMedicoId', () => {
    it('deve retornar 400 se ID não for fornecido (embora rota exija)', async () => {
      req.params = {}; // Sem ID
      await medicoController.getPacientesByMedicoId(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve retornar lista paginada (200)', async () => {
      req.params = { id: '1' };
      Medico.findPacientesAtendidos.mockResolvedValue({});
      await medicoController.getPacientesByMedicoId(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 500 em erro', async () => {
      req.params = { id: '1' };
      Medico.findPacientesAtendidos.mockRejectedValue(new Error('Erro'));
      await medicoController.getPacientesByMedicoId(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Get Consultas
  // ---------------------------------------------------------
  describe('getConsultasByMedicoId', () => {
    it('deve montar query com sucesso (200)', async () => {
      req.params = { id: 'med-1' };
      queryUtils.parseFilter.mockReturnValue({ clause: '', params: [] });
      db.query.mockResolvedValue({ rows: [] });

      await medicoController.getConsultasByMedicoId(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 400 se filtro for inválido', async () => {
      req.params = { id: 'med-1' };
      req.query.filter = 'invalido';
      queryUtils.parseFilter.mockImplementation(() => {
        throw new Error('Filtro ruim');
      });

      await medicoController.getConsultasByMedicoId(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve retornar 500 em erro de banco', async () => {
      req.params = { id: 'med-1' };
      queryUtils.parseFilter.mockReturnValue({ clause: '', params: [] });
      db.query.mockRejectedValue(new Error('Erro DB'));

      await medicoController.getConsultasByMedicoId(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------------------------------------------------
  // Get Meus Auxiliares
  // ---------------------------------------------------------
  describe('getMeusAuxiliares', () => {
    it('deve aplicar filtro de segurança (200)', async () => {
      req.user.id = 'medico-auth-1';
      Auxiliar.findPaginated.mockResolvedValue({});
      await medicoController.getMeusAuxiliares(req, res);
      expect(Auxiliar.findPaginated).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.stringContaining("idMedico eq 'medico-auth-1'"),
        expect.any(Object)
      );
    });

    it('deve retornar 500 em erro', async () => {
      Auxiliar.findPaginated.mockRejectedValue(new Error('Erro'));
      await medicoController.getMeusAuxiliares(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
