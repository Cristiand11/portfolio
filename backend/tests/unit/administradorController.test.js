const administradorController = require('../../src/controllers/administradorController');
const Administrador = require('../../src/models/administradorModel');
const Medico = require('../../src/models/medicoModel');

// --- SOLUÇÃO DEFINITIVA: Mocks Manuais (Sem biblioteca externa) ---
const mockRequest = () => {
  return {
    body: {},
    query: {},
    params: {},
    user: {}, // Caso precise de autenticação futura
  };
};

const mockResponse = () => {
  const res = {};
  // O mockReturnValue(res) permite o encadeamento: res.status(200).json(...)
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Mock dos Models
jest.mock('../../src/models/administradorModel');
jest.mock('../../src/models/medicoModel');

describe('AdministradorController Unit Tests', () => {
    let req;
    let res;

    beforeEach(() => {
        req = mockRequest();
        res = mockResponse();
        jest.clearAllMocks();
    });

    // ---------------------------------------------------------
    // Testes: createAdministrador
    // ---------------------------------------------------------
    describe('createAdministrador', () => {
        it('deve criar um administrador com sucesso (Status 201)', async () => {
            const mockAdmin = { nome: 'Admin Teste', email: 'admin@teste.com' };
            req.body = mockAdmin;
            
            Administrador.create.mockResolvedValue({ id: 1, ...mockAdmin });

            await administradorController.createAdministrador(req, res);

            expect(Administrador.create).toHaveBeenCalledWith(mockAdmin);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Administrador cadastrado com sucesso!',
                data: expect.objectContaining({ id: 1 })
            }));
        });

        it('deve retornar erro 500 se o model falhar', async () => {
            req.body = {};
            Administrador.create.mockRejectedValue(new Error('Erro DB'));

            await administradorController.createAdministrador(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Erro ao cadastrar administrador'
            }));
        });
    });

    // ---------------------------------------------------------
    // Testes: getAllAdministradores
    // ---------------------------------------------------------
    describe('getAllAdministradores', () => {
        it('deve listar administradores com paginação padrão', async () => {
            Administrador.findPaginated.mockResolvedValue({ data: [], total: 0 });

            await administradorController.getAllAdministradores(req, res);

            expect(Administrador.findPaginated).toHaveBeenCalledWith(1, 10, '');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('deve aplicar filtros e paginação corretamente', async () => {
            req.query = { page: '2', size: '20', filter: ['nome LIKE %teste%', 'ativo=true'] };
            
            Administrador.findPaginated.mockResolvedValue({ data: [], total: 0 });

            await administradorController.getAllAdministradores(req, res);

            expect(Administrador.findPaginated).toHaveBeenCalledWith(2, 20, 'nome LIKE %teste% AND ativo=true');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('deve tratar filtro string única corretamente', async () => {
             req.query = { filter: 'nome=teste' };
             Administrador.findPaginated.mockResolvedValue({ data: [], total: 0 });
             
             await administradorController.getAllAdministradores(req, res);
             expect(Administrador.findPaginated).toHaveBeenCalledWith(1, 10, 'nome=teste');
        });

        it('deve retornar erro 500 na listagem', async () => {
            Administrador.findPaginated.mockRejectedValue(new Error('Erro DB'));
            await administradorController.getAllAdministradores(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ---------------------------------------------------------
    // Testes: updateAdministrador
    // ---------------------------------------------------------
    describe('updateAdministrador', () => {
        it('deve atualizar com sucesso (Status 200)', async () => {
            req.params = { id: '1' };
            req.body = { nome: 'Novo Nome' };
            
            Administrador.update.mockResolvedValue({ id: 1, nome: 'Novo Nome' });

            await administradorController.updateAdministrador(req, res);

            expect(Administrador.update).toHaveBeenCalledWith('1', req.body);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('deve retornar 404 se administrador não for encontrado', async () => {
            req.params = { id: '999' };
            Administrador.update.mockResolvedValue(null);

            await administradorController.updateAdministrador(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Administrador não encontrado' });
        });

        it('deve retornar erro 500 na atualização', async () => {
            req.params = { id: '1' };
            Administrador.update.mockRejectedValue(new Error('Erro DB'));
            await administradorController.updateAdministrador(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ---------------------------------------------------------
    // Testes: deleteAdministrador
    // ---------------------------------------------------------
    describe('deleteAdministrador', () => {
        it('deve deletar com sucesso (Status 200)', async () => {
            req.params = { id: '1' };
            Administrador.delete.mockResolvedValue(1);

            await administradorController.deleteAdministrador(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('deve retornar 404 se não deletar nenhum registro', async () => {
            req.params = { id: '999' };
            Administrador.delete.mockResolvedValue(0);

            await administradorController.deleteAdministrador(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('deve retornar erro 500 ao deletar', async () => {
            req.params = { id: '1' };
            Administrador.delete.mockRejectedValue(new Error('Erro DB'));
            await administradorController.deleteAdministrador(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ---------------------------------------------------------
    // Testes: getDashboardStats
    // ---------------------------------------------------------
    describe('getDashboardStats', () => {
        beforeAll(() => {
            jest.useFakeTimers();
            // Define o "agora" como Sexta-feira, 20 de Outubro de 2023 ao meio-dia
            jest.setSystemTime(new Date('2023-10-20T12:00:00Z'));
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        it('deve retornar estatísticas corretamente ignorando fins de semana', async () => {
            Medico.countAtivos.mockResolvedValue(50);
            Medico.countSolicitacoesInativacaoRecentes.mockResolvedValue(5);

            await administradorController.getDashboardStats(req, res);

            expect(Medico.countAtivos).toHaveBeenCalled();
            
            // Validação da data calculada (5 dias úteis antes de 20/10/23 deve ser 13/10/23)
            const chamadaArgumento = Medico.countSolicitacoesInativacaoRecentes.mock.calls[0][0];
            // Verifica apenas a data (YYYY-MM-DD) para evitar problemas de timezone
            expect(chamadaArgumento.toISOString().split('T')[0]).toBe('2023-10-13');

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                totalMedicosAtivos: 50,
                solicitacoesRecentes: 5
            });
        });

        it('deve retornar erro 500 se houver falha ao buscar estatísticas', async () => {
            Medico.countAtivos.mockRejectedValue(new Error('Erro Count'));
            await administradorController.getDashboardStats(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});