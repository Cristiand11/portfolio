import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';

// Mock do Contexto
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Componente Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSidebar = (userProfile) => {
    useAuth.mockReturnValue({ user: { perfil: userProfile } });
    render(
      <MemoryRouter>
        <Sidebar isMobileMenuOpen={false} />
      </MemoryRouter>
    );
  };

  it('deve renderizar os links corretos para perfil ADMIN', () => {
    renderSidebar('administrador');

    expect(screen.getByText('Gerenciar')).toBeInTheDocument(); // Título do Divider
    expect(screen.getByText('Médicos')).toBeInTheDocument();
    expect(screen.getByText('Solicitações')).toBeInTheDocument();
    
    // Não deve ver links de outros perfis
    expect(screen.queryByText('Minhas Consultas')).not.toBeInTheDocument();
  });

  it('deve renderizar os links corretos para perfil MEDICO', () => {
    renderSidebar('medico');

    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Auxiliares')).toBeInTheDocument();
    expect(screen.getByText('Meus Horários')).toBeInTheDocument();
  });

  it('deve renderizar os links corretos para perfil PACIENTE', () => {
    renderSidebar('paciente');

    expect(screen.getByText('Minhas Consultas')).toBeInTheDocument();
    expect(screen.queryByText('Médicos')).not.toBeInTheDocument();
  });

  it('deve renderizar os links corretos para perfil AUXILIAR', () => {
    renderSidebar('auxiliar');

    expect(screen.getByText('Agenda do Médico')).toBeInTheDocument();
    expect(screen.getByText('Pacientes do Médico')).toBeInTheDocument();
  });

  it('deve aplicar classe de indentação se o link for configurado assim', () => {
    renderSidebar('administrador');
    // O item "Médicos" tem indent: true
    // No seu código, isso vira uma classe "pl-4" no <li>
    // Como é difícil pegar o LI exato pelo texto do link sem test-id, 
    // podemos verificar se o link está dentro de um LI que tem essa classe.
    
    const link = screen.getByText('Médicos');
    const listItem = link.closest('li');
    expect(listItem).toHaveClass('pl-4');
  });

  it('deve aplicar classes CSS de menu mobile aberto/fechado', () => {
    useAuth.mockReturnValue({ user: { perfil: 'medico' } });
    
    // 1. Teste Fechado
    const { rerender, container } = render(
      <MemoryRouter>
        <Sidebar isMobileMenuOpen={false} />
      </MemoryRouter>
    );
    
    // A sidebar é um <aside>
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('-translate-x-full'); // Escondido no mobile

    // 2. Teste Aberto
    rerender(
      <MemoryRouter>
        <Sidebar isMobileMenuOpen={true} />
      </MemoryRouter>
    );
    expect(aside).toHaveClass('translate-x-0'); // Visível
  });

  it('deve aplicar estilo de link ativo', () => {
    useAuth.mockReturnValue({ user: { perfil: 'medico' } });
    
    // Renderiza simulando que estamos na URL /medico/dashboard
    render(
      <MemoryRouter initialEntries={['/medico/dashboard']}>
        <Sidebar isMobileMenuOpen={false} />
      </MemoryRouter>
    );

    const dashboardLink = screen.getByText('Dashboard');
    // O NavLink aplica styles inline ou classes quando ativo.
    // No seu código: style={({ isActive }) => isActive ? activeLinkStyle : undefined}
    // activeLinkStyle = { backgroundColor: "#4f46e5", color: "white" }
    
    // Verificamos o estilo computado ou inline
    expect(dashboardLink).toHaveStyle({ backgroundColor: 'rgb(79, 70, 229)' }); // Hex #4f46e5 em RGB
  });
});