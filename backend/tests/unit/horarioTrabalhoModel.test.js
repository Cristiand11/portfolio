const HorarioTrabalho = require('../../src/models/horarioTrabalhoModel');
const db = require('../../src/config/database');

// Mock do módulo de banco de dados
jest.mock('../../src/config/database');

describe('HorarioTrabalhoModel Unit Tests', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Configuração do Mock do CLIENT (usado na transação)
    mockClient = {
      query: jest.fn().mockResolvedValue({}), // query do client sempre resolve sucesso por padrão
      release: jest.fn(), // função release
    };

    // Quando db.connect for chamado, retorna nosso mockClient
    db.connect.mockResolvedValue(mockClient);
  });

  // ---------------------------------------------------------
  // Definir Horários (Transação)
  // ---------------------------------------------------------
  describe('definirHorarios', () => {
    it('deve executar transação completa com sucesso (BEGIN -> DELETE -> INSERTS -> COMMIT)', async () => {
      const idMedico = 1;
      const horarios = [
        { dia_semana: 1, hora_inicio: '08:00', hora_fim: '12:00' },
        { dia_semana: 2, hora_inicio: '14:00', hora_fim: '18:00' },
      ];

      await HorarioTrabalho.definirHorarios(idMedico, horarios);

      // 1. Verificações de conexão e início
      expect(db.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

      // 2. Verificação do DELETE
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM HORARIO_TRABALHO WHERE medico_id = $1',
        [idMedico]
      );

      // 3. Verificação dos INSERTS (deve ter sido chamado para cada item do array)
      // Verificamos se a string de INSERT foi chamada
      const insertCalls = mockClient.query.mock.calls.filter((call) =>
        call[0].includes('INSERT INTO HORARIO_TRABALHO')
      );
      expect(insertCalls).toHaveLength(2); // 2 horários = 2 inserts

      // Valida os parametros do primeiro insert
      expect(insertCalls[0][1]).toEqual([idMedico, 1, '08:00', '12:00']);

      // 4. Verificação de finalização
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(mockClient.query).not.toHaveBeenCalledWith('ROLLBACK');
    });

    it('deve realizar ROLLBACK e liberar cliente em caso de erro', async () => {
      const idMedico = 1;
      const horarios = [{ dia_semana: 1, hora_inicio: '08:00', hora_fim: '12:00' }];

      // Simula um erro na execução de qualquer query dentro do client
      // Vamos fazer falhar na hora do INSERT
      mockClient.query.mockImplementation((sql) => {
        if (sql.includes('INSERT')) {
          return Promise.reject(new Error('Erro de Banco de Dados'));
        }
        return Promise.resolve({});
      });

      // Espera que a função lance o erro para cima
      await expect(HorarioTrabalho.definirHorarios(idMedico, horarios)).rejects.toThrow(
        'Erro de Banco de Dados'
      );

      // Verificações de falha
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK'); // Deve ter chamado rollback
      expect(mockClient.query).not.toHaveBeenCalledWith('COMMIT'); // Não pode ter comitado
      expect(mockClient.release).toHaveBeenCalled(); // Deve liberar a conexão mesmo com erro
    });
  });

  // ---------------------------------------------------------
  // Find By Medico Id (Query Simples)
  // ---------------------------------------------------------
  describe('findByMedicoId', () => {
    it('deve buscar horários ordenados corretamente', async () => {
      // Mock do db.query direto (não usa o client aqui, usa o pool direto)
      const mockHorarios = [{ dia_semana: 1, hora_inicio: '08:00', hora_fim: '12:00' }];
      db.query.mockResolvedValue({ rows: mockHorarios });

      const resultado = await HorarioTrabalho.findByMedicoId(123);

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT dia_semana'), [123]);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY dia_semana, hora_inicio ASC'),
        expect.any(Array)
      );
      expect(resultado).toEqual(mockHorarios);
    });
  });
});
