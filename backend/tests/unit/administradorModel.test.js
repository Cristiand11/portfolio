const Administrador = require('../../src/models/administradorModel');
const db = require('../../src/config/database');
const bcrypt = require('bcryptjs');
const { formatarData } = require('../../src/utils/dateUtils');

// Mock das dependências externas
jest.mock('../../src/config/database');
jest.mock('bcryptjs');
jest.mock('../../src/utils/dateUtils');

describe('AdministradorModel Unit Tests', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock padrão para formatarData retornar uma string fixa
        formatarData.mockImplementation((date) => '2025-01-01');
    });

    // ---------------------------------------------------------
    // CREATE
    // ---------------------------------------------------------
    describe('create', () => {
        it('deve criar um administrador criptografando a senha', async () => {
            const adminData = { nome: 'Admin', email: 'admin@teste.com', senha: '123' };
            
            // Mocks do Bcrypt
            bcrypt.genSalt.mockResolvedValue('salt123');
            bcrypt.hash.mockResolvedValue('hash123');

            // Mock do DB
            const mockDbResult = {
                rows: [{ 
                    id: 1, 
                    nome: 'Admin', 
                    email: 'admin@teste.com', 
                    senha: 'hash123', // O DB retorna a senha, mas o model deve remover
                    createdDate: new Date(), 
                    lastModifiedDate: new Date() 
                }]
            };
            db.query.mockResolvedValue(mockDbResult);

            const result = await Administrador.create(adminData);

            // Verificações
            expect(bcrypt.hash).toHaveBeenCalledWith('123', 'salt123'); // Garante segurança (RNF01)
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO administrador'),
                ['Admin', 'admin@teste.com', 'hash123']
            );
            expect(result).not.toHaveProperty('senha'); // Garante que senha não vaza
            expect(formatarData).toHaveBeenCalledTimes(2); // Formatou created e lastModified
        });
    });

    // ---------------------------------------------------------
    // READ (FIND PAGINATED) - A parte mais complexa
    // ---------------------------------------------------------
    describe('findPaginated', () => {
        it('deve listar com paginação padrão e sem filtros', async () => {
            // O findPaginated faz DUAS chamadas ao banco: COUNT e SELECT
            
            // Mock 1: Count
            db.query.mockResolvedValueOnce({ rows: [{ count: '20' }] });
            
            // Mock 2: Select Data
            db.query.mockResolvedValueOnce({ 
                rows: [
                    { id: 1, nome: 'A', createdDate: new Date(), lastModifiedDate: new Date() },
                    { id: 2, nome: 'B', createdDate: new Date(), lastModifiedDate: new Date() }
                ] 
            });

            const result = await Administrador.findPaginated(1, 10, '');

            expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT COUNT(*)'), []);
            expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [10, 0]);
            expect(result.totalElements).toBe(20);
            expect(result.totalPages).toBe(2); // 20 itens / 10 por pág = 2 págs
        });

        it('deve aplicar filtro de igualdade (eq) corretamente', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
            db.query.mockResolvedValueOnce({ rows: [{ id: 1, nome: 'Admin' }] });

            // Formato que seu código espera: "campo eq 'valor'"
            const filterString = "nome eq 'Admin'";

            await Administrador.findPaginated(1, 10, filterString);

            // Verifica se a query contém o WHERE correto
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE nome = $1'),
                expect.arrayContaining(['Admin'])
            );
        });

        it('deve aplicar filtro de contem (co - ILIKE) corretamente', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ count: '5' }] });
            db.query.mockResolvedValueOnce({ rows: [] });

            const filterString = "email co 'teste'";

            await Administrador.findPaginated(1, 10, filterString);

            // Verifica se usou ILIKE e colocou os % no valor
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE email ILIKE $1'),
                expect.arrayContaining(['%teste%'])
            );
        });

        it('deve ignorar campos de filtro não permitidos (Segurança)', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
            db.query.mockResolvedValueOnce({ rows: [] });

            // 'senha' não está no allowedFilterFields
            const filterString = "senha eq '123456'";

            await Administrador.findPaginated(1, 10, filterString);

            // Query NÃO deve ter WHERE
            const selectCall = db.query.mock.calls[1]; // Segunda chamada (o SELECT)
            const querySql = selectCall[0];
            
            expect(querySql).not.toContain('WHERE');
        });

        it('deve combinar múltiplos filtros com AND', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
            db.query.mockResolvedValueOnce({ rows: [] });

            const filterString = "nome eq 'Admin' AND email co 'com'";

            await Administrador.findPaginated(1, 10, filterString);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE nome = $1 AND email ILIKE $2'),
                ['Admin', '%com%'] // Verifica a ordem e formatação dos valores
            );
        });
    });

    // ---------------------------------------------------------
    // UPDATE
    // ---------------------------------------------------------
    describe('update', () => {
        it('deve atualizar dados e senha', async () => {
            const adminData = { nome: 'Novo', email: 'novo@email.com', senha: 'newpass' };
            bcrypt.genSalt.mockResolvedValue('saltNew');
            bcrypt.hash.mockResolvedValue('hashNew');

            db.query.mockResolvedValue({
                rows: [{ 
                    id: 1, ...adminData, senha: 'hashNew',
                    createdDate: new Date(), lastModifiedDate: new Date() 
                }]
            });

            const result = await Administrador.update(1, adminData);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE administrador SET'),
                ['Novo', 'novo@email.com', 'hashNew', 1]
            );
            expect(result).not.toHaveProperty('senha');
        });
    });

    // ---------------------------------------------------------
    // DELETE
    // ---------------------------------------------------------
    describe('delete', () => {
        it('deve retornar o rowCount ao deletar', async () => {
            db.query.mockResolvedValue({ rowCount: 1 });

            const result = await Administrador.delete(1);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM administrador'),
                [1]
            );
            expect(result).toBe(1);
        });
    });
});