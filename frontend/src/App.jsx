import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster, toast, ToastBar } from "react-hot-toast";

import LoginPage from "./pages/LoginPage";
import ProfileSelectionPage from "./pages/ProfileSelectionPage";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardMedicoPage from "./pages/medico/DashboardMedicoPage";
import PacientesMedicoPage from "./pages/medico/PacientesPage";
import AuxiliaresPage from "./pages/medico/AuxiliaresPage";
import MeuPerfilMedicoPage from "./pages/medico/MeuPerfilPage";
import AgendamentoPage from "./pages/medico/AgendamentoPage";
import ConsultasMedicoPage from "./pages/medico/ConsultasMedicoPage";
import HorariosPage from "./pages/medico/HorariosPage";
import DashboardPacientePage from "./pages/paciente/DashboardPacientePage";
import ConsultasPacientePage from "./pages/paciente/ConsultasPacientePage";
import MeuPerfilPacientePage from "./pages/paciente/MeuPerfilPacientePage";
import DashboardAdminPage from "./pages/admin/DashboardAdminPage";
import MedicosAdminPage from "./pages/admin/MedicosAdminPage";
import SolicitacoesPage from "./pages/admin/SolicitacoesPage";
import DashboardAuxiliarPage from "./pages/auxiliar/DashboardAuxiliarPage";
import AgendaAuxiliarPage from "./pages/auxiliar/AgendaPage";
import PacientesAuxiliarPage from "./pages/auxiliar/PacientesPage";
import MeuPerfilAuxiliarPage from "./pages/auxiliar/MeuPerfilPage";

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000, // Duração de 5 segundos
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {t.type !== "loading" && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="ml-4 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                    aria-label="Fechar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
      <Routes>
        {/* Rotas públicas*/}
        <Route path="/selecionar-perfil" element={<ProfileSelectionPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Rota de fallback: redireciona para a seleção de perfil se não encontrar a rota */}
        <Route path="*" element={<Navigate to="/selecionar-perfil" />} />

        {/* --- Rotas Protegidas (dentro do Layout) --- */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Rotas do perfil Médico */}
          <Route path="/medico/dashboard" element={<DashboardMedicoPage />} />
          <Route path="/medico/auxiliares" element={<AuxiliaresPage />} />
          <Route path="/medico/pacientes" element={<PacientesMedicoPage />} />
          <Route path="/medico/meu-perfil" element={<MeuPerfilMedicoPage />} />
          <Route path="/medico/agendamento" element={<AgendamentoPage />} />
          <Route path="/medico/consultas" element={<ConsultasMedicoPage />} />
          <Route path="/medico/horarios" element={<HorariosPage />} />
          {/* Rotas do perfil Paciente */}
          <Route
            path="/paciente/dashboard"
            element={<DashboardPacientePage />}
          />
          <Route
            path="/paciente/consultas"
            element={<ConsultasPacientePage />}
          />
          <Route
            path="/paciente/meu-perfil"
            element={<MeuPerfilPacientePage />}
          />
          {/* Rotas do perfil Administrador */}
          <Route path="/admin/dashboard" element={<DashboardAdminPage />} />
          <Route path="/admin/medicos" element={<MedicosAdminPage />} />
          <Route path="/admin/solicitacoes" element={<SolicitacoesPage />} />
          {/* Rotas do perfil Auxiliar */}
          <Route
            path="/auxiliar/dashboard"
            element={<DashboardAuxiliarPage />}
          />
          <Route path="/auxiliar/agenda" element={<AgendaAuxiliarPage />} />
          <Route
            path="/auxiliar/pacientes"
            element={<PacientesAuxiliarPage />}
          />
          <Route
            path="/auxiliar/meu-perfil"
            element={<MeuPerfilAuxiliarPage />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
