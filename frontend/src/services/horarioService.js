import api from "./api";

/**
 * Médico busca os seus horários de trabalho.
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

/**
 * Qualquer usuário busca o horário de trabalho de um médico
 */
export const getHorariosByMedicoId = async (medicoId, queryParams = {}) => {
  if (!medicoId) {
    throw new Error("ID do médico é obrigatório para buscar horários.");
  }
  return api.get(`/medicos/${medicoId}/horarios`, { params: queryParams });
};
