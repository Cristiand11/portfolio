import { useState, useEffect, useRef } from "react";
import { getMeusPacientes } from "../../services/pacienteService";
import { createConsulta } from "../../services/consultaService";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function AgendamentoForm({ initialData, onClose, onSuccess }) {
  const [pacientes, setPacientes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    idPaciente: "",
    data: initialData?.data || "",
    hora: initialData?.hora || "",
    observacoes: "",
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    async function fetchPacientes() {
      try {
        const response = await getMeusPacientes();
        setPacientes(response?.data?.contents || []);
      } catch (err) {
        console.error("Erro ao buscar pacientes:", err);
        toast.error("Não foi possível carregar a lista de pacientes.");
      }
    }

    fetchPacientes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    setFormData((prev) => ({ ...prev, data: formattedDate }));
    setIsCalendarOpen(false);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="data"
            className="block text-sm font-medium text-gray-700"
          >
            Data
          </label>
          {initialData?.data ? (
            <p className="mt-1 font-semibold">
              {new Date(initialData.data + "T00:00:00").toLocaleDateString(
                "pt-BR"
              )}
            </p>
          ) : (
            <input
              type="date"
              name="data"
              id="data"
              value={formData.data}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 cursor-pointer"
            />
          )}
        </div>
        <div>
          <label
            htmlFor="hora"
            className="block text-sm font-medium text-gray-700"
          >
            Hora
          </label>
          {initialData?.hora ? (
            <p className="mt-1 font-semibold">{initialData.hora}</p>
          ) : (
            <input
              type="time"
              name="hora"
              id="hora"
              value={formData.hora}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 cursor-pointer"
            />
          )}
        </div>
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
          name="idPaciente"
          value={formData.idPaciente}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
        >
          <option value="">Selecione um paciente:</option>
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
