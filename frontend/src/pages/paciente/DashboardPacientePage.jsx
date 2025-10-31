import { useState, useEffect, useCallback } from "react";
import { getMinhasConsultas } from "../../services/consultaService";
import RemarcacaoForm from "../../components/consulta/RemarcacaoForm";
import toast from "react-hot-toast";
import Modal from "../../components/Modal";
import { useOutletContext } from "react-router-dom";
import DetalhesConsultaPaciente from "../../components/paciente/DetalhesConsultaPaciente";

export default function DashboardPacientePage() {
  const [proximasConsultas, setProximasConsultas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState(null);
  const [remarcacaoModalState, setRemarcacaoModalState] = useState({
    isOpen: false,
    consulta: null,
  });
  const { setPageTitle } = useOutletContext();

  useEffect(() => {
    setPageTitle("Meu Dashboard");
  }, [setPageTitle]);

  const fetchConsultas = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getMinhasConsultas({ size: 100 });
      const agora = new Date();
      const consultasFuturas = response.data.contents
        .filter((c) => {
          if (!c.data || !c.hora) return false;
          const dataConsulta = new Date(`${c.data}T${c.hora}`);
          return (
            dataConsulta > agora &&
            (c.status === "Confirmada" ||
              c.status.includes("Aguardando") ||
              c.status.includes("Remarcação"))
          );
        })
        .sort(
          (a, b) =>
            new Date(`${a.data}T${a.hora}`) - new Date(`${b.data}T${b.hora}`)
        );

      setProximasConsultas(consultasFuturas);
    } catch (err) {
      setError("Não foi possível carregar as suas consultas.");
      toast.error("Não foi possível carregar as suas consultas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsultas();
  }, [fetchConsultas]);

  const handleVerDetalhes = (consulta) => {
    setConsultaSelecionada(consulta);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setConsultaSelecionada(null);
  };

  const handleIniciarRemarcacao = (consulta) => {
    setRemarcacaoModalState({ isOpen: true, consulta: consulta });
  };

  const handleCloseRemarcacaoModal = () => {
    setRemarcacaoModalState({ isOpen: false, consulta: null });
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setConsultaSelecionada(null);
    setRemarcacaoModalState({ isOpen: false, consulta: null });
    fetchConsultas();
  };

  if (isLoading) {
    return <div>A carregar o seu dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  const proximaConsulta = proximasConsultas[0];

  return (
    <div>
      {consultaSelecionada && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Detalhes da Consulta"
        >
          <DetalhesConsultaPaciente
            consulta={consultaSelecionada}
            onClose={handleCloseModal}
            onSuccess={handleSuccess}
            onRemarcar={handleIniciarRemarcacao}
          />
        </Modal>
      )}
      <Modal
        isOpen={remarcacaoModalState.isOpen}
        onClose={handleCloseRemarcacaoModal}
        title="Solicitar Remarcação"
      >
        <RemarcacaoForm
          consulta={{ extendedProps: remarcacaoModalState.consulta }}
          onClose={handleCloseRemarcacaoModal}
          onSuccess={handleSuccess}
        />
      </Modal>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card de Próximas Consultas */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">
            Próximas Consultas
          </h2>
          <p className="text-4xl font-bold text-indigo-600 mt-2">
            {proximasConsultas.length}
          </p>
        </div>

        {/* Card de Destaque da Próxima Consulta */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">
            Próxima Consulta Agendada
          </h2>
          {proximaConsulta ? (
            <div className="mt-2">
              <p className="text-xl font-bold text-gray-800">
                Dr(a). {proximaConsulta.nomeMedico}
              </p>
              <p className="text-gray-500 mt-1">
                {new Date(proximaConsulta.data).toLocaleDateString("pt-BR", {
                  timeZone: "UTC",
                })}{" "}
                às {proximaConsulta.hora}
              </p>
              <span
                className={`mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                  proximaConsulta.status === "Confirmada"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {proximaConsulta.status}
              </span>
              <div className="text-right mt-4">
                <button
                  onClick={() => handleVerDetalhes(proximaConsulta)}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-gray-500">
              Você não possui nenhuma consulta futura agendada.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
