import api from "./api";

/**
 * Busca a lista completa de médicos (acessível apenas pelo admin).
 */
export const getAllMedicos = (params) => {
  // O token do admin já é enviado automaticamente
  return api.get("/medicos", { params });
};

/**
 * Busca as stats para o dashboard
 */
export const getDashboardStats = () => {
  return api.get("/administradores/dashboard-stats");
};

/**
 * Cria um novo médico (acessível apenas pelo admin).
 */
export const createMedico = (medicoData) => {
  return api.post("/medicos", medicoData);
};
