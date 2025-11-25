const Paciente = require('../../src/models/pacienteModel');
const db = require('../../src/config/database');
const bcrypt = require('bcryptjs');
const { formatarData, formatarApenasData } = require('../../src/utils/dateUtils');

jest.mock('../../src/config/database');
jest.mock('bcryptjs');
jest.mock('../../src/utils/dateUtils');

describe('PacienteModel Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    formatarApenasData.mockImplementation(d => '2000-01-01');
    formatarData.mockImplementation(d => '2025-01-01');
  });

  // ---------------------------------------------------------
  // Create
  // ---------------------------------------------------------
  describe('create', () => {
    it('deve criar paciente e formatar datas de retorno', async () => {
      const dados = { nome: 'Pac', senha: '123' };
      bcrypt.hash.mockResolvedValue('hash');
      
      db.query.mockResolvedValue({ 
        rows: [{ ...dados, senha: 'hash', dataNascimento: new Date(), createdDate: new Date() }] 
      });

      const result = await Paciente.create(dados);

      expect(formatarApenasData).toHaveBeenCalled();
      expect(result).not.toHaveProperty('senha');
    });
  });

  // ---------------------------------------------------------
  // Find Paginated (Regex de Filtros)
  // ---------------------------------------------------------
  describe('findPaginated', () => {
    it('deve aplicar filtro por CEP (campo entre aspas)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '10' }] });
      db.query.mockResolvedValueOnce({ rows: [] });

      // No controller/model, cepCodigo é mapeado para "cepCodigo" (com aspas)
      const filter = "cepCodigo eq '89200'";
      
      await Paciente.findPaginated(1, 10, filter);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE "cepCodigo" = $1'),
        expect.arrayContaining(['89200'])
      );
    });
    
    it('deve aplicar replace correto nos parâmetros de paginação', async () => {
       db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
       db.query.mockResolvedValueOnce({ rows: [] });

       const filter = "nome eq 'Teste'";
       await Paciente.findPaginated(1, 10, filter);
       
       const queryExecutada = db.query.mock.calls[1][0];
       
       expect(queryExecutada).not.toContain('LIMIT $1'); 
       expect(queryExecutada).toContain('LIMIT $2');
    });
  });

  // ---------------------------------------------------------
  // Update (Query Dinâmica com Aspas)
  // ---------------------------------------------------------
  describe('update', () => {
    it('deve usar aspas duplas para campos camelCase (dataNascimento)', async () => {
      const dados = { dataNascimento: '2000-01-01' };
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await Paciente.update(1, dados);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('"dataNascimento" = $1'), // Verifica aspas
        expect.any(Array)
      );
    });

    it('deve retornar próprio objeto se não houver campos para update', async () => {
        // Mock do findById pois ele será chamado
        db.query.mockResolvedValue({ rows: [{ id: 1, nome: 'Antigo' }] });
        
        const result = await Paciente.update(1, {}); // Objeto vazio

        // Deve chamar findById (SELECT) e não UPDATE
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), expect.any(Array));
        expect(result.nome).toBe('Antigo');
    });
  });

  // ---------------------------------------------------------
  // Find Medicos Consultados
  // ---------------------------------------------------------
  describe('findMedicosConsultados', () => {
      it('deve executar query com DISTINCT e JOIN', async () => {
          db.query.mockResolvedValue({ rows: [] });
          
          await Paciente.findMedicosConsultados(1);

          const sql = db.query.mock.calls[0][0];
          expect(sql).toContain('DISTINCT m.id');
          expect(sql).toContain('JOIN consulta c');
      });
  });
});
