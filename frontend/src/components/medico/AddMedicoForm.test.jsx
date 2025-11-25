import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddMedicoForm from './AddMedicoForm';
import { createMedico } from '../../services/adminService';
import toast from 'react-hot-toast';

// --- MOCKS ---
vi.mock('../../services/adminService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Componente AddMedicoForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar todos os campos e botões', () => {
    render(<AddMedicoForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CRM/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha Provisória/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Especialidade/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar Médico/i })).toBeInTheDocument();
  });

  it('deve alternar visibilidade da senha ao clicar em Mostrar/Ocultar', () => {
    render(<AddMedicoForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const senhaInput = screen.getByLabelText(/Senha Provisória/i);
    const toggleButton = screen.getByRole('button', { name: /Mostrar/i });

    // Estado inicial: type="password"
    expect(senhaInput).toHaveAttribute('type', 'password');

    // Clica para mostrar
    fireEvent.click(toggleButton);
    expect(senhaInput).toHaveAttribute('type', 'text');
    expect(toggleButton).toHaveTextContent('Ocultar');

    // Clica para ocultar novamente
    fireEvent.click(toggleButton);
    expect(senhaInput).toHaveAttribute('type', 'password');
    expect(toggleButton).toHaveTextContent('Mostrar');
  });

  it('deve preencher e enviar o formulário com sucesso', async () => {
    createMedico.mockResolvedValue({});

    render(<AddMedicoForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // Preenche
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: 'Dr. House' } });
    fireEvent.change(screen.getByLabelText(/CRM/i), { target: { value: '12345/SC' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'house@med.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: '123456' } });
    // Telefone com máscara: input cru
    fireEvent.change(screen.getByLabelText(/Telefone/i), { target: { value: '47999998888' } });
    fireEvent.change(screen.getByLabelText(/Especialidade/i), { target: { value: 'Diagnóstico' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Salvar Médico/i }));

    // Estado de loading
    expect(screen.getByText('Salvando...')).toBeInTheDocument();

    await waitFor(() => {
      expect(createMedico).toHaveBeenCalledWith({
        nome: 'Dr. House',
        crm: '12345/SC',
        email: 'house@med.com',
        senha: '123456',
        telefone: '47999998888', // Valor sem formatação visual, pois usamos fireEvent direto
        especialidade: 'Diagnóstico',
      });
      expect(toast.success).toHaveBeenCalledWith('Médico cadastrado com sucesso!');
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('deve exibir erro se a API falhar', async () => {
    const erroApi = { response: { data: { message: 'CRM já existe' } } };
    createMedico.mockRejectedValue(erroApi);

    render(<AddMedicoForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // Preenche mínimo para habilitar submit (se houvesse validação no front além do HTML5)
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: 'Dr. Falha' } });
    fireEvent.change(screen.getByLabelText(/CRM/i), { target: { value: '00000/SC' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'falha@med.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: '123' } });

    // Submit via botão
    fireEvent.click(screen.getByRole('button', { name: /Salvar Médico/i }));

    await waitFor(() => {
      expect(createMedico).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('CRM já existe');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
});