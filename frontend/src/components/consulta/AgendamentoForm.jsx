import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getMeusPacientes } from "../../services/pacienteService";
import { createConsulta } from "../../services/consultaService";
import toast from "react-hot-toast";

export default function AgendamentoForm({ initialData, onClose, onSuccess }) {
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Busca a lista de pacientes do médico para preencher o <select>
  useEffect(() => {
    getMeusPacientes(1, 1000) // Pega até 1000 pacientes
      .then((res) => setPacientes(res.data.contents))
      .catch((err) => console.error("Erro ao buscar pacientes", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const consultaData = {
      idPaciente: selectedPaciente,
      data: initialData.data,
      hora: initialData.hora,
      observacoes: observacoes,
    };

    try {
      await createConsulta(consultaData);
      toast.success("Consulta proposta com sucesso!");
      onSuccess();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Não foi possível agendar a consulta."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700">
          Data: <span className="font-normal">{initialData.data}</span>
        </p>
        <p className="text-sm font-medium text-gray-700">
          Hora: <span className="font-normal">{initialData.hora}</span>
        </p>
      </div>
      <div>
        <label
          htmlFor="paciente"
          className="block text-sm font-medium text-gray-700"
        >
          Paciente
        </label>
        <select
          id="paciente"
          value={selectedPaciente}
          onChange={(e) => setSelectedPaciente(e.target.value)}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
        >
          <option value="">Selecione um paciente...</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="observacoes"
          className="block text-sm font-medium text-gray-700"
        >
          Observações
        </label>
        <textarea
          id="observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows="3"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
        />
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
          {isLoading ? "Agendando..." : "Agendar"}
        </button>
      </div>
    </form>
  );
}
