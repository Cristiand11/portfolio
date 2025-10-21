import { useState, useEffect } from "react";
import { getMeusPacientes } from "../../services/pacienteService";
import Modal from "../../components/Modal";
import AddPacienteForm from "../../components/paciente/AddPacienteForm";

const SortIcon = ({ direction }) => {
  if (!direction) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
        />
      </svg>
    );
  }

  // Ícone para ordenação ascendente (seta para cima)
  if (direction === "asc") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-gray-800"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    );
  }

  // Ícone para ordenação descendente (seta para baixo)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 text-gray-800"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
};

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: "ultimaConsultaData",
    direction: "desc",
  });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);

  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const handleSuccess = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchPacientes = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await getMeusPacientes(paginaAtual, 10, sortConfig);
        setPacientes(response.data.contents);
        setTotalPaginas(response.data.totalPages);
      } catch (err) {
        console.error("Erro ao buscar pacientes:", err);
        setError("Não foi possível carregar a lista de pacientes.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPacientes();
  }, [paginaAtual, sortConfig, refetchTrigger]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      setSortConfig({ key: "ultimaConsultaData", direction: "desc" });
      return;
    }
    setSortConfig({ key, direction });
  };

  if (isLoading) {
    return <div>Carregando pacientes...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Paciente"
      >
        <AddPacienteForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      </Modal>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Meus Pacientes
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 w-full sm:w-auto"
        >
          Adicionar Paciente
        </button>
      </div>

      {/* Tabela de Pacientes */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort("nome")}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nome{" "}
                  <SortIcon
                    direction={
                      sortConfig.key === "nome" ? sortConfig.direction : null
                    }
                  />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort("email")}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email{" "}
                  <SortIcon
                    direction={
                      sortConfig.key === "email" ? sortConfig.direction : null
                    }
                  />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefone
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort("ultimaConsultaData")}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Última Consulta{" "}
                  <SortIcon
                    direction={
                      sortConfig.key === "ultimaConsultaData"
                        ? sortConfig.direction
                        : null
                    }
                  />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pacientes.map((paciente) => (
              <tr key={paciente.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {paciente.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {paciente.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {paciente.telefone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {paciente.ultimaConsultaData}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Aqui virá a navegação da paginação */}
    </div>
  );
}
