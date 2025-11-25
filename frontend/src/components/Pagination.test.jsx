import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from './Pagination';
import { describe, it, expect, vi } from 'vitest';

describe('Componente Pagination', () => {
  it('Deve renderizar a página atual e total corretamente', () => {
    render(<Pagination paginaAtual={2} totalPaginas={5} onPageChange={() => {}} />);
    
    expect(screen.getByText(/Página/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('Deve chamar onPageChange com o valor correto ao clicar em Próximo', () => {
    // Mock da função (espião)
    const handlePageChange = vi.fn();
    
    render(<Pagination paginaAtual={1} totalPaginas={5} onPageChange={handlePageChange} />);
    
    const botaoProximo = screen.getByText('Próximo');
    fireEvent.click(botaoProximo);

    // Verifica se a função foi chamada com o argumento 2 (página seguinte)
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it('Botão Anterior deve estar desabilitado na página 1', () => {
    render(<Pagination paginaAtual={1} totalPaginas={5} onPageChange={() => {}} />);
    
    const botaoAnterior = screen.getByText('Anterior');
    expect(botaoAnterior).toBeDisabled();
  });
});