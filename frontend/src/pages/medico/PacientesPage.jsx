import { useState, useEffect, useCallback } from "react";
import { getMeusPacientes } from "../../services/pacienteService";
import Modal from "../../components/Modal";
import AddPacienteForm from "../../components/paciente/AddPacienteForm";
import Pagination from "../../components/Pagination";
import { useOutletContext } from "react-router-dom";
import { InputMask } from "@react-input/mask";

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
  const [itensPorPagina] = useState(10);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const { setPageTitle } = useOutletContext();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    nome: "",
    email: "",
    telefone: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    nome: "",
    email: "",
    telefone: "",
  });

  useEffect(() => {
    setPageTitle("Meus Pacientes");
  }, [setPageTitle]);

  const handleSuccess = () => {
    setRefetchTrigger((prev) => prev + 1);
    setIsModalOpen(false);
  };

  const buildFilterString = (applied) => {
    const parts = [];
    if (applied.nome) parts.push(`nome co '${applied.nome}'`);
    if (applied.email) parts.push(`email co '${applied.email}'`);
    if (applied.telefone)
      parts.push(`telefone co '${applied.telefone.replace(/\D/g, "")}'`);
    return parts.length ? parts.join(" AND ") : undefined;
  };

  const fetchPacientes = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = {
        page: paginaAtual,
        size: itensPorPagina,
        sort: sortConfig.key,
        order: sortConfig.direction,
      };

      const filterString = buildFilterString(appliedFilters);
      if (filterString) {
        params.filter = filterString;
      }

      const response = await getMeusPacientes(params);

      setPacientes(response.data.contents);
      setTotalPaginas(response.data.totalPages);
    } catch {
      setError("Não foi possível carregar a lista de pacientes.");
    } finally {
      setIsLoading(false);
    }
  }, [paginaAtual, itensPorPagina, sortConfig, refetchTrigger, appliedFilters]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      setSortConfig({ key: "ultimaConsultaData", direction: "desc" });
      setPaginaAtual(1);
      return;
    }
    setSortConfig({ key, direction });
    setPaginaAtual(1);
  };

  const handlePageChange = (novaPagina) => {
    setPaginaAtual(novaPagina);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPaginaAtual(1);
  };

  const handleClearFilters = () => {
    setFilters({ nome: "", email: "", telefone: "" });
    setAppliedFilters({ nome: "", email: "", telefone: "" });
    setPaginaAtual(1);
  };

  if (isLoading && pacientes.length === 0) {
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

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 w-full sm:w-auto"
        >
          Adicionar Paciente
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg mb-6">
        <div
          className="p-4 flex justify-between items-center cursor-pointer"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <h2 className="font-semibold text-gray-700">Filtros</h2>
          <svg
            className={`h-6 w-6 transform transition-transform ${
              isFilterOpen ? "rotate-180" : ""
            }`}
            xmlns="http://www.w3.org/2000/svg"
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
        </div>

        {isFilterOpen && (
          <div className="p-4 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {" "}
              {/* 3 Colunas */}
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nome
                </label>
                <input
                  type="text"
                  name="nome"
                  id="nome"
                  value={filters.nome}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  placeholder="Buscar por nome..."
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="text"
                  name="email"
                  id="email"
                  value={filters.email}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  placeholder="Buscar por email..."
                />
              </div>
              <div>
                <label
                  htmlFor="telefone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Telefone
                </label>
                <InputMask
                  mask="(__) _____-____"
                  replacement={{ _: /\d/ }}
                  id="telefone"
                  name="telefone"
                  value={filters.telefone}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                onClick={handleClearFilters}
                className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300"
              >
                Limpar
              </button>
              <button
                onClick={handleApplyFilters}
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700"
              >
                Filtrar
              </button>
            </div>
          </div>
        )}
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
                  Nome
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
                  Email
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
                  Última Consulta
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
      <Pagination
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
