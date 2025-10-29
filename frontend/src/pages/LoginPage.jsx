import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { requestPasswordReset } from "../services/authService";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, selectedProfile } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    if (!selectedProfile) {
      navigate("/selecionar-perfil");
    }
  }, [selectedProfile, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, senha, selectedProfile);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Falha no login. Verfique suas credenciais."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await requestPasswordReset(resetEmail, selectedProfile);
      toast.success(
        "Se o e-mail estiver cadastrado, um link de recuperação foi enviado."
      );
      setIsForgotPassword(false);
      setResetEmail("");
    } catch (err) {
      toast.success(
        "Se o e-mail estiver cadastrado, um link de recuperação foi enviado."
      );
      setIsForgotPassword(false);
      setResetEmail("");
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedProfile) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        {/* Botão Trocar Perfil */}
        {!isForgotPassword && (
          <button
            type="button"
            onClick={() => navigate("/selecionar-perfil")}
            className="w-full sm:w-1/3 text-center text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-md transition-colors mb-4"
          >
            Trocar Perfil
          </button>
        )}

        <h1 className="text-2xl font-bold text-center capitalize">
          {isForgotPassword ? "Recuperar Senha" : "Acessar AgendaMed"}
        </h1>

        {/* Renderização Condicional: Formulário de Login OU Esqueci a Senha */}
        {!isForgotPassword ? (
          // --- FORMULÁRIO DE LOGIN ---
          <form onSubmit={handleLogin} className="mt-4 space-y-4">
            {/* Campo de E-mail */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="seuemail@exemplo.com"
              />
            </div>
            {/* --- CAMPO DE SENHA --- */}
            <div>
              <label
                htmlFor="senha"
                className="block text-sm font-medium text-gray-700"
              >
                Senha
              </label>
              <div className="mt-1 relative">
                <input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>
            </div>

            {/* NOVO: Link "Esqueci a senha?" */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setError(""); // Limpa erros ao mudar de formulário
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Esqueci a senha
              </button>
            </div>

            {/* --- BOTÃO DE SUBMIT --- */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          // --- FORMULÁRIO ESQUECI A SENHA ---
          <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Digite seu e-mail para receber o link de recuperação de senha.
            </p>
            {/* Campo de E-mail para Recuperação */}
            <div>
              <label
                htmlFor="resetEmail"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="seuemail@exemplo.com"
              />
            </div>

            {/* Botão de Submit Recuperação */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
            </button>

            {/* NOVO: Link "Voltar para o login" */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(""); // Limpa erros ao mudar de formulário
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Voltar para o login
              </button>
            </div>
          </form>
        )}
        {error && <p className="mt-4 text-center text-red-600">{error}</p>}
      </div>
    </div>
  );
}
