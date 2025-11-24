import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AgendamentoForm from './AgendamentoForm';
import { getMeusPacientes, getPacientesByMedicoId } from '../../services/pacienteService';
import { createConsulta } from '../../services/consultaService';
import toast from 'react-hot-toast';

// --- MOCKS ---
vi.mock('../../services/pacienteService');
vi.mock('../../services/consultaService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Componente AgendamentoForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  // Dados falsos de pacientes
  const mockPacientes = {
    data: {
      contents: [
        { id: 'pac-1', nome: 'Ana Silva' },
        { id: 'pac-2', nome: 'Bruno Souza' },
      ]
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Configuração padrão: Retorna lista de pacientes
    getMeusPacientes.mockResolvedValue(mockPacientes);
    getPacientesByMedicoId.mockResolvedValue(mockPacientes);
  });

  it('deve carregar a lista de pacientes ao montar', async () => {
    render(<AgendamentoForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Selecione um paciente:')).toBeInTheDocument();
      expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    });
  });

  it('deve exibir erro se falhar ao carregar pacientes', async () => {
    getMeusPacientes.mockRejectedValue(new Error('Erro API'));

    render(<AgendamentoForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Não foi possível carregar a lista de pacientes.');
    });
  });

  it('deve preencher automaticamente data e hora se fornecidos (initialData)', async () => {
    const initialData = { data: '2025-12-25', hora: '14:00' };
    
    render(<AgendamentoForm initialData={initialData} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await waitFor(() => expect(screen.getByText('Selecione um paciente:')).toBeInTheDocument());

    // Formatação pt-BR: 2025-12-25 -> 25/12/2025
    expect(screen.getByText('25/12/2025')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
  });

  it('deve permitir selecionar paciente e agendar consulta com sucesso', async () => {
    createConsulta.mockResolvedValue({}); 

    // Desestruturamos 'container' para poder usar querySelector
    const { container } = render(<AgendamentoForm onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // 1. Espera carregar
    await waitFor(() => screen.getByText('Ana Silva'));

    // 2. Preenche os inputs usando seletores diretos (mais robusto para JSDOM forms)
    fireEvent.change(container.querySelector('input[name="data"]'), { target: { value: '2025-10-20' } });
    fireEvent.change(container.querySelector('input[name="hora"]'), { target: { value: '09:30' } });
    fireEvent.change(container.querySelector('select[name="idPaciente"]'), { target: { value: 'pac-1' } });
    fireEvent.change(container.querySelector('textarea[name="observacoes"]'), { target: { value: 'Primeira consulta' } });

    // 3. Dispara o submit diretamente no formulário
    const form = container.querySelector('form');
    fireEvent.submit(form);

    // 4. Verifica resultado
    await waitFor(() => {
      expect(createConsulta).toHaveBeenCalledWith({
        idPaciente: 'pac-1',
        data: '2025-10-20',
        hora: '09:30',
        observacoes: 'Primeira consulta'
      });
      expect(toast.success).toHaveBeenCalledWith('Consulta proposta com sucesso!');
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('deve usar serviço diferente se medicoId for fornecido (caso de Auxiliar)', async () => {
    const medicoId = 'med-123';
    render(<AgendamentoForm medicoId={medicoId} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(getPacientesByMedicoId).toHaveBeenCalledWith(medicoId, 0, 1000, expect.any(Object));
      expect(getMeusPacientes).not.toHaveBeenCalled();
    });
  });
});