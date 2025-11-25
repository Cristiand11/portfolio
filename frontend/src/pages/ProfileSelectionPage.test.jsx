import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileSelectionPage from './ProfileSelectionPage';
import { useAuth } from '../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';

// --- MOCK DO CONTEXTO ---
vi.mock('../contexts/AuthContext');

describe('Página ProfileSelectionPage', () => {
  const mockSelectProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Define o retorno do hook useAuth
    useAuth.mockReturnValue({
      selectProfile: mockSelectProfile,
    });
  });

  it('deve renderizar o título e as 4 opções de perfil', () => {
    render(
      <MemoryRouter>
        <ProfileSelectionPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Selecione seu Perfil/i })).toBeInTheDocument();
    
    // Verifica se os botões existem
    expect(screen.getByRole('button', { name: 'Paciente' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Médico' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Auxiliar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Administrador' })).toBeInTheDocument();
  });

  it('deve chamar selectProfile com "paciente" ao clicar no botão Paciente', () => {
    render(
      <MemoryRouter>
        <ProfileSelectionPage />
      </MemoryRouter>
    );

    const btnPaciente = screen.getByRole('button', { name: 'Paciente' });
    fireEvent.click(btnPaciente);

    expect(mockSelectProfile).toHaveBeenCalledWith('paciente');
  });

  it('deve chamar selectProfile com "medico" ao clicar no botão Médico', () => {
    render(
      <MemoryRouter>
        <ProfileSelectionPage />
      </MemoryRouter>
    );

    const btnMedico = screen.getByRole('button', { name: 'Médico' });
    fireEvent.click(btnMedico);

    expect(mockSelectProfile).toHaveBeenCalledWith('medico');
  });

  it('deve chamar selectProfile com "auxiliar" ao clicar no botão Auxiliar', () => {
    render(
      <MemoryRouter>
        <ProfileSelectionPage />
      </MemoryRouter>
    );

    const btnAuxiliar = screen.getByRole('button', { name: 'Auxiliar' });
    fireEvent.click(btnAuxiliar);

    expect(mockSelectProfile).toHaveBeenCalledWith('auxiliar');
  });

  it('deve chamar selectProfile com "administrador" ao clicar no botão Administrador', () => {
    render(
      <MemoryRouter>
        <ProfileSelectionPage />
      </MemoryRouter>
    );

    const btnAdmin = screen.getByRole('button', { name: 'Administrador' });
    fireEvent.click(btnAdmin);

    expect(mockSelectProfile).toHaveBeenCalledWith('administrador');
  });
});