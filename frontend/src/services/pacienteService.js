import api from "./api";

/**
 * Busca a lista paginada de pacientes atendidos pelo médico logado.
 */
export const getMeusPacientes = (page = 1, size = 10, sortConfig) => {
  return api.get("/medicos/me/pacientes", {
    params: {
      page,
      size,
      sort: sortConfig?.key, // ex: 'nome'
      order: sortConfig?.direction, // ex: 'asc'
    },
  });
};

/**
 * Cadastra um paciente no sistema
 */
export const createPaciente = (pacienteData) => {
  // O token do médico/auxiliar logado já é enviado automaticamente pelo 'api'
  return api.post("/pacientes", pacienteData);
};

/**
 * Busca os dados do perfil do paciente logado.
 */
export const getMeuPerfil = () => {
  return api.get("/pacientes/me");
};

/**
 * Atualiza os dados do perfil do paciente logado.
 */
export const updateMeuPerfil = (idPaciente, pacienteData) => {
  return api.put(`/pacientes/${idPaciente}`, pacienteData);
};
