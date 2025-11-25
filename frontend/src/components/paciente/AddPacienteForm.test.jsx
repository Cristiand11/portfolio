import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddPacienteForm from './AddPacienteForm';
import { createPaciente } from '../../services/pacienteService';
import toast from 'react-hot-toast';

// --- MOCKS ---
vi.mock('../../services/pacienteService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Componente AddPacienteForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar todos os campos obrigatórios', () => {
    render(<AddPacienteForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CPF/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CEP/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Número/i)).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /Salvar Paciente/i })).toBeInTheDocument();
  });

  it('deve alternar a visibilidade da senha', () => {
    render(<AddPacienteForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const senhaInput = screen.getByLabelText(/Senha/i);
    const toggleButton = screen.getByRole('button', { name: /Mostrar/i }); // O texto inicial é "Mostrar"

    // Inicialmente password
    expect(senhaInput).toHaveAttribute('type', 'password');

    // Clica para mostrar
    fireEvent.click(toggleButton);
    expect(senhaInput).toHaveAttribute('type', 'text');
    expect(toggleButton).toHaveTextContent('Ocultar');

    // Clica para esconder
    fireEvent.click(toggleButton);
    expect(senhaInput).toHaveAttribute('type', 'password');
  });

  it('deve preencher e enviar o formulário com sucesso', async () => {
    createPaciente.mockResolvedValue({});

    render(<AddPacienteForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // Preenche os campos
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: 'Paciente Teste' } });
    
    // Nota: Ao usar fireEvent.change em inputs com máscara, passamos o valor cru que queremos testar.
    // A formatação visual acontece no browser, mas o state recebe o valor do evento.
    fireEvent.change(screen.getByLabelText(/CPF/i), { target: { value: '123.456.789-00' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'paciente@teste.com' } });
    fireEvent.change(screen.getByLabelText(/Telefone/i), { target: { value: '(47) 99999-9999' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'senha123' } });
    fireEvent.change(screen.getByLabelText(/CEP/i), { target: { value: '89200-000' } });
    fireEvent.change(screen.getByLabelText(/Número/i), { target: { value: '100' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: /Salvar Paciente/i });
    fireEvent.click(submitButton);

    // Verifica estado de loading
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Salvando...')).toBeInTheDocument();

    await waitFor(() => {
      expect(createPaciente).toHaveBeenCalledWith({
        nome: 'Paciente Teste',
        cpf: '123.456.789-00',
        email: 'paciente@teste.com',
        telefone: '(47) 99999-9999',
        senha: 'senha123',
        cepCodigo: '89200-000',
        enderecoNumero: '100'
      });
      expect(toast.success).toHaveBeenCalledWith('Paciente cadastrado com sucesso!');
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('deve exibir erro se a API falhar', async () => {
    const erroApi = { response: { data: { error: 'CPF já cadastrado' } } };
    createPaciente.mockRejectedValue(erroApi);

    render(<AddPacienteForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // Preenche campos mínimos para tentar salvar
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: 'Teste' } });
    fireEvent.change(screen.getByLabelText(/CPF/i), { target: { value: '000.000.000-00' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: '123' } });

    fireEvent.click(screen.getByRole('button', { name: /Salvar Paciente/i }));

    await waitFor(() => {
      expect(createPaciente).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('CPF já cadastrado');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('deve fechar o modal ao clicar em Cancelar', () => {
    render(<AddPacienteForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});