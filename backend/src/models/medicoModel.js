const db = require('../config/database');

const Medico = {};

// Função para criar um médico
Medico.create = async (medicoData) => {
  const { nome, crm, email, telefone, especialidade, ativo } = medicoData;
  const { rows } = await db.query(
    'INSERT INTO medico (nome, crm, email, telefone, especialidade, ativo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [nome, crm, email, telefone, especialidade, ativo]
  );
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

Medico.findPaginated = async (page = 1, size = 10, filterString = '') => {
  const offset = (page - 1) * size;

  let whereClauses = [];
  const values = [];

  if (filterString) {
    // Separa a string de filtros por ' AND '
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

  const queryValues = [...values];
  let paramIndex = values.length + 1;

  queryValues.push(size, offset);

  const dataQuery = `SELECT * FROM medico ${whereClause} ORDER BY nome ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  const { rows } = await db.query(dataQuery, queryValues);

  const totalPages = Math.ceil(totalElements / size);

  return {
    totalPages,
    totalElements,
    contents: rows
  };
};

// Função para editar um médico
Medico.update = async (id, medicoData) => {
  const { nome, crm, email, telefone, especialidade, ativo } = medicoData;
  const { rows } = await db.query(
    'UPDATE medico SET nome = $1, crm = $2, email = $3, telefone = $4, especialidade = $5, ativo = $6, "lastModifiedDate" = NOW() WHERE id = $7 RETURNING *',
    [nome, crm, email, telefone, especialidade, ativo, id]
  );
  return rows[0];
};

// Função para deletar um médico pelo ID
Medico.delete = async (id) => {
  const { rowCount } = await db.query('DELETE FROM medico WHERE id = $1', [id]);
  return rowCount; // Retorna 1 se deletou, 0 se não encontrou
};

module.exports = Medico;