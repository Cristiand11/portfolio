import { useState, useEffect, useCallback } from "react";
import { getMeuMedicoVinculado } from "../../services/auxiliarService";
import { getMinhasConsultas } from "../../services/consultaService";
import toast from "react-hot-toast";
import { format, parseISO, isFuture, startOfDay, endOfDay } from "date-fns";

export default function DashboardAuxiliarPage() {
  const [medicoVinculado, setMedicoVinculado] = useState(null);
  const [consultasHoje, setConsultasHoje] = useState([]);
  const [proximaConsulta, setProximaConsulta] = useState(null);
  const [consultasRestantes, setConsultasRestantes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // 1. Buscar dados do médico vinculado
      const medicoRes = await getMeuMedicoVinculado();
      setMedicoVinculado(medicoRes.data);
      const medicoId = medicoRes.data?.id;

      if (!medicoId) {
        throw new Error("Médico vinculado não encontrado.");
      }

      // 2. Buscar consultas do dia para o médico vinculado
      const hoje = new Date();
      const hojeStr = format(hoje, "yyyy-MM-dd");

      const consultasRes = await getMinhasConsultas({
        size: 500,
        filter: [
          `medicoId eq '${medicoId}'`,
          `data eq '${hojeStr}'`,
          `(status eq 'Confirmada' OR status co 'Aguardando')`,
        ],
        sort: "hora", // Ordena por hora
        order: "asc",
      });

      const consultasDoDia = consultasRes.data.contents;
      setConsultasHoje(consultasDoDia);

      // 3. Calcular próximas consultas e restantes
      const agora = new Date();
      let proxima = null;
      let restantes = 0;

      for (const c of consultasDoDia) {
        // Ignora se não tiver data/hora ou se já passou
        if (!c.data || !c.hora) continue;
        const dataConsulta = parseISO(`${c.data}T${c.hora}`); // Assume hora local
        if (isFuture(dataConsulta)) {
          restantes++;
          if (!proxima) {
            proxima = c; // A primeira futura encontrada é a próxima
          }
        }
      }
      setProximaConsulta(proxima);
      setConsultasRestantes(restantes);
    } catch (err) {
      console.error("Erro ao carregar dashboard do auxiliar:", err);
      setError("Não foi possível carregar os dados do dashboard.");
      toast.error(
        err.message || "Não foi possível carregar os dados do dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return <div className="text-center p-10">Carregando dashboard...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-600">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Dashboard - Dr(a). {medicoVinculado?.nome || "Médico"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Card Consultas Restantes */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">
            Consultas Restantes Hoje
          </h2>
          <p className="text-4xl font-bold text-blue-600 mt-2">
            {consultasRestantes}
          </p>
        </div>

        {/* Card Próxima Consulta */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">
            Próxima Consulta
          </h2>
          {proximaConsulta ? (
            <div className="mt-2">
              <p className="text-3xl font-bold text-gray-800">
                {proximaConsulta.hora}
              </p>
              <p className="text-gray-500">{proximaConsulta.nomePaciente}</p>
              <span
                className={`mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                  proximaConsulta.status === "Confirmada"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {proximaConsulta.status}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-gray-500">
              Nenhuma consulta futura para hoje.
            </p>
          )}
        </div>
      </div>

      {/* Lista de Consultas do Dia */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Agenda de Hoje ({format(new Date(), "dd/MM/yyyy")})
        </h2>
        {consultasHoje.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {consultasHoje.map((consulta) => (
              <li
                key={consulta.id}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <span className="font-medium text-gray-800">
                    {consulta.hora}
                  </span>
                  <span className="ml-4 text-gray-600">
                    {consulta.nomePaciente}
                  </span>
                </div>
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    consulta.status === "Confirmada"
                      ? "bg-green-100 text-green-800"
                      : consulta.status.includes("Aguardando")
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800" // Outros status
                  }`}
                >
                  {consulta.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-4">
            Nenhuma consulta agendada para hoje.
          </p>
        )}
      </div>
    </div>
  );
}
