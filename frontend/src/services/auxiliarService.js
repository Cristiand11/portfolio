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
