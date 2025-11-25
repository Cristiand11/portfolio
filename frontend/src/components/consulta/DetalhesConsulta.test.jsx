import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DetalhesConsulta from './DetalhesConsulta';
import { confirmarConsulta, concluirConsulta } from '../../services/consultaService';
import toast from 'react-hot-toast';

// --- MOCKS ---
vi.mock('../../services/consultaService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Componente DetalhesConsulta', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnRemarcar = vi.fn();
  const mockOnCancelar = vi.fn();
  const mockOnAceitar = vi.fn();
  const mockOnRejeitar = vi.fn();

  // Função auxiliar para gerar o objeto consulta
  const criarConsulta = (status, dataISO) => ({
    title: 'Paciente Teste',
    start: dataISO,
    extendedProps: { id: 'cons-1', status },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Congelar o tempo para garantir que testes de "passado/futuro" não quebrem a renderização
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-10-20T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 1. Testes de Renderização Básica
  it('deve renderizar informações básicas (nome, data, hora, status)', () => {
    const consulta = criarConsulta('Confirmada', '2025-10-25T14:30:00');
    render(<DetalhesConsulta consulta={consulta} />);

    expect(screen.getByText('Paciente Teste')).toBeInTheDocument();
    expect(screen.getByText('25/10/2025')).toBeInTheDocument();
    expect(screen.getByText('14:30')).toBeInTheDocument();
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
  });

  // 2. Testes de Lógica de Botões (Status)

  it('deve exibir "Aprovar" e "Rejeitar" se status for "Aguardando Confirmação do Médico"', () => {
    const consulta = criarConsulta('Aguardando Confirmação do Médico', '2025-10-25T14:30:00');
    render(<DetalhesConsulta consulta={consulta} onClose={mockOnClose} onSuccess={mockOnSuccess} onCancelar={mockOnCancelar} />);

    expect(screen.getByText('Aprovar Consulta')).toBeInTheDocument();
    expect(screen.getByText('Rejeitar')).toBeInTheDocument();
  });

  it('deve chamar confirmarConsulta ao clicar em Aprovar', async () => {
    confirmarConsulta.mockResolvedValue({});
    const consulta = criarConsulta('Aguardando Confirmação do Médico', '2025-10-25T14:30:00');
    
    render(<DetalhesConsulta consulta={consulta} onSuccess={mockOnSuccess} />);

    // CORREÇÃO: Voltamos para o tempo real para que a Promise (async/await) funcione sem travar
    vi.useRealTimers();

    fireEvent.click(screen.getByText('Aprovar Consulta'));

    await waitFor(() => {
      expect(confirmarConsulta).toHaveBeenCalledWith('cons-1');
      expect(toast.success).toHaveBeenCalledWith('Consulta confirmada com sucesso!');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('deve chamar onCancelar ao clicar em Rejeitar', () => {
    const consulta = criarConsulta('Aguardando Confirmação do Médico', '2025-10-25T14:30:00');
    render(<DetalhesConsulta consulta={consulta} onCancelar={mockOnCancelar} />);

    fireEvent.click(screen.getByText('Rejeitar'));
    expect(mockOnCancelar).toHaveBeenCalledWith('cons-1');
  });

  it('deve exibir "Cancelar" e "Solicitar Remarcação" se status for "Confirmada" (Futuro)', () => {
    const consulta = criarConsulta('Confirmada', '2025-10-25T14:30:00'); // Futuro
    render(<DetalhesConsulta consulta={consulta} onRemarcar={mockOnRemarcar} onCancelar={mockOnCancelar} />);

    expect(screen.getByText('Cancelar Consulta')).toBeInTheDocument();
    expect(screen.getByText('Solicitar Remarcação')).toBeInTheDocument();
  });

  it('deve exibir "Marcar como Concluída" se status não for cancelado e data já passou', () => {
    // Data passada (antes de 2025-10-20)
    const consulta = criarConsulta('Confirmada', '2025-10-10T10:00:00');
    render(<DetalhesConsulta consulta={consulta} onSuccess={mockOnSuccess} />);

    const btnConcluir = screen.getByText('Marcar como Concluída');
    expect(btnConcluir).toBeInTheDocument();
  });

  it('deve chamar concluirConsulta ao clicar em Concluir', async () => {
    concluirConsulta.mockResolvedValue({});
    const consulta = criarConsulta('Confirmada', '2025-10-10T10:00:00'); // Passado
    
    render(<DetalhesConsulta consulta={consulta} onSuccess={mockOnSuccess} />);

    // CORREÇÃO: Voltamos para o tempo real para que a Promise (async/await) funcione sem travar
    vi.useRealTimers();

    fireEvent.click(screen.getByText('Marcar como Concluída'));

    await waitFor(() => {
      expect(concluirConsulta).toHaveBeenCalledWith('cons-1');
      expect(toast.success).toHaveBeenCalledWith('Consulta marcada como concluída!');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('deve exibir ações de remarcação se status for "Remarcação Solicitada Pelo Paciente"', () => {
    const consulta = criarConsulta('Remarcação Solicitada Pelo Paciente', '2025-10-25T14:30:00');
    render(
      <DetalhesConsulta 
        consulta={consulta} 
        onAceitarRemarcacao={mockOnAceitar} 
        onRejeitarRemarcacao={mockOnRejeitar} 
      />
    );

    expect(screen.getByText('Aceitar Proposta')).toBeInTheDocument();
    expect(screen.getByText('Rejeitar Proposta')).toBeInTheDocument();

    // Testa cliques (síncronos, não precisa de useRealTimers aqui necessariamente, mas mal não faz)
    fireEvent.click(screen.getByText('Aceitar Proposta'));
    expect(mockOnAceitar).toHaveBeenCalledWith('cons-1');

    fireEvent.click(screen.getByText('Rejeitar Proposta'));
    expect(mockOnRejeitar).toHaveBeenCalledWith('cons-1');
  });

  it('deve exibir mensagem de "Nenhuma ação" para status desconhecido', () => {
    const consulta = criarConsulta('Cancelada', '2025-10-25T14:30:00');
    render(<DetalhesConsulta consulta={consulta} />);

    expect(screen.getByText(/Nenhuma ação disponível/i)).toBeInTheDocument();
  });
});