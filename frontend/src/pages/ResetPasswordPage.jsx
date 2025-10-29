import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/authService";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 1. Extrai o token da URL na montagem do componente
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (!urlToken) {
      toast.error("Token de redefinição inválido ou ausente.");
      navigate("/login"); // Redireciona se não houver token
    } else {
      setToken(urlToken);
    }
  }, [searchParams, navigate]);

  // 2. Lida com a submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Limpa erros anteriores

    // Validação básica
    if (novaSenha.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }
    if (!token) {
      setError("Token inválido."); // Segurança adicional
      return;
    }

    setIsLoading(true);
    try {
      // Chama o serviço para redefinir a senha
      await resetPassword(token, novaSenha);
      toast.success("Senha redefinida com sucesso! Você já pode fazer login.");
      navigate("/login"); // Redireciona para o login após sucesso
    } catch (err) {
      setError(
        err.message ||
          "Não foi possível redefinir a senha. O link pode ter expirado."
      );
      toast.error(err.message || "Não foi possível redefinir a senha.");
    } finally {
      setIsLoading(false);
    }
  };

  // Renderiza apenas se o token for válido (evita renderização antes do useEffect)
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Verificando link...</p>
      </div>
    ); // Ou um spinner
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Redefinir Senha</h1>
        <p className="text-sm text-gray-600 text-center mb-4">
          Digite sua nova senha abaixo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* --- CAMPO NOVA SENHA --- */}
          <div>
            <label
              htmlFor="novaSenha"
              className="block text-sm font-medium text-gray-700"
            >
              Nova Senha
            </label>
            <div className="mt-1 relative">
              <input
                id="novaSenha"
                type={showPassword ? "text" : "password"}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
          </div>

          {/* --- CAMPO CONFIRMAR SENHA --- */}
          <div>
            <label
              htmlFor="confirmarSenha"
              className="block text-sm font-medium text-gray-700"
            >
              Confirmar Nova Senha
            </label>
            <div className="mt-1 relative">
              <input
                id="confirmarSenha"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
          </div>

          {/* Botão de Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            {isLoading ? "Salvando..." : "Redefinir Senha"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-center text-red-600 text-sm">{error}</p>
        )}

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    </div>
  );
}
