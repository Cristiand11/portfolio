import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResetPasswordPage from './ResetPasswordPage';
import { resetPassword } from '../services/authService';
import toast from 'react-hot-toast';

// --- MOCKS ---
vi.mock('../services/authService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// CORREÇÃO: Usamos vi.hoisted para criar os mocks antes do vi.mock rodar
const { mockNavigate, mockUseSearchParams } = vi.hoisted(() => {
  return {
    mockNavigate: vi.fn(),
    mockUseSearchParams: vi.fn(),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: mockUseSearchParams,
  };
});

describe('Página ResetPasswordPage', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Configuração Padrão: Token válido na URL
    // Nota: useSearchParams retorna um array [params, setParams]
    mockUseSearchParams.mockReturnValue([new URLSearchParams('?token=token-valido')]);
  });

  it('deve redirecionar para login se não houver token na URL', () => {
    // Simula URL sem parâmetros
    mockUseSearchParams.mockReturnValue([new URLSearchParams('')]);

    render(<ResetPasswordPage />);

    // O componente renderiza "Verificando link..." enquanto o useEffect processa
    expect(screen.getByText('Verificando link...')).toBeInTheDocument();

    // O useEffect roda e detecta falta de token
    expect(toast.error).toHaveBeenCalledWith('Token de redefinição inválido ou ausente.');
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('deve renderizar o formulário se o token for válido', () => {
    render(<ResetPasswordPage />);

    // Se tem token, o estado 'token' é setado e o form aparece
    expect(screen.getByRole('heading', { name: /Redefinir Senha/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar Nova Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Redefinir Senha' })).toBeInTheDocument();
  });

  it('deve validar senhas muito curtas', async () => {
    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText('Nova Senha'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('Confirmar Nova Senha'), { target: { value: '123' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Redefinir Senha' }));

    expect(await screen.findByText(/pelo menos 6 caracteres/i)).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('deve validar se as senhas não coincidem', async () => {
    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText('Nova Senha'), { target: { value: 'senha123' } });
    fireEvent.change(screen.getByLabelText('Confirmar Nova Senha'), { target: { value: 'outrasenha' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Redefinir Senha' }));

    expect(await screen.findByText(/senhas não coincidem/i)).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('deve enviar a nova senha com sucesso', async () => {
    resetPassword.mockResolvedValue({}); // Sucesso

    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText('Nova Senha'), { target: { value: 'novaSenha123' } });
    fireEvent.change(screen.getByLabelText('Confirmar Nova Senha'), { target: { value: 'novaSenha123' } });
    
    const submitButton = screen.getByRole('button', { name: 'Redefinir Senha' });
    fireEvent.click(submitButton);

    // Verifica estado de loading
    expect(screen.getByText('Salvando...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      // Verifica se o serviço foi chamado com o token da URL e a nova senha
      expect(resetPassword).toHaveBeenCalledWith('token-valido', 'novaSenha123');
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('sucesso'));
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('deve exibir erro se a API falhar (ex: token expirado)', async () => {
    resetPassword.mockRejectedValue(new Error('O link pode ter expirado'));

    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByLabelText('Nova Senha'), { target: { value: 'senha123' } });
    fireEvent.change(screen.getByLabelText('Confirmar Nova Senha'), { target: { value: 'senha123' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Redefinir Senha' }));

    await waitFor(() => {
      expect(screen.getByText('O link pode ter expirado')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('deve alternar a visibilidade das senhas', () => {
    render(<ResetPasswordPage />);

    const inputs = screen.getAllByPlaceholderText('••••••••');
    const toggleButtons = screen.getAllByText('Mostrar'); // Existem 2 botões "Mostrar"

    // Verifica estado inicial (password)
    expect(inputs[0]).toHaveAttribute('type', 'password');
    expect(inputs[1]).toHaveAttribute('type', 'password');

    // Clica para mostrar a primeira senha
    fireEvent.click(toggleButtons[0]);
    expect(inputs[0]).toHaveAttribute('type', 'text');
    expect(inputs[1]).toHaveAttribute('type', 'password'); // A segunda deve continuar oculta

    // Clica para mostrar a segunda senha
    fireEvent.click(toggleButtons[1]);
    expect(inputs[1]).toHaveAttribute('type', 'text');
  });

  it('deve voltar para login ao clicar no botão voltar', () => {
    render(<ResetPasswordPage />);
    
    fireEvent.click(screen.getByText('Voltar para o login'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});