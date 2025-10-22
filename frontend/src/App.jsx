import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import LoginPage from "./pages/LoginPage";
import ProfileSelectionPage from "./pages/ProfileSelectionPage";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";

import DashboardMedicoPage from "./pages/medico/DashboardMedicoPage";
import PacientesPage from "./pages/medico/PacientesPage";
import AuxiliaresPage from "./pages/medico/AuxiliaresPage";
import MeuPerfilPage from "./pages/medico/MeuPerfilPage";
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

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000, // Duração de 5 segundos
        }}
      />
      <Routes>
        {/* Rotas públicas*/}
        <Route path="/selecionar-perfil" element={<ProfileSelectionPage />} />
        <Route path="/login" element={<LoginPage />} />

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
          <Route path="/medico/pacientes" element={<PacientesPage />} />
          <Route path="/medico/meu-perfil" element={<MeuPerfilPage />} />
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
        </Route>
      </Routes>
    </>
  );
}

export default App;
