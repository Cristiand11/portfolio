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
          <Route path="/medico/dashboard" element={<DashboardMedicoPage />} />
          <Route path="/medico/auxiliares" element={<AuxiliaresPage />} />
          <Route path="/medico/pacientes" element={<PacientesPage />} />
          <Route path="/medico/meu-perfil" element={<MeuPerfilPage />} />
          <Route path="/medico/agendamento" element={<AgendamentoPage />} />
          {/* Adicione as outras rotas de dashboard aqui */}
        </Route>
      </Routes>
    </>
  );
}

export default App;
