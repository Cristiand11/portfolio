import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getAllMedicos, 
  getDashboardStats, 
  createMedico, 
  updateMedico, 
  solicitarInativacao, 
  reverterInativacao 
} from './adminService';
import api from './api';

// --- MOCK DO API.JS ---
vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('AdminService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------
  // GET ALL MEDICOS
  // ---------------------------------------------------------
  it('getAllMedicos deve chamar api.get com os parâmetros corretos', async () => {
    const mockResponse = { data: { contents: [] } };
    api.get.mockResolvedValue(mockResponse);

    const params = { page: 1, size: 10 };
    const result = await getAllMedicos(params);

    expect(api.get).toHaveBeenCalledWith('/medicos', { params });
    expect(result).toEqual(mockResponse);
  });

  // ---------------------------------------------------------
  // GET DASHBOARD STATS
  // ---------------------------------------------------------
  it('getDashboardStats deve chamar o endpoint correto', async () => {
    const mockResponse = { data: { total: 100 } };
    api.get.mockResolvedValue(mockResponse);

    const result = await getDashboardStats();

    expect(api.get).toHaveBeenCalledWith('/administradores/dashboard-stats');
    expect(result).toEqual(mockResponse);
  });

  // ---------------------------------------------------------
  // CREATE MEDICO
  // ---------------------------------------------------------
  it('createMedico deve enviar dados via POST', async () => {
    const mockResponse = { data: { id: 1 } };
    api.post.mockResolvedValue(mockResponse);

    const medicoData = { nome: 'Dr. Teste', crm: '123' };
    const result = await createMedico(medicoData);

    expect(api.post).toHaveBeenCalledWith('/medicos', medicoData);
    expect(result).toEqual(mockResponse);
  });

  // ---------------------------------------------------------
  // UPDATE MEDICO
  // ---------------------------------------------------------
  it('updateMedico deve enviar dados via PUT para o ID correto', async () => {
    const mockResponse = { data: { success: true } };
    api.put.mockResolvedValue(mockResponse);

    const id = 123;
    const medicoData = { nome: 'Dr. Novo Nome' };
    const result = await updateMedico(id, medicoData);

    expect(api.put).toHaveBeenCalledWith(`/medicos/${id}`, medicoData);
    expect(result).toEqual(mockResponse);
  });

  // ---------------------------------------------------------
  // SOLICITAR INATIVAÇÃO
  // ---------------------------------------------------------
  it('solicitarInativacao deve chamar o endpoint de inativação', async () => {
    const mockResponse = { data: { status: 'Aguardando' } };
    api.post.mockResolvedValue(mockResponse);

    const id = 456;
    const result = await solicitarInativacao(id);

    expect(api.post).toHaveBeenCalledWith(`/medicos/${id}/solicitar-inativacao`);
    expect(result).toEqual(mockResponse);
  });

  // ---------------------------------------------------------
  // REVERTER INATIVAÇÃO
  // ---------------------------------------------------------
  it('reverterInativacao deve chamar o endpoint de reversão', async () => {
    const mockResponse = { data: { status: 'Ativo' } };
    api.post.mockResolvedValue(mockResponse);

    const id = 456;
    const result = await reverterInativacao(id);

    expect(api.post).toHaveBeenCalledWith(`/medicos/${id}/reverter-inativacao`);
    expect(result).toEqual(mockResponse);
  });
});