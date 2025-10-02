import { useState, useEffect, useCallback } from "react";
import {
  getMinhasConsultas,
  confirmarConsulta,
  cancelarConsultaAdmin,
  concluirConsulta,
} from "../../services/consultaService";
import ActionsDropdown from "../../components/ActionsDropdown";
import toast from "react-hot-toast";

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
  const [isFilterOpen, setIsFilterOpen] = useState(true);
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

  console.log("Estado de Ordenação Atual (sortConfig):", sortConfig);

  const fetchConsultas = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        size: 100,
        sort: sortConfig.key,
        order: sortConfig.direction,
        filter: [],
      };

      if (appliedFilters.status) {
        params.filter.push(`status eq '${appliedFilters.status}'`);
      }
      if (appliedFilters.paciente) {
        params.filter.push(`nomePaciente co '${appliedFilters.paciente}'`);
      }
      if (appliedFilters.data) {
        params.filter.push(`data eq '${appliedFilters.data}'`);
      }

      const response = await getMinhasConsultas(params);
      setConsultas(response.data.contents);
    } catch (err) {
      toast.error("Não foi possível carregar as consultas.");
    } finally {
      setIsLoading(false);
    }
  }, [sortConfig, appliedFilters]);

  useEffect(() => {
    fetchConsultas();
  }, [fetchConsultas]);

  const handleSort = (key) => {
    let newDirection = "asc";
    let newKey = key;

    // Se está a clicar na mesma coluna que já está ordenada...
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        // Se está 'asc', muda para 'desc' (segundo clique)
        newDirection = "desc";
      } else if (sortConfig.direction === "desc") {
        // Se está 'desc', volta para o padrão (terceiro clique)
        newKey = "data"; // Chave de ordenação padrão
        newDirection = "asc"; // Direção padrão
      }
    }
    // Se for uma coluna nova, a direção padrão 'asc' já está definida.

    setSortConfig({ key: newKey, direction: newDirection });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    setFilters({ status: "", paciente: "", data: "" });
    setAppliedFilters({ status: "", paciente: "", data: "" });
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

  const handleCancel = async (id) => {
    if (window.confirm("Tem certeza? A ação notificará o paciente.")) {
      try {
        await cancelarConsultaAdmin(id);
        toast.success("Consulta cancelada!");
        fetchConsultas();
      } catch (err) {
        toast.error(err.response?.data?.message || "Erro ao cancelar.");
      }
    }
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
    toast("Funcionalidade de remarcação a ser implementada.");
    console.log("Remarcar:", consulta);
  };

  const handleAceitarRemarcacao = (id) => {
    toast("Funcionalidade de aceitar remarcação a ser implementada.");
    console.log("Aceitar remarcação da consulta:", id);
  };

  const handleRejeitarRemarcacao = (id) => {
    toast("Funcionalidade de rejeitar remarcação a ser implementada.");
    console.log("Rejeitar remarcação da consulta:", id);
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

    // Se o paciente solicitou uma remarcação
    if (
      consulta.status === "Remarcação Solicitada Pelo Paciente" &&
      agora < dataHoraConsulta
    ) {
      actions.push({
        label: "Aceitar Remarcação",
        onClick: () => handleAceitarRemarcacao(consulta.id),
        className: "text-green-700",
      });
      actions.push({
        label: "Rejeitar Remarcação",
        onClick: () => handleRejeitarRemarcacao(consulta.id),
        className: "text-red-700",
      });
    }

    return actions;
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">
        Gerenciar Consultas
      </h1>

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
          <div className="p-4 border-t">
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
                <input
                  type="date"
                  name="data"
                  id="data"
                  value={filters.data}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
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
                  <option value="Concluída">Concluída</option>
                  <option value="Expirada">Expirada</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4">
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
                  onClick={() => handleSort("nomePaciente")}
                  className="flex items-center gap-2"
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

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("data")}
                  className="flex items-center gap-2"
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

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-2"
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
            {isLoading ? (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-10 text-gray-500 rounded-tl-lg"
                >
                  Carregando...
                </td>
              </tr>
            ) : consultas.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-10 text-gray-500 rounded-tl-lg"
                >
                  Nenhuma consulta encontrada.
                </td>
              </tr>
            ) : (
              consultas.map((consulta, index) => (
                <tr key={consulta.id}>
                  {/* Célula do Paciente com arredondamento condicional */}
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
    </div>
  );
}
