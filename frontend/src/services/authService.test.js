import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, requestPasswordReset, resetPassword } from './authService';
import api from './api';

// --- MOCK DO API.JS (AXIOS) ---
// Substituímos a instância do axios por um objeto com funções espiãs (vi.fn)
vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------
  describe('login', () => {
    it('deve chamar api.post com os parâmetros corretos e retornar dados', async () => {
      const mockResponse = { data: { token: 'fake-token', user: 'Cristian' } };
      // Configura o mock para retornar sucesso
      api.post.mockResolvedValue(mockResponse);

      const result = await login('email@teste.com', '123456', 'medico');

      // Verifica se chamou a URL certa com o payload certo
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'email@teste.com',
        senha: '123456',
        perfil: 'medico',
      });

      // Verifica se retornou apenas o response.data (conforme seu código)
      expect(result).toEqual(mockResponse.data);
    });

    it('deve repassar o erro original caso a requisição falhe', async () => {
      // No seu código, a função login NÃO tem try/catch, então ela deve explodir o erro original
      const mockError = new Error('Falha na rede');
      api.post.mockRejectedValue(mockError);

      await expect(login('email@teste.com', '123', 'medico'))
        .rejects
        .toThrow('Falha na rede');
    });
  });

  // ---------------------------------------------------------
  // REQUEST PASSWORD RESET
  // ---------------------------------------------------------
  describe('requestPasswordReset', () => {
    it('deve chamar api.post e retornar dados em caso de sucesso', async () => {
      const mockResponse = { data: { message: 'Email enviado' } };
      api.post.mockResolvedValue(mockResponse);

      const result = await requestPasswordReset('email@teste.com', 'medico');

      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'email@teste.com',
        perfil: 'medico',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('deve tratar erro da API (400/404/500) e lançar o erro formatado', async () => {
      // Simula um erro que vem do backend (com response.data)
      const erroBackend = {
        response: {
          data: { message: 'Usuário não encontrado' }
        }
      };
      api.post.mockRejectedValue(erroBackend);

      // Seu código captura o erro e lança error.response.data
      try {
        await requestPasswordReset('email@teste.com', 'medico');
      } catch (error) {
        expect(error).toEqual({ message: 'Usuário não encontrado' });
      }
    });

    it('deve tratar erro de conexão (sem response) e lançar erro genérico', async () => {
      // Simula erro de rede (sem response)
      const erroRede = new Error('Network Error');
      api.post.mockRejectedValue(erroRede);

      await expect(requestPasswordReset('email@teste.com', 'medico'))
        .rejects
        .toThrow('Não foi possível conectar ao servidor para solicitar a redefinição de senha.');
    });
  });

  // ---------------------------------------------------------
  // RESET PASSWORD
  // ---------------------------------------------------------
  describe('resetPassword', () => {
    it('deve chamar api.post com token e nova senha', async () => {
      const mockResponse = { data: { message: 'Senha alterada' } };
      api.post.mockResolvedValue(mockResponse);

      const result = await resetPassword('token-valido', 'novaSenha123');

      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'token-valido',
        novaSenha: 'novaSenha123',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('deve tratar erro da API e lançar o erro formatado', async () => {
      const erroBackend = {
        response: {
          data: { message: 'Token inválido' }
        }
      };
      api.post.mockRejectedValue(erroBackend);

      try {
        await resetPassword('token-invalido', '123');
      } catch (error) {
        expect(error).toEqual({ message: 'Token inválido' });
      }
    });

    it('deve tratar erro de conexão e lançar erro genérico', async () => {
      const erroRede = new Error('Network Error');
      api.post.mockRejectedValue(erroRede);

      await expect(resetPassword('token', '123'))
        .rejects
        .toThrow('Não foi possível conectar ao servidor para redefinir a senha.');
    });
  });
});