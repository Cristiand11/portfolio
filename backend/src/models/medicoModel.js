const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { formatarData } = require('../utils/dateUtils');

const Medico = {};

// Função para criar um médico
Medico.create = async (medicoData) => {
  const { nome, crm, email, telefone, especialidade, senha, ativo } = medicoData;

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(senha, salt);

  const { rows } = await db.query(
    'INSERT INTO medico (nome, crm, email, telefone, especialidade, senha, ativo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [nome, crm, email, telefone, especialidade, hash, ativo]
  );

  delete rows[0].senha;

  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  return rows[0];
};

// Função para buscar médicos
// Mapeia o nome do filtro da URL para o nome da coluna no banco
const allowedFilterFields = {
  'id': 'id',
  'nome': 'nome',
  'crm': 'crm',
  'email': 'email',
  'telefone': 'telefone',
  'especialidade': 'especialidade',
  'ativo': 'ativo',
  'createdDate': '"createdDate"',
  'lastModifiedDate': '"lastModifiedDate"'
};

const operatorMap = {
  eq: '=',      // Equals
  co: 'ILIKE',  // Contains (case-insensitive)
  gt: '>',      // Greater than
  lt: '<',      // Less than
  ne: '!=',     // Not equal
};

Medico.findPaginated = async (page = 1, size = 10, filterString = '', options = {}) => {
  const offset = (page - 1) * size;
  let whereClauses = [];
  const values = [];

  if (filterString) {
    const filters = filterString.split(' AND ');

    filters.forEach(filter => {
      const match = filter.match(/(\w+)\s+(eq|co|gt|lt|ne)\s+'([^']*)'/);
      if (match) {
        const [, field, operator, value] = match;
        if (Object.keys(allowedFilterFields).includes(field)) {
          const sqlField = allowedFilterFields[field];
          const sqlOperator = operatorMap[operator];
          if (sqlOperator) {
            // Adiciona a condição ao array de cláusulas
            whereClauses.push(`${sqlField} ${sqlOperator} $${values.length + 1}`);
            values.push(operator === 'co' ? `%${value}%` : value);
          }
        }
      }
    });
  }

  // Monta a cláusula WHERE final, se houver filtros
  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) FROM medico ${whereClause}`;
  const countResult = await db.query(countQuery, values);
  const totalElements = parseInt(countResult.rows[0].count, 10);

  let selectColumns = '';
  if (options.perfil === 'paciente') {
    selectColumns = 'id, nome, crm, email, telefone, especialidade';
  } else {
    selectColumns = 'id, nome, crm, email, telefone, especialidade, ativo, "createdDate", "lastModifiedDate", "inativacaoSolicitadaEm"';
  }

  let paramIndex = values.length + 1;
  const queryValues = [...values, size, offset];

  const dataQuery = `
    SELECT 
      ${selectColumns} 
    FROM medico 
      ${whereClause} 
    ORDER BY nome ASC 
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

  const { rows } = await db.query(dataQuery, queryValues);

  const formattedRows = rows.map(row => ({
    ...row,
    createdDate: formatarData(row.createdDate),
    lastModifiedDate: formatarData(row.lastModifiedDate)
  }));
  const totalPages = Math.ceil(totalElements / size);

  return {
    totalPages,
    totalElements,
    contents: formattedRows
  };
};

// Função para editar um médico
Medico.update = async (id, medicoData) => {
  const { nome, crm, email, telefone, especialidade, senha, ativo } = medicoData;

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(senha, salt);

  const { rows } = await db.query(
    'UPDATE medico SET nome = $1, crm = $2, email = $3, telefone = $4, especialidade = $5, senha = $6, ativo = $7, "lastModifiedDate" = NOW() WHERE id = $8 RETURNING *',
    [nome, crm, email, telefone, especialidade, hash, ativo, id]
  );

  delete rows[0].senha;

  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
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
    'UPDATE medico SET "inativacaoSolicitadaEm" = NOW() WHERE id = $1 AND ativo = true AND "inativacaoSolicitadaEm" IS NULL RETURNING *',
    [id]
  );
  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  rows[0].inativacaoSolicitadaEm = formatarData(rows[0].inativacaoSolicitadaEm);
  return rows[0];
};

// Função para reverter a solicitação de inativação de um médico
Medico.reverterInativacao = async (id) => {
  const { rows } = await db.query(
    'UPDATE medico SET "inativacaoSolicitadaEm" = NULL WHERE id = $1 AND "inativacaoSolicitadaEm" IS NOT NULL RETURNING *',
    [id]
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
Medico.findPacientesAtendidos = async (idMedico, page = 1, size = 10) => {
  const offset = (page - 1) * size;
  const statusPermitidos = ['Concluída', 'Agendada', 'Confirmada', 'Cancelada Pelo Paciente'];

  const countQuery = `
    SELECT COUNT(DISTINCT p.id) 
      FROM paciente p
      JOIN consulta c ON p.id = c.paciente_id
      WHERE c.medico_id = $1 AND c.status = ANY($2::varchar[])
  `;
  const countResult = await db.query(countQuery, [idMedico, statusPermitidos]);
  const totalElements = parseInt(countResult.rows[0].count, 10);

  const dataQuery = `
    SELECT 
      p.id, 
      p.nome, 
      p.cpf, 
      p.email, 
      p.telefone,
      MAX(c.data) as "ultimaConsultaData" -- <-- ALTERAÇÃO PRINCIPAL AQUI
    FROM paciente p
    JOIN consulta c ON p.id = c.paciente_id
    WHERE c.medico_id = $1 AND c.status = ANY($2::varchar[])
    GROUP BY p.id -- Agrupamos por paciente para que o MAX() funcione para cada um
    ORDER BY p.nome ASC
    LIMIT $3 OFFSET $4
  `;
  const { rows } = await db.query(dataQuery, [idMedico, statusPermitidos, size, offset]);

  const formattedRows = rows.map(row => {
    if (row.ultimaConsultaData) {
      row.ultimaConsultaData = new Date(row.ultimaConsultaData).toISOString().slice(0, 10);
    }
    return row;
  });

  const totalPages = Math.ceil(totalElements / size);

  return {
    totalPages,
    totalElements,
    contents: formattedRows
  };
};

module.exports = Medico;
