import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { format } from "date-fns";
import { getMeuPerfil, updateMeuPerfil } from "../../services/pacienteService";
import toast from "react-hot-toast";
import { InputMask } from "@react-input/mask";
import DatePicker from "../../components/DatePicker";

export default function MeuPerfilPage() {
  const { user } = useAuth();
  const [perfilData, setPerfilData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.id) {
      getMeuPerfil()
        .then((response) => {
          setPerfilData(response.data);
        })
        .catch(() => {
          setError("Não foi possível carregar os dados do perfil.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPerfilData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    // Formata a data para 'YYYY-MM-DD' antes de guardar no estado
    const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
    setPerfilData((prev) => ({ ...prev, dataNascimento: formattedDate }));
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

  if (isLoading) return <div>Carregando perfil...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Meu Perfil</h1>
      <p className="mt-1 text-gray-600">Atualize suas informações pessoais.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 bg-white p-6 rounded-lg shadow-md space-y-6"
      >
        {/* --- DADOS PESSOAIS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              htmlFor="cpf"
              className="block text-sm font-medium text-gray-700"
            >
              CPF
            </label>
            <InputMask
              mask="___.___.___-__"
              replacement={{ _: /\d/ }}
              id="cpf"
              value={perfilData?.cpf || ""}
              readOnly
              className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 cursor-not-allowed"
            />
          </div>
          <div>
            <label
              htmlFor="dataNascimento"
              className="block text-sm font-medium text-gray-700"
            >
              Data de Nascimento
            </label>
            <DatePicker
              value={perfilData?.dataNascimento}
              onChange={handleDateChange}
            />
          </div>
          <div>
            <label
              htmlFor="telefone"
              className="block text-sm font-medium text-gray-700"
            >
              Telefone
            </label>
            <InputMask
              mask="(__) _____-____"
              replacement={{ _: /\d/ }}
              id="telefone"
              name="telefone"
              value={perfilData?.telefone || ""}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
        </div>

        {/* --- DADOS DE ACESSO --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
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
              htmlFor="senha"
              className="block text-sm font-medium text-gray-700"
            >
              Nova Senha
            </label>
            <input
              type="password"
              name="senha"
              id="senha"
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              placeholder="Deixe em branco para não alterar"
            />
          </div>
        </div>

        {/* --- ENDEREÇO --- */}
        <div className="pt-6 border-t">
          <p className="text-sm text-gray-600 mb-4">
            Se o CEP for informado, o endereço será preenchido automaticamente.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="cepCodigo"
                className="block text-sm font-medium text-gray-700"
              >
                CEP
              </label>
              <InputMask
                mask="_____-___"
                replacement={{ _: /\d/ }}
                id="cepCodigo"
                name="cepCodigo"
                value={perfilData?.cepCodigo || ""}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label
                htmlFor="endereco"
                className="block text-sm font-medium text-gray-700"
              >
                Endereço
              </label>
              <input
                type="text"
                name="endereco"
                id="endereco"
                value={perfilData?.endereco || ""}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label
                htmlFor="enderecoNumero"
                className="block text-sm font-medium text-gray-700"
              >
                Número
              </label>
              <input
                type="text"
                name="enderecoNumero"
                id="enderecoNumero"
                value={perfilData?.enderecoNumero || ""}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
          </div>
        </div>

        {/* --- BOTÃO DE SALVAR --- */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 border-t">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 w-full sm:w-auto"
          >
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
