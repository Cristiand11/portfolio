const db = require('../config/database');
const { parseFilter } = require('../utils/queryUtils');
const { getDiasUteis } = require('../utils/dateUtils');

const Medico = require('../models/medicoModel');
const Auxiliar = require('../models/auxiliarModel');
const HorarioTrabalho = require('../models/horarioTrabalhoModel');

// Helper para validar o formato do CRM
function isCrmValido(crm) {
  if (!crm) return false;
  // Regex: verifica se o formato é número(s)/UF com 2 letras. Ex: 12345/SC
  const crmRegex = /^\d{1,8}\/[A-Z]{2}$/i;
  return crmRegex.test(crm);
}

// Função para listar todos os médicos
exports.getAllMedicos = async (req, res) => {
  try {
    const { page, size, filter } = req.query;
    const { perfil } = req.user;

    const pageNum = parseInt(page || '1', 10);
    const sizeNum = parseInt(size || '10', 10);

    let filterString = '';
    if (filter) {
      filterString = Array.isArray(filter) ? filter.join(' AND ') : filter;
    }

    const { sort, order } = req.query;
    const result = await Medico.findPaginated(pageNum, sizeNum, filterString, {
      perfil,
      sort,
      order,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao buscar médicos',
      error: error.message,
    });
  }
};

// Função para criar um médico
exports.createMedico = async (req, res) => {
  try {
    if (!isCrmValido(req.body.crm)) {
      return res
        .status(400)
        .json({ message: 'Formato de CRM inválido. Use o formato NÚMERO/UF (ex: 12345/SC).' });
    }

    const novoMedico = await Medico.create(req.body);
    res.status(201).json({
      message: 'Médico cadastrado com sucesso!',
      data: novoMedico,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao cadastrar médico',
      error: error.message,
    });
  }
};

// Função para atualizar um médico
exports.updateMedico = async (req, res) => {
  try {
    if (!isCrmValido(req.body.crm)) {
      return res
        .status(400)
        .json({ message: 'Formato de CRM inválido. Use o formato NÚMERO/UF (ex: 12345/SC).' });
    }

    const { id } = req.params;
    const medicoAtualizado = await Medico.update(id, req.body);

    if (!medicoAtualizado) {
      return res.status(404).json({ message: 'Médico não encontrado para atualização.' });
    }

    res.status(200).json({
      message: 'Médico atualizado com sucesso!',
      data: medicoAtualizado,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao atualizar médico',
      error: error.message,
    });
  }
};

// Função para deletar um médico
exports.deleteMedico = async (req, res) => {
  try {
    const { id } = req.params;
    const deletado = await Medico.delete(id);

    if (deletado === 0) {
      return res.status(404).json({ message: 'Médico não encontrado para remoção.' });
    }

    res.status(200).json({ message: 'Médico removido com sucesso!' });
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao remover médico',
      error: error.message,
    });
  }
};

