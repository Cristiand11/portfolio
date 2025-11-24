import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditMedicoForm from './EditMedicoForm';
import { updateMedico } from '../../services/adminService';
import toast from 'react-hot-toast';

// --- MOCKS ---
vi.mock('../../services/adminService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Componente EditMedicoForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const medicoMock = {
    id: 'med-1',
    nome: 'Dr. House',
    crm: '12345/SC',
    email: 'house@med.com',
    telefone: '47999998888',
    especialidade: 'Diagnóstico'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve preencher o formulário com os dados do médico ao carregar', () => {
    render(<EditMedicoForm medico={medicoMock} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/Nome/i).value).toBe('Dr. House');
    expect(screen.getByLabelText(/Email/i).value).toBe('house@med.com');
    expect(screen.getByLabelText(/Especialidade/i).value).toBe('Diagnóstico');
    // CRM deve estar preenchido E desabilitado/readonly
    const crmInput = screen.getByLabelText(/CRM/i);
    expect(crmInput.value).toBe('12345/SC');
    expect(crmInput).toHaveAttribute('readonly');
  });

  it('deve atualizar os dados e enviar o formulário com sucesso', async () => {
    updateMedico.mockResolvedValue({});

    render(<EditMedicoForm medico={medicoMock} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // Altera alguns campos
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: 'Dr. Gregory House' } });
    fireEvent.change(screen.getByLabelText(/Especialidade/i), { target: { value: 'Infectologia' } });
    
    // NÃO altera a senha (deve ir vazia ou não ir, dependendo da sua lógica de backend, mas o front envia o state atual)

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

    expect(screen.getByText('Salvando...')).toBeInTheDocument();

    await waitFor(() => {
      expect(updateMedico).toHaveBeenCalledWith('med-1', expect.objectContaining({
        nome: 'Dr. Gregory House',
        especialidade: 'Infectologia',
        email: 'house@med.com', // Mantém o original
        crm: '12345/SC',       // Mantém o original
      }));
      expect(toast.success).toHaveBeenCalledWith('Dados do médico atualizados com sucesso!');
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('deve permitir alterar a senha se desejado', async () => {
    updateMedico.mockResolvedValue({});
    render(<EditMedicoForm medico={medicoMock} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    // Digita nova senha
    fireEvent.change(screen.getByLabelText(/Nova Senha/i), { target: { value: 'novaSenha123' } });

    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

    await waitFor(() => {
      expect(updateMedico).toHaveBeenCalledWith('med-1', expect.objectContaining({
        senha: 'novaSenha123'
      }));
    });
  });

  it('deve exibir erro se a API falhar', async () => {
    const erroApi = { response: { data: { message: 'Erro desconhecido' } } };
    updateMedico.mockRejectedValue(erroApi);

    render(<EditMedicoForm medico={medicoMock} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

    await waitFor(() => {
      expect(updateMedico).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Erro desconhecido');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
});