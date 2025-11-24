import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';

// --- MOCK DO CONTEXTO ---
// Dizemos ao Vitest: "Quando alguém importar AuthContext, não use o arquivo real,
// use este objeto mockado onde eu controlo o retorno de useAuth".
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Componente Header', () => {
  const mockLogout = vi.fn();
  const mockOnMenuClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configuração Padrão: Usuário Logado
    useAuth.mockReturnValue({
      logout: mockLogout,
      user: { nome: 'Dr. House' },
    });
  });

  it('deve renderizar o título da página passado via props', () => {
    render(<Header title="Dashboard Médico" onMenuButtonClick={mockOnMenuClick} />);
    
    // Verifica se o H1 com o título está lá
    expect(screen.getByRole('heading', { name: 'Dashboard Médico' })).toBeInTheDocument();
  });

  it('deve exibir o nome do usuário logado vindo do contexto', () => {
    render(<Header title="Teste" onMenuButtonClick={mockOnMenuClick} />);
    
    expect(screen.getByText('Dr. House')).toBeInTheDocument();
  });

  it('deve exibir "Usuário" como fallback se não houver usuário logado', () => {
    // Sobrescreve o mock para simular usuário sem nome ou nulo
    useAuth.mockReturnValue({
      logout: mockLogout,
      user: null,
    });

    render(<Header title="Teste" onMenuButtonClick={mockOnMenuClick} />);
    
    expect(screen.getByText('Usuário')).toBeInTheDocument();
  });

  it('deve chamar a função logout ao clicar no botão "Sair"', () => {
    render(<Header title="Teste" onMenuButtonClick={mockOnMenuClick} />);
    
    const logoutButton = screen.getByRole('button', { name: /Sair/i });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onMenuButtonClick ao clicar no ícone de menu (Mobile)', () => {
    render(<Header title="Teste" onMenuButtonClick={mockOnMenuClick} />);
    
    // O botão de menu não tem texto, mas sabemos que existem 2 botões na tela:
    // 1. Menu (Mobile)
    // 2. Sair
    // O Menu vem primeiro no HTML.
    const buttons = screen.getAllByRole('button');
    const menuButton = buttons[0]; 

    fireEvent.click(menuButton);

    expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
  });
});