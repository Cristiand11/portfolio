import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { login as loginService } from '../services/authService';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { MemoryRouter, useNavigate } from 'react-router-dom';

// --- MOCKS ---
vi.mock('../services/authService');
vi.mock('jwt-decode');

// Mock do useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// --- COMPONENTE DE TESTE ---
const TestComponent = () => {
  const { user, token, login, logout, selectProfile, selectedProfile } = useAuth();

  const handleLogin = () => {
    // CORREÇÃO 1: Adicionamos .catch() aqui.
    // Isso impede que o erro "Nenhum perfil selecionado" exploda como Unhandled Rejection
    // durante os testes, permitindo que a gente faça as asserções corretamente.
    login('email@test.com', '123', selectedProfile).catch(() => {
      // Erro capturado silenciosamente para não quebrar o teste runner
    });
  };

  return (
    <div>
      <p data-testid="user">{user ? user.nome : 'No User'}</p>
      <p data-testid="token">{token || 'No Token'}</p>
      <p data-testid="profile">{selectedProfile || 'No Profile'}</p>
      
      <button onClick={() => selectProfile('medico')}>Selecionar Medico</button>
      <button onClick={handleLogin}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete api.defaults.headers.common['Authorization'];
  });

  it('deve iniciar sem usuário e sem token se localStorage estiver vazio', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('No User');
    expect(screen.getByTestId('token')).toHaveTextContent('No Token');
  });

  it('deve recuperar usuário do localStorage se houver token válido', () => {
    const fakeToken = 'token-valido';
    const fakeUser = { nome: 'Dr. House', perfil: 'medico' };
    
    localStorage.setItem('authToken', fakeToken);
    jwtDecode.mockReturnValue(fakeUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('Dr. House');
    expect(screen.getByTestId('token')).toHaveTextContent('token-valido');
    expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${fakeToken}`);
  });

  it('deve fazer logout automático se o token do localStorage for inválido', () => {
    localStorage.setItem('authToken', 'token-invalido');
    jwtDecode.mockImplementation(() => { throw new Error('Invalid token'); });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('No User');
    expect(screen.getByTestId('token')).toHaveTextContent('No Token');
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('selectProfile deve atualizar o estado e navegar para login', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Selecionar Medico'));

    expect(screen.getByTestId('profile')).toHaveTextContent('medico');
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('login deve falhar se nenhum perfil for selecionado', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Clica em login SEM selecionar perfil antes
    // Graças ao .catch() no TestComponent, isso não vai quebrar o teste
    fireEvent.click(screen.getByText('Login'));

    expect(loginService).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('login deve autenticar, salvar token e redirecionar corretamente', async () => {
    const fakeToken = 'novo-token-jwt';
    const fakeUser = { nome: 'Paciente Teste', perfil: 'paciente' };
    
    loginService.mockResolvedValue({ token: fakeToken });
    jwtDecode.mockReturnValue(fakeUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // 1. Seleciona Perfil
    fireEvent.click(screen.getByText('Selecionar Medico')); 
    
    // CORREÇÃO 2: Aguarda o estado atualizar antes de tentar logar
    // Isso garante que selectedProfile não seja null quando clicarmos em Login
    await waitFor(() => {
        expect(screen.getByTestId('profile')).toHaveTextContent('medico');
    });

    // 2. Faz Login
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(loginService).toHaveBeenCalledWith('email@test.com', '123', 'medico');
      
      expect(screen.getByTestId('token')).toHaveTextContent(fakeToken);
      expect(localStorage.getItem('authToken')).toBe(fakeToken);
      expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${fakeToken}`);
      expect(mockNavigate).toHaveBeenCalledWith('/paciente/dashboard');
    });
  });

  it('logout deve limpar tudo e redirecionar', async () => {
    const fakeToken = 'token';
    localStorage.setItem('authToken', fakeToken);
    jwtDecode.mockReturnValue({ nome: 'User' });
    api.defaults.headers.common['Authorization'] = `Bearer ${fakeToken}`;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('token')).toHaveTextContent('token');

    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
      expect(screen.getByTestId('token')).toHaveTextContent('No Token');
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
      expect(mockNavigate).toHaveBeenCalledWith('/selecionar-perfil');
    });
  });
});