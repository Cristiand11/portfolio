import {
  confirmarConsulta,
  concluirConsulta,
} from "../../services/consultaService";
import toast from "react-hot-toast";

export default function DetalhesConsulta({
  consulta,
  onSuccess,
  onRemarcar,
  onCancelar,
  onAceitarRemarcacao,
  onRejeitarRemarcacao,
}) {
  const handleConfirmar = async () => {
    try {
      await confirmarConsulta(consulta.extendedProps.id);
      toast.success("Consulta confirmada com sucesso!");
      onSuccess();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Não foi possível confirmar a consulta."
      );
    }
  };

  const handleCancelar = () => {
    onCancelar(consulta.extendedProps.id);
  };

  const handleConcluir = async () => {
    try {
      await concluirConsulta(consulta.extendedProps.id);
      toast.success("Consulta marcada como concluída!");
      onSuccess();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Não foi possível concluir a consulta."
      );
    }
  };

  const renderizarAcoes = () => {
    const status = consulta.extendedProps.status;
    const dataHoraConsulta = new Date(consulta.start);
    const agora = new Date();

    if (
      agora > dataHoraConsulta &&
      status !== "Cancelada Pelo Paciente" &&
      status !== "Cancelada Pelo Médico/Auxiliar" &&
      status !== "Expirada"
    ) {
      return (
        <button
          onClick={handleConcluir}
          className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Marcar como Concluída
        </button>
      );
    }

    if (status === "Aguardando Confirmação do Médico") {
      return (
        <>
          <button
            onClick={handleCancelar}
            className="bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-md hover:bg-red-200"
          >
            Rejeitar
          </button>
          <button
            onClick={handleConfirmar}
            className="bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700"
          >
            Aprovar Consulta
          </button>
        </>
      );
    }

    if (status === "Confirmada") {
      return (
        <>
          <button
            onClick={handleCancelar}
            className="bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-md hover:bg-red-200"
          >
            Cancelar Consulta
          </button>
          <button
            onClick={onRemarcar}
            className="bg-yellow-100 text-yellow-800 font-semibold py-2 px-4 rounded-md hover:bg-yellow-200"
          >
            Solicitar Remarcação
          </button>
        </>
      );
    }

    if (status === "Remarcação Solicitada Pelo Paciente") {
      return (
        <>
          <button
            onClick={() => onRejeitarRemarcacao(consulta.extendedProps.id)}
            className="bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-md hover:bg-red-200"
          >
            Rejeitar Proposta
          </button>
          <button
            onClick={() => onAceitarRemarcacao(consulta.extendedProps.id)}
            className="bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700"
          >
            Aceitar Proposta
          </button>
        </>
      );
    }

    return (
      <p className="text-sm text-gray-500">
        Nenhuma ação disponível para este status.
      </p>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-800">{consulta.title}</h3>
        <p className="text-sm text-gray-500">Paciente</p>
      </div>
      <hr />
      <div>
        <p className="text-sm font-medium text-gray-700">
          Data:{" "}
          <span className="font-normal">
            {new Date(consulta.start).toLocaleDateString("pt-BR")}
          </span>
        </p>
        <p className="text-sm font-medium text-gray-700">
          Horário:{" "}
          <span className="font-normal">
            {new Date(consulta.start).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </p>
        <p className="text-sm font-medium text-gray-700">
          Status:{" "}
          <span className="font-normal">{consulta.extendedProps.status}</span>
        </p>
      </div>

      {/* Ações possíveis para a consulta */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
        {renderizarAcoes()}
      </div>
    </div>
  );
}