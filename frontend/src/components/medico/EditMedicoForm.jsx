import { useState, useEffect } from "react";
import { updateMedico } from "../../services/adminService";
import toast from "react-hot-toast";
import { InputMask } from "@react-input/mask";

// O formulário agora recebe o objeto 'medico' com os dados atuais
export default function EditMedicoForm({ medico, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nome: "",
    crm: "",
    email: "",
    telefone: "",
    especialidade: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Preenche o formulário com os dados do médico quando o componente é carregado
  useEffect(() => {
    if (medico) {
      setFormData({
        nome: medico.nome || "",
        crm: medico.crm || "",
        email: medico.email || "",
        telefone: medico.telefone || "",
        especialidade: medico.especialidade || "",
      });
    }
  }, [medico]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateMedico(medico.id, formData);
      toast.success("Dados do médico atualizados com sucesso!");
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Não foi possível atualizar os dados.";
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
          readOnly
          className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 cursor-not-allowed"
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
        />
      </div>

      <div>
        <label
          htmlFor="senha"
          className="block text-sm font-medium text-gray-700"
        >
          Nova Senha
        </label>
        <div className="mt-1 relative">
          <input
            type={showPassword ? "text" : "password"}
            name="senha"
            id="senha"
            value={formData.senha || ""}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            placeholder="Digite uma nova senha..."
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

      <div className="flex justify-end gap-4 pt-4 border-t mt-6">
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
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700"
        >
          {isLoading ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </form>
  );
}
