import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AgendaLegenda from './AgendaLegenda';

describe('Componente AgendaLegenda', () => {
  it('deve renderizar o título "Legenda:"', () => {
    render(<AgendaLegenda />);
    expect(screen.getByText('Legenda:')).toBeInTheDocument();
  });

  it('deve renderizar todos os textos de status', () => {
    render(<AgendaLegenda />);

    // Verifica se cada texto esperado está no documento
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
    expect(screen.getByText('Pendente de Confirmação do Médico')).toBeInTheDocument();
    expect(screen.getByText('Pendente de Confirmação do Paciente')).toBeInTheDocument();
    expect(screen.getByText('Concluída')).toBeInTheDocument();
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
  });

  it('deve renderizar os indicadores de cor corretos', () => {
    // Renderiza o componente e pega o container (div principal)
    const { container } = render(<AgendaLegenda />);

    // Verifica se as classes de cor do Tailwind estão presentes no HTML
    // querySelectorAll retorna uma NodeList, verificamos se o length é > 0
    expect(container.querySelectorAll('.bg-indigo-600')).toHaveLength(1);
    expect(container.querySelectorAll('.bg-yellow-500')).toHaveLength(1);
    expect(container.querySelectorAll('.bg-yellow-600')).toHaveLength(1);
    expect(container.querySelectorAll('.bg-gray-500')).toHaveLength(1);
    expect(container.querySelectorAll('.bg-gray-200')).toHaveLength(1);
  });
});