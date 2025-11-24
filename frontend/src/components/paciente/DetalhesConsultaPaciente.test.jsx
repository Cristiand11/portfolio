import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DetalhesConsultaPaciente from './DetalhesConsultaPaciente';
import { confirmarConsulta, cancelarConsulta, aceitarRemarcacao, rejeitarRemarcacao } from '../../services/consultaService';
import toast from 'react-hot-toast';

// --- MOCKS ---
vi.mock('../../services/consultaService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Componente DetalhesConsultaPaciente', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnRemarcar = vi.fn();

  // Helper para criar objeto consulta
  const criarConsulta = (status, dataISO, horaStr = '10:00') => ({
    id: 'cons-1',
    nomeMedico: 'Dr. House',
    especialidadeMedico: 'Diagnóstico',
    data: dataISO, // YYYY-MM-DD
    hora: horaStr,
    status,
    dataRemarcacaoSugerida: '2025-12-01',
    horaRemarcacaoSugerida: '15:00',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Congelar tempo em 20 de Outubro de 2025
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-10-20T09:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve renderizar informações do médico e da consulta', () => {
    const consulta = criarConsulta('Confirmada', '2025-10-25');
    render(<DetalhesConsultaPaciente consulta={consulta} />);

    expect(screen.getByText(/Dr\(a\). Dr. House/)).toBeInTheDocument();
    expect(screen.getByText('Diagnóstico')).toBeInTheDocument();
    // 2025-10-25 UTC em pt-BR é 25/10/2025
    expect(screen.getByText('25/10/2025')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
  });

  it('deve exibir mensagem se a consulta já passou', () => {
    // Data passada (10/10/2025)
    const consulta = criarConsulta('Confirmada', '2025-10-10');
    render(<DetalhesConsultaPaciente consulta={consulta} />);

    expect(screen.getByText(/Esta consulta já aconteceu/)).toBeInTheDocument();
    // Não deve ter botões de ação
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('deve exibir botões de Confirmar/Rejeitar para status "Aguardando Confirmação do Paciente"', () => {
    const consulta = criarConsulta('Aguardando Confirmação do Paciente', '2025-10-25');
    render(<DetalhesConsultaPaciente consulta={consulta} onSuccess={mockOnSuccess} />);

    expect(screen.getByText('Confirmar Consulta')).toBeInTheDocument();
    expect(screen.getByText('Rejeitar')).toBeInTheDocument();
  });

  it('deve chamar confirmarConsulta ao clicar em Confirmar', async () => {
    confirmarConsulta.mockResolvedValue({});
    const consulta = criarConsulta('Aguardando Confirmação do Paciente', '2025-10-25');
    
    render(<DetalhesConsultaPaciente consulta={consulta} onSuccess={mockOnSuccess} />);

    // VOLTA PARA TEMPO REAL PARA ASYNC
    vi.useRealTimers();

    fireEvent.click(screen.getByText('Confirmar Consulta'));

    await waitFor(() => {
      expect(confirmarConsulta).toHaveBeenCalledWith('cons-1');
      expect(toast.success).toHaveBeenCalledWith('Consulta confirmada com sucesso!');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('deve chamar cancelarConsulta ao clicar em Rejeitar (que é um cancelar)', async () => {
    cancelarConsulta.mockResolvedValue({});
    const consulta = criarConsulta('Aguardando Confirmação do Paciente', '2025-10-25');
    
    render(<DetalhesConsultaPaciente consulta={consulta} onSuccess={mockOnSuccess} />);

    vi.useRealTimers();

    fireEvent.click(screen.getByText('Rejeitar'));

    await waitFor(() => {
      expect(cancelarConsulta).toHaveBeenCalledWith('cons-1');
      expect(toast.success).toHaveBeenCalledWith('Cancelamento solicitado com sucesso!');
    });
  });

  it('deve exibir botões de Cancelar/Remarcar para status "Confirmada"', () => {
    const consulta = criarConsulta('Confirmada', '2025-10-25');
    render(<DetalhesConsultaPaciente consulta={consulta} onRemarcar={mockOnRemarcar} />);

    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Solicitar Remarcação')).toBeInTheDocument();

    // Teste do clique em remarcar
    fireEvent.click(screen.getByText('Solicitar Remarcação'));
    expect(mockOnRemarcar).toHaveBeenCalledWith(consulta);
  });

  it('deve exibir proposta e botões Aceitar/Rejeitar para status "Remarcação Solicitada Pelo Médico"', () => {
    const consulta = criarConsulta('Remarcação Solicitada Pelo Médico', '2025-10-25');
    render(<DetalhesConsultaPaciente consulta={consulta} onSuccess={mockOnSuccess} />);

    // Verifica se mostra a proposta
    expect(screen.getByText(/Proposta de Remarcação:/)).toBeInTheDocument();
    expect(screen.getByText(/01\/12\/2025/)).toBeInTheDocument(); // Data sugerida formatada
    expect(screen.getByText(/15:00/)).toBeInTheDocument();

    expect(screen.getByText('Aceitar Proposta')).toBeInTheDocument();
    expect(screen.getByText('Rejeitar Proposta')).toBeInTheDocument();
  });

  it('deve chamar aceitarRemarcacao ao clicar em Aceitar', async () => {
    aceitarRemarcacao.mockResolvedValue({});
    const consulta = criarConsulta('Remarcação Solicitada Pelo Médico', '2025-10-25');
    
    render(<DetalhesConsultaPaciente consulta={consulta} onSuccess={mockOnSuccess} />);

    vi.useRealTimers();

    fireEvent.click(screen.getByText('Aceitar Proposta'));

    await waitFor(() => {
      expect(aceitarRemarcacao).toHaveBeenCalledWith('cons-1');
      expect(toast.success).toHaveBeenCalledWith('Remarcação aceite com sucesso!');
    });
  });

  it('deve chamar rejeitarRemarcacao ao clicar em Rejeitar Proposta', async () => {
    rejeitarRemarcacao.mockResolvedValue({});
    const consulta = criarConsulta('Remarcação Solicitada Pelo Médico', '2025-10-25');
    
    render(<DetalhesConsultaPaciente consulta={consulta} onSuccess={mockOnSuccess} />);

    vi.useRealTimers();

    fireEvent.click(screen.getByText('Rejeitar Proposta'));

    await waitFor(() => {
      expect(rejeitarRemarcacao).toHaveBeenCalledWith('cons-1');
      expect(toast.success).toHaveBeenCalledWith('Proposta de remarcação rejeitada.');
    });
  });
});