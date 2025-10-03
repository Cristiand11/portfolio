import { useState, useEffect } from "react";
import { getMeusPacientes } from "../../services/pacienteService";
import { createConsulta } from "../../services/consultaService";
import toast from "react-hot-toast";

export default function AgendamentoForm({ initialData, onClose, onSuccess }) {
  const [pacientes, setPacientes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. O estado agora inclui a data e hora, inicializadas com os dados recebidos (se existirem)
  const [formData, setFormData] = useState({
    idPaciente: "",
    data: initialData?.data || "",
    hora: initialData?.hora || "",
    observacoes: "",
  });

  useEffect(() => {
    getMeusPacientes(1, 1000)
      .then((res) => setPacientes(res.data.contents))
      .catch((err) => console.error("Erro ao buscar pacientes", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createConsulta(formData);
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
      {initialData ? (
        // Se veio do calendário, mostra a data/hora como texto
        <div>
          <p className="text-sm font-medium text-gray-700">
            Data: <span className="font-normal">{initialData.data}</span>
          </p>
          <p className="text-sm font-medium text-gray-700">
            Hora: <span className="font-normal">{initialData.hora}</span>
          </p>
        </div>
      ) : (
        // Se veio do botão "Marcar Consulta", mostra os inputs de data e hora
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              value={formData.data}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label
              htmlFor="hora"
              className="block text-sm font-medium text-gray-700"
            >
              Hora
            </label>
            <input
              type="time"
              name="hora"
              id="hora"
              value={formData.hora}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
        </div>
      )}
      <div>
        <label
          htmlFor="paciente"
          className="block text-sm font-medium text-gray-700"
        >
          Paciente
        </label>
        <select
          id="paciente"
          name="idPaciente"
          value={formData.idPaciente}
          onChange={handleChange}
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
          name="observacoes"
          value={formData.observacoes}
          onChange={handleChange}
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
