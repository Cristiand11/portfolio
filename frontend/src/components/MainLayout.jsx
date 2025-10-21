import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useState } from "react";

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="relative flex h-screen bg-gray-100">
      {/* 1. Barra Lateral recebe props para controlar a visibilidade */}
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 2. Cabeçalho recebe a função para o botão */}
        <Header onMenuButtonClick={toggleMobileMenu} />

        {/* 3. Área de Conteúdo Principal */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
          <Outlet />
        </main>
      </div>

      {/* Fundo escuro que aparece quando o menu está aberto no mobile */}
      {isMobileMenuOpen && (
        <div
          onClick={toggleMobileMenu}
          className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
        ></div>
      )}
    </div>
  );
}
