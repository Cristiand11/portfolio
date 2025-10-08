import { useState, useEffect, useCallback } from "react";
import { getAllMedicos } from "../../services/adminService";
import toast from "react-hot-toast";
import Modal from "../../components/Modal";
import AddMedicoForm from "../../components/medico/AddMedicoForm";
import ActionsDropdown from "../../components/ActionsDropdown";
import ConfirmModal from "../../components/ConfirmModal";

export default function MedicosAdminPage() {
  const [medicos, setMedicos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchMedicos = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAllMedicos();
      setMedicos(response.data.contents);
    } catch (err) {
      toast.error("Não foi possível carregar a lista de médicos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedicos();
  }, [refetchTrigger]);

  const handleSuccess = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const getActionsForMedico = (medico) => {
    const actions = [];
    actions.push({
      label: "Editar",
      onClick: () => toast("Função de editar a ser implementada."),
    });
    if (medico.ativo) {
      actions.push({
        label: "Solicitar Inativação",
        onClick: () => toast("Função de inativar a ser implementada."),
        className: "text-red-700",
      });
    }
    return actions;
  };

  return (
    <div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Médico"
      >
        <AddMedicoForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      </Modal>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Gerenciar Médicos
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700"
        >
          Adicionar Médico
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CRM
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Especialidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data de Cadastro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center py-10 rounded-b-lg">
                  Carregando...
                </td>
              </tr>
            ) : medicos.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-10 rounded-b-lg text-gray-500"
                >
                  Nenhum médico encontrado.
                </td>
              </tr>
            ) : (
              medicos.map((medico, index) => (
                <tr key={medico.id}>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${
                      index === medicos.length - 1 ? "rounded-bl-lg" : ""
                    }`}
                  >
                    {medico.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {medico.crm}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {medico.especialidade || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(medico.createdDate).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        medico.ativo
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {medico.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      index === medicos.length - 1 ? "rounded-br-lg" : ""
                    }`}
                  >
                    <ActionsDropdown actions={getActionsForMedico(medico)} />
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
