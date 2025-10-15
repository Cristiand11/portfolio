import { useState, useEffect } from "react";
import { getAllMedicos } from "../../services/adminService"; // Reutilizamos o serviço do admin para buscar a lista de médicos
import { createConsulta } from "../../services/consultaService";
import toast from "react-hot-toast";
import DatePicker from "../DatePicker";
import { format } from "date-fns";

export default function SolicitarConsultaForm({ onClose, onSuccess }) {
  const [medicos, setMedicos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    idMedico: "",
    data: "",
    hora: "",
    observacoes: "",
  });

  // Busca a lista de todos os médicos para preencher o <select>
  useEffect(() => {
    getAllMedicos()
      .then((res) => setMedicos(res.data.contents))
      .catch((err) => console.error("Erro ao buscar médicos", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
    setFormData((prev) => ({ ...prev, data: formattedDate }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createConsulta(formData);
      toast.success("Solicitação de consulta enviada com sucesso!");
      onSuccess(); // Fecha o modal e recarrega a lista
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Não foi possível solicitar a consulta."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="idMedico"
          className="block text-sm font-medium text-gray-700"
        >
          Médico
        </label>
        <select
          id="idMedico"
          name="idMedico"
          value={formData.idMedico}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
        >
          <option value="">Selecione um médico...</option>
          {medicos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome} - {m.especialidade}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="data"
            className="block text-sm font-medium text-gray-700"
          >
            Data
          </label>
          <DatePicker value={formData.data} onChange={handleDateChange} />
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
          {isLoading ? "Enviando..." : "Enviar Solicitação"}
        </button>
      </div>
    </form>
  );
}
