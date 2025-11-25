import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useOutletContext } from 'react-router-dom';
import { useEffect } from 'react';
import MainLayout from './MainLayout';

// --- MOCKS DOS COMPONENTES FILHOS ---
// Mockamos Sidebar para verificar se ele recebe a prop isMobileMenuOpen corretamente
vi.mock('./Sidebar', () => ({
  default: ({ isMobileMenuOpen }) => (
    <div data-testid="sidebar-mock">
      Sidebar: {isMobileMenuOpen ? 'Aberto' : 'Fechado'}
    </div>
  ),
}));

// Mockamos Header para verificar o título e simular o clique no botão de menu
vi.mock('./Header', () => ({
  default: ({ title, onMenuButtonClick }) => (
    <div data-testid="header-mock">
      <h1>Título: {title}</h1>
      <button data-testid="toggle-btn" onClick={onMenuButtonClick}>
        Menu
      </button>
    </div>
  ),
}));

// --- COMPONENTE DUMMY PARA TESTAR O CONTEXTO DO OUTLET ---
// Este componente simula uma página (ex: Dashboard) tentando mudar o título
const TestChildComponent = () => {
  const { setPageTitle } = useOutletContext();

  useEffect(() => {
    setPageTitle('Nova Página Teste');
  }, [setPageTitle]);

  return <div>Conteúdo da Rota Filha</div>;
};

describe('Componente MainLayout', () => {
  
  it('deve renderizar a estrutura base (Sidebar, Header e Outlet)', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>Conteúdo Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
    expect(screen.getByTestId('header-mock')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo Home')).toBeInTheDocument();
  });

  it('deve renderizar o título padrão "Dashboard" inicialmente', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Título: Dashboard')).toBeInTheDocument();
  });

  it('deve abrir e fechar o menu mobile ao interagir', () => {
    // Renderizamos o layout
    const { container } = render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<MainLayout />} />
        </Routes>
      </MemoryRouter>
    );

    // 1. Estado Inicial: Sidebar fechado
    expect(screen.getByText('Sidebar: Fechado')).toBeInTheDocument();
    
    // Verifica que o overlay (fundo preto) NÃO existe
    // O overlay no seu código tem a classe "fixed inset-0 bg-black"
    const overlayInicial = container.querySelector('.fixed.inset-0.bg-black');
    expect(overlayInicial).not.toBeInTheDocument();

    // 2. Clica no botão de menu no Header
    fireEvent.click(screen.getByTestId('toggle-btn'));

    // 3. Estado Aberto: Sidebar recebe prop true e Overlay aparece
    expect(screen.getByText('Sidebar: Aberto')).toBeInTheDocument();
    
    const overlayAberto = container.querySelector('.fixed.inset-0.bg-black');
    expect(overlayAberto).toBeInTheDocument();

    // 4. Clica no Overlay para fechar
    fireEvent.click(overlayAberto);

    // 5. Volta para estado fechado
    expect(screen.getByText('Sidebar: Fechado')).toBeInTheDocument();
  });

  it('deve permitir que componentes filhos alterem o título da página (Outlet Context)', async () => {
    render(
      <MemoryRouter initialEntries={['/child']}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Renderiza nosso componente de teste que chama setPageTitle */}
            <Route path="child" element={<TestChildComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // O Header deve atualizar para o título definido pelo filho
    // Usamos waitFor porque o useEffect do filho roda após a renderização
    await waitFor(() => {
      expect(screen.getByText('Título: Nova Página Teste')).toBeInTheDocument();
    });
  });
});