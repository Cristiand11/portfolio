const db = require('../config/database');
const { formatarData, formatarApenasData } = require('../utils/dateUtils');

const Consulta = {};
const MINUTOS_ENTRE_CONSULTAS = 5;

function formatarConsulta(consulta) {
  if (!consulta) return null;

  consulta.data = formatarApenasData(consulta.data);
  consulta.dataRemarcacaoSugerida = formatarApenasData(consulta.dataRemarcacaoSugerida);
  consulta.createdDate = formatarData(consulta.createdDate);
  consulta.lastModifiedDate = formatarData(consulta.lastModifiedDate);

  delete consulta.senha;

  return consulta;
}

// --- CREATE ---
Consulta.create = async (consultaData) => {
  // Padronizando os nomes para camelCase
  const { data, hora, status, observacoes, idMedico, idPaciente, duracaoMinutos } = consultaData;
  const { rows } = await db.query(
    'INSERT INTO consulta (data, hora, status, observacoes, medico_id, paciente_id, "duracaoMinutos") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [data, hora, status, observacoes, idMedico, idPaciente, duracaoMinutos]
  );
  rows[0].data = formatarApenasData(rows[0].data);
  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  return rows[0];
};

// --- READ (PAGINATED & WITH JOINS) ---
const allowedFilterFields = {
  id: 'c.id',
  status: 'c.status',
  data: 'c.data',
  idMedico: 'c.medico_id',
  idPaciente: 'c.paciente_id',
  'medico.nome': 'm.nome', // Filtro por nome do médico
  'paciente.nome': 'p.nome', // Filtro por nome do paciente
  nomePaciente: 'p.nome',
};

const operatorMap = { eq: '=', co: 'ILIKE' };

const colunasOrdenaveis = {
  data: 'c.data',
  status: 'c.status',
  nomePaciente: 'p.nome',
};

