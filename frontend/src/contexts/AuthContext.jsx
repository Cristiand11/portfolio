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
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
      } catch (error) {
        console.error("Token inválido ou expirado:", error);
        localStorage.removeItem("authToken");
        setToken(null);
        setUser(null);
      }
    } else {
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    }
  }, [token]);

  const selectProfile = (perfil) => {
    setSelectedProfile(perfil);
    navigate("/login");
  };

  const login = async (email, senha, perfil) => {
    if (!selectedProfile) {
      throw new Error("Nenhum perfil selecionado.");
    }
    try {
      const data = await loginService(email, senha, perfil);

      const decodedToken = jwtDecode(data.token);
      const userProfile = decodedToken.perfil;

      localStorage.setItem("authToken", data.token);
      setToken(data.token);

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