// Função para um ADMIN solicitar a inativação de um médico
exports.solicitarInativacao = async (req, res) => {
  try {
    const { id } = req.params;

    const medicoExistente = await db.query('SELECT * FROM medico WHERE id = $1', [id]);

    if (medicoExistente.rows.length === 0) {
      return res.status(404).json({ message: 'Médico não encontrado.' });
    }
    if (medicoExistente.rows[0].inativacaoSolicitadaEm) {
      return res
        .status(409)
        .json({ message: 'Este médico já possui uma solicitação de inativação pendente.' });
    }

    const medico = await Medico.solicitarInativacao(id);
    delete medico.senha;
    res.status(200).json({
      message:
        'Solicitação de inativação registrada. O médico será inativado em 5 dias úteis se a ação não for revertida.',
      data: medico,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao solicitar inativação.', error: error.message });
  }
};

// Função para um ADMIN reverter uma solicitação de inativação de um médico
exports.reverterInativacao = async (req, res) => {
  try {
    const { id } = req.params;
    const medicoExistenteResult = await db.query('SELECT * FROM medico WHERE id = $1', [id]);
    if (medicoExistenteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Médico não encontrado.' });
    }

    const medicoExistente = medicoExistenteResult.rows[0];
    if (!medicoExistente.inativacaoSolicitadaEm) {
      return res
        .status(404)
        .json({ message: 'Médico não possui solicitação de inativação pendente.' });
    }

    const diasUteisPassados = getDiasUteis(medicoExistente.inativacaoSolicitadaEm);
    if (diasUteisPassados > 5) {
      return res
        .status(409)
        .json({ message: 'O prazo de 5 dias úteis para reverter esta solicitação já expirou.' });
    }

    const medico = await Medico.reverterInativacao(id);
    delete medico.senha;

    res
      .status(200)
      .json({ message: 'Solicitação de inativação revertida com sucesso.', data: medico });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao reverter solicitação.', error: error.message });
  }
};

// Função para o médico visualizar os pacientes que ele já atendeu
exports.getPacientesAtendidos = async (req, res) => {
  try {
    const idMedicoDoToken = req.user.id;

    const { page, size, sort, order } = req.query;
    const pageNum = parseInt(page || '1', 10);
    const sizeNum = parseInt(size || '10', 10);

    const pacientesPaginados = await Medico.findPacientesAtendidos(
      idMedicoDoToken,
      pageNum,
      sizeNum,
      sort,
      order
    );
    res.status(200).json(pacientesPaginados);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Erro ao buscar histórico de pacientes.', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const medicoId = req.user.id;

    const medico = await Medico.findById(medicoId);
    if (!medico) {
      // Este caso é raro, mas pode acontecer se o médico for deletado
      // e o token ainda estiver válido
      return res.status(404).json({ message: 'Médico não encontrado.' });
    }

    delete medico.inativacaoSolicitadaEm;
    res.status(200).json(medico);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar dados do médico.', error: error.message });
  }
};

exports.getMeusAuxiliares = async (req, res) => {
  try {
    const { page, size, filter, sort, order } = req.query;
    const pageNum = parseInt(page || '1', 10);
    const sizeNum = parseInt(size || '10', 10);

    const idMedicoDoToken = req.user.id;

    const securityFilter = `idMedico eq '${idMedicoDoToken}'`;

    let finalFilterString = securityFilter;
    if (filter) {
      const userFilter = Array.isArray(filter) ? filter.join(' AND ') : filter;
      finalFilterString = `${securityFilter} AND ${userFilter}`;
    }

    const result = await Auxiliar.findPaginated(pageNum, sizeNum, finalFilterString, {
      perfil: 'medico',
      sort,
      order,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar auxiliares.', error: error.message });
  }
};

exports.definirMeusHorarios = async (req, res) => {
  try {
    const idMedicoDoToken = req.user.id;
    const horarios = req.body;

    if (!Array.isArray(horarios)) {
      return res
        .status(400)
        .json({ message: 'O corpo da requisição deve ser um array de horários.' });
    }

    await HorarioTrabalho.definirHorarios(idMedicoDoToken, horarios);

    res.status(200).json({ message: 'Horários de trabalho atualizados com sucesso!' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Erro ao definir horários de trabalho.', error: error.message });
  }
};

exports.getHorariosByMedicoId = async (req, res) => {
  try {
    const { id: medicoId } = req.params;
    const horarios = await HorarioTrabalho.findByMedicoId(medicoId);

    res.status(200).json(horarios);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar horários do médico.', error: error.message });
  }
};

exports.getMeusHorarios = async (req, res) => {
  try {
    const idMedicoDoToken = req.user.id;
    const horarios = await HorarioTrabalho.findByMedicoId(idMedicoDoToken);

    res.status(200).json(horarios);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Erro ao buscar seus horários de trabalho.', error: error.message });
  }
};

exports.getPacientesByMedicoId = async (req, res) => {
  try {
    const { id: medicoId } = req.params;
    if (!medicoId) {
      return res.status(400).json({ message: 'ID do médico é obrigatório.' });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const size = parseInt(req.query.size, 10) || 10;
    const sort = req.query.sort;
    const order = req.query.order;
    const pacientesPaginados = await Medico.findPacientesAtendidos(
      medicoId,
      page,
      size,
      sort,
      order
    );

    res.status(200).json(pacientesPaginados);
  } catch (error) {
    console.error(`Erro ao buscar pacientes para o médico ${req.params.id}:`, error);
    res
      .status(500)
      .json({ message: 'Erro no servidor ao buscar pacientes.', error: error.message });
  }
};

exports.getConsultasByMedicoId = async (req, res) => {
  try {
    const { id: medicoId } = req.params;
    const { size = 1000, sort = 'data', order = 'asc', filter } = req.query;
    const page = 0;
    const offset = page * size;

    const validSortColumns = {
      data: 'c.data',
      hora: 'c.hora',
      status: 'c.status',
      nomePaciente: 'p.nome',
    };
    const sortKey = validSortColumns[sort] ? sort : 'data';
    const sortColumn = validSortColumns[sortKey] || validSortColumns.data;
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let whereClause = 'WHERE c.medico_id = $1';
    const queryParams = [medicoId];

    if (filter) {
      try {
        const { clause, params } = parseFilter(filter, queryParams.length + 1, {
          nomePaciente: 'p.nome',
        });
        if (clause) {
          whereClause += ` AND (${clause})`;
          queryParams.push(...params);
        }
      } catch (parseError) {
        return res.status(400).json({ message: 'Filtro inválido.', error: parseError.message });
      }
    }

    queryParams.push(size);
    queryParams.push(offset);

    // --- Query SQL ---
    const query = `
      SELECT
        c.id,
        c.data,
        c.hora,
        c."duracaoMinutos",
        c.status,
        p.nome AS "nomePaciente",
        c.observacoes,
        c.paciente_id AS "pacienteId"
      FROM consulta c
      JOIN PACIENTE p ON c.paciente_id = p.id 
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}, c.hora ${sortOrder} -- Ordena pela coluna correta (p.nome se for o caso)
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length};
    `;

    // Executa a query principal
    const consultaResult = await db.query(query, queryParams);
    const consultas = consultaResult.rows;

    res.status(200).json({
      contents: consultas,
    });
  } catch (error) {
    console.error(`Erro ao buscar consultas para o médico ${req.params.id}:`, error);
    res
      .status(500)
      .json({ message: 'Erro no servidor ao buscar consultas.', error: error.message });
  }
};
