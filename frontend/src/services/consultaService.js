import api from "./api";

/**
 * Busca as consultas do usuário logado.
 * Pode receber filtros como parâmetros.
 */
export const getMinhasConsultas = (params) => {
  let queryString = "";

  if (params) {
    // Construímos a string de busca manualmente
    const filterParams = [];
    if (params.filter) {
      // Garante que o filtro seja sempre um array para facilitar
      const filters = Array.isArray(params.filter)
        ? params.filter
        : [params.filter];
      filters.forEach((f) => {
        // Codifica o filtro para ser seguro na URL e adiciona ao array
        filterParams.push(`filter=${encodeURIComponent(f)}`);
      });
    }

    // Adiciona outros parâmetros se existirem (como page, size)
    if (params.page) filterParams.push(`page=${params.page}`);
    if (params.size) filterParams.push(`size=${params.size}`);

    // Junta todos os parâmetros com '&'
    if (filterParams.length > 0) {
      queryString = `?${filterParams.join("&")}`;
    }
  }

  // Faz a chamada para a URL com a string de busca montada
  return api.get(`/consultas${queryString}`);
};
