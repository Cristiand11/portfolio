import { useState, useEffect, useCallback } from "react";
import { getAllMedicos, reverterInativacao } from "../../services/adminService";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ConfirmModal";

// Função para calcular o tempo restante (simplificada)
const calcularTempoRestante = (dataSolicitacao) => {
  if (!dataSolicitacao) return "N/A";
  // Lógica de 5 dias úteis é complexa, aqui uma aproximação de 7 dias corridos
  const dataFinal = new Date(dataSolicitacao);
  dataFinal.setDate(dataFinal.getDate() + 7);
  const diff = dataFinal.getTime() - new Date().getTime();
  const diasRestantes = Math.ceil(diff / (1000 * 3600 * 24));
  return diasRestantes > 0 ? `${diasRestantes} dia(s)` : "Expirado";
};

export default function SolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    onConfirm: () => {},
  });

  const fetchSolicitacoes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAllMedicos();
      // Filtra no frontend para pegar apenas médicos com solicitação pendente
      const pendentes = response.data.contents.filter(
        (m) => m.inativacaoSolicitadaEm
      );
      setSolicitacoes(pendentes);
    } catch (err) {
      toast.error("Não foi possível carregar as solicitações.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolicitacoes();
  }, [fetchSolicitacoes]);

  const handleReverter = (medico) => {
    setConfirmModalState({
      isOpen: true,
      title: "Confirmar Reversão",
      message: `Tem a certeza de que deseja reverter a inativação do médico ${medico.nome}?`,
      onConfirm: async () => {
        try {
          await reverterInativacao(medico.id);
          toast.success("Inativação revertida com sucesso!");
          fetchSolicitacoes();
        } catch (err) {
          toast.error(
            err.response?.data?.message || "Não foi possível reverter."
          );
        }
        setConfirmModalState({ isOpen: false });
      },
    });
  };

  return (
    <div>
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        onConfirm={confirmModalState.onConfirm}
        onClose={() => setConfirmModalState({ isOpen: false })}
      />

      <h1 className="text-2xl font-semibold text-gray-800">
        Solicitações de Inativação
      </h1>

      <div className="mt-6 overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                Nome do Médico
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CRM
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data da Solicitação
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tempo Restante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">
                Ações
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-10 rounded-b-lg">
                  Carregando...
                </td>
              </tr>
            ) : solicitacoes.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-10 rounded-b-lg text-gray-500"
                >
                  Nenhuma solicitação pendente.
                </td>
              </tr>
            ) : (
              solicitacoes.map((medico, index) => (
                <tr key={medico.id}>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${
                      index === solicitacoes.length - 1 ? "rounded-bl-lg" : ""
                    }`}
                  >
                    {medico.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {medico.crm}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(medico.inativacaoSolicitadaEm).toLocaleDateString(
                      "pt-BR"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calcularTempoRestante(medico.inativacaoSolicitadaEm)}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      index === solicitacoes.length - 1 ? "rounded-br-lg" : ""
                    }`}
                  >
                    <button
                      onClick={() => handleReverter(medico)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-semibold"
                    >
                      Reverter
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
