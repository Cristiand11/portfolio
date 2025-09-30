import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getMeuPerfil, updateMeuPerfil } from "../../services/medicoService";
import toast from "react-hot-toast";

export default function MeuPerfilPage() {
  const { user } = useAuth(); // Pega o usuário logado do contexto
  const [perfilData, setPerfilData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Busca os dados do perfil quando o componente é montado
  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      getMeuPerfil()
        .then((response) => {
          setPerfilData(response.data);
        })
        .catch((err) => {
          console.error("Erro ao buscar perfil:", err);
          setError("Não foi possível carregar os dados do perfil.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user]); // Roda sempre que o usuário do contexto mudar

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPerfilData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await updateMeuPerfil(user.id, perfilData);
      setPerfilData(response.data.data); // Atualiza o estado com os dados retornados
      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      toast.error(
        err.response?.data?.message || "Não foi possível atualizar o perfil."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Carregando perfil...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Meu Perfil</h1>
      <p className="mt-1 text-gray-600">
        Atualize suas informações pessoais e profissionais.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 bg-white p-6 rounded-lg shadow-md space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna da Esquerda */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="nome"
                className="block text-sm font-medium text-gray-700"
              >
                Nome Completo
              </label>
              <input
                type="text"
                name="nome"
                id="nome"
                value={perfilData?.nome || ""}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={perfilData?.email || ""}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label
                htmlFor="crm"
                className="block text-sm font-medium text-gray-700"
              >
                CRM
              </label>
              <input
                type="text"
                id="crm"
                value={perfilData?.crm || ""}
                readOnly
                className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Coluna da Direita */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="especialidade"
                className="block text-sm font-medium text-gray-700"
              >
                Especialidade Médica
              </label>
              <input
                type="text"
                name="especialidade"
                id="especialidade"
                value={perfilData?.especialidade || ""}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label
                htmlFor="telefone"
                className="block text-sm font-medium text-gray-700"
              >
                Telefone
              </label>
              <input
                type="tel"
                name="telefone"
                id="telefone"
                value={perfilData?.telefone || ""}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label
                htmlFor="duracaoPadraoConsultaMinutos"
                className="block text-sm font-medium text-gray-700"
              >
                Duração Padrão da Consulta (minutos)
              </label>
              <input
                type="number"
                name="duracaoPadraoConsultaMinutos"
                id="duracaoPadraoConsultaMinutos"
                value={perfilData?.duracaoPadraoConsultaMinutos || ""}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label
                htmlFor="cancelamentoAntecedenciaHoras"
                className="block text-sm font-medium text-gray-700"
              >
                Antecedência para Cancelamento (horas)
              </label>
              <input
                type="number"
                name="cancelamentoAntecedenciaHoras"
                id="cancelamentoAntecedenciaHoras"
                value={perfilData?.cancelamentoAntecedenciaHoras || ""}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
