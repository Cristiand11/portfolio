import { useState } from "react";
import { createPaciente } from "../../services/pacienteService";
import toast from "react-hot-toast";
import { InputMask } from "@react-input/mask";

export default function AddPacienteForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    senha: "",
    cepCodigo: "",
    enderecoNumero: "",
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
      await createPaciente(formData);
      toast.success("Paciente cadastrado com sucesso!");
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Não foi possível cadastrar o paciente.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* --- CAMPO DE NOME --- */}
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
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* --- LINHA DE CPF E TELEFONE --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            name="cpf"
            value={formData.cpf}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* --- CAMPO DE EMAIL --- */}
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
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="paciente@email.com"
        />
      </div>

      {/* --- CAMPO DE SENHA COM "OLHO" --- */}
      <div>
        <label
          htmlFor="senha"
          className="block text-sm font-medium text-gray-700"
        >
          Senha
        </label>
        <div className="mt-1 relative">
          <input
            type={showPassword ? "text" : "password"}
            name="senha"
            id="senha"
            value={formData.senha}
            onChange={handleChange}
            required
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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

      <p className="text-xs text-gray-500 pt-2 border-t mt-4">
        Se o CEP for informado, o endereço será preenchido automaticamente.
      </p>

      {/* --- LINHA DE CEP E NÚMERO --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            value={formData.cepCodigo}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="00000-000"
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
            value={formData.enderecoNumero}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* --- BOTÕES DE AÇÃO --- */}
      <div className="flex justify-end gap-4 pt-4 border-t mt-6">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Salvando..." : "Salvar Paciente"}
        </button>
      </div>
    </form>
  );
}