Consulta.findPaginated = async (page = 1, size = 10, filterString = '', options = {}) => {
  const offset = (page - 1) * size;
  let whereClauses = [];
  const values = [];

  if (filterString) {
    const filters = filterString.split(' AND ');
    filters.forEach((filter) => {
      const match = filter.match(/([\w\.]+)\s+(eq|co)\s+'([^']*)'/);
      if (match) {
        const [, field, operator, value] = match;
        if (Object.keys(allowedFilterFields).includes(field)) {
          const sqlField = allowedFilterFields[field];
          const sqlOperator = operatorMap[operator];
          if (sqlOperator) {
            whereClauses.push(`${sqlField} ${sqlOperator} $${values.length + 1}`);
            values.push(operator === 'co' ? `%${value}%` : value);
          }
        }
      }
    });
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sortKey = options.sort || 'data';
  const sortOrder = options.order || 'asc';
  const orderByClause = colunasOrdenaveis[sortKey] || colunasOrdenaveis.data;
  const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const baseQuery = `FROM consulta c LEFT JOIN paciente p ON c.paciente_id = p.id`;

  const countQuery = `SELECT COUNT(c.id) ${baseQuery} ${whereClause}`;
  const countResult = await db.query(countQuery, values);
  const totalElements = parseInt(countResult.rows[0].count, 10);

  let paramIndex = values.length + 1;
  const queryValues = [...values, size, offset];
  const dataQuery = `
    SELECT c.*, p.nome as "nomePaciente"
    ${baseQuery} 
    ${whereClause} 
    ORDER BY ${orderByClause} ${orderDirection}, c.hora ASC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;

  const { rows } = await db.query(dataQuery, queryValues);
  const totalPages = Math.ceil(totalElements / size);

  const formattedRows = rows.map((row) => ({
    ...row,
    data: formatarApenasData(row.data),
    createdDate: formatarData(row.createdDate),
    lastModifiedDate: formatarData(row.lastModifiedDate),
  }));

  return { totalPages, totalElements, contents: formattedRows };
};

// --- UPDATE ---
Consulta.update = async (id, consultaData) => {
  let querySetParts = [];
  const values = [];
  let paramIndex = 1;

  // Constrói a query dinamicamente com os campos fornecidos
  for (const key in consultaData) {
    if (consultaData[key] !== undefined && key !== 'id') {
      // Usa aspas duplas para nomes de coluna em camelCase
      const colunasCamelCase = [
        'dataRemarcacaoSugerida',
        'horaRemarcacaoSugerida',
        'duracaoMinutos',
      ];
      const columnName = colunasCamelCase.includes(key) ? `"${key}"` : key;
      querySetParts.push(`${columnName} = $${paramIndex++}`);
      values.push(consultaData[key]);
    }
  }

  if (querySetParts.length === 0) {
    return Consulta.findById(id);
  }

  querySetParts.push(`"lastModifiedDate" = NOW()`);
  values.push(id);

  const query = `UPDATE consulta SET ${querySetParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

  const { rows } = await db.query(query, values);

  // Formata a resposta
  if (rows[0]) {
    rows[0].data = formatarApenasData(rows[0].data);
    rows[0].createdDate = formatarData(rows[0].createdDate);
    rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  }

  return rows[0];
};

/*
Removida por solicitação da professora
// --- DELETE ---
Consulta.delete = async (id) => {
  const { rowCount } = await db.query('DELETE FROM consulta WHERE id = $1', [id]);
  return rowCount;
};

Removida por solicitação da professora
// Deleta múltiplas consultas com base em um array de IDs
Consulta.deleteByIds = async (ids) => {
  const { rowCount } = await db.query('DELETE FROM consulta WHERE id = ANY($1::uuid[])', [ids]);
  return rowCount;
};
*/

// --- FUNÇÃO DE VALIDAÇÃO DE CONFLITO PARA O MÉDICO ---
Consulta.checkConflict = async (idMedico, data, hora, duracao, excludeConsultaId = null) => {
  const busyStatus = ['Agendada', 'Confirmada', 'Concluída'];
  let query = `
        SELECT COUNT(*) FROM consulta 
        WHERE medico_id = $1 AND data = $2 AND status = ANY($3::varchar[])
        AND (
            -- A nova consulta começa durante uma existente
            ($4::time >= hora AND $4::time < (hora + ("duracaoMinutos" + ${MINUTOS_ENTRE_CONSULTAS}) * INTERVAL '1 minute')) 
            OR 
            -- A nova consulta termina durante uma existente
            (($4::time + ($5::integer + ${MINUTOS_ENTRE_CONSULTAS}) * INTERVAL '1 minute') > hora AND ($4::time + ($5::integer + ${MINUTOS_ENTRE_CONSULTAS}) * INTERVAL '1 minute') <= (hora + ("duracaoMinutos" + ${MINUTOS_ENTRE_CONSULTAS}) * INTERVAL '1 minute'))
            OR
            -- A nova consulta "envelopa" uma existente
            ($4::time <= hora AND ($4::time + ($5::integer + ${MINUTOS_ENTRE_CONSULTAS}) * INTERVAL '1 minute') >= (hora + ("duracaoMinutos" + ${MINUTOS_ENTRE_CONSULTAS}) * INTERVAL '1 minute'))
        )
    `;
  const values = [idMedico, data, busyStatus, hora, duracao];

  if (excludeConsultaId) {
    query += ' AND id != $6';
    values.push(excludeConsultaId);
  }

  const { rows } = await db.query(query, values);
  return parseInt(rows[0].count, 10) > 0;
};

// --- FUNÇÃO DE VALIDAÇÃO DE CONFLITO PARA O PACIENTE ---
Consulta.checkPatientConflict = async (
  idPaciente,
  data,
  hora,
  duracao,
  excludeConsultaId = null
) => {
  // Definimos os status que são considerados "horário ocupado"
  const busyStatus = ['Agendada', 'Confirmada', 'Concluída'];

  let query = `
        SELECT COUNT(*) FROM consulta 
        WHERE paciente_id = $1 AND data = $2 AND status = ANY($3::varchar[])
        AND (
            -- A nova consulta começa durante uma existente
            ($4::time >= hora AND $4::time < (hora + ("duracaoMinutos" + ${MINUTOS_ENTRE_CONSULTAS}) * INTERVAL '1 minute')) 
            OR 
            -- A nova consulta termina durante uma existente
            (($4::time + ($5::integer + ${MINUTOS_ENTRE_CONSULTAS}) * INTERVAL '1 minute') > hora AND ($4::time + ($5::integer + ${MINUTOS_ENTRE_CONSULTAS}) * INTERVAL '1 minute') <= (hora + ("duracaoMinutos" + ${MINUTOS_ENTRE_CONSULTAS}) * INTERVAL '1 minute'))
            OR
            -- A nova consulta "envelopa" uma existente
            ($4::time <= hora AND ($4::time + ($5::integer + ${MINUTOS_ENTRE_CONSULTAS}) * INTERVAL '1 minute') >= (hora + ("duracaoMinutos" + ${MINUTOS_ENTRE_CONSULTAS}) * INTERVAL '1 minute'))
        )
    `;
  const values = [idPaciente, data, busyStatus, hora, duracao];

  // Se estivermos atualizando, precisamos excluir a própria consulta da verificação
  if (excludeConsultaId) {
    query += ' AND id != $6';
    values.push(excludeConsultaId);
  }

  const { rows } = await db.query(query, values);
  return parseInt(rows[0].count, 10) > 0;
};

// --- FUNÇÃO DE GET CONSULTA BY ID ---
Consulta.findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM consulta WHERE id = $1', [id]);
  rows[0].data = formatarApenasData(rows[0].data);
  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  return rows[0];
};

