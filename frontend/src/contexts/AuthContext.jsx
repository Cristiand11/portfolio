import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { login as loginService } from "../services/authService";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [selectedProfile, setSelectedProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Decodifica o token e armazena os dados do usuário no estado
      const decodedUser = jwtDecode(token);
      setUser(decodedUser);
    }
  }, [token]);

  const selectProfile = (perfil) => {
    setSelectedProfile(perfil);
    navigate("/login"); // Navega para a tela de login após selecionar
  };

  const login = async (email, senha, perfil) => {
    if (!selectedProfile) {
      throw new Error("Nenhum perfil selecionado.");
    }
    try {
      const data = await loginService(email, senha, perfil);
      localStorage.setItem("authToken", data.token);
      setToken(data.token);
      const decodedToken = jwtDecode(data.token);
      const userProfile = decodedToken.perfil;
      if (userProfile === "medico") {
        navigate("/medico/dashboard");
      } else if (userProfile === "paciente") {
        navigate("/paciente/dashboard");
      } else if (userProfile === "auxiliar") {
        navigate("/auxiliar/dashboard");
      } else if (userProfile === "administrador") {
        navigate("/admin/dashboard");
      } else {
        // Fallback, caso algo dê errado
        navigate("/");
      }
    } catch (error) {
      console.error("Falha no login", error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
    delete api.defaults.headers.common["Authorization"];
    navigate("/selecionar-perfil");
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, selectProfile, selectedProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para facilitar o uso do contexto
export const useAuth = () => {
  return useContext(AuthContext);
};
