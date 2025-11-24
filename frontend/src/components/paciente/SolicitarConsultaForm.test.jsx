import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SolicitarConsultaForm from './SolicitarConsultaForm';
import { getAllMedicos } from '../../services/adminService';
import { createConsulta } from '../../services/consultaService';
import toast from 'react-hot-toast';

// --- MOCKS ---
vi.mock('../../services/adminService');
vi.mock('../../services/consultaService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do DatePicker para simplificar
vi.mock('../DatePicker', () => ({
  default: ({ value, onChange }) => (
    <input
      data-testid="mock-datepicker"
      value={value}
      onChange={(e) => onChange(new Date(e.target.value))}
    />
  ),
}));

describe('Componente SolicitarConsultaForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const mockMedicos = {
    data: {
      contents: [
        { id: 'med-1', nome: 'Dr. House', especialidade: 'Diagnóstico' },
        { id: 'med-2', nome: 'Dra. Grey', especialidade: 'Cirurgia' },
      ]
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getAllMedicos.mockResolvedValue(mockMedicos);
  });

  it('deve carregar a lista de médicos ao montar', async () => {
    render(<SolicitarConsultaForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // Aguarda preencher o select
    await waitFor(() => {
      expect(screen.getByText('Dr. House - Diagnóstico')).toBeInTheDocument();
      expect(screen.getByText('Dra. Grey - Cirurgia')).toBeInTheDocument();
    });
  });

  it('deve preencher e enviar a solicitação com sucesso', async () => {
    createConsulta.mockResolvedValue({});

    // Usamos container para usar querySelector se necessário, mas aqui getByLabelText deve funcionar bem
    const { container } = render(<SolicitarConsultaForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await waitFor(() => screen.getByText('Dr. House - Diagnóstico'));

    // Preenche Médico (Select)
    fireEvent.change(screen.getByLabelText(/Médico/i), { target: { value: 'med-1' } });

    // Preenche Data (Mock DatePicker)
    fireEvent.change(screen.getByTestId('mock-datepicker'), { target: { value: '2025-12-25T10:00:00' } });

    // Preenche Hora
    fireEvent.change(screen.getByLabelText(/Hora/i), { target: { value: '10:00' } });

    // Preenche Obs
    fireEvent.change(screen.getByLabelText(/Observações/i), { target: { value: 'Tenho dor de cabeça' } });

    // Clica em Enviar
    fireEvent.click(screen.getByRole('button', { name: /Enviar Solicitação/i }));

    expect(screen.getByText('Enviando...')).toBeInTheDocument();

    await waitFor(() => {
      expect(createConsulta).toHaveBeenCalledWith({
        idMedico: 'med-1',
        data: '2025-12-25', // O componente formata para YYYY-MM-DD
        hora: '10:00',
        observacoes: 'Tenho dor de cabeça'
      });
      expect(toast.success).toHaveBeenCalledWith('Solicitação de consulta enviada com sucesso!');
      // Verifica se onSuccess foi chamado (onClose não é chamado no sucesso neste componente, baseado no seu código)
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('deve exibir erro se a API de criação falhar', async () => {
    createConsulta.mockRejectedValue({ response: { data: { message: 'Médico indisponível' } } });

    render(<SolicitarConsultaForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => screen.getByText('Dr. House - Diagnóstico'));

    // Preenche mínimo
    fireEvent.change(screen.getByLabelText(/Médico/i), { target: { value: 'med-1' } });
    fireEvent.change(screen.getByTestId('mock-datepicker'), { target: { value: '2025-12-25T10:00:00' } });
    fireEvent.change(screen.getByLabelText(/Hora/i), { target: { value: '10:00' } });

    fireEvent.click(screen.getByRole('button', { name: /Enviar Solicitação/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Médico indisponível');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('deve logar erro se falhar ao carregar médicos', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getAllMedicos.mockRejectedValue(new Error('Erro API'));

    render(<SolicitarConsultaForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao buscar médicos', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });
});