// --- FUNÇÃO DE SOLICITAÇÃO DE CANCELAMENTO ---
Consulta.cancelar = async (id, novoStatus) => {
  const { rows } = await db.query(
    'UPDATE consulta SET status = $1, "lastModifiedDate" = NOW() WHERE id = $2 RETURNING *',
    [novoStatus, id]
  );

  if (rows[0]) {
    rows[0].data = formatarApenasData(rows[0].data);
    rows[0].createdDate = formatarData(rows[0].createdDate);
    rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  }

  return rows[0];
};

// --- FUNÇÃO PARA MARCAR UMA CONSULTA COMO CONCLUÍDA ---
Consulta.marcarComoConcluida = async (id) => {
  const statusConcluido = 'Concluída';
  const { rows } = await db.query(
    'UPDATE consulta SET status = $1, "lastModifiedDate" = NOW() WHERE id = $2 RETURNING *',
    [statusConcluido, id]
  );
  if (rows[0]) {
    delete rows[0].senha; // Segurança caso houvesse dados sensíveis
  }
  rows[0].data = formatarApenasData(rows[0].data);
  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  return rows[0];
};

// --- FUNÇÃO PARA APROVAR UMA SOLICITAÇÃO DE AGENDAMENTO DE CONSULTA ---
Consulta.confirmar = async (id, novaData, novaHora) => {
  const { rows } = await db.query(
    `UPDATE consulta SET 
            status = 'Confirmada',
            data = $1,
            hora = $2,
            "dataRemarcacaoSugerida" = NULL,
            "horaRemarcacaoSugerida" = NULL,
            "lastModifiedDate" = NOW()
         WHERE id = $3 RETURNING *`,
    [novaData, novaHora, id]
  );
  rows[0].data = formatarApenasData(rows[0].data);
  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  return rows[0];
};

// --- FUNÇÃO PARA REPROVAR UMA SOLICITAÇÃO DE CONSULTA ---
Consulta.reprovar = async (id) => {
  const { rows } = await db.query(
    `UPDATE consulta SET 
            status = 'Confirmada',
            "dataRemarcacaoSugerida" = NULL,
            "horaRemarcacaoSugerida" = NULL,
            "lastModifiedDate" = NOW()
         WHERE id = $1 RETURNING *`,
    [id]
  );
  rows[0].data = formatarApenasData(rows[0].data);
  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  return rows[0];
};

// --- FUNÇÃO PARA SOLICITAR A REMARCAÇÃO DE CONSULTA ---
Consulta.solicitarRemarcacao = async (id, novaData, novaHora, novoStatus) => {
  const { rows } = await db.query(
    `UPDATE consulta SET 
            status = $1, 
            "dataRemarcacaoSugerida" = $2, 
            "horaRemarcacaoSugerida" = $3, 
            "lastModifiedDate" = NOW() 
         WHERE id = $4 RETURNING *`,
    [novoStatus, novaData, novaHora, id]
  );
  rows[0].data = formatarApenasData(rows[0].data);
  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  rows[0].dataRemarcacaoSugerida = formatarApenasData(rows[0].dataRemarcacaoSugerida);
  return rows[0];
};

// --- FUNÇÃO PARA ATUALIZAR O STATUS DA CONSULTA ---
Consulta.updateStatus = async (id, novoStatus) => {
  const { rows } = await db.query(
    'UPDATE consulta SET status = $1, "lastModifiedDate" = NOW() WHERE id = $2 RETURNING *',
    [novoStatus, id]
  );
  return rows[0];
};

// --- FUNÇÃO PARA ACEITAR A REMARCAÇÃO DA CONSULTA ---
Consulta.aceitarRemarcacao = async (id, novaData, novaHora) => {
  const { rows } = await db.query(
    `UPDATE consulta SET 
            status = 'Confirmada',
            data = $1,
            hora = $2,
            "dataRemarcacaoSugerida" = NULL,
            "horaRemarcacaoSugerida" = NULL,
            "lastModifiedDate" = NOW()
         WHERE id = $3 RETURNING *`,
    [novaData, novaHora, id]
  );
  return formatarConsulta(rows[0]);
};

// --- FUNÇÃO PARA REJEITAR A REMARCAÇÃO DA CONSULTA (VOLTA P/ O STATUS E DATA EM QUE SE ENCONTRAVA) ---
Consulta.rejeitarRemarcacao = async (id) => {
  const { rows } = await db.query(
    `UPDATE consulta SET 
            status = 'Confirmada',
            "dataRemarcacaoSugerida" = NULL,
            "horaRemarcacaoSugerida" = NULL,
            "lastModifiedDate" = NOW()
         WHERE id = $1 RETURNING *`,
    [id]
  );
  return formatarConsulta(rows[0]);
};

module.exports = Consulta;
