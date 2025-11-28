const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { formatarData } = require('../utils/dateUtils');

const Medico = {};

// Função para criar um médico
Medico.create = async (medicoData) => {
  const { nome, crm, email, telefone, especialidade, senha } = medicoData;

  const status = medicoData.status !== undefined ? medicoData.status : 'Ativo';

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(senha, salt);

  const { rows } = await db.query(
    'INSERT INTO medico (nome, crm, email, telefone, especialidade, senha, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [nome, crm, email, telefone, especialidade, hash, status]
  );

  delete rows[0].senha;

  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  return rows[0];
};

// Mapeia o nome do filtro da URL para o nome da coluna no banco
const allowedFilterFields = {
  id: 'id',
  nome: 'nome',
  crm: 'crm',
  email: 'email',
  telefone: 'telefone',
  especialidade: 'especialidade',
  status: 'status',
  createdDate: '"createdDate"',
  lastModifiedDate: '"lastModifiedDate"',
  inativacaoSolicitadaEm: '"inativacaoSolicitadaEm"',
};

// Mapeia os campos permitidos para filtrar
const pacienteFilterFields = {
  nome: 'p.nome',
  email: 'p.email',
  telefone: 'p.telefone',
};

// Mapeia os campos permitidos para ordenar dos pacientes
const pacienteSortColumns = {
  nome: 'p.nome',
  email: 'p.email',
  ultimaConsultaData: 'MAX(c.data)',
};

const operatorMap = {
  eq: '=', // Equals
  co: 'ILIKE', // Contains (case-insensitive)
  gt: '>', // Greater than
  lt: '<', // Less than
  ne: '!=', // Not equal
  or: '||', // or other
  isnotnull: 'IS NOT NULL', // Not null
};

const colunasOrdenaveis = {
  nome: 'nome',
  crm: 'crm',
  email: 'email',
  ultimaConsultaData: 'MAX(c.data)',
  especialidade: 'especialidade',
  status: 'status',
  createdDate: '"createdDate"',
};

// Função para buscar médicos
Medico.findPaginated = async (page = 1, size = 10, filterString = '', options = {}) => {
  const offset = (page - 1) * size;
  let whereClauses = [];
  const values = [];

  if (filterString) {
    const andFilters = filterString.split(' AND ');

    andFilters.forEach((filterGroup) => {
      let orClauses = [];
      let orValues = [];
      let parseSuccess = true;

      const orParts = filterGroup.split(' or ');

      orParts.forEach((part) => {
        const match = part.match(/([\w.]+)\s+(eq|co|isnotnull)\s*'?([^']*)'?/);

        if (match) {
          const [, field, operator, value] = match;

          if (Object.keys(allowedFilterFields).includes(field)) {
            const sqlField = allowedFilterFields[field];
            const sqlOperator = operatorMap[operator];

            if (sqlOperator) {
              let clause;
              let val;

              if (field === 'createdDate' && operator === 'eq') {
                clause = `DATE(${sqlField}) = $${values.length + orValues.length + 1}`;
                val = value;
              } else if (operator === 'isnotnull') {
                clause = `${sqlField} ${sqlOperator}`;
              } else {
                clause = `${sqlField} ${sqlOperator} $${values.length + orValues.length + 1}`;
                val = operator === 'co' ? `%${value}%` : value;
              }

              orClauses.push(clause);
              if (operator !== 'isnotnull') {
                orValues.push(val);
              }
            } else {
              parseSuccess = false;
            }
          } else {
            parseSuccess = false;
          }
        } else {
          parseSuccess = false;
        }
      });

      if (parseSuccess && orClauses.length > 0) {
        whereClauses.push(`(${orClauses.join(' OR ')})`);
        values.push(...orValues);
      }
    });
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) FROM medico ${whereClause}`;
  const countResult = await db.query(countQuery, values);
  const totalElements = parseInt(countResult.rows[0].count, 10);

  const sortKey = options.sort || 'nome';
  const sortOrder = options.order || 'asc';
  const orderByClause = colunasOrdenaveis[sortKey] || colunasOrdenaveis.createdDate;
  const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  let selectColumns = '';
  if (options.perfil === 'paciente') {
    selectColumns = 'id, nome, crm, email, telefone, especialidade';
  } else {
    selectColumns =
      'id, nome, crm, email, telefone, especialidade, status, "createdDate", "lastModifiedDate", "inativacaoSolicitadaEm"';
  }

  let paramIndex = values.length + 1;
  const queryValues = [...values, size, offset];

  const dataQuery = `
    SELECT ${selectColumns} 
    FROM medico 
    ${whereClause} 
    ORDER BY ${orderByClause} ${orderDirection}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const { rows } = await db.query(dataQuery, queryValues);

  const formattedRows = rows.map((row) => ({
    ...row,
    createdDate: formatarData(row.createdDate),
    lastModifiedDate: formatarData(row.lastModifiedDate),
  }));
  const totalPages = Math.ceil(totalElements / size);

  return {
    totalPages,
    totalElements,
    contents: formattedRows,
  };
};

