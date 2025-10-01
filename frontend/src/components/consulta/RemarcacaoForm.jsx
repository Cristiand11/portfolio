import { useState } from "react";
import toast from "react-hot-toast";
import { solicitarRemarcacao } from "../../services/consultaService";

export default function RemarcacaoForm({ consulta, onClose, onSuccess }) {
  const [novaData, setNovaData] = useState("");
  const [novaHora, setNovaHora] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await solicitarRemarcacao(consulta.extendedProps.id, novaData, novaHora);
      toast.success("Solicitação de remarcação enviada!");
      onSuccess(); // Fecha os modais e recarrega o calendário
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Não foi possível solicitar a remarcação."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Proponha uma nova data e hora para a consulta de{" "}
        <strong>{consulta.title}</strong>.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="novaData"
            className="block text-sm font-medium text-gray-700"
          >
            Nova Data
          </label>
          <input
            type="date"
            id="novaData"
            value={novaData}
            onChange={(e) => setNovaData(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          />
        </div>
        <div>
          <label
            htmlFor="novaHora"
            className="block text-sm font-medium text-gray-700"
          >
            Nova Hora
          </label>
          <input
            type="time"
            id="novaHora"
            value={novaHora}
            onChange={(e) => setNovaHora(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          />
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700"
        >
          {isLoading ? "Enviando..." : "Enviar Proposta"}
        </button>
      </div>
    </form>
  );
}
