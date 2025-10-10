import { useState, useEffect, useCallback } from "react";
import {
  getMinhasConsultas,
  cancelarConsulta,
  confirmarConsulta,
  aceitarRemarcacao,
  rejeitarRemarcacao,
} from "../../services/consultaService";
import toast from "react-hot-toast";
import ActionsDropdown from "../../components/ActionsDropdown";
import Modal from "../../components/Modal";
import SolicitarConsultaForm from "../../components/paciente/SolicitarConsultaForm";
import RemarcacaoForm from "../../components/consulta/RemarcacaoForm";
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

export default function ConsultasPacientePage() {
  const [consultas, setConsultas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [sortConfig, setSortConfig] = useState({
    key: "data",
    direction: "asc",
  });

  const fetchConsultas = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        size: 100,
        sort: sortConfig.key,
        order: sortConfig.direction,
      };
      const response = await getMinhasConsultas({ params });
      setConsultas(response.data.contents);
    } catch (err) {
      setError("Não foi possível carregar as suas consultas.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [sortConfig]);

  useEffect(() => {
    fetchConsultas();
  }, [fetchConsultas]);

  const handleCloseModal = () => {
    setRemarcacaoModalState({ isOpen: false, consulta: null });
  };

  const handleSuccess = () => {
    handleCloseModal();
    fetchConsultas();
  };

  const handleSort = (key) => {
    let newDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      newDirection = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      setSortConfig({ key: "data", direction: "asc" });
      return;
    }
    setSortConfig({ key, direction: newDirection });
  };

  // --- Funções de Ação ---
  const handleConfirmar = async (id) => {
    try {
      await confirmarConsulta(id);
      toast.success("Consulta confirmada com sucesso!");
      fetchConsultas();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Não foi possível confirmar a consulta."
      );
    }
  };

  const handleCancelar = (id) => {
    setConfirmModalState({
      isOpen: true,
      title: "Confirmar Cancelamento",
      message:
        "Tem a certeza de que deseja solicitar o cancelamento desta consulta?",
      onConfirm: async () => {
        try {
          await cancelarConsulta(id);
          toast.success("Cancelamento solicitado com sucesso!");
          fetchConsultas();
        } catch (err) {
          toast.error(
            err.response?.data?.message ||
              "Não foi possível cancelar a consulta."
          );
        }
        setConfirmModalState({ isOpen: false });
      },
    });
  };

  const handleIniciarRemarcacao = (consulta) => {
    setRemarcacaoModalState({
      isOpen: true,
      consulta: { extendedProps: consulta, title: consulta.nomeMedico },
    });
  };

  const handleAceitarRemarcacao = async (id) => {
    try {
      await aceitarRemarcacao(id);
      toast.success("Remarcação aceite com sucesso!");
      fetchConsultas();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao aceitar remarcação.");
    }
  };

  const handleRejeitarRemarcacao = (id) => {
    setConfirmModalState({
      isOpen: true,
      title: "Rejeitar Proposta",
      message:
        "Tem a certeza de que deseja rejeitar esta proposta de remarcação?",
      onConfirm: async () => {
        try {
          await rejeitarRemarcacao(id);
          toast.success("Remarcação rejeitada!");
          fetchConsultas();
        } catch (err) {
          toast.error(
            err.response?.data?.message || "Erro ao rejeitar proposta."
          );
        }
        setConfirmModalState({ isOpen: false });
      },
    });
  };

  const getActionsForConsulta = (consulta) => {
    const actions = [];
    const agora = new Date();
    const dataHoraConsulta = new Date(`${consulta.data}T${consulta.hora}`);

    if (agora < dataHoraConsulta) {
      if (consulta.status === "Aguardando Confirmação do Paciente") {
        actions.push({
          label: "Confirmar",
          onClick: () => handleConfirmar(consulta.id),
          className: "text-green-700",
        });
        actions.push({
          label: "Rejeitar",
          onClick: () => handleCancelar(consulta.id),
          className: "text-red-700",
        });
      }
      if (consulta.status === "Remarcação Solicitada Pelo Médico") {
        actions.push({
          label: "Aceitar Proposta",
          onClick: () => handleAceitarRemarcacao(consulta.id),
          className: "text-green-700",
        });
        actions.push({
          label: "Rejeitar Proposta",
          onClick: () => handleRejeitarRemarcacao(consulta.id),
          className: "text-red-700",
        });
      }
      if (consulta.status === "Confirmada") {
        actions.push({
          label: "Cancelar",
          onClick: () => handleCancelar(consulta.id),
          className: "text-red-700",
        });
        actions.push({
          label: "Solicitar Remarcação",
          onClick: () => handleIniciarRemarcacao(consulta),
        });
      }
    }
    return actions;
  };

  if (isLoading) return <div>A carregar as suas consultas...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Solicitar Nova Consulta"
      >
        <SolicitarConsultaForm
          onClose={() => setIsModalOpen(false)}
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
      {remarcacaoModalState.consulta && (
        <Modal
          isOpen={remarcacaoModalState.isOpen}
          onClose={handleCloseModal}
          title="Solicitar Remarcação"
        >
          <RemarcacaoForm
            consulta={remarcacaoModalState.consulta}
            onClose={handleCloseModal}
            onSuccess={handleSuccess}
          />
        </Modal>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Minhas Consultas
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700"
        >
          Solicitar Nova Consulta
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                <button
                  onClick={() => handleSort("nomeMedico")}
                  className="flex items-center gap-2 ..."
                >
                  Médico{" "}
                  <SortIcon
                    direction={
                      sortConfig.key === "nomeMedico"
                        ? sortConfig.direction
                        : null
                    }
                  />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                <button
                  onClick={() => handleSort("data")}
                  className="flex items-center gap-2 ..."
                >
                  Data{" "}
                  <SortIcon
                    direction={
                      sortConfig.key === "data" ? sortConfig.direction : null
                    }
                  />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-2 ..."
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
            {consultas.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-10 rounded-b-lg text-gray-500"
                >
                  Nenhuma consulta encontrada.
                </td>
              </tr>
            ) : (
              consultas.map((consulta, index) => (
                <tr key={consulta.id}>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${
                      index === consultas.length - 1 ? "rounded-bl-lg" : ""
                    }`}
                  >
                    {consulta.nomeMedico}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(consulta.data).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consulta.hora}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consulta.status}
                  </td>
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