// Função para editar um médico
Medico.update = async (id, medicoData) => {
  const { senha, ...dadosSemSenha } = medicoData;

  let querySetParts = [];
  const values = [];
  let paramIndex = 1;

  for (const key in dadosSemSenha) {
    // Garante que não estamos tentando atualizar o ID ou campos nulos
    if (
      dadosSemSenha[key] !== undefined &&
      key !== 'id' &&
      key !== 'createdDate' &&
      key !== 'lastModifiedDate'
    ) {
      const colunasCamelCase = [
        'duracaoPadraoConsultaMinutos',
        'inativacaoSolicitadaEm',
        'cancelamentoAntecedenciaHoras',
      ];
      const columnName = colunasCamelCase.includes(key) ? `"${key}"` : key;
      querySetParts.push(`${columnName} = $${paramIndex++}`);
      values.push(dadosSemSenha[key]);
    }
  }

  // Se uma nova senha foi fornecida, e não é uma string vazia, criptografa e adiciona à query
  if (senha) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(senha, salt);
    querySetParts.push(`senha = $${paramIndex++}`);
    values.push(hash);
  }

  // Se não houver nada para atualizar, retorna os dados atuais
  if (querySetParts.length === 0) {
    return Medico.findById(id);
  }

  // Adiciona o lastModifiedDate e o WHERE
  querySetParts.push(`"lastModifiedDate" = NOW()`);
  values.push(id);

  const query = `UPDATE medico SET ${querySetParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

  const { rows } = await db.query(query, values);

  if (rows[0]) {
    delete rows[0].senha;
    rows[0].createdDate = formatarData(rows[0].createdDate);
    rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  }

  return rows[0];
};

// Função para deletar um médico pelo ID
Medico.delete = async (id) => {
  const { rowCount } = await db.query('DELETE FROM medico WHERE id = $1', [id]);
  return rowCount; // Retorna 1 se deletou, 0 se não encontrou
};

// Função para solicitar a inativação de um médico
Medico.solicitarInativacao = async (id) => {
  const { rows } = await db.query(
    'UPDATE medico SET status = $1, "inativacaoSolicitadaEm" = NOW() WHERE id = $2 AND status = $3 RETURNING *',
    ['Aguardando Inativação', id, 'Ativo']
  );
  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  rows[0].inativacaoSolicitadaEm = formatarData(rows[0].inativacaoSolicitadaEm);
  return rows[0];
};

// Função para reverter a solicitação de inativação de um médico
Medico.reverterInativacao = async (id) => {
  const { rows } = await db.query(
    'UPDATE medico SET status = $1, "inativacaoSolicitadaEm" = NULL WHERE id = $2 AND status = $3 RETURNING *',
    ['Ativo', id, 'Aguardando Inativação']
  );
  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  rows[0].inativacaoSolicitadaEm = formatarData(rows[0].inativacaoSolicitadaEm);
  return rows[0];
};

// Função para localizar um médico pelo ID
Medico.findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM medico WHERE id = $1', [id]);
  const medico = rows[0];

  // --- CORREÇÃO AQUI ---
  // Se nenhum médico for encontrado, retorna null imediatamente.
  if (!medico) {
    return null;
  }

  // Se encontrou, formata os dados e remove a senha antes de retornar.
  delete medico.senha;
  medico.createdDate = formatarData(medico.createdDate);
  medico.lastModifiedDate = formatarData(medico.lastModifiedDate);
  medico.inativacaoSolicitadaEm = formatarData(medico.inativacaoSolicitadaEm);

  return medico;
};

// Função para um médico visualizar os pacientes que ele já atendeu
Medico.findPacientesAtendidos = async (
  idMedico,
  page = 1,
  size = 10,
  sort,
  order,
  filterString = ''
) => {
  const offset = (page - 1) * size;

  let whereClauses = ['mp.medico_id = $1']; // Filtro base
  const values = [idMedico]; // Valor base

  if (filterString) {
    const filters = filterString.split(' AND ');
    filters.forEach((filter) => {
      const match = filter.match(/([\w.]+)\s+(eq|co|isnotnull)\s*["']?([^"']*)["']?/);
      if (match) {
        const [, field, operator, value] = match;

        // Verifica se o campo é permitido (nome, email, telefone)
        if (Object.keys(pacienteFilterFields).includes(field)) {
          const sqlField = pacienteFilterFields[field]; // ex: p.nome
          const sqlOperator = operatorMap[operator]; // ex: ILIKE

          if (sqlOperator) {
            whereClauses.push(`${sqlField} ${sqlOperator} $${values.length + 1}`);
            let finalValue = value;

            // Se for 'co' (contains/ILIKE), adiciona os curingas
            if (operator === 'co') {
              // Se for telefone, limpa a máscara (assumindo que o banco guarda só números)
              if (field === 'telefone') {
                finalValue = value.replace(/\D/g, '');
                // Se o banco também tiver máscara, comente a linha acima
              }
              finalValue = `%${finalValue}%`;
            }
            values.push(finalValue);
          }
        }
      }
    });
  }
  const whereClause = `WHERE ${whereClauses.join(' AND ')}`;

  // A query de contagem agora olha para a tabela de vínculo
  const countQuery = `
    SELECT COUNT(DISTINCT p.id) 
    FROM paciente p
    JOIN MEDICO_PACIENTE mp ON p.id = mp.paciente_id
    ${whereClause}
  `;
  const countResult = await db.query(countQuery, values);
  const totalElements = parseInt(countResult.rows[0].count, 10);

  const sortKey = sort || 'nome';
  const orderDirection = (order || 'asc').toUpperCase();
  const orderByClause = pacienteSortColumns[sortKey] || 'p.nome';

  // A query principal agora usa a tabela de vínculo como base e um LEFT JOIN
  const dataQuery = `
        SELECT 
            p.id, p.nome, p.cpf, p.email, p.telefone,
            MAX(c.data) as "ultimaConsultaData"
        FROM paciente p
        JOIN MEDICO_PACIENTE mp ON p.id = mp.paciente_id
        LEFT JOIN consulta c ON p.id = c.paciente_id AND c.medico_id = mp.medico_id
        ${whereClause}
        GROUP BY p.id
        ORDER BY ${orderByClause} ${orderDirection}
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
  const { rows } = await db.query(dataQuery, [...values, size, offset]);

  const formattedRows = rows.map((row) => {
    if (row.ultimaConsultaData) {
      row.ultimaConsultaData = new Date(row.ultimaConsultaData).toISOString().slice(0, 10);
    }
    return row;
  });

  const totalPages = Math.ceil(totalElements / size);
  return { totalPages, totalElements, contents: formattedRows };
};

