import { useState, useEffect, useCallback } from "react";
import { getAllMedicos, reverterInativacao } from "../../services/adminService";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";
import { useOutletContext } from "react-router-dom";
import { calcularTempoRestante } from "../../utils/dateUtils";

export default function SolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    onConfirm: () => {},
  });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [itensPorPagina] = useState(10);
  const { setPageTitle } = useOutletContext();

  useEffect(() => {
    setPageTitle("Solicitações de Inativação");
  }, [setPageTitle]);

  const fetchSolicitacoes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: paginaAtual,
        size: itensPorPagina,
        filter: "status eq 'Aguardando Inativação' or status eq 'Inativo'",
        sort: "inativacaoSolicitadaEm",
        order: "asc",
      };

      const response = await getAllMedicos(params);

      setSolicitacoes(response.data.contents || []);
      setTotalPaginas(response.data.totalPages || 0);
    } catch (err) {
      toast.error("Não foi possível carregar as solicitações.");
      setSolicitacoes([]);
      setTotalPaginas(0);
    } finally {
      setIsLoading(false);
    }
  }, [paginaAtual, itensPorPagina]);

  useEffect(() => {
    fetchSolicitacoes();
  }, [fetchSolicitacoes]);

  const handlePageChange = (novaPagina) => {
    setPaginaAtual(novaPagina);
  };

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
              solicitacoes.map((medico, index) => {
                const { texto: tempoRestanteTexto, expirado } =
                  calcularTempoRestante(medico.inativacaoSolicitadaEm);
                return (
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
                      {new Date(
                        medico.inativacaoSolicitadaEm
                      ).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={expirado ? "text-red-600 font-semibold" : ""}
                      >
                        {tempoRestanteTexto}
                      </span>
                    </td>

                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        index === solicitacoes.length - 1 ? "rounded-br-lg" : ""
                      }`}
                    >
                      <button
                        onClick={() => handleReverter(medico)}
                        disabled={expirado}
                        className={`text-sm font-semibold ${
                          expirado
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-indigo-600 hover:text-indigo-900"
                        }`}
                      >
                        Reverter
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
