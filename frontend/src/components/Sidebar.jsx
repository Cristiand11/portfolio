import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-800 text-white p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-6">AgendaMed</h2>
      <nav>
        <ul>
          {/* Estes são links de exemplo, vamos torná-los dinâmicos depois */}
          <li className="mb-2">
            <Link
              to="/medico/dashboard"
              className="block p-2 rounded hover:bg-gray-700"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <span className="block p-2 text-xs font-bold uppercase text-gray-400">
              Cadastros
            </span>
            <ul className="pl-4">
              <li className="mb-2">
                <Link
                  to="/medico/agendamento"
                  className="block p-2 rounded hover:bg-gray-700"
                >
                  Agendar uma Consulta
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/medico/auxiliares"
                  className="block p-2 rounded hover:bg-gray-700"
                >
                  Auxiliares
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/medico/pacientes"
                  className="block p-2 rounded hover:bg-gray-700"
                >
                  Pacientes
                </Link>
              </li>
            </ul>
          </li>
          <li className="mb-2">
            <Link
              to="/medico/consultas"
              className="block p-2 rounded hover:bg-gray-700"
            >
              Consultas
            </Link>
          </li>
          <li className="mt-4 pt-4 border-t border-gray-700">
            <Link
              to="/medico/meu-perfil"
              className="block p-2 rounded hover:bg-gray-700"
            >
              Meu Perfil
            </Link>
          </li>
        </ul>
      </nav>
      <div className="mt-auto">
        <p className="text-xs text-gray-400">© 2025</p>
      </div>
    </div>
  );
}
