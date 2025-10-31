import { useState } from "react";
import toast from "react-hot-toast";
import { createAuxiliar } from "../../services/auxiliarService";
import { InputMask } from "@react-input/mask";

export default function AddAuxiliarForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createAuxiliar(formData);
      toast.success("Auxiliar cadastrado com sucesso!");
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Não foi possível cadastrar o auxiliar.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          value={formData.nome}
          onChange={handleChange}
          required
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
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          placeholder="auxiliar@email.com"
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
          value={formData.telefone}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          placeholder="(47) 99999-9999"
        />
      </div>
      <div>
        <label
          htmlFor="senha"
          className="block text-sm font-medium text-gray-700"
        >
          Senha Provisória
        </label>
        <input
          type="password"
          name="senha"
          id="senha"
          value={formData.senha}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          placeholder="••••••••"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {isLoading ? "Salvando..." : "Salvar Auxiliar"}
        </button>
      </div>
    </form>
  );
}
