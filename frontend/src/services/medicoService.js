import api from "./api";

/**
 * Busca os dados do perfil do médico logado.
 */
export const getMeuPerfil = () => {
  return api.get("/medicos/me");
};

/**
 * Atualiza os dados do perfil do médico logado.
 */
export const updateMeuPerfil = (idMedico, medicoData) => {
  return api.put(`/medicos/${idMedico}`, medicoData);
};
