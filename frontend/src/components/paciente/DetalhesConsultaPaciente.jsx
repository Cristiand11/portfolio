import toast from "react-hot-toast";
import {
  confirmarConsulta,
  cancelarConsulta,
  aceitarRemarcacao,
  rejeitarRemarcacao,
} from "../../services/consultaService";

export default function DetalhesConsultaPaciente({
  consulta,
  onClose,
  onSuccess,
  onRemarcar,
}) {
  const handleConfirmar = async () => {
    try {
      await confirmarConsulta(consulta.id);
      toast.success("Consulta confirmada com sucesso!");
      onSuccess();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Não foi possível confirmar a consulta."
      );
    }
  };

  const handleCancelar = async () => {
    if (
      !window.confirm("Tem a certeza de que deseja solicitar o cancelamento?")
    )
      return;
    try {
      await cancelarConsulta(consulta.id);
      toast.success("Cancelamento solicitado com sucesso!");
      onSuccess();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Não foi possível cancelar a consulta."
      );
    }
  };

  const handleAceitar = async () => {
    try {
      await aceitarRemarcacao(consulta.id);
      toast.success("Remarcação aceite com sucesso!");
      onSuccess();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Não foi possível aceitar a remarcação."
      );
    }
  };

  const handleRejeitar = async () => {
    if (!window.confirm("Tem a certeza de que deseja rejeitar a proposta?"))
      return;
    try {
      await rejeitarRemarcacao(consulta.id);
      toast.success("Proposta de remarcação rejeitada.");
      onSuccess();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Não foi possível rejeitar a proposta."
      );
    }
  };

  const renderizarAcoes = () => {
    const status = consulta.status;
    const dataHoraConsulta = new Date(`${consulta.data}T${consulta.hora}`);
    const agora = new Date();

    if (agora > dataHoraConsulta) {
      return (
        <p className="text-sm text-gray-500">
          Esta consulta já aconteceu. Nenhuma ação disponível.
        </p>
      );
    }

    switch (status) {
      case "Aguardando Confirmação do Paciente":
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
              Confirmar Consulta
            </button>
          </>
        );
      case "Confirmada":
        return (
          <>
            <button
              onClick={handleCancelar}
              className="bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-md hover:bg-red-200"
            >
              Cancelar
            </button>
            <button
              onClick={onRemarcar}
              className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-yellow-600"
            >
              Solicitar Remarcação
            </button>
          </>
        );
      case "Remarcação Solicitada Pelo Médico":
        return (
          <>
            <button
              onClick={handleRejeitar}
              className="bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-md hover:bg-red-200"
            >
              Rejeitar Proposta
            </button>
            <button
              onClick={handleAceitar}
              className="bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700"
            >
              Aceitar Proposta
            </button>
          </>
        );
      default:
        return (
          <p className="text-sm text-gray-500">
            Nenhuma ação disponível para esta consulta.
          </p>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-800">
          Dr(a). {consulta.nomeMedico}
        </h3>
        <p className="text-sm text-gray-500">{consulta.especialidadeMedico}</p>
      </div>
      <hr />
      <div>
        <p className="text-sm font-medium text-gray-700">
          Data:{" "}
          <span className="font-normal">
            {new Date(consulta.data).toLocaleDateString("pt-BR", {
              timeZone: "UTC",
            })}
          </span>
        </p>
        <p className="text-sm font-medium text-gray-700">
          Horário: <span className="font-normal">{consulta.hora}</span>
        </p>
        <p className="text-sm font-medium text-gray-700">
          Status: <span className="font-normal">{consulta.status}</span>
        </p>
        {consulta.status === "Remarcação Solicitada Pelo Médico" && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm font-bold text-yellow-800">
              Proposta de Remarcação:
            </p>
            <p className="text-sm text-yellow-700">
              {new Date(consulta.dataRemarcacaoSugerida).toLocaleDateString(
                "pt-BR",
                { timeZone: "UTC" }
              )}{" "}
              às {consulta.horaRemarcacaoSugerida}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        {renderizarAcoes()}
      </div>
    </div>
  );
}
