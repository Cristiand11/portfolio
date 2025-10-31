import { useState, useEffect } from "react";
import {
  getMeusHorarios,
  updateMeusHorarios,
} from "../../services/horarioService";
import toast from "react-hot-toast";
import { useOutletContext } from "react-router-dom";

// Helper para os dias da semana
const DIAS_SEMANA = [
  { id: 0, nome: "Domingo" },
  { id: 1, nome: "Segunda-feira" },
  { id: 2, nome: "Terça-feira" },
  { id: 3, nome: "Quarta-feira" },
  { id: 4, nome: "Quinta-feira" },
  { id: 5, nome: "Sexta-feira" },
  { id: 6, nome: "Sábado" },
];

export default function HorariosPage() {
  const [horarios, setHorarios] = useState(
    DIAS_SEMANA.map((dia) => ({ ...dia, ativo: false, slots: [] }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const { setPageTitle } = useOutletContext();

  useEffect(() => {
    setPageTitle("Meus Horários");
  }, [setPageTitle]);

  useEffect(() => {
    async function fetchHorarios() {
      try {
        const response = await getMeusHorarios();
        const horariosDoBackend = response.data;

        // Mapeia os dados do backend para o nosso estado do frontend
        const newState = DIAS_SEMANA.map((dia) => {
          const slotsDoDia = horariosDoBackend
            .filter((h) => h.dia_semana === dia.id)
            .map((h) => ({ hora_inicio: h.hora_inicio, hora_fim: h.hora_fim }));

          return {
            ...dia,
            ativo: slotsDoDia.length > 0,
            slots:
              slotsDoDia.length > 0
                ? slotsDoDia
                : [{ hora_inicio: "08:00", hora_fim: "18:00" }], // Padrão
          };
        });
        setHorarios(newState);
      } catch (err) {
        toast.error("Não foi possível carregar os horários.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchHorarios();
  }, []);

  const handleToggleDia = (diaIndex) => {
    const newHorarios = [...horarios];
    newHorarios[diaIndex].ativo = !newHorarios[diaIndex].ativo;
    setHorarios(newHorarios);
  };

  const handleSlotChange = (diaIndex, slotIndex, field, value) => {
    const newHorarios = [...horarios];
    newHorarios[diaIndex].slots[slotIndex][field] = value;
    setHorarios(newHorarios);
  };

  const handleAddSlot = (diaIndex) => {
    const newHorarios = [...horarios];
    newHorarios[diaIndex].slots.push({ hora_inicio: "", hora_fim: "" });
    setHorarios(newHorarios);
  };

  const handleRemoveSlot = (diaIndex, slotIndex) => {
    const newHorarios = [...horarios];
    newHorarios[diaIndex].slots.splice(slotIndex, 1);
    setHorarios(newHorarios);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Formata os dados do estado para o formato que a API espera
      const payload = horarios
        .filter((dia) => dia.ativo)
        .flatMap((dia) =>
          dia.slots.map((slot) => ({
            dia_semana: dia.id,
            hora_inicio: slot.hora_inicio,
            hora_fim: slot.hora_fim,
          }))
        )
        .filter((item) => item.hora_inicio && item.hora_fim); // Garante que não envia slots vazios

      await updateMeusHorarios(payload);
      toast.success("Horários salvos com sucesso!");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Não foi possível salvar os horários."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <p className="mt-1 text-gray-600">
            Defina seus dias e horários de atendimento.
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 w-full sm:w-auto flex-shrink-0"
        >
          {isLoading ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p>Carregando horários...</p>
        ) : (
          horarios.map((dia, diaIndex) => (
            <div
              key={dia.id}
              className={`p-4 border rounded-lg transition-colors ${
                dia.ativo ? "bg-white shadow-sm" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={dia.ativo}
                    onChange={() => handleToggleDia(diaIndex)}
                    className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <h2
                    className={`font-bold text-lg ${
                      dia.ativo ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    {dia.nome}
                  </h2>
                </div>
                {dia.ativo && (
                  <button
                    onClick={() => handleAddSlot(diaIndex)}
                    className="text-sm text-indigo-600 font-semibold hover:text-indigo-800"
                  >
                    + Adicionar Horário
                  </button>
                )}
              </div>

              {dia.ativo && dia.slots.length > 0 && (
                <div className="mt-4 space-y-3 pl-9">
                  {dia.slots.map((slot, slotIndex) => (
                    <div
                      key={slotIndex}
                      className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr_auto] items-center gap-2 sm:gap-3"
                    >
                      <input
                        type="time"
                        value={slot.hora_inicio}
                        onChange={(e) =>
                          handleSlotChange(
                            diaIndex,
                            slotIndex,
                            "hora_inicio",
                            e.target.value
                          )
                        }
                        className="w-full border-gray-300 rounded-md shadow-sm p-2"
                      />
                      <span className="hidden sm:inline text-gray-500 text-sm">
                        até
                      </span>
                      <input
                        type="time"
                        value={slot.hora_fim}
                        onChange={(e) =>
                          handleSlotChange(
                            diaIndex,
                            slotIndex,
                            "hora_fim",
                            e.target.value
                          )
                        }
                        className="w-full border-gray-300 rounded-md shadow-sm p-2"
                      />
                      <button
                        onClick={() => handleRemoveSlot(diaIndex, slotIndex)}
                        className="text-gray-400 hover:text-red-500 p-1 self-end sm:self-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
