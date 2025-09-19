import api from "./api";

export const login = async (email, senha, perfil) => {
  const response = await api.post("/auth/login", { email, senha, perfil });
  return response.data; // Retorna { message, token }
};
