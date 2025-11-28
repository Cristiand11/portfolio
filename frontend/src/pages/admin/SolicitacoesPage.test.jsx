import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SolicitacoesPage from "./SolicitacoesPage";
import { getAllMedicos, reverterInativacao } from "../../services/adminService";
import { calcularTempoRestante } from "../../utils/dateUtils";
import toast from "react-hot-toast";

// --- MOCKS ---
vi.mock("../../services/adminService");
vi.mock("../../utils/dateUtils");
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do useOutletContext
const mockSetPageTitle = vi.fn();
vi.mock("react-router-dom", () => ({
  useOutletContext: () => ({
    setPageTitle: mockSetPageTitle,
  }),
}));

// Mock do Pagination (componente filho complexo)
vi.mock("../../components/Pagination", () => ({
  default: ({ paginaAtual, onPageChange }) => (
    <div data-testid="pagination-mock">
      Pagina {paginaAtual}
      <button onClick={() => onPageChange(paginaAtual + 1)}>Proxima</button>
    </div>
  ),
}));

// Mock do ConfirmModal
vi.mock("../../components/ConfirmModal", () => ({
  default: ({ isOpen, onConfirm, title }) =>
    isOpen ? (
      <div data-testid="confirm-modal">
        <h1>{title}</h1>
        <button onClick={onConfirm}>Sim, confirmar</button>
      </div>
    ) : null,
}));

describe("Página SolicitacoesPage", () => {
  const mockSolicitacoes = [
    {
      id: "med-1",
      nome: "Dr. House",
      crm: "123",
      inativacaoSolicitadaEm: "2025-10-01",
    },
    {
      id: "med-2",
      nome: "Dr. Wilson",
      crm: "456",
      inativacaoSolicitadaEm: "2025-09-01",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Configura mocks padrão
    getAllMedicos.mockResolvedValue({
      data: { contents: mockSolicitacoes, totalPages: 5 },
    });

    calcularTempoRestante.mockReturnValue({
      texto: "3 dias restantes",
      expirado: false,
    });
  });

  it("deve definir o título da página ao montar", async () => {
    render(<SolicitacoesPage />);
    await waitFor(() =>
      expect(mockSetPageTitle).toHaveBeenCalledWith(
        "Solicitações de Inativação"
      )
    );
  });

  it("deve carregar e exibir a lista de solicitações", async () => {
    render(<SolicitacoesPage />);

    expect(screen.getByText("Carregando...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Dr. House")).toBeInTheDocument();
      expect(screen.getByText("Dr. Wilson")).toBeInTheDocument();
      // Verifica se o cálculo de tempo foi usado
      expect(screen.getAllByText("3 dias restantes")).toHaveLength(2);
    });
  });

  it('deve exibir mensagem de "Nenhuma solicitação" se a lista vier vazia', async () => {
    getAllMedicos.mockResolvedValue({ data: { contents: [] } });

    render(<SolicitacoesPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Nenhuma solicitação pendente.")
      ).toBeInTheDocument();
    });
  });

  it("deve exibir erro (toast) se a API falhar", async () => {
    getAllMedicos.mockRejectedValue(new Error("Erro API"));

    render(<SolicitacoesPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível carregar as solicitações."
      );
    });
  });

  it("deve abrir modal e reverter inativação ao confirmar", async () => {
    reverterInativacao.mockResolvedValue({}); // Sucesso

    render(<SolicitacoesPage />);

    // Espera carregar
    await waitFor(() => screen.getByText("Dr. House"));

    // Clica em Reverter do primeiro médico
    const reverterBtns = screen.getAllByText("Reverter");
    fireEvent.click(reverterBtns[0]);

    // Verifica se o modal abriu
    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    expect(screen.getByText("Confirmar Reversão")).toBeInTheDocument();

    // Confirma no modal
    fireEvent.click(screen.getByText("Sim, confirmar"));

    // Verifica chamada do serviço
    await waitFor(() => {
      expect(reverterInativacao).toHaveBeenCalledWith("med-1");
      expect(toast.success).toHaveBeenCalledWith(
        "Inativação revertida com sucesso!"
      );

      // Verifica se a lista foi recarregada (getAllMedicos chamado novamente)
      expect(getAllMedicos).toHaveBeenCalledTimes(2); // 1 no mount + 1 no reload
    });
  });

  it("deve desabilitar botão de reverter se o prazo expirou", async () => {
    // Sobrescreve mock para simular expiração no segundo item
    calcularTempoRestante
      .mockReturnValueOnce({ texto: "Ok", expirado: false }) // Para o primeiro
      .mockReturnValueOnce({ texto: "Expirado", expirado: true }); // Para o segundo

    render(<SolicitacoesPage />);

    await waitFor(() => screen.getByText("Dr. Wilson"));

    const reverterBtns = screen.getAllByText("Reverter");

    // O segundo botão deve estar desabilitado
    expect(reverterBtns[1]).toBeDisabled();
    expect(reverterBtns[1]).toHaveClass("cursor-not-allowed");
  });

  it("deve mudar de página ao clicar na paginação", async () => {
    render(<SolicitacoesPage />);
    await waitFor(() => screen.getByText("Dr. House"));

    // Clica em Próxima (do nosso mock de Pagination)
    fireEvent.click(screen.getByText("Proxima"));

    // Verifica se getAllMedicos foi chamado com page=2
    expect(getAllMedicos).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
      })
    );
  });
});
