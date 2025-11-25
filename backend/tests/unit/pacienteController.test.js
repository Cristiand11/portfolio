const pacienteController = require('../../src/controllers/pacienteController');
const Paciente = require('../../src/models/pacienteModel');
const Medico = require('../../src/models/medicoModel');
const Auxiliar = require('../../src/models/auxiliarModel');
const axios = require('axios');
const { cpf } = require('cpf-cnpj-validator');

// Mocks Manuais
const mockRequest = () => ({
  body: {},
  query: {},
  params: {},
  user: { id: 'paciente-auth-1', perfil: 'paciente' },
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock das dependências
jest.mock('../../src/models/pacienteModel');
jest.mock('../../src/models/medicoModel');
jest.mock('../../src/models/auxiliarModel');
jest.mock('axios');
jest.mock('cpf-cnpj-validator', () => ({
  cpf: {
    isValid: jest.fn(),
    strip: jest.fn(val => val.replace(/\D/g, '')),
  }
}));

describe('PacienteController Unit Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // Create Paciente (Validações Complexas + Integração)
  // ---------------------------------------------------------
  describe('createPaciente', () => {
    it('deve criar paciente com CPF válido e endereço via CEP (201)', async () => {
      req.body = { 
        nome: 'Teste', 
        cpf: '123.456.789-00', 
        cepCodigo: '89200000' 
      };

      // Mock Valid CPF
      cpf.isValid.mockReturnValue(true);
      
      // Mock ViaCEP Success
      axios.get.mockResolvedValue({ 
        data: { logradouro: 'Rua Teste', localidade: 'Joinville', uf: 'SC', bairro: 'Centro' } 
      });

      // Mock DB Create
      Paciente.create.mockResolvedValue({ id: 1, ...req.body });

      await pacienteController.createPaciente(req, res);

      // Verificações
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('89200000'));
      expect(Paciente.create).toHaveBeenCalledWith(expect.objectContaining({
        endereco: 'Rua Teste',
        cidade: 'Joinville'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve retornar 400 se CPF for inválido', async () => {
      req.body = { cpf: 'invalido' };
      cpf.isValid.mockReturnValue(false);

      await pacienteController.createPaciente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringMatching(/Erro ao cadastrar/),
        error: expect.stringMatching(/CPF inválido/)
      }));
    });

    it('deve retornar 400 se CEP não for encontrado (Erro ViaCEP)', async () => {
      req.body = { cpf: '123', cepCodigo: '99999999' };
      cpf.isValid.mockReturnValue(true);

      // O axios retorna erro, o seu código captura e lança "Erro ao consultar o CEP."
      axios.get.mockResolvedValue({ data: { erro: true } });

      await pacienteController.createPaciente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      
      // CORREÇÃO: Ajustado para esperar a mensagem exata que seu código retorna
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringMatching(/Erro ao consultar o CEP/)
      }));
    });

    it('deve criar link com médico se quem cria é um médico', async () => {
        req.user = { id: 'med-1', perfil: 'medico' };
        req.body = { cpf: '123' };
        cpf.isValid.mockReturnValue(true);
        Paciente.create.mockResolvedValue({ id: 'pac-1' });

        await pacienteController.createPaciente(req, res);

        expect(Medico.createLink).toHaveBeenCalledWith('med-1', 'pac-1');
    });

    it('deve criar link com médico se quem cria é auxiliar', async () => {
        req.user = { id: 'aux-1', perfil: 'auxiliar' };
        req.body = { cpf: '123' };
        cpf.isValid.mockReturnValue(true);
        Paciente.create.mockResolvedValue({ id: 'pac-1' });
        
        // Mock Auxiliar buscando seu médico chefe
        Auxiliar.findById.mockResolvedValue({ id: 'aux-1', idMedico: 'med-chefe' });

        await pacienteController.createPaciente(req, res);

        expect(Medico.createLink).toHaveBeenCalledWith('med-chefe', 'pac-1');
    });
  });

  // ---------------------------------------------------------
  // Update Paciente (Segurança)
  // ---------------------------------------------------------
  describe('updatePaciente', () => {
    it('deve permitir atualização se for o próprio paciente (200)', async () => {
      req.params = { id: 'meu-id' };
      req.user = { id: 'meu-id' }; // Tokens batem
      req.body = { cpf: '123' };
      
      cpf.isValid.mockReturnValue(true);
      Paciente.update.mockResolvedValue({ id: 'meu-id' });

      await pacienteController.updatePaciente(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve negar atualização se tentar alterar outro usuário (403)', async () => {
      req.params = { id: 'outro-id' }; // ID URL
      req.user = { id: 'meu-id' };     // ID Token

      await pacienteController.updatePaciente(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(Paciente.update).not.toHaveBeenCalled();
    });

    it('deve retornar 400 se CEP não for encontrado (Erro ViaCEP)', async () => {
      req.body = { cpf: '123', cepCodigo: '99999999' };
      cpf.isValid.mockReturnValue(true);

      axios.get.mockResolvedValue({ data: { erro: true } });

      await pacienteController.createPaciente(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringMatching(/Erro ao consultar o CEP/)
      }));
    });
  });

  // ---------------------------------------------------------
  // Get Medicos Consultados
  // ---------------------------------------------------------
  describe('getMedicosConsultados', () => {
      it('deve retornar lista de médicos', async () => {
          req.user = { id: 'pac-1' };
          Paciente.findMedicosConsultados.mockResolvedValue([{ nome: 'Dr. House' }]);

          await pacienteController.getMedicosConsultados(req, res);

          expect(Paciente.findMedicosConsultados).toHaveBeenCalledWith('pac-1');
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith([{ nome: 'Dr. House' }]);
      });
  });
});