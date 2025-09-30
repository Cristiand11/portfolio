const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { formatarData } = require('../utils/dateUtils');
const { formatarApenasData } = require('../utils/dateUtils');

const Auxiliar = {};

// --- CREATE ---
Auxiliar.create = async (auxiliarData) => {
  const { nome, email, telefone, dataNascimento, senha, idMedico } = auxiliarData;

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(senha, salt);

  const { rows } = await db.query(
    'INSERT INTO auxiliar (nome, email, telefone, "dataNascimento", senha, "idMedico") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [nome, email, telefone, dataNascimento, hash, idMedico]
  );

  delete rows[0].senha;
  rows[0].dataNascimento = formatarApenasData(rows[0].dataNascimento);
  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  return rows[0];
};

// --- READ  ---
const allowedFilterFields = {
  'id': 'id',
  'nome': 'nome',
  'email': 'email',
  'idMedico': '"idMedico"',
  'dataNascimento': '"dataNascimento"'
};

const operatorMap = {
  eq: '=',
  co: 'ILIKE',
};

Auxiliar.findPaginated = async (page = 1, size = 10, filterString = '', options = {}) => {
  const offset = (page - 1) * size;
  let whereClauses = [];
  const values = [];

  if (filterString) {
    const filters = filterString.split(' AND ');
    filters.forEach(filter => {
      const match = filter.match(/(\w+)\s+(eq|co)\s+'([^']*)'/);
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
  const countQuery = `SELECT COUNT(*) FROM auxiliar ${whereClause}`;
  const countResult = await db.query(countQuery, values);
  const totalElements = parseInt(countResult.rows[0].count, 10);

  let paramIndex = values.length + 1;
  const queryValues = [...values, size, offset];

  const dataQuery = `
        SELECT 
            id, nome, email, telefone, "dataNascimento", "idMedico", "createdDate", "lastModifiedDate" 
        FROM auxiliar 
        ${whereClause} 
        ORDER BY nome ASC 
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

  const { rows } = await db.query(dataQuery, queryValues);

  const formattedRows = rows.map(row => ({
    ...row,
    dataNascimento: formatarApenasData(row.dataNascimento),
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

// Função para buscar um único auxiliar
Auxiliar.findById = async (id) => {
  const { rows } = await db.query('SELECT * FROM auxiliar WHERE id = $1', [id]);
  if (rows[0]) {
    delete rows[0].senha;
  }
  rows[0].dataNascimento = formatarApenasData(rows[0].dataNascimento);
  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  return rows[0];
};


// --- UPDATE ---
Auxiliar.update = async (id, auxiliarData) => {
  const { nome, email, telefone, dataNascimento, senha, idMedico } = auxiliarData;
  const { rows } = await db.query(
    'UPDATE auxiliar SET nome = $1, email = $2, telefone = $3, "dataNascimento" = $4, senha = $5, "idMedico" = $6, "lastModifiedDate" = NOW() WHERE id = $7 RETURNING *',
    [nome, email, telefone, dataNascimento, senha, idMedico, id]
  );
  rows[0].dataNascimento = formatarApenasData(rows[0].dataNascimento);
  rows[0].createdDate = formatarData(rows[0].createdDate);
  rows[0].lastModifiedDate = formatarData(rows[0].lastModifiedDate);
  return rows[0];
};

// --- DELETE ---
Auxiliar.delete = async (id) => {
  const { rowCount } = await db.query('DELETE FROM auxiliar WHERE id = $1', [id]);
  return rowCount;
};

module.exports = Auxiliar;
