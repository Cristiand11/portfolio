import api from "./api";

/**
 * Busca os horários de trabalho do médico logado.
 */
export const getMeusHorarios = () => {
  return api.get("/medicos/me/horarios");
};

/**
 * Atualiza os horários de atendimento do médico logado.
 * @param {Array} horarios - Um array de objetos de horário.
 */
export const updateMeusHorarios = (horarios) => {
  return api.put("/medicos/me/horarios", horarios);
};
