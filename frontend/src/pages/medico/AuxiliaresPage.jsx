import { useState, useEffect, useCallback } from "react";
import {
  getMeusAuxiliares,
  deleteAuxiliar,
  deleteVariosAuxiliares,
} from "../../services/auxiliarService";
import toast from "react-hot-toast";
import Modal from "../../components/Modal";
import AddAuxiliarForm from "../../components/auxiliar/AddAuxiliarForm";

const SortIcon = ({ direction }) => {
  if (!direction) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
        />
      </svg>
    );
  }

  // Ícone para ordenação ascendente (seta para cima)
  if (direction === "asc") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-gray-800"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    );
  }

  // Ícone para ordenação descendente (seta para baixo)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 text-gray-800"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
};

export default function AuxiliaresPage() {
  const [auxiliares, setAuxiliares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [sortConfig, setSortConfig] = useState({
    key: "nome",
    direction: "asc",
  });
  const [confirmDeleteState, setConfirmDeleteState] = useState({
    isOpen: false,
    auxiliarId: null,
  });
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const fetchAuxiliares = async () => {
      setIsLoading(true);
      setError("");
      try {
        const params = {
          sort: sortConfig.key,
          order: sortConfig.direction,
        };
        const response = await getMeusAuxiliares(params);
        setAuxiliares(response.data.contents);
      } catch (err) {
        console.error("Erro ao buscar auxiliares:", err);
        setError("Não foi possível carregar a lista de auxiliares.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuxiliares();
  }, [refetchTrigger, sortConfig]);

  const handleSuccess = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(auxiliares.map((aux) => aux.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Tem certeza de que deseja excluir ${selectedIds.length} auxiliares?`
      )
    ) {
      try {
        await deleteVariosAuxiliares(selectedIds);
        toast.success("Auxiliares excluídos com sucesso!");
        setSelectedIds([]);
        handleSuccess();
      } catch (err) {
        toast.error("Não foi possível excluir os auxiliares.");
      }
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      setSortConfig({ key: "nome", direction: "asc" });
      return;
    }
    setSortConfig({ key, direction });
  };

  const handleDeleteClick = (auxiliarId) => {
    setConfirmDeleteState({ isOpen: true, auxiliarId: auxiliarId });
  };

  const executeDelete = async () => {
    const auxiliarId = confirmDeleteState.auxiliarId;
    try {
      await deleteAuxiliar(auxiliarId);
      toast.success("Auxiliar excluído com sucesso!");
      setRefetchTrigger((prev) => prev + 1);
    } catch (err) {
      toast.error("Não foi possível excluir o auxiliar.");
      console.error("Erro ao excluir auxiliar:", err);
    } finally {
      setConfirmDeleteState({ isOpen: false, auxiliarId: null });
    }
  };

  return (
    <div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Auxiliar"
      >
        <AddAuxiliarForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      </Modal>
      <Modal
        isOpen={confirmDeleteState.isOpen}
        onClose={() =>
          setConfirmDeleteState({ isOpen: false, auxiliarId: null })
        }
        title="Confirmar Exclusão"
      >
        <div>
          <p className="text-gray-600">
            Tem certeza de que deseja excluir este auxiliar? Esta ação não
            poderá ser desfeita.
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
            <button
              onClick={() =>
                setConfirmDeleteState({ isOpen: false, auxiliarId: null })
              }
              className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={executeDelete}
              className="bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700"
            >
              Confirmar Exclusão
            </button>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Meus Auxiliares
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 w-full sm:w-auto"
          >
            Adicionar
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.length === 0}
            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            Excluir
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        {isLoading ? (
          <p className="p-10 text-center text-gray-500">Carregando...</p>
        ) : error ? (
          <p className="p-10 text-center text-red-600">{error}</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 py-3 w-16 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    onChange={handleSelectAll}
                    checked={
                      auxiliares.length > 0 &&
                      selectedIds.length === auxiliares.length
                    }
                  />
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort("nome")}
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Nome{" "}
                    <SortIcon
                      direction={
                        sortConfig.key === "nome" ? sortConfig.direction : null
                      }
                    />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort("email")}
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email{" "}
                    <SortIcon
                      direction={
                        sortConfig.key === "email" ? sortConfig.direction : null
                      }
                    />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="text-center py-10">
                    Carregando...
                  </td>
                </tr>
              ) : auxiliares.length > 0 ? (
                auxiliares.map((aux) => (
                  <tr key={aux.id}>
                    <td className="p-4 py-4 w-16 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedIds.includes(aux.id)}
                        onChange={() => handleSelectOne(aux.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {aux.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {aux.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {aux.telefone || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteClick(aux.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500">
                    Nenhum auxiliar cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
