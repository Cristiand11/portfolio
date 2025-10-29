import { useState, useEffect } from "react";
import { getMinhasConsultas } from "../../services/consultaService";

export default function DashboardMedicoPage() {
  const [consultasHoje, setConsultasHoje] = useState([]);
  const [proximaConsulta, setProximaConsulta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchConsultas = async () => {
      try {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");
        const hojeStr = `${ano}-${mes}-${dia}`;

        const response = await getMinhasConsultas({
          filter: [`data eq '${hojeStr}'`, `status eq 'Confirmada'`],
        });

        const consultasDoDia = response.data.contents;

        consultasDoDia.sort((a, b) => a.hora.localeCompare(b.hora));
        setConsultasHoje(consultasDoDia);

        const agora = new Date();
        const proxima = consultasDoDia.find((c) => {
          const dataConsulta = new Date(`${c.data}T${c.hora}`);
          return dataConsulta > agora;
        });
        setProximaConsulta(proxima);
      } catch (err) {
        setError("Não foi possível carregar os dados da agenda.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultas();
  }, []); // O array vazio [] faz com que o useEffect rode apenas uma vez, quando o componente monta

  if (isLoading) {
    return <div className="text-center p-10">Carregando agenda...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-600">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Meu Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">
            Consultas Confirmadas Hoje
          </h2>
          <p className="text-4xl font-bold text-indigo-600 mt-2">
            {consultasHoje.length}
          </p>
        </div>

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
            </div>
          ) : (
            <p className="mt-2 text-gray-500">
              Nenhuma consulta futura para hoje.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
