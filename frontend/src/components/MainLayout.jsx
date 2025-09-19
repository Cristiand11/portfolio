import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 1. Barra Lateral Fixa */}
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 2. Cabeçalho Superior */}
        <Header />

        {/* 3. Área de Conteúdo Principal com Scroll */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
          {/* O <Outlet /> é onde o React Router irá renderizar a página da rota atual */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
