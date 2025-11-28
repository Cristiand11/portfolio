import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

// --- MOCKS DOS COMPONENTES E PÁGINAS ---

// Mock do Toaster para não quebrar
vi.mock("react-hot-toast", () => ({
  Toaster: () => <div data-testid="toaster" />,
  ToastBar: () => null,
  toast: { dismiss: vi.fn() },
}));

// Mock das Páginas Públicas
vi.mock("./pages/LoginPage", () => ({
  default: () => <div data-testid="login-page">Login</div>,
}));
vi.mock("./pages/ProfileSelectionPage", () => ({
  default: () => <div data-testid="profile-page">Profile</div>,
}));
vi.mock("./pages/ResetPasswordPage", () => ({
  default: () => <div data-testid="reset-page">Reset</div>,
}));

// Mock das Páginas Protegidas (Apenas algumas principais para provar o conceito)
vi.mock("./pages/medico/DashboardMedicoPage", () => ({
  default: () => <div data-testid="medico-dashboard">Medico Home</div>,
}));
vi.mock("./pages/paciente/DashboardPacientePage", () => ({
  default: () => <div data-testid="paciente-dashboard">Paciente Home</div>,
}));
vi.mock("./pages/admin/DashboardAdminPage", () => ({
  default: () => <div data-testid="admin-dashboard">Admin Home</div>,
}));

// Mock do ProtectedRoute
// Ele deve renderizar o 'children' para que a rota interna apareça
vi.mock("./components/ProtectedRoute", () => ({
  default: ({ children }) => (
    <div data-testid="protected-route">{children}</div>
  ),
}));

// Mock do MainLayout
// IMPORTANTE: Ele precisa renderizar o <Outlet /> para que as rotas filhas apareçam!
vi.mock("./components/MainLayout", async () => {
  const { Outlet } = await vi.importActual("react-router-dom");
  return {
    default: () => (
      <div data-testid="main-layout">
        <h1>Layout</h1>
        <Outlet />
      </div>
    ),
  };
});

describe("Roteamento Principal (App)", () => {
  // Helper para renderizar o App em uma rota específica
  const renderWithRouter = (route) => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    );
  };

  it("deve renderizar a página de seleção de perfil na rota /selecionar-perfil", () => {
    renderWithRouter("/selecionar-perfil");
    expect(screen.getByTestId("profile-page")).toBeInTheDocument();
  });

  it("deve renderizar a página de login na rota /login", () => {
    renderWithRouter("/login");
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
  });

  it("deve renderizar a página de reset de senha na rota /reset-password", () => {
    renderWithRouter("/reset-password");
    expect(screen.getByTestId("reset-page")).toBeInTheDocument();
  });

  it("deve redirecionar rotas desconhecidas (*) para /selecionar-perfil", () => {
    // Tenta acessar uma rota maluca
    renderWithRouter("/rota-que-nao-existe-404");

    // O <Navigate to="..." /> deve levar para a seleção de perfil
    expect(screen.getByTestId("profile-page")).toBeInTheDocument();
  });

  it("deve renderizar rotas protegidas dentro da estrutura de Layout", () => {
    renderWithRouter("/medico/dashboard");

    // 1. Verifica se o ProtectedRoute está envolvendo o conteúdo
    expect(screen.getByTestId("protected-route")).toBeInTheDocument();

    // 2. Verifica se o MainLayout está sendo renderizado
    expect(screen.getByTestId("main-layout")).toBeInTheDocument();

    // 3. Verifica se a página específica apareceu (graças ao Outlet do mock)
    expect(screen.getByTestId("medico-dashboard")).toBeInTheDocument();
  });

  it("deve renderizar corretamente rotas de outros perfis (Paciente)", () => {
    renderWithRouter("/paciente/dashboard");
    expect(screen.getByTestId("paciente-dashboard")).toBeInTheDocument();
  });

  it("deve renderizar corretamente rotas de outros perfis (Admin)", () => {
    renderWithRouter("/admin/dashboard");
    expect(screen.getByTestId("admin-dashboard")).toBeInTheDocument();
  });
});