// Função para criar um vínculo entre médico e paciente
Medico.createLink = async (medicoId, pacienteId) => {
  const query = `
    INSERT INTO MEDICO_PACIENTE (medico_id, paciente_id) 
    VALUES ($1, $2) 
    ON CONFLICT (medico_id, paciente_id) DO NOTHING
  `;
  await db.query(query, [medicoId, pacienteId]);
};

// Função para verificar o horário disponível do médico
Medico.isHorarioDisponivel = async (medicoId, data, hora, duracao) => {
  const dataObj = new Date(`${data}T${hora}`);
  const diaSemana = dataObj.getDay(); // Usamos getUTCDay para ser consistente

  const horaFimProposta = `(TIME '${hora}' + INTERVAL '${duracao} minutes')`;

  const { rows } = await db.query(
    `SELECT COUNT(*) FROM HORARIO_TRABALHO 
      WHERE medico_id = $1 
        AND dia_semana = $2 
        AND $3::time >= hora_inicio 
        AND ${horaFimProposta} <= hora_fim`,
    [medicoId, diaSemana, hora]
  );

  return parseInt(rows[0].count, 10) > 0;
};

// Conta o total de médicos com status 'ativo'
Medico.countAtivos = async () => {
  const { rows } = await db.query('SELECT COUNT(*) FROM medico WHERE status = $1', ['Ativo']);
  return parseInt(rows[0].count, 10);
};

// Conta as solicitações de inativação feitas nos últimos X dias
Medico.countSolicitacoesInativacaoRecentes = async (startDate) => {
  const { rows } = await db.query(
    'SELECT COUNT(*) FROM medico WHERE "inativacaoSolicitadaEm" >= $1',
    [startDate]
  );
  return parseInt(rows[0].count, 10);
};

module.exports = Medico;
