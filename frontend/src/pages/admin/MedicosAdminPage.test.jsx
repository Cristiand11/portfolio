import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MedicosAdminPage from "./MedicosAdminPage";
import {
  getAllMedicos,
  solicitarInativacao,
} from "../../services/adminService";
import toast from "react-hot-toast";

// --- MOCKS ---
vi.mock("../../services/adminService");
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

// Mock dos componentes filhos para simplificar o teste da página
vi.mock("../../components/ActionsDropdown", () => ({
  default: ({ actions }) => (
    <div>
      {actions.map((action) => (
        <button key={action.label} onClick={action.onClick}>
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

// Mock simples dos modais para não precisar preencher forms complexos aqui
vi.mock("../../components/medico/AddMedicoForm", () => ({
  default: ({ onSuccess }) => (
    <button onClick={onSuccess}>Simular Sucesso Add</button>
  ),
}));
vi.mock("../../components/medico/EditMedicoForm", () => ({
  default: ({ onSuccess }) => (
    <button onClick={onSuccess}>Simular Sucesso Edit</button>
  ),
}));
vi.mock("../../components/ConfirmModal", () => ({
  default: ({ isOpen, onConfirm }) =>
    isOpen ? (
      <button onClick={onConfirm}>Sim, confirmar inativação</button>
    ) : null,
}));
vi.mock("../../components/Modal", () => ({
  default: ({ isOpen, title, children }) =>
    isOpen ? (
      <div role="dialog">
        <h1>{title}</h1>
        {children}
      </div>
    ) : null,
}));
vi.mock("../../components/Pagination", () => ({
  default: ({ onPageChange }) => (
    <button onClick={() => onPageChange(2)}>Proxima Pagina</button>
  ),
}));
// Mock do DatePicker do filtro
vi.mock("../../components/DatePicker", () => ({
  default: ({ onChange }) => (
    <button onClick={() => onChange(new Date("2025-10-20"))}>
      Filtrar Data
    </button>
  ),
}));

describe("Página MedicosAdminPage", () => {
  const mockMedicos = [
    {
      id: "med-1",
      nome: "Dr. House",
      crm: "123",
      status: "Ativo",
      createdDate: "2025-01-01",
    },
    {
      id: "med-2",
      nome: "Dr. Wilson",
      crm: "456",
      status: "Inativo",
      createdDate: "2025-01-02",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getAllMedicos.mockResolvedValue({
      data: { contents: mockMedicos, totalPages: 5 },
    });
  });

  it("deve definir título e carregar a lista de médicos", async () => {
    render(<MedicosAdminPage />);

    expect(mockSetPageTitle).toHaveBeenCalledWith("Gerenciar Médicos");
    expect(screen.getByText("Carregando...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Dr. House")).toBeInTheDocument();
      expect(screen.getByText("Dr. Wilson")).toBeInTheDocument();
    });
  });

  it("deve exibir mensagem de lista vazia", async () => {
    getAllMedicos.mockResolvedValue({ data: { contents: [] } });
    render(<MedicosAdminPage />);

    await waitFor(() => {
      expect(screen.getByText("Nenhum médico encontrado.")).toBeInTheDocument();
    });
  });

  it("deve abrir modal de adicionar médico", async () => {
    render(<MedicosAdminPage />);
    await waitFor(() => screen.getByText("Dr. House"));

    fireEvent.click(screen.getByText("Adicionar Médico"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Cadastrar Novo Médico")).toBeInTheDocument();
  });

  it("deve recarregar a lista após adicionar médico com sucesso", async () => {
    render(<MedicosAdminPage />);
    await waitFor(() => screen.getByText("Dr. House"));

    fireEvent.click(screen.getByText("Adicionar Médico"));
    fireEvent.click(screen.getByText("Simular Sucesso Add")); // Do nosso mock

    // getAllMedicos deve ter sido chamado 2 vezes (montagem + reload)
    await waitFor(() => {
      expect(getAllMedicos).toHaveBeenCalledTimes(2);
    });
  });

  it("deve abrir modal de edição ao clicar na ação Editar", async () => {
    render(<MedicosAdminPage />);
    await waitFor(() => screen.getByText("Dr. House"));

    // Clica no botão "Editar" do primeiro médico (mock do ActionsDropdown)
    const editButtons = screen.getAllByText("Editar");
    fireEvent.click(editButtons[0]);

    expect(screen.getByText("Editar Dados do Médico")).toBeInTheDocument();
  });

  it("deve solicitar inativação ao confirmar no modal", async () => {
    solicitarInativacao.mockResolvedValue({});
    render(<MedicosAdminPage />);
    await waitFor(() => screen.getByText("Dr. House"));

    // Clica em "Solicitar Inativação" do Dr. House (status Ativo)
    fireEvent.click(screen.getByText("Solicitar Inativação"));

    // Clica no botão do ConfirmModal
    fireEvent.click(screen.getByText("Sim, confirmar inativação"));

    await waitFor(() => {
      expect(solicitarInativacao).toHaveBeenCalledWith("med-1");
      expect(toast.success).toHaveBeenCalledWith(
        "Solicitação de inativação registrada!"
      );
      expect(getAllMedicos).toHaveBeenCalledTimes(2);
    });
  });

  it("deve aplicar filtros e recarregar a lista", async () => {
    const { container } = render(<MedicosAdminPage />);
    await waitFor(() => screen.getByText("Dr. House"));

    // Abre filtros
    fireEvent.click(screen.getByText("Filtros"));

    // Como o formulário de filtros não tem IDs/Labels perfeitos, usamos querySelector pelo name
    const nomeInput = container.querySelector('input[name="nome"]');
    const crmInput = container.querySelector('input[name="crm"]');

    // Verifica se os inputs apareceram
    expect(nomeInput).toBeInTheDocument();
    expect(crmInput).toBeInTheDocument();

    // Simula digitação
    fireEvent.change(nomeInput, { target: { value: "House" } });
    fireEvent.change(crmInput, { target: { value: "123" } });

    // Clica em Filtrar
    fireEvent.click(screen.getByText("Filtrar"));

    await waitFor(() => {
      // Verifica se getAllMedicos foi chamado com o filtro correto
      expect(getAllMedicos).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining("nome co 'House' AND crm co '123'"),
        })
      );
    });
  });

  it("deve mudar a ordenação ao clicar no cabeçalho da tabela", async () => {
    render(<MedicosAdminPage />);
    await waitFor(() => screen.getByText("Dr. House"));

    // Clica no cabeçalho "Nome"
    fireEvent.click(screen.getByRole("button", { name: /Nome/i }));

    await waitFor(() => {
      expect(getAllMedicos).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: "nome",
          order: "asc", // Primeiro clique vira ASC
        })
      );
    });
  });

  it("deve mudar de página ao clicar na paginação", async () => {
    render(<MedicosAdminPage />);
    await waitFor(() => screen.getByText("Dr. House"));

    fireEvent.click(screen.getByText("Proxima Pagina"));

    await waitFor(() => {
      expect(getAllMedicos).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });
});
