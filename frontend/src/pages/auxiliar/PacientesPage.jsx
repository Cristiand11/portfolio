import { useState, useEffect, useCallback } from "react";
import { getMeuMedicoVinculado } from "../../services/auxiliarService";
import { getPacientesByMedicoId } from "../../services/pacienteService";
import toast from "react-hot-toast";
import Modal from "../../components/Modal";
import AddPacienteForm from "../../components/paciente/AddPacienteForm";
import Pagination from "../../components/Pagination";

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
  const [medicoVinculado, setMedicoVinculado] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "nome",
    direction: "asc",
  });
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [itensPorPagina] = useState(10);

  useEffect(() => {
    const fetchMedico = async () => {
      setIsLoading(true);
      setError("");
      try {
        const medicoRes = await getMeuMedicoVinculado();
        if (!medicoRes.data || !medicoRes.data.id) {
          throw new Error("Médico vinculado não identificado.");
        }
        setMedicoVinculado(medicoRes.data);
      } catch (err) {
        setError("Não foi possível identificar o médico vinculado.");
        setIsLoading(false);
        toast.error("Não foi possível identificar o médico vinculado.");
      }
    };
    fetchMedico();
  }, []);

  const fetchPacientes = useCallback(async () => {
    if (!medicoVinculado?.id) return;

    setIsLoading(true);
    setError("");

    try {
      const paginaParaApi = paginaAtual > 0 ? paginaAtual - 1 : 0;
      const response = await getPacientesByMedicoId(
        medicoVinculado.id,
        paginaParaApi,
        itensPorPagina,
        sortConfig
      );
      setPacientes(response.data.contents || []);
      setTotalPaginas(response.data.totalPages || 0);
    } catch (err) {
      setError("Não foi possível carregar a lista de pacientes.");
      toast.error("Não foi possível carregar a lista de pacientes.");
      setPacientes([]);
      setTotalPaginas(0);
    } finally {
      setIsLoading(false);
    }
  }, [medicoVinculado, sortConfig, paginaAtual, itensPorPagina]);

  useEffect(() => {
    if (medicoVinculado?.id) {
      fetchPacientes();
    }
  }, [fetchPacientes, refetchTrigger, medicoVinculado]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    setPaginaAtual(1);
    setRefetchTrigger((prev) => prev + 1);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setPaginaAtual(1);
  };

  const handlePageChange = (novaPagina) => {
    setPaginaAtual(novaPagina);
  };

  if (isLoading && !medicoVinculado) {
    return <div className="text-center p-10">Carregando...</div>;
  }
  if (error && !pacientes.length && !isLoading) {
    return <div className="text-center p-10 text-red-600">{error}</div>;
  }

  return (
    <div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Paciente"
      >
        <AddPacienteForm
          medicoId={medicoVinculado?.id}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      </Modal>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Pacientes - Dr(a). {medicoVinculado?.nome || "..."}
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!medicoVinculado}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 w-full sm:w-auto disabled:bg-indigo-300"
        >
          Adicionar Paciente
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort("nome")}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase"
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
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase"
                >
                  Email{" "}
                  <SortIcon
                    direction={
                      sortConfig.key === "email" ? sortConfig.direction : null
                    }
                  />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rounded-tr-lg">
                Telefone
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="4" className="text-center py-10 rounded-b-lg">
                  Carregando pacientes...
                </td>
              </tr>
            ) : pacientes.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-10 text-gray-500 rounded-b-lg"
                >
                  Nenhum paciente encontrado para este médico.
                </td>
              </tr>
            ) : (
              pacientes.map((paciente, index) => (
                <tr key={paciente.id}>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${
                      index === pacientes.length - 1 ? "rounded-bl-lg" : ""
                    }`}
                  >
                    {paciente.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {paciente.email || "N/A"}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${
                      index === pacientes.length - 1 ? "rounded-br-lg" : ""
                    }`}
                  >
                    {paciente.telefone || "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
