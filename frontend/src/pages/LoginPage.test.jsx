import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './LoginPage';
import { useAuth } from '../contexts/AuthContext';
import { requestPasswordReset } from '../services/authService';
import toast from 'react-hot-toast';

// --- MOCKS ---
vi.mock('../contexts/AuthContext');
vi.mock('../services/authService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do React Router Dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
  };
});

describe('Página LoginPage', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Configuração Padrão: Perfil selecionado
    useAuth.mockReturnValue({
      login: mockLogin,
      selectedProfile: 'medico',
    });
  });

  it('deve redirecionar para /selecionar-perfil se nenhum perfil estiver selecionado', () => {
    useAuth.mockReturnValue({ selectedProfile: null });
    render(<LoginPage />);
    expect(mockNavigate).toHaveBeenCalledWith('/selecionar-perfil');
  });

  it('deve renderizar o formulário de login corretamente', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /Acessar AgendaMed/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('deve permitir digitar e realizar login com sucesso', async () => {
    mockLogin.mockResolvedValue({}); // Login bem sucedido

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'teste@email.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: '123456' } });

    const submitButton = screen.getByRole('button', { name: /Entrar/i });
    fireEvent.click(submitButton);

    expect(screen.getByText('Entrando...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('teste@email.com', '123456', 'medico');
    });
  });

  it('deve exibir erro se o login falhar', async () => {
    const erroApi = { response: { data: { message: 'Credenciais inválidas' } } };
    mockLogin.mockRejectedValue(erroApi);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@a.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: '123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
    });
  });

  it('deve alternar visibilidade da senha', () => {
    render(<LoginPage />);
    const senhaInput = screen.getByLabelText(/Senha/i);
    const toggleBtn = screen.getByRole('button', { name: /Mostrar/i });

    // Default: password
    expect(senhaInput).toHaveAttribute('type', 'password');

    // Click -> text
    fireEvent.click(toggleBtn);
    expect(senhaInput).toHaveAttribute('type', 'text');
    expect(toggleBtn).toHaveTextContent('Ocultar');
  });

  it('deve navegar para /selecionar-perfil ao clicar em "Trocar Perfil"', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /Trocar Perfil/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/selecionar-perfil');
  });

  // --- TESTES DE "ESQUECI A SENHA" ---

  it('deve alternar para o formulário de recuperação de senha', () => {
    render(<LoginPage />);
    
    // Clica no link "Esqueci a senha"
    fireEvent.click(screen.getByText(/Esqueci a senha/i));

    // Verifica mudança na UI
    expect(screen.getByRole('heading', { name: /Recuperar Senha/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar Link/i })).toBeInTheDocument();
    // Botão de login deve ter sumido
    expect(screen.queryByRole('button', { name: /Entrar/i })).not.toBeInTheDocument();
  });

  it('deve enviar solicitação de recuperação de senha com sucesso', async () => {
    requestPasswordReset.mockResolvedValue({});

    render(<LoginPage />);
    
    // Vai para tela de recuperação
    fireEvent.click(screen.getByText(/Esqueci a senha/i));

    // Preenche email
    // Nota: O label é "Email", mas existem dois inputs de email no código (um do login, um do reset).
    // Como o de login foi desmontado (renderização condicional), só deve haver um.
    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'reset@email.com' } });

    // Envia
    fireEvent.click(screen.getByRole('button', { name: /Enviar Link/i }));

    expect(screen.getByText('Enviando...')).toBeInTheDocument();

    await waitFor(() => {
      expect(requestPasswordReset).toHaveBeenCalledWith('reset@email.com', 'medico');
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('link de recuperação foi enviado'));
      
      // Deve voltar para a tela de login automaticamente
      expect(screen.getByRole('heading', { name: /Acessar AgendaMed/i })).toBeInTheDocument();
    });
  });

  it('deve permitir voltar para o login manualmente', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText(/Esqueci a senha/i));
    
    // Clica em Voltar
    fireEvent.click(screen.getByText(/Voltar para o login/i));

    expect(screen.getByRole('heading', { name: /Acessar AgendaMed/i })).toBeInTheDocument();
  });
});