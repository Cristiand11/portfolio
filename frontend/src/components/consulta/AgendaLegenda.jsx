export default function AgendaLegenda() {
  const legendas = [
    { cor: "bg-indigo-600", texto: "Confirmada" },
    { cor: "bg-yellow-500", texto: "Pendente de Confirmação do Médico" },
    { cor: "bg-yellow-600", texto: "Pendente de Confirmação do Paciente" },
    { cor: "bg-gray-500", texto: "Concluída" },
    { cor: "bg-gray-200", texto: "Cancelada" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 mb-2 p-2 bg-white rounded-md shadow-sm text-xs text-gray-700">
      <span className="font-semibold">Legenda:</span>
      {legendas.map((leg) => (
        <div key={leg.texto} className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${leg.cor} border border-gray-300`}
          ></span>
          <span>{leg.texto}</span>
        </div>
      ))}
    </div>
  );
}
