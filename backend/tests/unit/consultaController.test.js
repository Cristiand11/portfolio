const consultaController = require('../../src/controllers/consultaController');
const Consulta = require('../../src/models/consultaModel');
const Medico = require('../../src/models/medicoModel');
const Paciente = require('../../src/models/pacienteModel');
const Auxiliar = require('../../src/models/auxiliarModel');
const NotificationService = require('../../src/services/notificationService');
const db = require('../../src/config/database'); // ADICIONADO

// Mocks manuais
const mockRequest = () => ({
  body: {},
  query: {},
  params: {},
  user: { id: 'paciente-1', perfil: 'paciente' },
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mocks das dependências
jest.mock('../../src/models/consultaModel');
jest.mock('../../src/models/medicoModel');
jest.mock('../../src/models/pacienteModel');
jest.mock('../../src/models/auxiliarModel');
jest.mock('../../src/services/notificationService');
jest.mock('../../src/config/database'); // ADICIONADO

describe('ConsultaController Unit Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // CREATE CONSULTA
  // ---------------------------------------------------------
  describe('createConsulta', () => {
    it('deve criar consulta com sucesso e enviar email (201)', async () => {
      const dataFutura = '2030-10-20';
      req.body = { idMedico: 'med-1', data: dataFutura, hora: '14:00' };

      Medico.findById.mockResolvedValue({ id: 'med-1', email: 'house@med.com', duracaoPadraoConsultaMinutos: 30 });
      Paciente.findById.mockResolvedValue({ id: 'paciente-1', nome: 'Paciente Teste' });
      Medico.isHorarioDisponivel.mockResolvedValue(true);
      Consulta.checkConflict.mockResolvedValue(false);
      Consulta.checkPatientConflict.mockResolvedValue(false);
      Consulta.create.mockResolvedValue({ id: 100, status: 'Aguardando', data: dataFutura, hora: '14:00' });

      await consultaController.createConsulta(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve bloquear agendamento no passado (400)', async () => {
      req.body = { data: '2000-01-01', hora: '10:00' };
      await consultaController.createConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve permitir auxiliar criar consulta para seu médico', async () => {
      req.user = { id: 'aux-1', perfil: 'auxiliar' };
      req.body = { idPaciente: 'pac-1', data: '2030-01-01', hora: '10:00' };

      Auxiliar.findById.mockResolvedValue({ id: 'aux-1', idMedico: 'med-1' });
      Medico.findById.mockResolvedValue({ id: 'med-1', duracaoPadraoConsultaMinutos: 30 });
      Medico.isHorarioDisponivel.mockResolvedValue(true);
      Consulta.checkConflict.mockResolvedValue(false);
      Consulta.checkPatientConflict.mockResolvedValue(false);
      Consulta.create.mockResolvedValue({ id: 100 });

      await consultaController.createConsulta(req, res);

      expect(Consulta.create).toHaveBeenCalledWith(expect.objectContaining({ idMedico: 'med-1' }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve bloquear auxiliar sem médico vinculado (403)', async () => {
      req.user = { id: 'aux-1', perfil: 'auxiliar' };
      // CORREÇÃO: Adicionado data/hora para passar pela validação inicial (400) e chegar no erro de permissão (403)
      req.body = { idPaciente: 'pac-1', data: '2030-01-01', hora: '10:00' };
      
      Auxiliar.findById.mockResolvedValue({ id: 'aux-1', idMedico: null });

      await consultaController.createConsulta(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('deve bloquear perfil desconhecido (403)', async () => {
      req.user = { id: 'user-1', perfil: 'hacker' };
      // CORREÇÃO: Adicionado data/hora para passar pela validação inicial
      req.body = { data: '2030-01-01', hora: '10:00' };
      
      await consultaController.createConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ---------------------------------------------------------
  // CANCELAR CONSULTA
  // ---------------------------------------------------------
  describe('cancelarConsulta', () => {
    it('deve cancelar com sucesso se antecedência for respeitada (200)', async () => {
      req.params = { id: 'cons-1' };
      req.user = { id: 'pac-1', perfil: 'paciente' };

      Consulta.findById.mockResolvedValue({ id: 'cons-1', paciente_id: 'pac-1', medico_id: 'med-1', data: '2030-12-31', hora: '10:00' });
      Paciente.findById.mockResolvedValue({ nome: 'Pac' });
      Medico.findById.mockResolvedValue({ email: 'med@test.com', cancelamentoAntecedenciaHoras: 24 });
      Consulta.cancelar.mockResolvedValue({});

      await consultaController.cancelarConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve permitir auxiliar cancelar consulta do seu médico', async () => {
      req.params = { id: 'cons-1' };
      req.user = { id: 'aux-1', perfil: 'auxiliar' };

      Consulta.findById.mockResolvedValue({ id: 'cons-1', medico_id: 'med-1', data: '2030-01-01', hora: '10:00' });
      Medico.findById.mockResolvedValue({ id: 'med-1', cancelamentoAntecedenciaHoras: 0 });
      Auxiliar.findById.mockResolvedValue({ id: 'aux-1', idMedico: 'med-1' });
      Consulta.cancelar.mockResolvedValue({});

      await consultaController.cancelarConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve negar cancelamento se auxiliar não for do médico da consulta', async () => {
      req.params = { id: 'cons-1' };
      req.user = { id: 'aux-1', perfil: 'auxiliar' };

      Consulta.findById.mockResolvedValue({ id: 'cons-1', medico_id: 'med-1', data: '2030-01-01', hora: '10:00' });
      Medico.findById.mockResolvedValue({ cancelamentoAntecedenciaHoras: 0 });
      Auxiliar.findById.mockResolvedValue({ id: 'aux-1', idMedico: 'med-OUTRO' });

      await consultaController.cancelarConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ---------------------------------------------------------
  // GET ALL CONSULTAS
  // ---------------------------------------------------------
  describe('getAllConsultas', () => {
    it('deve aplicar filtro de segurança para paciente', async () => {
      req.user = { id: 'pac-1', perfil: 'paciente' };
      req.query = {};
      Consulta.findPaginated.mockResolvedValue({});

      await consultaController.getAllConsultas(req, res);
      expect(Consulta.findPaginated).toHaveBeenCalledWith(
        expect.any(Number), expect.any(Number),
        expect.stringContaining("idPaciente eq 'pac-1'"),
        expect.any(Object)
      );
    });

    it('deve negar acesso se auxiliar não tiver médico vinculado (403)', async () => {
      req.user = { id: 'aux-1', perfil: 'auxiliar' };
      Auxiliar.findById.mockResolvedValue({ id: 'aux-1', idMedico: null });

      await consultaController.getAllConsultas(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ---------------------------------------------------------
  // UPDATE CONSULTA
  // ---------------------------------------------------------
  describe('updateConsulta', () => {
    it('deve atualizar com sucesso se não houver conflito (200)', async () => {
      req.params = { id: 'cons-1' };
      req.body = { data: '2030-01-01', hora: '10:00', idMedico: 'med-1', idPaciente: 'pac-1' };
      Consulta.checkConflict.mockResolvedValue(false);
      Consulta.checkPatientConflict.mockResolvedValue(false);
      Consulta.update.mockResolvedValue({ id: 'cons-1' });

      await consultaController.updateConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 409 se houver conflito de médico na edição', async () => {
      req.params = { id: 'cons-1' };
      req.body = { data: '2030-01-01', hora: '10:00', idMedico: 'med-1', idPaciente: 'pac-1' };
      Consulta.checkConflict.mockResolvedValue(true);

      await consultaController.updateConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  // ---------------------------------------------------------
  // CONCLUIR CONSULTA
  // ---------------------------------------------------------
  describe('concluirConsulta', () => {
    it('deve permitir auxiliar concluir consulta do seu médico', async () => {
      req.params = { id: 'cons-1' };
      req.user = { id: 'aux-1', perfil: 'auxiliar' };

      Consulta.findById.mockResolvedValue({ id: 'cons-1', medico_id: 'med-1', status: 'Confirmada' });
      Auxiliar.findById.mockResolvedValue({ id: 'aux-1', idMedico: 'med-1' });
      Consulta.marcarComoConcluida.mockResolvedValue({});

      await consultaController.concluirConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve impedir conclusão se status já for final (409)', async () => {
      req.params = { id: 'cons-1' };
      Consulta.findById.mockResolvedValue({ status: 'Concluída' });
      await consultaController.concluirConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  // ---------------------------------------------------------
  // CONFIRMAR CONSULTA
  // ---------------------------------------------------------
  describe('confirmarConsulta', () => {
    it('deve confirmar consulta aguardando médico (200)', async () => {
      req.params = { id: 'cons-1' };
      req.user = { id: 'med-1', perfil: 'medico' };
      const dataFutura = '2030-01-01';
      
      Consulta.findById.mockResolvedValue({ id: 'cons-1', status: 'Aguardando Confirmação do Médico', data: dataFutura, hora: '10:00' });
      Consulta.confirmar.mockResolvedValue({ status: 'Confirmada' });

      await consultaController.confirmarConsulta(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve expirar consulta se data já passou (409)', async () => {
      req.params = { id: 'cons-1' };
      Consulta.findById.mockResolvedValue({ id: 'cons-1', status: 'Aguardando Confirmação do Médico', data: '2000-01-01', hora: '10:00' });

      await consultaController.confirmarConsulta(req, res);
      expect(Consulta.updateStatus).toHaveBeenCalledWith('cons-1', 'Expirada');
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  // ---------------------------------------------------------
  // SOLICITAR REMARCAÇÃO
  // ---------------------------------------------------------
  describe('solicitarRemarcacao', () => {
    it('deve permitir auxiliar solicitar remarcação', async () => {
      req.params = { id: 'cons-1' };
      req.user = { id: 'aux-1', perfil: 'auxiliar' };
      req.body = { novaData: '2030-01-01', novaHora: '10:00' };

      Consulta.findById.mockResolvedValue({ medico_id: 'med-1', status: 'Confirmada', data: '2030-05-05', hora: '12:00', duracaoMinutos: 30 });

      // CORREÇÃO: Mock do db.query para verificar vínculo do auxiliar
      db.query.mockResolvedValue({ rows: [{ idMedico: 'med-1' }] });
      
      Medico.isHorarioDisponivel.mockResolvedValue(true);
      Consulta.checkConflict.mockResolvedValue(false);
      Consulta.checkPatientConflict.mockResolvedValue(false);
      Consulta.solicitarRemarcacao.mockResolvedValue({});
      Medico.findById.mockResolvedValue({ email: 'a@a.com' });
      Paciente.findById.mockResolvedValue({ email: 'b@b.com' });

      await consultaController.solicitarRemarcacao(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ---------------------------------------------------------
  // REPROVAR CONSULTA
  // ---------------------------------------------------------
  describe('reprovarConsulta', () => {
    it('deve expirar consulta se data da proposta já passou', async () => {
      req.params = { id: 'cons-1' };
      Consulta.findById.mockResolvedValue({ dataRemarcacaoSugerida: '2000-01-01', horaRemarcacaoSugerida: '10:00' });

      await consultaController.reprovarConsulta(req, res);
      expect(Consulta.updateStatus).toHaveBeenCalledWith('cons-1', 'Expirada');
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  // ---------------------------------------------------------
  // REJEITAR E ACEITAR REMARCAÇÃO (Simples)
  // ---------------------------------------------------------
  describe('aceitarRemarcacao', () => {
    it('deve rejeitar automaticamente se houver conflito no novo horário (409)', async () => {
      req.params = { id: 'cons-1' };
      req.user = { id: 'med-1', perfil: 'medico' };
      Consulta.findById.mockResolvedValue({ id: 'cons-1', medico_id: 'med-1', status: 'Remarcação Solicitada Pelo Paciente', dataRemarcacaoSugerida: '2030-05-05', horaRemarcacaoSugerida: '15:00' });
      Consulta.checkConflict.mockResolvedValue(true);

      await consultaController.aceitarRemarcacao(req, res);
      expect(Consulta.rejeitarRemarcacao).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('rejeitarRemarcacao', () => {
    it('deve rejeitar com sucesso se permissões ok', async () => {
      req.params = { id: 'cons-1' };
      req.user = { id: 'med-1', perfil: 'medico' };
      Consulta.findById.mockResolvedValue({ medico_id: 'med-1', status: 'Remarcação Solicitada Pelo Paciente' });
      Consulta.rejeitarRemarcacao.mockResolvedValue({});

      await consultaController.rejeitarRemarcacao(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});