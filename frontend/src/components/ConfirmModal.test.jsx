import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmModal from './ConfirmModal';

describe('Componente ConfirmModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    title: 'Excluir Item',
    message: 'Tem certeza que deseja excluir este item?',
  };

  it('não deve renderizar nada se isOpen for false', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Excluir Item')).not.toBeInTheDocument();
    expect(screen.queryByText('Tem certeza que deseja excluir este item?')).not.toBeInTheDocument();
  });

  it('deve renderizar título e mensagem corretamente quando aberto', () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByText('Excluir Item')).toBeInTheDocument();
    expect(screen.getByText('Tem certeza que deseja excluir este item?')).toBeInTheDocument();
  });

  it('deve exibir os botões de Cancelar e Confirmar', () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar em Cancelar', () => {
    render(<ConfirmModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    // Garante que não chamou o confirm por engano
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('deve chamar onConfirm ao clicar em Confirmar', () => {
    render(<ConfirmModal {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: /confirmar/i });
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
});