import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useOutletContext } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { getMeuPerfil, updateAuxiliar } from "../../services/auxiliarService";
import toast from "react-hot-toast";
import { InputMask } from "@react-input/mask";
import DatePicker from "../../components/DatePicker";

export default function MeuPerfilPage() {
  const { user } = useAuth();
  const { setPageTitle } = useOutletContext();
  const [perfilData, setPerfilData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPageTitle("Meu Perfil");
  }, [setPageTitle]);

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      getMeuPerfil()
        .then((response) => {
          const data = response.data;
          if (data.dataNascimento) {
            data.dataNascimento = format(
              parseISO(data.dataNascimento),
              "yyyy-MM-dd"
            );
          }
          setPerfilData(data);
        })
        .catch(() => {
          setError("Não foi possível carregar os dados do perfil.");
          toast.error("Não foi possível carregar os dados do perfil.");
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
    const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
    setPerfilData((prev) => ({ ...prev, dataNascimento: formattedDate }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { senha, ...dataToUpdate } = perfilData;
      if (senha && senha.length > 0) {
        dataToUpdate.senha = senha;
      }

      const response = await updateAuxiliar(user.id, dataToUpdate);
      const data = response.data.data;

      if (data.dataNascimento) {
        data.dataNascimento = format(
          parseISO(data.dataNascimento),
          "yyyy-MM-dd"
        );
      }
      setPerfilData(data);
      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Não foi possível atualizar o perfil."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !perfilData) {
    return <div>Carregando perfil...</div>;
  }
  if (error) {
    return <div className="text-red-600">{error}</div>;
  }
  if (!perfilData) {
    return null;
  }

  return (
    <div>
      <p className="mt-1 text-gray-600 mb-6">
        Atualize suas informações pessoais.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 bg-white p-6 rounded-lg shadow-md space-y-6"
      >
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
              value={perfilData.nome || ""}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
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
              value={perfilData.dataNascimento}
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
              value={perfilData.telefone || ""}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
        </div>

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
              value={perfilData.email || ""}
              onChange={handleChange}
              required
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
