import api from "./api";

/**
 * Busca os horários de trabalho do médico logado.
 * O endpoint correto é /api/medicos/me/horarios
 */
export const getMeusHorarios = () => {
  return api.get("/medicos/me/horarios");
};
