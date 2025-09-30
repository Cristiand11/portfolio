import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const { logout, user } = useAuth(); // Pega a função de logout do contexto

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-semibold text-gray-700">Dashboard</h1>
      </div>
      <div>
        {/* Adicionar nome do usuário aqui quando tivermos no contexto */}
        {/* <span className="mr-4">Olá, {user?.nome || 'Usuário'}!</span> */}
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
