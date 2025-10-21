import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  getMinhasConsultas,
  solicitarRemarcacao,
  updateConsulta,
  cancelarConsultaAdmin,
  aceitarRemarcacao,
  rejeitarRemarcacao,
} from "../../services/consultaService";
import { getMeusHorarios } from "../../services/horarioService";
import { useWindowSize } from "../../hooks/useWindowSize";
import Modal from "../../components/Modal";
import AgendaLegenda from "../../components/consulta/AgendaLegenda";
import AgendamentoForm from "../../components/consulta/AgendamentoForm";
import DetalhesConsulta from "../../components/consulta/DetalhesConsulta";
import RemarcacaoForm from "../../components/consulta/RemarcacaoForm";
import toast from "react-hot-toast";

const getEventStyleAndTitle = (consulta) => {
  const baseTitle = consulta.nomePaciente;
  let styleProps = {};

  switch (consulta.status) {
    case "Confirmada":
      styleProps = {
        title: baseTitle,
        backgroundColor: "#4f46e5",
        borderColor: "#4f46e5",
        textColor: "white",
      };
      break;
    case "Aguardando Confirmação do Paciente":
      styleProps = {
        title: `(Pendente Paciente) - ${baseTitle}`,
        backgroundColor: "#d99706",
        borderColor: "#d99706",
        textColor: "white",
      };
      break;
    case "Aguardando Confirmação do Médico":
      styleProps = {
        title: `(Pendente Médico) - ${baseTitle}`,
        backgroundColor: "#f59e0b",
        borderColor: "#f59e0b",
        textColor: "white",
      };
      break;
    case "Concluída":
      styleProps = {
        title: `(Concluída) - ${baseTitle}`,
        backgroundColor: "#6b7280",
        borderColor: "#6b7280",
        textColor: "white",
      };
      break;
    case "Cancelada":
    case "Expirada":
      styleProps = {
        title: `(Cancelada) - ${baseTitle}`,
        backgroundColor: "#f3f4f6",
        borderColor: "#e5e7eb",
        textColor: "#9ca3af",
        className: "line-through",
      };
      break;
    default:
      styleProps = { title: `(Status: ${consulta.status}) - ${baseTitle}` };
  }
  return styleProps;
};

