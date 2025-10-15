import { useState } from "react";
import { createMedico } from "../../services/adminService";
import toast from "react-hot-toast";
import { InputMask } from "@react-input/mask";

export default function AddMedicoForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nome: "",
    crm: "",
    email: "",
    senha: "",
    telefone: "",
    especialidade: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createMedico(formData);
      toast.success("Médico cadastrado com sucesso!");
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Não foi possível cadastrar o médico.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            htmlFor="crm"
            className="block text-sm font-medium text-gray-700"
          >
            CRM
          </label>
          <input
            type="text"
            name="crm"
            id="crm"
            value={formData.crm}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            placeholder="12345/SC"
          />
        </div>
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
        />
      </div>

      <div>
        <label
          htmlFor="senha"
          className="block text-sm font-medium text-gray-700"
        >
          Senha Provisória
        </label>
        <div className="mt-1 relative">
          <input
            type={showPassword ? "text" : "password"}
            name="senha"
            id="senha"
            value={formData.senha}
            onChange={handleChange}
            required
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            placeholder="••••••••"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            htmlFor="especialidade"
            className="block text-sm font-medium text-gray-700"
          >
            Especialidade
          </label>
          <input
            type="text"
            name="especialidade"
            id="especialidade"
            value={formData.especialidade}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t mt-6">
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
          {isLoading ? "Salvando..." : "Salvar Médico"}
        </button>
      </div>
    </form>
  );
}
