import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RemarcacaoForm from './RemarcacaoForm';
import { solicitarRemarcacao } from '../../services/consultaService';
import toast from 'react-hot-toast';

// --- MOCKS ---
vi.mock('../../services/consultaService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do componente DatePicker para simplificar a interação
// Ele vai renderizar um input de texto normal que chama onChange quando digitamos
vi.mock('../DatePicker', () => ({
  default: ({ value, onChange }) => (
    <input
      data-testid="mock-datepicker"
      value={value}
      onChange={(e) => onChange(new Date(e.target.value))} // Simula o objeto Date que o DatePicker original retorna
    />
  ),
}));

describe('Componente RemarcacaoForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const mockConsulta = {
    extendedProps: {
      id: 'cons-1',
      nomePaciente: 'Maria Souza',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o nome do paciente e os campos', () => {
    render(<RemarcacaoForm consulta={mockConsulta} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByText(/Maria Souza/)).toBeInTheDocument();
    expect(screen.getByTestId('mock-datepicker')).toBeInTheDocument(); // Nosso mock
    expect(screen.getByLabelText(/Nova Hora/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar Proposta/i })).toBeInTheDocument();
  });

  it('deve enviar a solicitação de remarcação com sucesso', async () => {
    solicitarRemarcacao.mockResolvedValue({});

    render(<RemarcacaoForm consulta={mockConsulta} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // 1. Preenche Nova Data (usando nosso mock de DatePicker)
    // O mock espera uma string que possa virar Date, ex: '2025-12-25'
    const dateInput = screen.getByTestId('mock-datepicker');
    fireEvent.change(dateInput, { target: { value: '2025-12-25T12:00:00' } });

    // 2. Preenche Nova Hora
    const timeInput = screen.getByLabelText(/Nova Hora/i);
    fireEvent.change(timeInput, { target: { value: '15:30' } });

    // 3. Submete
    const submitButton = screen.getByRole('button', { name: /Enviar Proposta/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Enviando...')).toBeInTheDocument();

    // 4. Verifica chamada
    await waitFor(() => {
      // O componente formata a data para yyyy-MM-dd antes de enviar
      expect(solicitarRemarcacao).toHaveBeenCalledWith('cons-1', '2025-12-25', '15:30');
      expect(toast.success).toHaveBeenCalledWith('Solicitação de remarcação enviada!');
      expect(mockOnSuccess).toHaveBeenCalled();
      // Diferente do AgendamentoForm, este componente não chama onClose no sucesso (baseado no seu código enviado)
      // Se você quiser que feche, precisará adicionar onClose() no RemarcacaoForm.jsx
    });
  });

  it('deve exibir erro se a solicitação falhar', async () => {
    const erroApi = { response: { data: { message: 'Horário indisponível' } } };
    solicitarRemarcacao.mockRejectedValue(erroApi);

    render(<RemarcacaoForm consulta={mockConsulta} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // Preenche dados mínimos para habilitar submit (se houvesse validação extra)
    fireEvent.change(screen.getByTestId('mock-datepicker'), { target: { value: '2025-12-25T10:00:00' } });
    fireEvent.change(screen.getByLabelText(/Nova Hora/i), { target: { value: '10:00' } });

    fireEvent.click(screen.getByRole('button', { name: /Enviar Proposta/i }));

    await waitFor(() => {
      expect(solicitarRemarcacao).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Horário indisponível');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('deve fechar o modal ao clicar em Cancelar', () => {
    render(<RemarcacaoForm consulta={mockConsulta} onClose={mockOnClose} />);

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});