import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import DatePicker from "../../components/DatePicker";
import {
  getMinhasConsultas,
  confirmarConsulta,
  cancelarConsultaAdmin,
  concluirConsulta,
  aceitarRemarcacao,
  rejeitarRemarcacao,
} from "../../services/consultaService";
import ActionsDropdown from "../../components/ActionsDropdown";
import Modal from "../../components/Modal";
import AgendamentoForm from "../../components/consulta/AgendamentoForm";
import RemarcacaoForm from "../../components/consulta/RemarcacaoForm";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";
import toast from "react-hot-toast";
import { useOutletContext } from "react-router-dom";

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

export default function ConsultasMedicoPage() {
  const [consultas, setConsultas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "data",
    direction: "asc",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    paciente: "",
    data: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    status: "",
    paciente: "",
    data: "",
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false);
  const [remarcacaoModalState, setRemarcacaoModalState] = useState({
    isOpen: false,
    consulta: null,
  });
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [itensPorPagina] = useState(10);
  const { setPageTitle } = useOutletContext();

  useEffect(() => {
    setPageTitle("Gerenciar Consultas");
  }, [setPageTitle]);

  const buildFilterString = (applied) => {
    const parts = [];
    if (applied.status) parts.push(`status eq '${applied.status}'`);
    if (applied.paciente) parts.push(`nomePaciente co '${applied.paciente}'`);
    if (applied.data) parts.push(`data eq '${applied.data}'`);
    return parts.length ? parts.join(" AND ") : undefined;
  };

  const fetchConsultas = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: paginaAtual,
        size: itensPorPagina,
        sort: sortConfig.key,
        order: sortConfig.direction,
      };

      const filterString = buildFilterString(appliedFilters);
      if (filterString) params.filter = filterString;

      const response = await getMinhasConsultas(params);

      setConsultas(response.data.contents || []);
      setTotalPaginas(response.data.totalPages || 0);
      setSelectedIds([]);
    } catch (err) {
      toast.error("Não foi possível carregar as consultas.");
      setConsultas([]);
      setTotalPaginas(0);
    } finally {
      setIsLoading(false);
    }
  }, [sortConfig, appliedFilters, paginaAtual, itensPorPagina]);

  useEffect(() => {
    fetchConsultas();
  }, [fetchConsultas]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
    setPaginaAtual(1);
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(consultas.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  /*
  Removida por solicitação da professora
  const handleBulkDelete = () => {
    setConfirmModalState({
      isOpen: true,
      title: `Excluir ${selectedIds.length} Consultas`,
      message: `Tem certeza de que deseja excluir permanentemente as ${selectedIds.length} consultas selecionadas?`,
      onConfirm: async () => {
        try {
          await deleteVariasConsultas(selectedIds);
          toast.success("Consultas excluídas com sucesso!");
          setSelectedIds([]);
          fetchConsultas();
        } catch (err) {
          toast.error("Não foi possível excluir as consultas.");
        }
        setConfirmModalState({ isOpen: false });
      },
    });
  };
  */

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateFilterChange = (date) => {
    const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
    setFilters((prev) => ({ ...prev, data: formattedDate }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPaginaAtual(1);
  };

  const handleClearFilters = () => {
    setFilters({ status: "", paciente: "", data: "" });
    setAppliedFilters({ status: "", paciente: "", data: "" });
    setPaginaAtual(1);
  };

  const handlePageChange = (novaPagina) => {
    setPaginaAtual(novaPagina);
  };

  const handleConfirm = async (id) => {
    try {
      await confirmarConsulta(id);
      toast.success("Consulta confirmada!");
      fetchConsultas();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao confirmar.");
    }
  };

  const executeCancel = async () => {
    const consultaId = confirmModalState.onConfirm;
    try {
      await cancelarConsultaAdmin(consultaId);
      toast.success("Consulta cancelada!");
      fetchConsultas();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao cancelar.");
    } finally {
      setConfirmModalState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
      });
    }
  };

  const handleCancel = (id) => {
    setConfirmModalState({
      isOpen: true,
      title: "Confirmar Cancelamento",
      message:
        "Tem certeza de que deseja cancelar esta consulta? O paciente será notificado.",
      onConfirm: id,
    });
  };

  const handleConcluir = async (id) => {
    try {
      await concluirConsulta(id);
      toast.success("Consulta marcada como concluída!");
      fetchConsultas();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Não foi possível concluir a consulta."
      );
    }
  };

  const handleIniciarRemarcacao = (consulta) => {
    setRemarcacaoModalState({ isOpen: true, consulta: consulta });
  };

  const handleAceitarRemarcacao = async (id) => {
    const consultaParaRemarcar = consultas.find((c) => c.id === id);
    if (!consultaParaRemarcar) return;

    const dataAntiga = new Date(consultaParaRemarcar.data).toLocaleDateString(
      "pt-BR",
      { timeZone: "UTC" }
    );
    const dataNova = new Date(
      consultaParaRemarcar.dataRemarcacaoSugerida
    ).toLocaleDateString("pt-BR", { timeZone: "UTC" });

    setConfirmModalState({
      isOpen: true,
      title: "Confirmar Remarcação",
      message: `Aceitar a proposta de remarcação do paciente ${consultaParaRemarcar.nomePaciente}? De: ${dataAntiga} às ${consultaParaRemarcar.hora}. Para: ${dataNova} às ${consultaParaRemarcar.horaRemarcacaoSugerida}.`,
      onConfirm: async () => {
        try {
          await aceitarRemarcacao(id);
          toast.success("Remarcação aceita com sucesso!");
          fetchConsultas();
        } catch (err) {
          toast.error(
            err.response?.data?.message || "Erro ao aceitar remarcação."
          );
        }
        setConfirmModalState({ isOpen: false });
      },
    });
  };

  const handleRejeitarRemarcacao = (id) => {
    setConfirmModalState({
      isOpen: true,
      title: "Confirmar Rejeição",
      message:
        "Tem certeza de que deseja rejeitar esta proposta de remarcação? A consulta voltará ao seu horário original.",
      onConfirm: async () => {
        try {
          await rejeitarRemarcacao(id);
          toast.success("Remarcação rejeitada com sucesso!");
          fetchConsultas();
        } catch (err) {
          toast.error(
            err.response?.data?.message || "Erro ao rejeitar remarcação."
          );
        }
        // Fecha o modal após a ação ser concluída
        setConfirmModalState({ isOpen: false });
      },
    });
  };

  const handleCloseModal = () => {
    setRemarcacaoModalState({ isOpen: false, consulta: null });
  };

  const handleSuccess = () => {
    handleCloseModal();
    fetchConsultas();
  };

  const getActionsForConsulta = (consulta) => {
    const actions = [];
    const agora = new Date();
    const dataHoraConsulta = new Date(`${consulta.data}T${consulta.hora}`);

    // Regra para Concluir
    if (
      agora > dataHoraConsulta &&
      ![
        "Concluída",
        "Cancelada Pelo Paciente",
        "Cancelada Pelo Médico/Auxiliar",
        "Expirada",
      ].includes(consulta.status)
    ) {
      actions.push({
        label: "Marcar como Concluída",
        onClick: () => handleConcluir(consulta.id),
        className: "text-blue-700",
      });
    }

    // Regra para Aprovar (consulta futura)
    if (
      consulta.status === "Aguardando Confirmação do Médico" &&
      agora < dataHoraConsulta
    ) {
      actions.push({
        label: "Aprovar",
        onClick: () => handleConfirm(consulta.id),
        className: "text-green-700",
      });
      actions.push({
        label: "Rejeitar",
        onClick: () => handleCancel(consulta.id),
        className: "text-red-700",
      });
    }

    // Regra para Consultas Confirmadas (futuras)
    if (consulta.status === "Confirmada" && agora < dataHoraConsulta) {
      actions.push({
        label: "Cancelar",
        onClick: () => handleCancel(consulta.id),
        className: "text-red-700",
      });
      actions.push({
        label: "Remarcar",
        onClick: () => handleIniciarRemarcacao(consulta),
      });
    }

    return actions;
  };

  return (
    <div>
      <Modal
        isOpen={isAgendamentoModalOpen}
        onClose={() => setIsAgendamentoModalOpen(false)}
        title="Marcar Nova Consulta"
      >
        <AgendamentoForm
          initialData={null}
          onSuccess={() => {
            setIsAgendamentoModalOpen(false);
            fetchConsultas();
          }}
          onClose={() => setIsAgendamentoModalOpen(false)}
        />
      </Modal>
      <Modal
        isOpen={remarcacaoModalState.isOpen}
        onClose={handleCloseModal}
        title="Solicitar Remarcação"
      >
        <RemarcacaoForm
          consulta={{ extendedProps: remarcacaoModalState.consulta }}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      </Modal>
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        onConfirm={executeCancel}
        onClose={() => setConfirmModalState({ isOpen: false })}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setIsAgendamentoModalOpen(true)}
            className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 w-full sm:w-auto"
          >
            Marcar Consulta
          </button>
        </div>
      </div>

      <div className="mt-4 bg-white shadow-md rounded-lg">
        <div
          className="p-4 flex justify-between items-center cursor-pointer"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <h2 className="font-semibold">Filtros</h2>
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
              <div>
                <label
                  htmlFor="paciente"
                  className="block text-sm font-medium text-gray-700"
                >
                  Paciente
                </label>
                <input
                  type="text"
                  name="paciente"
                  id="paciente"
                  value={filters.paciente}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label
                  htmlFor="data"
                  className="block text-sm font-medium text-gray-700"
                >
                  Data
                </label>
                <DatePicker
                  value={filters.data}
                  onChange={handleDateFilterChange}
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700"
                >
                  Status
                </label>
                <select
                  name="status"
                  id="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                >
                  <option value="">Todos</option>
                  <option value="Confirmada">Confirmada</option>
                  <option value="Aguardando Confirmação do Médico">
                    Aguardando Aprovação
                  </option>
                  <option value="Aguardando Confirmação do Paciente">
                    Aguardando Paciente
                  </option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="Concluída">Concluída</option>
                  <option value="Expirada">Expirada</option>
                </select>
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

      <div className="mt-6 bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-16 text-center rounded-tl-lg">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    consultas.length > 0 &&
                    selectedIds.length === consultas.length
                  }
                  className="h-4 w-4 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider rounded-tl-lg">
                <button
                  onClick={() => handleSort("nomePaciente")}
                  className="flex items-center uppercase gap-2"
                >
                  Paciente
                  <SortIcon
                    direction={
                      sortConfig.key === "nomePaciente"
                        ? sortConfig.direction
                        : null
                    }
                  />
                </button>
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                <button
                  onClick={() => handleSort("data")}
                  className="flex items-center uppercase gap-2"
                >
                  Data
                  <SortIcon
                    direction={
                      sortConfig.key === "data" ? sortConfig.direction : null
                    }
                  />
                </button>
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hora
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center uppercase gap-2"
                >
                  Status
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
            {isLoading && consultas.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 ...">
                  Carregando...
                </td>
              </tr>
            ) : consultas.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 ...">
                  Nenhuma consulta encontrada.
                </td>
              </tr>
            ) : (
              consultas.map((consulta, index) => (
                <tr
                  key={consulta.id}
                  className={
                    selectedIds.includes(consulta.id) ? "bg-indigo-50" : ""
                  }
                >
                  <td
                    className={`px-4 py-4 w-16 text-center ${
                      index === consultas.length - 1 ? "rounded-bl-lg" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(consulta.id)}
                      onChange={() => handleSelectOne(consulta.id)}
                      className="h-4 w-4 rounded"
                    />
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${
                      index === consultas.length - 1 ? "rounded-bl-lg" : ""
                    }`}
                  >
                    {consulta.nomePaciente}
                  </td>

                  {/* Célula da Data */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(consulta.data).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}
                  </td>

                  {/* Célula da Hora */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consulta.hora}
                  </td>

                  {/* Célula do Status */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consulta.status}
                  </td>

                  {/* Célula de Ações com arredondamento condicional */}
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      index === consultas.length - 1 ? "rounded-br-lg" : ""
                    }`}
                  >
                    <ActionsDropdown
                      actions={getActionsForConsulta(consulta)}
                    />
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
