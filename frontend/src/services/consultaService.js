import api from "./api";

/**
 * Busca as consultas do usuário logado.
 * Pode receber filtros como parâmetros.
 */
export const getMinhasConsultas = (params) => {
  let queryString = "";

  if (params) {
    const filterParams = [];

    if (params.filter) {
      const filters = Array.isArray(params.filter)
        ? params.filter
        : [params.filter];
      filters.forEach((f) => {
        filterParams.push(`filter=${encodeURIComponent(f)}`);
      });
    }

    if (params.page) filterParams.push(`page=${params.page}`);
    if (params.size) filterParams.push(`size=${params.size}`);

    if (params.sort) filterParams.push(`sort=${params.sort}`);
    if (params.order) filterParams.push(`order=${params.order}`);

    if (filterParams.length > 0) {
      queryString = `?${filterParams.join("&")}`;
    }
  }

  return api.get(`/consultas${queryString}`);
};

/**
 * Busca as consultas pelo ID do médico
 */
export const getConsultasByMedicoId = async (medicoId, queryParams = {}) => {
  return api.get(`/medicos/${medicoId}/consultas`, { params: queryParams });
};

/**
 * Cria/propõe uma nova consulta.
 */
export const createConsulta = (consultaData) => {
  return api.post("/consultas", consultaData);
};

/**
 * Médico ou auxiliar cancela uma consulta.
 */
export const cancelarConsultaAdmin = (consultaId) => {
  return api.post(`/consultas/${consultaId}/cancelar`);
};

/**
 * Paciente cancela uma consulta
 */
export const cancelarConsulta = (consultaId) => {
  return api.post(`/consultas/${consultaId}/cancelar`);
};

/**
 * Confirma uma consulta pendente.
 */
export const confirmarConsulta = (consultaId) => {
  return api.post(`/consultas/${consultaId}/confirmar`);
};

/**
 * Solicita a remarcação de uma consulta.
 */
export const solicitarRemarcacao = (consultaId, novaData, novaHora) => {
  return api.post(`/consultas/${consultaId}/solicitar-remarcacao`, {
    novaData,
    novaHora,
  });
};

/**
 * Conclui uma consulta
 */
export const concluirConsulta = (consultaId) => {
  return api.post(`/consultas/${consultaId}/concluir`);
};

/**
 * Atualiza os dados de uma consulta existente.
 */
export const updateConsulta = (id, data) => {
  return api.put(`/consultas/${id}`, data);
};

/**
 * Deleta múltiplas consultas com base em um array de IDs.

export const deleteVariasConsultas = (ids) => {
  return api.delete("/consultas", { data: { ids } });
};
*/

/**
 * Aceita uma proposta de remarcação.
 */
export const aceitarRemarcacao = (consultaId) => {
  return api.post(`/consultas/${consultaId}/aceitar-remarcacao`);
};

/**
 * Rejeita uma proposta de remarcação.
 */
export const rejeitarRemarcacao = (consultaId) => {
  return api.post(`/consultas/${consultaId}/rejeitar-remarcacao`);
};
