import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Modal from './Modal'; // Certifique-se que o caminho está correto

describe('Componente Modal', () => {
  
  // 1. Verifica se o componente respeita a prop isOpen={false}
  it('não deve renderizar nada se isOpen for false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Título Invisível">
        <p>Conteúdo Secreto</p>
      </Modal>
    );

    // queryByText retorna null se não achar (ao invés de erro), ideal para testar ausência
    expect(screen.queryByText('Título Invisível')).not.toBeInTheDocument();
  });

  // 2. Verifica se o componente renderiza título e filhos quando isOpen={true}
  it('deve renderizar o título e o conteúdo filho quando isOpen for true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Título Visível">
        <div data-testid="child-content">Conteúdo do Modal</div>
      </Modal>
    );

    expect(screen.getByText('Título Visível')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo do Modal')).toBeInTheDocument();
  });

  // 3. Verifica a interatividade do botão de fechar
  it('deve chamar a função onClose ao clicar no botão de fechar (×)', () => {
    const onCloseMock = vi.fn(); // Cria uma função "espiã"

    render(
      <Modal isOpen={true} onClose={onCloseMock} title="Teste Interação">
        <p>Conteúdo</p>
      </Modal>
    );

    // O seu código usa &times;, que renderiza o caractere "×".
    // O { name: /×/i } busca um botão que contenha esse caractere.
    const closeButton = screen.getByRole('button', { name: /×/i });

    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});