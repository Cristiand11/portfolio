const Medico = require('../../src/models/medicoModel');
const db = require('../../src/config/database');
const bcrypt = require('bcryptjs');
const { formatarData } = require('../../src/utils/dateUtils');

jest.mock('../../src/config/database');
jest.mock('bcryptjs');
jest.mock('../../src/utils/dateUtils');

describe('MedicoModel Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    formatarData.mockImplementation(d => '2025-01-01');
  });

  // ---------------------------------------------------------
  // Create
  // ---------------------------------------------------------
  describe('create', () => {
    it('deve criar medico hashando a senha', async () => {
      const dados = { nome: 'Dr', senha: '123' };
      bcrypt.hash.mockResolvedValue('hash123');
      
      db.query.mockResolvedValue({ rows: [{ ...dados, senha: 'hash123' }] });

      await Medico.create(dados);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO medico'),
        expect.any(Array)
      );
    });
  });

  // ---------------------------------------------------------
  // Find Paginated (Parse de Filtros Complexos)
  // ---------------------------------------------------------
  describe('findPaginated', () => {
    it('deve fazer parse de filtros com OR', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '10' }] });
      db.query.mockResolvedValueOnce({ rows: [] });

      // Filtro: "nome eq 'A' or crm eq 'B'"
      const filter = "nome eq 'A' or crm eq 'B'";
      
      await Medico.findPaginated(1, 10, filter);

      // Verifica se gerou "(nome = $1 OR crm = $2)"
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE (nome = $1 OR crm = $2)'),
        expect.arrayContaining(['A', 'B'])
      );
    });

    it('deve ignorar campos não permitidos', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      db.query.mockResolvedValueOnce({ rows: [] });

      const filter = "senha eq '123'"; // Campo proibido

      await Medico.findPaginated(1, 10, filter);

      // Query não deve ter WHERE
      const sql = db.query.mock.calls[1][0];
      expect(sql).not.toContain('WHERE');
    });
  });

  // ---------------------------------------------------------
  // Update (Query Dinâmica)
  // ---------------------------------------------------------
  describe('update', () => {
    it('deve atualizar apenas campos fornecidos', async () => {
      const dados = { telefone: '999' }; // Só telefone
      db.query.mockResolvedValue({ rows: [{ id: 1, telefone: '999' }] });

      await Medico.update(1, dados);

      // Verifica se a query só tem o campo telefone e lastModifiedDate
      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE medico SET telefone = \$1, "lastModifiedDate" = NOW\(\) WHERE/),
        ['999', 1]
      );
    });

    it('deve hashar senha se fornecida no update', async () => {
      const dados = { senha: 'nova' };
      bcrypt.hash.mockResolvedValue('novaHash');
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await Medico.update(1, dados);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('senha = $1'),
        expect.any(Array)
      );
    });
  });

  // ---------------------------------------------------------
  // Find Pacientes Atendidos
  // ---------------------------------------------------------
  describe('findPacientesAtendidos', () => {
    it('deve construir query com JOIN em MEDICO_PACIENTE', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '5' }] });
      db.query.mockResolvedValueOnce({ rows: [] });

      await Medico.findPacientesAtendidos('med-1');

      const sql = db.query.mock.calls[1][0]; // Query de dados
      expect(sql).toContain('JOIN MEDICO_PACIENTE mp');
      expect(sql).toContain('LEFT JOIN consulta c');
    });

    it('deve aplicar filtro específico de paciente (p.nome)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      db.query.mockResolvedValueOnce({ rows: [] });

      const filter = "nome co 'Joao'";
      await Medico.findPacientesAtendidos('med-1', 1, 10, null, null, filter);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('p.nome ILIKE'),
        expect.arrayContaining(['%Joao%'])
      );
    });
  });

  // ---------------------------------------------------------
  // Is Horario Disponivel
  // ---------------------------------------------------------
  describe('isHorarioDisponivel', () => {
    it('deve retornar true se count > 0', async () => {
      // Mock do COUNT retornando 1 (significa que há horário de trabalho cobrindo)
      db.query.mockResolvedValue({ rows: [{ count: '1' }] });

      const disponivel = await Medico.isHorarioDisponivel(1, '2025-10-20', '10:00', 30);

      expect(disponivel).toBe(true);
    });

    it('deve retornar false se count == 0', async () => {
      db.query.mockResolvedValue({ rows: [{ count: '0' }] });

      const disponivel = await Medico.isHorarioDisponivel(1, '2025-10-20', '10:00', 30);

      expect(disponivel).toBe(false);
    });
  });

  // ---------------------------------------------------------
  // Find Paginated (Filtros Avançados e Ordenação)
  // ---------------------------------------------------------
  describe('findPaginated (Advanced)', () => {
    it('deve aplicar filtro isnotnull', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '5' }] });
      db.query.mockResolvedValueOnce({ rows: [] });

      await Medico.findPaginated(1, 10, "crm isnotnull");

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('crm IS NOT NULL'),
        expect.any(Array)
      );
    });

    it('deve aplicar filtro de data exata (createdDate eq)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      db.query.mockResolvedValueOnce({ rows: [] });

      await Medico.findPaginated(1, 10, "createdDate eq '2023-01-01'");

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DATE("createdDate") = $1'),
        expect.arrayContaining(['2023-01-01'])
      );
    });

    it('deve aplicar ordenação personalizada', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      db.query.mockResolvedValueOnce({ rows: [] });

      await Medico.findPaginated(1, 10, '', { sort: 'crm', order: 'DESC' });

      const sql = db.query.mock.calls[1][0];
      expect(sql).toContain('ORDER BY crm DESC');
    });

    it('deve selecionar colunas específicas para perfil paciente', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      db.query.mockResolvedValueOnce({ rows: [] });

      await Medico.findPaginated(1, 10, '', { perfil: 'paciente' });

      const sql = db.query.mock.calls[1][0];
      // Deve conter apenas campos públicos, não 'status' ou datas administrativas
      expect(sql).toContain('id, nome, crm, email, telefone, especialidade');
      expect(sql).not.toContain('inativacaoSolicitadaEm');
    });
  });

  // ---------------------------------------------------------
  // Inativação (Solicitar e Reverter)
  // ---------------------------------------------------------
  describe('Fluxos de Inativação', () => {
    it('solicitarInativacao: deve atualizar status e data', async () => {
      db.query.mockResolvedValue({ 
        rows: [{ 
          id: 1, status: 'Aguardando', 
          inativacaoSolicitadaEm: new Date(),
          createdDate: new Date(), lastModifiedDate: new Date() 
        }] 
      });

      await Medico.solicitarInativacao(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE medico SET status = $1'),
        ['Aguardando Inativação', 1, 'Ativo']
      );
    });

    it('reverterInativacao: deve limpar data e voltar status', async () => {
      db.query.mockResolvedValue({ 
        rows: [{ 
          id: 1, status: 'Ativo', 
          createdDate: new Date(), lastModifiedDate: new Date() 
        }] 
      });

      await Medico.reverterInativacao(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('"inativacaoSolicitadaEm" = NULL'),
        ['Ativo', 1, 'Aguardando Inativação']
      );
    });
  });

  // ---------------------------------------------------------
  // Contagens e Links
  // ---------------------------------------------------------
  describe('Helpers de Contagem e Vínculo', () => {
    it('countAtivos: deve retornar número de ativos', async () => {
      db.query.mockResolvedValue({ rows: [{ count: '42' }] });
      const total = await Medico.countAtivos();
      expect(total).toBe(42);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1'),
        ['Ativo']
      );
    });

    it('countSolicitacoesInativacaoRecentes: deve filtrar por data', async () => {
      db.query.mockResolvedValue({ rows: [{ count: '5' }] });
      const dataInicio = new Date();
      
      const total = await Medico.countSolicitacoesInativacaoRecentes(dataInicio);
      
      expect(total).toBe(5);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE "inativacaoSolicitadaEm" >= $1'),
        [dataInicio]
      );
    });

    it('createLink: deve inserir na tabela de junção', async () => {
      db.query.mockResolvedValue({}); // Retorno irrelevante (void)
      
      await Medico.createLink(1, 100);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO MEDICO_PACIENTE'),
        [1, 100]
      );
    });
  });

  // ---------------------------------------------------------
  // FindById (Tratamento de Null)
  // ---------------------------------------------------------
  describe('findById', () => {
    it('deve retornar null se médico não for encontrado', async () => {
      db.query.mockResolvedValue({ rows: [] });
      const resultado = await Medico.findById(999);
      expect(resultado).toBeNull();
    });

    it('deve formatar dados se encontrado', async () => {
      db.query.mockResolvedValue({ 
        rows: [{ 
          id: 1, senha: 'hash', 
          createdDate: new Date(), lastModifiedDate: new Date() 
        }] 
      });
      const resultado = await Medico.findById(1);
      
      expect(resultado).not.toHaveProperty('senha');
      expect(formatarData).toHaveBeenCalled();
    });
  });
});