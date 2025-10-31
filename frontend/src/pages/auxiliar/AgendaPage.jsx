import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useWindowSize } from "../../hooks/useWindowSize";
import { getMeuMedicoVinculado } from "../../services/auxiliarService";
import {
  getConsultasByMedicoId,
  createConsulta,
  updateConsulta,
  cancelarConsultaAdmin,
  aceitarRemarcacao,
  rejeitarRemarcacao,
  solicitarRemarcacao,
} from "../../services/consultaService";
import { getHorariosByMedicoId } from "../../services/horarioService";
import Modal from "../../components/Modal";
import AgendaLegenda from "../../components/consulta/AgendaLegenda";
import AgendamentoForm from "../../components/consulta/AgendamentoForm";
import DetalhesConsulta from "../../components/consulta/DetalhesConsulta";
import RemarcacaoForm from "../../components/consulta/RemarcacaoForm";
import ConfirmModal from "../../components/ConfirmModal";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";

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

export default function AgendaPage() {
  const [medicoVinculado, setMedicoVinculado] = useState(null);
  const [events, setEvents] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
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
  const { setPageTitle } = useOutletContext();

  useEffect(() => {
    if (medicoVinculado?.nome) {
      setPageTitle(`Agenda - Dr(a). ${medicoVinculado.nome}`);
    } else {
      setPageTitle("Agenda do Médico");
    }
  }, [setPageTitle, medicoVinculado]);

  const fetchAgendaData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // 1. Buscar o médico vinculado
      const medicoRes = await getMeuMedicoVinculado();
      const medicoData = medicoRes.data;
      setMedicoVinculado(medicoData);

      const medicoId = medicoData?.id;

      if (!medicoId) {
        throw new Error("Médico vinculado não encontrado.");
      }

      // 2. Buscar consultas e horários DO MÉDICO VINCULADO
      const hoje = new Date();
      const dataInicio = new Date();
      dataInicio.setDate(hoje.getDate() - 30);
      const dataFim = new Date();
      dataFim.setDate(hoje.getDate() + 90);
      const dataInicioStr = format(dataInicio, "yyyy-MM-dd");
      const dataFimStr = format(dataFim, "yyyy-MM-dd");

      const paramsConsultas = {
        size: 1000,
        filter: [
          `medicoId eq '${medicoId}'`, // Filtro crucial pelo ID do médico
          `data gt '${dataInicioStr}'`,
          `data lt '${dataFimStr}'`,
        ],
      };

      const [consultasRes, horariosRes] = await Promise.all([
        getConsultasByMedicoId(medicoId, paramsConsultas),
        getHorariosByMedicoId(medicoId),
      ]);

      // Mapear consultas para eventos do FullCalendar (igual ao AgendamentoPage)
      const consultasEvents = consultasRes.data.contents
        .filter((c) => c.data && c.hora && c.duracaoMinutos > 0)
        .map((consulta) => {
          const start = parseISO(
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
            durationEditable: styleAndTitle.display !== "none", // Ajustar permissões se necessário
            startEditable: styleAndTitle.display !== "none", // Ajustar permissões se necessário
          };
        });
      setEvents(consultasEvents);

      const horariosFormatados = horariosRes.data.map((h) => ({
        daysOfWeek: [h.dia_semana],
        startTime: h.hora_inicio,
        endTime: h.hora_fim,
      }));
      setBusinessHours(horariosFormatados);
    } catch (err) {
      setError("Não foi possível carregar os dados da agenda.");
      toast.error(
        err.message || "Não foi possível carregar os dados da agenda."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgendaData();
  }, [fetchAgendaData]);

  const handleDateClick = (arg) => {
    const dateStr = arg.dateStr;
    const [datePart, timePartRaw] = dateStr.split("T");
    const hora = timePartRaw ? timePartRaw.substring(0, 5) : "";
    setModalState({
      isOpen: true,
      initialData: { data: datePart, hora: hora },
    });
  };

  const handleEventClick = (clickInfo) => {
    const eventoCompleto = events.find((e) => e.id === clickInfo.event.id);
    if (eventoCompleto) {
      setDetalhesModalState({ isOpen: true, consulta: clickInfo.event });
    }
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, initialData: null });
    setDetalhesModalState({ isOpen: false, consulta: null });
    setConfirmChangeState({ isOpen: false, eventInfo: null });
    setRemarcacaoModalState({ isOpen: false, consulta: null });
    setCancelConfirmState({ isOpen: false, consultaId: null });
    setRejectConfirmState({ isOpen: false, consultaId: null });
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
      toast.error(error.response?.data?.message || "Erro ao remarcar.");
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
    initialView: isMobile ? "timeGridDay" : "timeGridWeek",
    headerToolbar: isMobile
      ? { left: "prev,next", center: "title", right: "today" }
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
    buttonText: { today: "Hoje", month: "Mês", week: "Semana", day: "Dia" },
    allDaySlot: false,
    height: isMobile ? "auto" : "auto",
    eventTimeFormat: {
      hour: "2-digit",
      minute: "2-digit",
      meridiem: false,
      hourCycle: "h23",
    },
    slotLabelFormat: {
      hour: "2-digit",
      minute: "2-digit",
      meridiem: false,
      hourCycle: "h23",
    },
  };

  if (isLoading) {
    return <div className="text-center p-10">Carregando agenda...</div>;
  }
  if (error) {
    return <div className="text-center p-10 text-red-600">{error}</div>;
  }

  return (
    <div>
      {/* Modais */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        title="Agendar Nova Consulta"
      >
        {/* Passa o ID do médico para o form saber para quem agendar */}
        <AgendamentoForm
          initialData={modalState.initialData}
          medicoId={medicoVinculado?.id}
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
            {" "}
            {confirmChangeState.eventInfo.newStart ? (
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
              {" "}
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
      <ConfirmModal
        isOpen={cancelConfirmState.isOpen}
        onClose={() => setCancelConfirmState({ isOpen: false })}
        title="Confirmar Cancelamento"
        message="Tem certeza de que deseja cancelar esta consulta? O paciente será notificado."
        onConfirm={executeCancel}
      />
      <ConfirmModal
        isOpen={rejectConfirmState.isOpen}
        onClose={() => setRejectConfirmState({ isOpen: false })}
        title="Confirmar Rejeição"
        message="Tem certeza de que deseja rejeitar esta remarcação? O paciente será notificado."
        onConfirm={handleRejeitarRemarcacao}
      />
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

      <AgendaLegenda />
      <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
        <FullCalendar {...calendarOptions} />
      </div>
    </div>
  );
}
