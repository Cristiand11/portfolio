const Auxiliar = require('../../src/models/auxiliarModel');
const db = require('../../src/config/database');
const bcrypt = require('bcryptjs');
const { formatarData, formatarApenasData } = require('../../src/utils/dateUtils');

// Mocks
jest.mock('../../src/config/database');
jest.mock('bcryptjs');
jest.mock('../../src/utils/dateUtils');

describe('AuxiliarModel Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    formatarData.mockImplementation((d) => 'Formatted Date');
    formatarApenasData.mockImplementation((d) => 'Formatted Only Date');
  });

  // ---------------------------------------------------------
  // Create
  // ---------------------------------------------------------
  describe('create', () => {
    it('deve criar auxiliar formatando datas', async () => {
      const dados = { nome: 'Aux', senha: '123' };
      bcrypt.hash.mockResolvedValue('hash');

      db.query.mockResolvedValue({
        rows: [{ ...dados, senha: 'hash', dataNascimento: new Date(), createdDate: new Date() }],
      });

      const result = await Auxiliar.create(dados);

      expect(formatarApenasData).toHaveBeenCalled(); // Data Nascimento
      expect(formatarData).toHaveBeenCalled(); // CreatedAt
      expect(result).not.toHaveProperty('senha');
    });
  });

  // ---------------------------------------------------------
  // Find Paginated (Filtros)
  // ---------------------------------------------------------
  describe('findPaginated', () => {
    it('deve aplicar filtro por idMedico', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '10' }] }); // Count
      db.query.mockResolvedValueOnce({ rows: [] }); // Data

      // Filtro específico deste model
      const filter = "idMedico eq '123'";

      await Auxiliar.findPaginated(1, 10, filter);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE "idMedico" = $1'),
        expect.arrayContaining(['123'])
      );
    });

    it('deve ordenar corretamente (feature especifica do auxiliarModel)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      db.query.mockResolvedValueOnce({ rows: [] });

      await Auxiliar.findPaginated(1, 10, '', { sort: 'email', order: 'DESC' });

      // Verifica se a query contém ORDER BY email DESC
      const callArgs = db.query.mock.calls[1]; // Segunda chamada (SELECT dados)
      const sql = callArgs[0];

      expect(sql).toContain('ORDER BY email DESC');
    });
  });

  // ---------------------------------------------------------
  // FindById
  // ---------------------------------------------------------
  describe('findById', () => {
    it('deve retornar null se não encontrar', async () => {
      db.query.mockResolvedValue({ rows: [] });
      const res = await Auxiliar.findById(1);
      expect(res).toBeNull();
    });

    it('deve remover senha ao encontrar', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, senha: 'hash' }] });
      const res = await Auxiliar.findById(1);
      expect(res).not.toHaveProperty('senha');
    });
  });

  // ---------------------------------------------------------
  // Delete By IDs (Batch)
  // ---------------------------------------------------------
  describe('deleteByIds', () => {
    it('deve executar query com ANY', async () => {
      db.query.mockResolvedValue({ rowCount: 5 });
      const ids = ['1', '2', '3'];

      const count = await Auxiliar.deleteByIds(ids);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM auxiliar WHERE id = ANY($1::uuid[])'),
        [ids]
      );
      expect(count).toBe(5);
    });
  });
});
