import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// 1. Define os links para cada perfil em um objeto central
const navLinks = {
  administrador: [
    { label: "Dashboard", to: "/admin/dashboard" },
    { type: "divider", label: "Gerenciar" },
    { label: "Médicos", to: "/admin/medicos", indent: true },
    { label: "Solicitações", to: "/admin/solicitacoes", indent: true },
  ],
  medico: [
    { label: "Dashboard", to: "/medico/dashboard" },
    { label: "Agenda", to: "/medico/agendamento" },
    { type: "divider", label: "Cadastros" },
    { label: "Auxiliares", to: "/medico/auxiliares", indent: true },
    { label: "Consultas", to: "/medico/consultas", indent: true },
    { label: "Pacientes", to: "/medico/pacientes", indent: true },
    { type: "divider", label: "Dados Pessoais" },
    { label: "Meu Perfil", to: "/medico/meu-perfil", indent: true },
    { label: "Meus Horários", to: "/medico/horarios", indent: true },
  ],
  paciente: [
    { label: "Dashboard", to: "/paciente/dashboard" },
    { type: "divider", label: "Consultas" },
    { label: "Minhas Consultas", to: "/paciente/consultas", indent: true },
    { type: "divider", label: "Dados Pessoais" },
    { label: "Meu Perfil", to: "/paciente/meu-perfil" },
  ],
  auxiliar: [
    { label: "Dashboard", to: "/auxiliar/dashboard" },
    { label: "Agenda do Médico", to: "/auxiliar/agenda" },
    { label: "Pacientes do Médico", to: "/auxiliar/pacientes" },
    { type: "divider", isSpacer: true },
    { label: "Meu Perfil", to: "/auxiliar/meu-perfil" },
  ],
};

// Estilo para o link ativo, para dar feedback visual ao usuário
const activeLinkStyle = {
  backgroundColor: "#4f46e5", // Um tom de índigo
  color: "white",
};

export default function Sidebar({ isMobileMenuOpen }) {
  const { user } = useAuth();
  const links = user?.perfil ? navLinks[user.perfil] : [];

  // NOVO: Lógica para aplicar classes dinamicamente com base no estado e tamanho da tela
  const sidebarClasses = `
    w-64 bg-gray-800 text-white p-4 flex flex-col  
    fixed inset-y-0 left-0 z-30                      
    transform transition-transform duration-300 ease-in-out 
    ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} 
    md:relative md:translate-x-0                      
  `;

  return (
    // ALTERADO: Usando a tag <aside> para semântica e aplicando as classes dinâmicas
    <aside className={sidebarClasses}>
      <h2 className="text-2xl font-bold mb-6 text-center">AgendaMed</h2>
      <nav>
        <ul>
          {links.map((link, index) => {
            if (link.type === "divider") {
              if (link.isSpacer)
                return (
                  <li
                    key={index}
                    className="flex-grow pt-4 border-t border-gray-700"
                  />
                );
              return (
                <li
                  key={index}
                  className="px-2 pt-4 pb-2 text-xs font-bold uppercase text-gray-400"
                >
                  {link.label}
                </li>
              );
            }
            return (
              <li key={index} className={`mb-1 ${link.indent ? "pl-4" : ""}`}>
                <NavLink
                  to={link.to}
                  style={({ isActive }) =>
                    isActive ? activeLinkStyle : undefined
                  }
                  className="block p-2 rounded hover:bg-gray-700 transition-colors"
                >
                  {link.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
