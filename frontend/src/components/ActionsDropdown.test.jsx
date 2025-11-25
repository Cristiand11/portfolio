import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ActionsDropdown from './ActionsDropdown'; // Ajuste o caminho se necessário

describe('Componente ActionsDropdown', () => {
  // Mock das ações para usar nos testes
  const mockActions = [
    { label: 'Editar', onClick: vi.fn() },
    { label: 'Excluir', onClick: vi.fn(), className: 'text-red-600' },
  ];

  beforeEach(() => {
    // Mock do getBoundingClientRect. 
    // O componente usa isso para calcular se abre para cima ou para baixo.
    // Retornamos valores falsos para simular que o botão está no meio da tela.
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 100,
      height: 40,
      top: 200,
      left: 200,
      bottom: 240,
      right: 300,
    }));

    // Mock do window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
    
    // Mock do window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o botão desabilitado quando não há ações', () => {
    const { rerender } = render(<ActionsDropdown actions={[]} />);
    
    const button = screen.getByRole('button', { name: /Ações/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('cursor-not-allowed');

    // Testa com prop null/undefined
    rerender(<ActionsDropdown actions={null} />);
    expect(screen.getByRole('button', { name: /Ações/i })).toBeDisabled();
  });

  it('deve renderizar o botão habilitado quando há ações', () => {
    render(<ActionsDropdown actions={mockActions} />);
    
    const button = screen.getByRole('button', { name: /Ações/i });
    expect(button).toBeEnabled();
    // O menu não deve estar visível inicialmente
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
  });

  it('deve abrir o menu ao clicar no botão', () => {
    render(<ActionsDropdown actions={mockActions} />);
    
    const button = screen.getByRole('button', { name: /Ações/i });
    fireEvent.click(button);

    // Agora os itens devem aparecer
    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Excluir')).toBeInTheDocument();
  });

  it('deve executar a ação e fechar o menu ao clicar em um item', () => {
    render(<ActionsDropdown actions={mockActions} />);
    
    // Abre o menu
    const button = screen.getByRole('button', { name: /Ações/i });
    fireEvent.click(button);

    // Clica na ação 'Editar'
    const editAction = screen.getByText('Editar');
    fireEvent.click(editAction);

    // Verifica se a função foi chamada
    expect(mockActions[0].onClick).toHaveBeenCalledTimes(1);
    
    // Verifica se o menu fechou (o texto não deve mais estar no documento)
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
  });

  it('deve fechar o menu ao clicar fora (Click Outside)', () => {
    render(
      <div>
        <div data-testid="outside">Elemento Externo</div>
        <ActionsDropdown actions={mockActions} />
      </div>
    );
    
    // Abre o menu
    const button = screen.getByRole('button', { name: /Ações/i });
    fireEvent.click(button);
    expect(screen.getByText('Editar')).toBeInTheDocument();

    // Clica fora
    fireEvent.mouseDown(screen.getByTestId('outside'));

    // O menu deve sumir
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
  });

  it('deve aplicar classes customizadas nos itens', () => {
    render(<ActionsDropdown actions={mockActions} />);
    const button = screen.getByRole('button', { name: /Ações/i });
    fireEvent.click(button);

    const deleteAction = screen.getByText('Excluir');
    expect(deleteAction).toHaveClass('text-red-600');
  });
});