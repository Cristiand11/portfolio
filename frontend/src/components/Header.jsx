import { useAuth } from "../contexts/AuthContext";

export default function Header({ onMenuButtonClick, title }) {
  const { logout, user } = useAuth();

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center">
        <button
          onClick={onMenuButtonClick}
          className="text-gray-500 mr-4 md:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-700">{title}</h1>
      </div>
      <div>
        <span className="mr-4">{user?.nome || "Usuário"}</span>
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
