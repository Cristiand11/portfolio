import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  getAllMedicos,
  solicitarInativacao,
} from "../../services/adminService";
import toast from "react-hot-toast";
import Modal from "../../components/Modal";
import AddMedicoForm from "../../components/medico/AddMedicoForm";
import EditMedicoForm from "../../components/medico/EditMedicoForm";
import ActionsDropdown from "../../components/ActionsDropdown";
import DatePicker from "../../components/DatePicker";
import ConfirmModal from "../../components/ConfirmModal";

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

export default function MedicosAdminPage() {
  const [medicos, setMedicos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "data",
    direction: "asc",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalState, setEditModalState] = useState({
    isOpen: false,
    medico: null,
  });
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [filters, setFilters] = useState({
    nome: "",
    crm: "",
    especialidade: "",
    createdDate: "",
    status: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    nome: "",
    crm: "",
    especialidade: "",
    createdDate: "",
    status: "",
  });

  const buildFilterString = (applied) => {
    const parts = [];
    if (applied.nome) parts.push(`nome co '${applied.nome}'`);
    if (applied.crm) parts.push(`crm co '${applied.crm}'`);
    if (applied.especialidade)
      parts.push(`especialidade co '${applied.especialidade}'`);
    if (applied.createdDate)
      parts.push(`createdDate eq '${applied.createdDate}'`);
    if (applied.status) parts.push(`status eq '${applied.status}'`);
    return parts.length ? parts.join(" AND ") : undefined;
  };

  const fetchMedicos = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        size: 100,
        sort: sortConfig.key,
        order: sortConfig.direction,
      };

      const filterString = buildFilterString(appliedFilters);
      if (filterString) params.filter = filterString;

      const response = await getAllMedicos(params);
      setMedicos(response.data.contents);
    } catch (err) {
      toast.error("Não foi possível carregar a lista de médicos.");
    } finally {
      setIsLoading(false);
    }
  }, [sortConfig, appliedFilters]);

  useEffect(() => {
    fetchMedicos();
  }, [fetchMedicos]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleSuccess = () => {
    fetchMedicos();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateFilterChange = (date) => {
    const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
    setFilters((prev) => ({ ...prev, createdDate: formattedDate }));
  };

  const handleApplyFilters = () => setAppliedFilters(filters);

  const handleClearFilters = () => {
    setFilters({
      nome: "",
      crm: "",
      especialidade: "",
      createdDate: "",
      status: "",
    });
    setAppliedFilters({
      nome: "",
      crm: "",
      especialidade: "",
      createdDate: "",
      status: "",
    });
  };

  const handleOpenEditModal = (medico) => {
    setEditModalState({ isOpen: true, medico: medico });
  };

  const handleSolicitarInativacao = (medico) => {
    setConfirmModalState({
      isOpen: true,
      title: "Confirmar Solicitação",
      message: `Tem a certeza de que deseja solicitar a inativação do médico ${medico.nome}? Ele terá 5 dias úteis para a reversão.`,
      onConfirm: async () => {
        try {
          await solicitarInativacao(medico.id);
          toast.success("Solicitação de inativação registada!");
          fetchMedicos();
        } catch (err) {
          toast.error(
            err.response?.data?.message ||
              "Não foi possível solicitar a inativação."
          );
        }
        setConfirmModalState({ isOpen: false });
      },
    });
  };

  const getActionsForMedico = (medico) => {
    const actions = [];
    actions.push({
      label: "Editar",
      onClick: () => handleOpenEditModal(medico),
    });
    if (medico.status === "Ativo") {
      actions.push({
        label: "Solicitar Inativação",
        onClick: () => handleSolicitarInativacao(medico),
        className: "text-red-700",
      });
    }
    return actions;
  };

  return (
    <div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Médico"
      >
        <AddMedicoForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      </Modal>

      <Modal
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState({ isOpen: false, medico: null })}
        title="Editar Dados do Médico"
      >
        <EditMedicoForm
          medico={editModalState.medico}
          onClose={() => setEditModalState({ isOpen: false, medico: null })}
          onSuccess={handleSuccess}
        />
      </Modal>

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        onConfirm={confirmModalState.onConfirm}
        onClose={() => setConfirmModalState({ isOpen: false })}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Gerenciar Médicos
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700"
        >
          Adicionar Médico
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg">
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  type="text"
                  name="nome"
                  value={filters.nome}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  CRM
                </label>
                <input
                  type="text"
                  name="crm"
                  value={filters.crm}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Especialidade
                </label>
                <input
                  type="text"
                  name="especialidade"
                  value={filters.especialidade}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data de Cadastro
                </label>
                <DatePicker
                  value={filters.createdDate}
                  onChange={handleDateFilterChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                >
                  <option value="">Todos</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Aguardando Inativação">
                    Aguardando Inativação
                  </option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-4">
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

      <div className="mt-6 bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                <button
                  onClick={() => handleSort("nome")}
                  className="flex items-center uppercase gap-2"
                >
                  Nome{" "}
                  <SortIcon
                    direction={
                      sortConfig.key === "nome" ? sortConfig.direction : null
                    }
                  />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("crm")}
                  className="flex items-center uppercase gap-2"
                >
                  CRM{" "}
                  <SortIcon
                    direction={
                      sortConfig.key === "crm" ? sortConfig.direction : null
                    }
                  />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("especialidade")}
                  className="flex items-center uppercase gap-2"
                >
                  Especialidade{" "}
                  <SortIcon
                    direction={
                      sortConfig.key === "especialidade"
                        ? sortConfig.direction
                        : null
                    }
                  />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("createdDate")}
                  className="flex items-center uppercase gap-2"
                >
                  Data de Cadastro{" "}
                  <SortIcon
                    direction={
                      sortConfig.key === "createdDate"
                        ? sortConfig.direction
                        : null
                    }
                  />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center uppercase gap-2"
                >
                  Status{" "}
                  <SortIcon
                    direction={
                      sortConfig.key === "status" ? sortConfig.direction : null
                    }
                  />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center py-10 rounded-b-lg">
                  Carregando...
                </td>
              </tr>
            ) : medicos.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-10 rounded-b-lg text-gray-500"
                >
                  Nenhum médico encontrado.
                </td>
              </tr>
            ) : (
              medicos.map((medico, index) => (
                <tr key={medico.id}>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${
                      index === medicos.length - 1 ? "rounded-bl-lg" : ""
                    }`}
                  >
                    {medico.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {medico.crm}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {medico.especialidade || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(medico.createdDate).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        medico.status === "Ativo"
                          ? "bg-green-100 text-green-800"
                          : medico.status === "Aguardando Inativação"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {medico.status}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      index === medicos.length - 1 ? "rounded-br-lg" : ""
                    }`}
                  >
                    <ActionsDropdown actions={getActionsForMedico(medico)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
