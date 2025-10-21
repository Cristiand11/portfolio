import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login, selectedProfile } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  if (!selectedProfile) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <button
          type="button"
          onClick={() => navigate("/selecionar-perfil")}
          className="w-full sm:w-1/3 text-center text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-md transition-colors mb-4"
        >
          Trocar Perfil
        </button>
        <h1 className="text-2xl font-bold text-center capitalize">
          Acessar AgendaMed
        </h1>
        <form onSubmit={handleLogin} className="mt-4 space-y-4">
          {/* --- CAMPO DE E-MAIL --- */}
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
          {/* --- BOTÃO DE SUBMIT --- */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        {error && <p className="mt-4 text-center text-red-600">{error}</p>}
      </div>
    </div>
  );
}
