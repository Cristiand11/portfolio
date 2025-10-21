import api from "./api";

export const login = async (email, senha, perfil) => {
  const response = await api.post("/auth/login", { email, senha, perfil });
  return response.data;
};

export const requestPasswordReset = async (email, perfil) => {
  try {
    const payload = { email, perfil };
    const response = await api.post("/auth/forgot-password", payload);

    return response.data;
  } catch (error) {
    console.error(
      "Erro ao solicitar redefinição de senha:",
      error.response?.data || error.message
    );

    if (error.response && error.response.data) {
      throw error.response.data;
    } else {
      throw new Error(
        "Não foi possível conectar ao servidor para solicitar a redefinição de senha."
      );
    }
  }
};

export const resetPassword = async (token, novaSenha) => {
  try {
    const payload = { token, novaSenha };
    const response = await api.post("/auth/reset-password", payload);
    return response.data;
  } catch (error) {
    console.error(
      "Erro ao redefinir a senha:",
      error.response?.data || error.message
    );
    if (error.response && error.response.data) {
      throw error.response.data;
    } else {
      throw new Error(
        "Não foi possível conectar ao servidor para redefinir a senha."
      );
    }
  }
};
