import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { getMinhasConsultas } from "../../services/consultaService";
import { getMeusHorarios } from "../../services/horarioService";

export default function AgendamentoPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgendaData = async () => {
      try {
        // Busca as consultas e os horários de trabalho em paralelo
        const [consultasRes, horariosRes] = await Promise.all([
          getMinhasConsultas(),
          getMeusHorarios(),
        ]);

        // 1. Formata as consultas existentes como eventos do calendário
        const consultasEvents = consultasRes.data.contents.map((consulta) => {
          const start = new Date(
            `${consulta.data.slice(0, 10)}T${consulta.hora}`
          );
          const end = new Date(
            start.getTime() + consulta.duracao_minutos * 60000
          );

          return {
            id: consulta.id,
            title: consulta.nomePaciente, // Mostra o nome do paciente no evento
            start: start,
            end: end,
            backgroundColor: "#3730a3", // Cor para consultas confirmadas
            borderColor: "#3730a3",
          };
        });

        // 2. Formata os horários de trabalho como eventos de fundo
        const horariosEvents = horariosRes.data.flatMap((horario) => {
          // Cria eventos recorrentes para os próximos 90 dias, por exemplo
          const events = [];
          for (let i = 0; i < 90; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            if (date.getDay() === horario.dia_semana) {
              events.push({
                // groupId: 'horarioTrabalho',
                startTime: horario.hora_inicio,
                endTime: horario.hora_fim,
                daysOfWeek: [horario.dia_semana],
                display: "background",
                color: "#d1d5db",
              });
            }
          }
          return events;
        });

        setEvents([...consultasEvents, ...horariosEvents]);
      } catch (error) {
        console.error("Erro ao carregar dados da agenda:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgendaData();
  }, []);

  const handleDateClick = (arg) => {
    // Esta função é chamada quando o usuário clica em um horário VAGO
    // Aqui abriremos o modal para criar uma nova consulta
    alert("Abrir modal para agendar em: " + arg.dateStr);
  };

  const handleEventClick = (arg) => {
    // Esta função é chamada quando o usuário clica em uma CONSULTA EXISTENTE
    // Aqui abriremos o modal para ver/editar/cancelar a consulta
    alert(
      "Consulta clicada: " + arg.event.title + " (ID: " + arg.event.id + ")"
    );
  };

  if (isLoading) {
    return <div>Carregando agenda...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Minha Agenda</h1>
      <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek" // Visão inicial de semana
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          editable={true} // Permite arrastar/redimensionar eventos (lógica futura)
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          locale="pt-br" // Para traduzir o calendário
          buttonText={{
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
          }}
          allDaySlot={false} // Remove a área "o dia todo"
        />
      </div>
    </div>
  );
}
