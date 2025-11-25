import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddAuxiliarForm from './AddAuxiliarForm';
import { createAuxiliar } from '../../services/auxiliarService';
import toast from 'react-hot-toast';

// --- MOCKS ---
// Mock do Service
vi.mock('../../services/auxiliarService');

// Mock do Toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Componente AddAuxiliarForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar todos os campos do formulário', () => {
    render(<AddAuxiliarForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha Provisória/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar Auxiliar/i })).toBeInTheDocument();
  });

  it('deve permitir digitar nos campos', () => {
    render(<AddAuxiliarForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    fireEvent.change(nomeInput, { target: { value: 'João Silva' } });
    expect(nomeInput.value).toBe('João Silva');

    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'joao@email.com' } });
    expect(emailInput.value).toBe('joao@email.com');
  });

  it('deve chamar createAuxiliar e exibir sucesso ao submeter formulário válido', async () => {
    // Configura o mock para sucesso
    createAuxiliar.mockResolvedValue({});

    render(<AddAuxiliarForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // Preenche o formulário
    fireEvent.change(screen.getByLabelText(/Nome Completo/i), { target: { value: 'Auxiliar Teste' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'aux@teste.com' } });
    
    // AJUSTE AQUI: O fireEvent envia o valor cru direto para o estado.
    // Como o componente não tem lógica de sanitização no submit, ele envia o que está no input.
    fireEvent.change(screen.getByLabelText(/Telefone/i), { target: { value: '47999999999' } }); 
    
    fireEvent.change(screen.getByLabelText(/Senha Provisória/i), { target: { value: '123456' } });

    // Clica em Salvar
    const submitButton = screen.getByRole('button', { name: /Salvar Auxiliar/i });
    fireEvent.click(submitButton);

    // O botão deve mudar para "Salvando..."
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Salvando...')).toBeInTheDocument();

    // Aguarda a finalização
    await waitFor(() => {
      expect(createAuxiliar).toHaveBeenCalledWith({
        nome: 'Auxiliar Teste',
        email: 'aux@teste.com',
        telefone: '47999999999',
        senha: '123456'
      });
      expect(toast.success).toHaveBeenCalledWith('Auxiliar cadastrado com sucesso!');
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('deve exibir erro se a API falhar', async () => {
    // Configura o mock para falha
    const erroApi = { response: { data: { message: 'Email duplicado' } } };
    createAuxiliar.mockRejectedValue(erroApi);

    render(<AddAuxiliarForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // Preenche dados mínimos
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@a.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: '123' } });
    
    // Submete
    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));

    await waitFor(() => {
      expect(createAuxiliar).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Email duplicado');
      
      // Garante que NÃO fechou o modal nem chamou sucesso
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
    
    // Botão deve voltar ao estado normal
    expect(screen.getByRole('button', { name: /Salvar Auxiliar/i })).toBeEnabled();
  });

  it('deve fechar o modal ao clicar em Cancelar', () => {
    render(<AddAuxiliarForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});