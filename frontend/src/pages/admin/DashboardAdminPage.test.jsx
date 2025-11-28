import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardAdminPage from "./DashboardAdminPage";
import { getDashboardStats } from "../../services/adminService";
import toast from "react-hot-toast";

// --- MOCKS ---
vi.mock("../../services/adminService");
vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
  },
}));

// Mock do contexto do Outlet para o título da página
const mockSetPageTitle = vi.fn();
vi.mock("react-router-dom", () => ({
  useOutletContext: () => ({
    setPageTitle: mockSetPageTitle,
  }),
}));

describe("Página DashboardAdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve definir o título da página ao montar", async () => {
    // Mock básico para não quebrar o fetch
    getDashboardStats.mockResolvedValue({ data: {} });

    render(<DashboardAdminPage />);

    expect(mockSetPageTitle).toHaveBeenCalledWith("Meu Dashboard");
  });

  it('deve exibir "Carregando..." inicialmente', () => {
    // Retorna uma promise pendente para manter o estado de loading
    getDashboardStats.mockReturnValue(new Promise(() => {}));

    render(<DashboardAdminPage />);

    expect(screen.getByText("Carregando dashboard...")).toBeInTheDocument();
  });

  it("deve renderizar os dados corretamente após o carregamento", async () => {
    const mockStats = {
      totalMedicosAtivos: 42,
      solicitacoesRecentes: 7,
    };

    getDashboardStats.mockResolvedValue({ data: mockStats });

    render(<DashboardAdminPage />);

    // Aguarda o loading sumir
    await waitFor(() => {
      expect(
        screen.queryByText("Carregando dashboard...")
      ).not.toBeInTheDocument();
    });

    // Verifica os cards
    expect(screen.getByText("Médicos Ativos")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();

    expect(screen.getByText(/Solicitações de Inativação/)).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("deve renderizar 0 como fallback se os dados vierem vazios", async () => {
    getDashboardStats.mockResolvedValue({ data: {} }); // Objeto vazio

    render(<DashboardAdminPage />);

    await waitFor(() => {
      expect(
        screen.queryByText("Carregando dashboard...")
      ).not.toBeInTheDocument();
    });

    // Verifica se o fallback (?? 0) funcionou
    const zeros = screen.getAllByText("0");
    expect(zeros).toHaveLength(2); // Um para cada card
  });

  it("deve exibir erro e parar o loading se a API falhar", async () => {
    getDashboardStats.mockRejectedValue(new Error("Erro no servidor"));

    render(<DashboardAdminPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível carregar as estatísticas."
      );
      // O loading deve sumir mesmo com erro (bloco finally)
      expect(
        screen.queryByText("Carregando dashboard...")
      ).not.toBeInTheDocument();
    });

    // Deve renderizar 0 nos cards (já que stats será null)
    const zeros = screen.getAllByText("0");
    expect(zeros).toHaveLength(2);
  });
});
