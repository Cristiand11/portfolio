const db = require('../../src/config/database'); 
const Consulta = require('../../src/models/consultaModel'); 
jest.mock('../../src/config/database');

describe('ConsultaModel - Validação de Conflitos', () => {
  // Limpa os mocks antes de cada teste para não haver interferência
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkConflict (Conflito do Médico)', () => {
    
    it('Deve retornar TRUE quando o banco retornar count > 0', async () => {
      // ARRANGE (Preparar)
      // Simulamos que o banco retornou uma linha com count: '1' (conflito existe)
      db.query.mockResolvedValue({ rows: [{ count: '1' }] });

      const idMedico = 1;
      const data = '2025-10-30';
      const hora = '10:00';
      const duracao = 30;

      // ACT (Agir)
      const result = await Consulta.checkConflict(idMedico, data, hora, duracao);

      // ASSERT (Verificar)
      expect(result).toBe(true); // Esperamos true
      expect(db.query).toHaveBeenCalledTimes(1); // Verifica se o banco foi chamado
      
      // Verifica se os parâmetros SQL continham os status corretos (incluindo pendentes)
      const queryCallArgs = db.query.mock.calls[0];
      const valuesPassed = queryCallArgs[1]; // O segundo argumento de db.query são os values
      const statusArray = valuesPassed[2]; // O terceiro item no array values é o array de status
      
      expect(statusArray).toContain('Confirmada');
      expect(statusArray).toContain('Aguardando Confirmação do Médico');
      expect(statusArray).toContain('Aguardando Confirmação do Paciente');
    });

    it('Deve retornar FALSE quando o banco retornar count = 0', async () => {
      // ARRANGE
      // Simulamos que o banco retornou count: '0' (sem conflito)
      db.query.mockResolvedValue({ rows: [{ count: '0' }] });

      // ACT
      const result = await Consulta.checkConflict(1, '2025-10-30', '14:00', 30);

      // ASSERT
      expect(result).toBe(false);
    });

    it('Deve incluir o ID da consulta para exclusão na query se fornecido', async () => {
        // ARRANGE
        db.query.mockResolvedValue({ rows: [{ count: '0' }] });
        const excludeId = 99;
  
        // ACT
        await Consulta.checkConflict(1, '2025-10-30', '14:00', 30, excludeId);
  
        // ASSERT
        const querySql = db.query.mock.calls[0][0]; // A string SQL
        const queryValues = db.query.mock.calls[0][1]; // Os valores
        
        expect(querySql).toContain('AND id != $6'); // Verifica se a cláusula foi adicionada
        expect(queryValues).toContain(excludeId);   // Verifica se o ID foi passado
    });
  });

  describe('checkPatientConflict (Conflito do Paciente)', () => {
    
    it('Deve retornar TRUE quando houver conflito na agenda do paciente', async () => {
      // ARRANGE
      db.query.mockResolvedValue({ rows: [{ count: '2' }] }); // Paciente ocupado

      // ACT
      const result = await Consulta.checkPatientConflict(50, '2025-10-30', '10:00', 30);

      // ASSERT
      expect(result).toBe(true);
    });

    it('Deve verificar os mesmos status de bloqueio que a função do médico', async () => {
        // ARRANGE
        db.query.mockResolvedValue({ rows: [{ count: '0' }] });
  
        // ACT
        await Consulta.checkPatientConflict(50, '2025-10-30', '10:00', 30);
  
        // ASSERT
        const queryValues = db.query.mock.calls[0][1];
        const statusArray = queryValues[2];
        
        expect(statusArray).toContain('Confirmada');
        expect(statusArray).toContain('Aguardando Confirmação do Paciente');
    });
  });

  // ---------------------------------------------------------
  // Find Paginated (Regex e Filtros Complexos)
  // ---------------------------------------------------------
  describe('findPaginated', () => {
    it('deve aplicar filtro de status e ordenar corretamente', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '10' }] }); // Count
      db.query.mockResolvedValueOnce({ rows: [] }); // Select

      const filter = "status eq 'Confirmada'";
      const options = { sort: 'data', order: 'DESC' };

      await Consulta.findPaginated(1, 10, filter, options);

      // Verifica filtro WHERE
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.status = $1'),
        expect.arrayContaining(['Confirmada'])
      );

      // Verifica Ordenação DESC
      const sqlSelect = db.query.mock.calls[1][0];
      expect(sqlSelect).toContain('ORDER BY c.data DESC');
    });

    it('deve fazer JOIN com paciente e medico', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      db.query.mockResolvedValueOnce({ rows: [] });

      await Consulta.findPaginated(1, 10);

      const sqlSelect = db.query.mock.calls[1][0];
      expect(sqlSelect).toContain('LEFT JOIN paciente p');
      expect(sqlSelect).toContain('LEFT JOIN medico m');
    });
  });

  // ---------------------------------------------------------
  // Update (Query Dinâmica)
  // ---------------------------------------------------------
  describe('update', () => {
    it('deve atualizar apenas campos permitidos e setar lastModifiedDate', async () => {
      const dados = { observacoes: 'Nova obs', status: 'Concluída' };
      
      db.query.mockResolvedValue({ 
        rows: [{ id: 1, ...dados }] 
      });

      await Consulta.update(1, dados);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE consulta SET'),
        expect.any(Array)
      );
      
      const sql = db.query.mock.calls[0][0];
      expect(sql).toContain('observacoes = $1');
      expect(sql).toContain('status = $2');
      expect(sql).toContain('"lastModifiedDate" = NOW()');
    });
  });

  // ---------------------------------------------------------
  // State Transitions (Confirmação)
  // ---------------------------------------------------------
  describe('confirmar', () => {
    it('deve limpar datas de remarcação ao confirmar', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await Consulta.confirmar(1, '2025-10-20', '10:00');

      const sql = db.query.mock.calls[0][0];
      // Deve setar NULL nas sugestões de remarcação
      expect(sql).toContain('"dataRemarcacaoSugerida" = NULL');
      expect(sql).toContain('"horaRemarcacaoSugerida" = NULL');
      expect(sql).toContain("status = 'Confirmada'");
    });
  });

  // ---------------------------------------------------------
  // CREATE (Formatação de Retorno)
  // ---------------------------------------------------------
  describe('create', () => {
    it('deve criar consulta e formatar datas no retorno', async () => {
      const dados = { data: '2025-10-20', hora: '14:00' };
      
      // Mock do retorno do INSERT
      db.query.mockResolvedValue({ 
        rows: [{ 
          id: 1, ...dados, 
          createdDate: new Date(), 
          lastModifiedDate: new Date() 
        }] 
      });

      const result = await Consulta.create(dados);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO consulta'),
        expect.any(Array)
      );
      // Verifica se as funções de formatação foram chamadas (mocks globais)
      expect(result).toHaveProperty('createdDate');
    });
  });

  // ---------------------------------------------------------
  // UPDATE (Caso Vazio)
  // ---------------------------------------------------------
  describe('update (Edge Cases)', () => {
    it('deve retornar objeto sem update se não houver campos', async () => {
      // Mock do findById (pois ele será chamado se não houver update)
      db.query.mockResolvedValue({ rows: [{ id: 1, status: 'Original' }] });

      const result = await Consulta.update(1, {}); // Objeto vazio

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM consulta'),
        expect.any(Array)
      );
      expect(result.status).toBe('Original');
    });
  });

  // ---------------------------------------------------------
  // REMARCAÇÃO (Solicitar/Aceitar/Rejeitar)
  // ---------------------------------------------------------
  describe('Fluxos de Remarcação', () => {
    it('solicitarRemarcacao: deve atualizar status e datas sugeridas', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await Consulta.solicitarRemarcacao(1, '2030-01-01', '10:00', 'Aguardando');

      const sql = db.query.mock.calls[0][0];
      expect(sql).toContain('status = $1');
      expect(sql).toContain('"dataRemarcacaoSugerida" = $2');
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        ['Aguardando', '2030-01-01', '10:00', 1]
      );
    });

    it('aceitarRemarcacao: deve limpar sugestões e confirmar nova data', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, data: '2030-01-01' }] });

      await Consulta.aceitarRemarcacao(1, '2030-01-01', '10:00');

      const sql = db.query.mock.calls[0][0];
      expect(sql).toContain("status = 'Confirmada'");
      expect(sql).toContain('data = $1'); // Nova data
      expect(sql).toContain('"dataRemarcacaoSugerida" = NULL');
    });

    it('rejeitarRemarcacao: deve limpar sugestões e manter data original', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await Consulta.rejeitarRemarcacao(1);

      const sql = db.query.mock.calls[0][0];
      expect(sql).toContain("status = 'Confirmada'");
      // Não deve alterar data/hora principal, apenas limpar as sugeridas
      expect(sql).not.toContain('data = $1'); 
      expect(sql).toContain('"dataRemarcacaoSugerida" = NULL');
    });
  });

  // ---------------------------------------------------------
  // OUTRAS TRANSIÇÕES DE ESTADO
  // ---------------------------------------------------------
  describe('Transições de Estado', () => {
    it('marcarComoConcluida: deve setar status para Concluída', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });
      await Consulta.marcarComoConcluida(1);
      
      const params = db.query.mock.calls[0][1];
      expect(params[0]).toBe('Concluída');
    });

    it('reprovar: deve setar status Confirmada e limpar sugestões (lógica de limpar proposta)', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });
      await Consulta.reprovar(1);

      const sql = db.query.mock.calls[0][0];
      expect(sql).toContain('"dataRemarcacaoSugerida" = NULL');
    });

    it('updateStatus: deve apenas atualizar o status', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });
      await Consulta.updateStatus(1, 'Expirada');

      const params = db.query.mock.calls[0][1];
      expect(params[0]).toBe('Expirada');
    });
  });
});