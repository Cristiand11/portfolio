import api from "./api";

/**
 * Busca a lista de auxiliares do médico logado.
 * O endpoint GET /api/medicos/me/auxiliares já retorna os dados paginados e ordenados se necessário.
 */
export const getMeusAuxiliares = (params) => {
  return api.get("/medicos/me/auxiliares", { params });
};

/**
 * Cria um novo auxiliar. O backend vincula automaticamente ao médico logado.
 */
export const createAuxiliar = (auxiliarData) => {
  return api.post("/auxiliares", auxiliarData);
};

/**
 * Deleta um auxiliar pelo seu ID.
 */
export const deleteAuxiliar = (id) => {
  return api.delete(`/auxiliares/${id}`);
};

/**
 * Deleta vários auxiliares pelos seus IDs
 */
export const deleteVariosAuxiliares = (ids) => {
  return api.delete("/auxiliares", { data: { ids } });
};

/**
 * Busca pelo médico que o auxiliar está vinculado
 */
export const getMeuMedicoVinculado = async () => {
  try {
    const response = await api.get("/auxiliares/meu-medico");
    return response;
  } catch (error) {
    throw error.response?.data || new Error("Erro ao buscar dados do médico.");
  }
};

/**
 * Busca pelos dados do próprio auxiliar
 */
export const getMeuPerfil = () => {
  return api.get("/auxiliares/me");
};

/**
 * Atualiza os dados do perfil do auxiliar logado.
 */
export const updateAuxiliar = (idAuxiliar, auxiliarData) => {
  return api.put(`/auxiliares/${idAuxiliar}`, auxiliarData);
};
