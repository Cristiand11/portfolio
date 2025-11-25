import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HomePage from './HomePage';

describe('Página HomePage', () => {
  it('deve renderizar a mensagem de boas-vindas e status de login', () => {
    render(<HomePage />);

    // Verifica se o título principal está presente (h1)
    const welcomeHeading = screen.getByRole('heading', { name: /Bem-vindo à AgendaMed!/i });
    expect(welcomeHeading).toBeInTheDocument();

    // Verifica se o texto de parágrafo está presente
    expect(screen.getByText('Você está logado.')).toBeInTheDocument();
  });
});