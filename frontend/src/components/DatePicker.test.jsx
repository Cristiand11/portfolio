import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DatePicker from './DatePicker';

// --- MOCK DO REACT-CALENDAR ---
// Substituímos o calendário complexo por uma div simples com um botão.
// Isso torna o teste leve e focado na lógica do SEU componente.
vi.mock('react-calendar', () => ({
  __esModule: true,
  default: ({ onChange, value }) => (
    <div data-testid="calendar-mock">
      <p>Calendário Aberto</p>
      <button 
        data-testid="select-date-btn"
        onClick={() => onChange(new Date('2025-12-25T12:00:00Z'))}
      >
        Selecionar Natal
      </button>
    </div>
  ),
}));

describe('Componente DatePicker', () => {
  const mockOnChange = vi.fn();

  it('deve renderizar o input com o placeholder quando value é vazio', () => {
    render(<DatePicker value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Selecione uma data');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('deve formatar a data visualmente no input (dd/mm/aaaa)', () => {
    // Entrada: YYYY-MM-DD (Padrão do seu backend/state)
    render(<DatePicker value="2025-10-20" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Selecione uma data');
    // O seu componente usa toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    // new Date('2025-10-20') é UTC 00:00. Em pt-BR UTC, é 20/10/2025.
    expect(input.value).toBe('20/10/2025');
  });

  it('deve abrir o calendário ao clicar no input', () => {
    render(<DatePicker value="" onChange={mockOnChange} />);
    
    // Calendário não deve existir antes do clique
    expect(screen.queryByTestId('calendar-mock')).not.toBeInTheDocument();

    // Clica no input
    const input = screen.getByPlaceholderText('Selecione uma data');
    fireEvent.click(input);

    // Calendário deve aparecer
    expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
  });

  it('deve chamar onChange e fechar o calendário ao selecionar uma data', () => {
    render(<DatePicker value="" onChange={mockOnChange} />);
    
    // 1. Abre
    fireEvent.click(screen.getByPlaceholderText('Selecione uma data'));
    
    // 2. Seleciona data (simulado pelo clique no botão do nosso mock)
    const selectButton = screen.getByTestId('select-date-btn');
    fireEvent.click(selectButton);

    // 3. Verifica se onChange foi chamado com o objeto Date
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(expect.any(Date));
    
    // 4. Verifica se fechou
    expect(screen.queryByTestId('calendar-mock')).not.toBeInTheDocument();
  });

  it('deve fechar o calendário ao clicar fora (Click Outside)', () => {
    render(
      <div>
        <div data-testid="outside">Area Externa</div>
        <DatePicker value="" onChange={mockOnChange} />
      </div>
    );
    
    // Abre
    fireEvent.click(screen.getByPlaceholderText('Selecione uma data'));
    expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();

    // Clica fora
    fireEvent.mouseDown(screen.getByTestId('outside'));

    // Verifica se fechou
    expect(screen.queryByTestId('calendar-mock')).not.toBeInTheDocument();
  });
});