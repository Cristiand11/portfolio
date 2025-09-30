import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProfileSelectionPage() {
  const { selectProfile } = useAuth();
  const perfis = [
    { displayName: "Paciente", apiValue: "paciente" },
    { displayName: "Médico", apiValue: "medico" },
    { displayName: "Auxiliar", apiValue: "auxiliar" },
    { displayName: "Administrador", apiValue: "administrador" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Selecione seu Perfil</h1>
      <div className="grid grid-cols-2 gap-4">
        {perfis.map((perfil) => (
          <button
            key={perfil}
            onClick={() => selectProfile(perfil.apiValue)}
            className="p-6 bg-white rounded-lg shadow-md text-center font-semibold text-gray-700 hover:bg-indigo-500 hover:text-white transition-colors"
          >
            {perfil.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