export default function AgendamentoPage() {
  const [events, setEvents] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState({
    isOpen: false,
    initialData: null,
  });
  const [detalhesModalState, setDetalhesModalState] = useState({
    isOpen: false,
    consulta: null,
  });
  const [confirmChangeState, setConfirmChangeState] = useState({
    isOpen: false,
    eventInfo: null,
  });
  const [remarcacaoModalState, setRemarcacaoModalState] = useState({
    isOpen: false,
    consulta: null,
  });
  const [cancelConfirmState, setCancelConfirmState] = useState({
    isOpen: false,
    consultaId: null,
  });
  const [rejectConfirmState, setRejectConfirmState] = useState({
    isOpen: false,
    consultaId: null,
  });
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const fetchAgendaData = useCallback(async () => {
    setIsLoading(true);
    try {
      const hoje = new Date();
      const dataInicio = new Date();
      dataInicio.setDate(hoje.getDate() - 30);
      const dataFim = new Date();
      dataFim.setDate(hoje.getDate() + 90);

      const dataInicioStr = dataInicio.toISOString().slice(0, 10);
      const dataFimStr = dataFim.toISOString().slice(0, 10);

      const params = {
        size: 1000,
        filter: [`data gt '${dataInicioStr}'`, `data lt '${dataFimStr}'`],
      };

      const [consultasRes, horariosRes] = await Promise.all([
        getMinhasConsultas(params),
        getMeusHorarios(),
      ]);

      const consultasEvents = consultasRes.data.contents
        .filter(
          (consulta) =>
            consulta.data && consulta.hora && consulta.duracaoMinutos > 0
        )
        .map((consulta) => {
          const start = new Date(
            `${consulta.data.slice(0, 10)}T${consulta.hora}`
          );
          const end = new Date(
            start.getTime() + consulta.duracaoMinutos * 60000
          );
          const styleAndTitle = getEventStyleAndTitle(consulta);

          return {
            id: consulta.id,
            start,
            end,
            ...styleAndTitle,
            extendedProps: consulta,
            durationEditable: styleAndTitle.display !== "none",
            startEditable: styleAndTitle.display !== "none",
          };
        });

      setEvents(consultasEvents);

      const horariosFormatados = horariosRes.data.map((horario) => ({
        daysOfWeek: [horario.dia_semana],
        startTime: horario.hora_inicio,
        endTime: horario.hora_fim,
      }));
      setBusinessHours(horariosFormatados);
    } catch (error) {
      console.error("Erro ao carregar dados da agenda:", error);
      toast.error("Não foi possível carregar os dados da agenda.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgendaData();
  }, [fetchAgendaData]);

  const handleDateClick = (arg) => {
    // Exemplo de arg.dateStr:
    // - "2025-10-07T14:00:00-03:00" → modo Semana/Dia
    // - "2025-10-07" → modo Mês

    const dateStr = arg.dateStr;
    const [datePart, timePartRaw] = dateStr.split("T");

    // Se tiver parte de hora (timePartRaw), extrai as horas e minutos;
    // senão, deixa vazio para o input permitir edição.
    const hora = timePartRaw ? timePartRaw.substring(0, 5) : "";

    setModalState({
      isOpen: true,
      initialData: {
        data: datePart,
        hora: hora,
      },
    });
  };

  const handleEventClick = (clickInfo) => {
    const eventoCompleto = events.find((e) => e.id === clickInfo.event.id);
    if (eventoCompleto) {
      setDetalhesModalState({
        isOpen: true,
        consulta: clickInfo.event,
      });
    }
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, initialData: null });
    setDetalhesModalState({ isOpen: false, consulta: null });
    setConfirmChangeState({ isOpen: false, eventInfo: null });
    setRemarcacaoModalState({ isOpen: false, consulta: null });
  };

  const handleSuccess = () => {
    handleCloseModal();
    fetchAgendaData();
  };

  const handleEventDrop = (dropInfo) => {
    setConfirmChangeState({
      isOpen: true,
      eventInfo: {
        id: dropInfo.event.id,
        title: dropInfo.event.title,
        oldStart: dropInfo.oldEvent.start,
        newStart: dropInfo.event.start,
        revert: dropInfo.revert,
      },
    });
  };

  const handleEventResize = (resizeInfo) => {
    const oldDuration =
      (resizeInfo.oldEvent.end - resizeInfo.oldEvent.start) / 60000;
    const newDuration = (resizeInfo.event.end - resizeInfo.event.start) / 60000;

    setConfirmChangeState({
      isOpen: true,
      eventInfo: {
        id: resizeInfo.event.id,
        title: resizeInfo.event.title,
        oldDuration: oldDuration,
        newDuration: newDuration,
        revert: resizeInfo.revert,
      },
    });
  };

  const handleConfirmarResize = async () => {
    const { id, newDuration } = confirmChangeState.eventInfo;
    try {
      await updateConsulta(id, { duracaoMinutos: newDuration });
      toast.success("Duração da consulta atualizada com sucesso!");
      handleSuccess();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Não foi possível atualizar a duração."
      );
      confirmChangeState.eventInfo.revert();
      handleCloseModal();
    }
  };

  const handleConfirmarMudanca = async () => {
    const { id, newStart } = confirmChangeState.eventInfo;
    try {
      const novaData = newStart.toLocaleDateString("en-CA");
      const novaHora = newStart.toLocaleTimeString("pt-BR", { hour12: false });

      await solicitarRemarcacao(id, novaData, novaHora);
      toast.success("Solicitação de remarcação enviada ao paciente!");
      handleSuccess();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Não foi possível solicitar a remarcação."
      );
      confirmChangeState.eventInfo.revert();
      handleCloseModal();
    }
  };

  const handleCancelarMudanca = () => {
    if (
      confirmChangeState.eventInfo &&
      typeof confirmChangeState.eventInfo.revert === "function"
    ) {
      confirmChangeState.eventInfo.revert();
    }
    handleCloseModal();
  };

  const handleAbrirModalCancelamento = (consultaId) => {
    setDetalhesModalState({ isOpen: false, consulta: null });
    setCancelConfirmState({ isOpen: true, consultaId: consultaId });
  };

  const executeCancel = async () => {
    const consultaId = cancelConfirmState.consultaId;
    try {
      await cancelarConsultaAdmin(consultaId);
      toast.success("Consulta cancelada com sucesso!");
      handleSuccess();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Não foi possível cancelar a consulta."
      );
      handleCloseModal();
    }
  };

  const handleIniciarRemarcacao = (consulta) => {
    setDetalhesModalState({ isOpen: false, consulta: null });
    setRemarcacaoModalState({ isOpen: true, consulta: consulta });
  };

  const handleAceitarRemarcacao = async (id) => {
    try {
      await aceitarRemarcacao(id);
      toast.success("Remarcação aceita com sucesso!");
      handleSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao aceitar remarcação.");
    }
  };

  const handleAbrirModalRejeicao = (consultaId) => {
    setDetalhesModalState({ isOpen: false, consulta: null });
    setRejectConfirmState({ isOpen: true, consultaId: consultaId });
  };

  const handleRejeitarRemarcacao = async () => {
    const consultaId = rejectConfirmState.consultaId;
    try {
      await rejeitarRemarcacao(consultaId);
      toast.success("Remarcação rejeitada com sucesso!");
      handleSuccess();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Erro ao rejeitar remarcação."
      );
    }
  };

  const calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    // Altera a visão inicial para 'Dia' no mobile
    initialView: isMobile ? "timeGridDay" : "timeGridWeek",
    // Simplifica o cabeçalho no mobile
    headerToolbar: isMobile
      ? {
          left: "prev,next",
          center: "title",
          right: "today",
        }
      : {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        },
    events: events,
    businessHours: businessHours,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    dateClick: handleDateClick,
    eventClick: handleEventClick,
    eventDrop: handleEventDrop,
    eventResize: handleEventResize,
    locale: "pt-br",
    buttonText: {
      today: "Hoje",
      month: "Mês",
      week: "Semana",
      day: "Dia",
    },
    allDaySlot: false,
    // Altura mais adequada para mobile
    height: isMobile ? "auto" : "auto",
    // Tamanho da fonte menor no mobile ajuda
    eventTimeFormat: {
      // Formato da hora nos eventos
      hour: "2-digit",
      minute: "2-digit",
      meridiem: false, // usa 24h
      hourCycle: "h23",
    },
    slotLabelFormat: {
      // Formato da hora na coluna lateral
      hour: "2-digit",
      minute: "2-digit",
      meridiem: false,
      hourCycle: "h23",
    },
  };

  if (isLoading) {
    return <div>Carregando agenda...</div>;
  }

  return (
    <div>
      <Modal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        title="Agendar Nova Consulta"
      >
        <AgendamentoForm
          initialData={modalState.initialData}
          onSuccess={handleSuccess}
          onClose={handleCloseModal}
        />
      </Modal>
      {remarcacaoModalState.consulta && (
        <Modal
          isOpen={remarcacaoModalState.isOpen}
          onClose={handleCloseModal}
          title="Solicitar Remarcação"
        >
          <RemarcacaoForm
            consulta={remarcacaoModalState.consulta}
            onClose={handleCloseModal}
            onSuccess={handleSuccess}
          />
        </Modal>
      )}
      {confirmChangeState.eventInfo && (
        <Modal
          isOpen={confirmChangeState.isOpen}
          onClose={handleCancelarMudanca}
          title="Confirmar Alteração"
        >
          <div>
            {/* Renderização condicional para Arrastar ou Redimensionar */}
            {confirmChangeState.eventInfo.newStart ? (
              // Conteúdo para Arrastar (eventDrop)
              <div>
                <p>
                  Deseja propor a remarcação da consulta de{" "}
                  <strong>{confirmChangeState.eventInfo.title}</strong>?
                </p>
                <div className="mt-4 p-2 bg-gray-100 rounded">
                  <p>
                    <strong>De:</strong>{" "}
                    {confirmChangeState.eventInfo.oldStart.toLocaleString(
                      "pt-BR"
                    )}
                  </p>
                  <p>
                    <strong>Para:</strong>{" "}
                    {confirmChangeState.eventInfo.newStart.toLocaleString(
                      "pt-BR"
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p>
                  Deseja alterar a duração da consulta de{" "}
                  <strong>{confirmChangeState.eventInfo.title}</strong>?
                </p>
                <div className="mt-4 p-2 bg-gray-100 rounded">
                  <p>
                    <strong>Duração Antiga:</strong>{" "}
                    {confirmChangeState.eventInfo.oldDuration} minutos
                  </p>
                  <p>
                    <strong>Nova Duração:</strong>{" "}
                    {confirmChangeState.eventInfo.newDuration} minutos
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
              <button
                onClick={handleCancelarMudanca}
                className="bg-gray-200  text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={
                  confirmChangeState.eventInfo.newStart
                    ? handleConfirmarMudanca
                    : handleConfirmarResize
                }
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700"
              >
                Confirmar Alteração
              </button>
            </div>
          </div>
        </Modal>
      )}
      <Modal
        isOpen={cancelConfirmState.isOpen}
        onClose={() =>
          setCancelConfirmState({ isOpen: false, consultaId: null })
        }
        title="Confirmar Cancelamento"
      >
        <div>
          <p className="text-gray-600">
            Tem certeza de que deseja cancelar esta consulta? O paciente será
            notificado.
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
            <button
              onClick={() =>
                setCancelConfirmState({ isOpen: false, consultaId: null })
              }
              className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300"
            >
              Voltar
            </button>
            <button
              onClick={executeCancel}
              className="bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700"
            >
              Sim, Cancelar Consulta
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={rejectConfirmState.isOpen}
        onClose={() =>
          setRejectConfirmState({ isOpen: false, consultaId: null })
        }
        title="Confirmar Rejeição de Remarcação"
      >
        <div>
          <p className="text-gray-600">
            Tem certeza de que deseja <strong>rejeitar</strong> esta remarcação?
            O paciente será notificado.
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
            <button
              onClick={() =>
                setRejectConfirmState({ isOpen: false, consultaId: null })
              }
              className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300"
            >
              Voltar
            </button>
            <button
              onClick={handleRejeitarRemarcacao}
              className="bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700"
            >
              Sim, Rejeitar Remarcação
            </button>
          </div>
        </div>
      </Modal>
      {detalhesModalState.consulta && (
        <Modal
          isOpen={detalhesModalState.isOpen}
          onClose={handleCloseModal}
          title="Detalhes da Consulta"
        >
          <DetalhesConsulta
            consulta={detalhesModalState.consulta}
            onClose={handleCloseModal}
            onSuccess={handleSuccess}
            onRemarcar={() =>
              handleIniciarRemarcacao(detalhesModalState.consulta)
            }
            onCancelar={handleAbrirModalCancelamento}
            onAceitarRemarcacao={handleAceitarRemarcacao}
            onRejeitarRemarcacao={handleAbrirModalRejeicao}
          />
        </Modal>
      )}

      <h1 className="text-2xl font-semibold text-gray-800">Minha Agenda</h1>
      <AgendaLegenda />
      <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
        <FullCalendar {...calendarOptions} />
      </div>
    </div>
  );
}
