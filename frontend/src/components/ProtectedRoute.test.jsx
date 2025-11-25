import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

// --- MOCKS ---

// 1. Mock do AuthContext para controlarmos se tem token ou não
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// 2. Mock do React Router Dom
// Ao invés de redirecionar de verdade, o componente <Navigate> vai apenas
// renderizar um texto na tela mostrando para onde ele iria.
vi.mock('react-router-dom', () => ({
  Navigate: ({ to }) => <div data-testid="redirect-mock">Redirecionando para: {to}</div>,
}));

describe('Componente ProtectedRoute', () => {
  
  it('deve redirecionar para /selecionar-perfil se não houver token', () => {
    // Cenário: Usuário deslogado (token null ou undefined)
    useAuth.mockReturnValue({ token: null });

    render(
      <ProtectedRoute>
        <h1>Conteúdo Secreto</h1>
      </ProtectedRoute>
    );

    // Verifica se o conteúdo filho NÃO foi renderizado
    expect(screen.queryByText('Conteúdo Secreto')).not.toBeInTheDocument();

    // Verifica se o Navigate foi renderizado com o destino correto
    expect(screen.getByTestId('redirect-mock')).toHaveTextContent('Redirecionando para: /selecionar-perfil');
  });

  it('deve renderizar o conteúdo filho (children) se houver token', () => {
    // Cenário: Usuário logado
    useAuth.mockReturnValue({ token: 'token-valido-jwt' });

    render(
      <ProtectedRoute>
        <h1>Conteúdo Secreto</h1>
      </ProtectedRoute>
    );

    // O conteúdo deve aparecer
    expect(screen.getByText('Conteúdo Secreto')).toBeInTheDocument();

    // O redirecionamento NÃO deve aparecer
    expect(screen.queryByTestId('redirect-mock')).not.toBeInTheDocument();
  });
});