const db = require('../config/database');
const bcrypt = require('bcryptjs');

const Administrador = {};

// --- CREATE ---
Administrador.create = async (adminData) => {
    const { nome, email, senha } = adminData;

    // Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(senha, salt);

    const { rows } = await db.query(
        'INSERT INTO administrador (nome, email, senha) VALUES ($1, $2, $3) RETURNING *',
        [nome, email, hash]
    );
    // Remove a senha da resposta por segurança
    delete rows[0].senha;
    return rows[0];
};

// --- READ (PAGINATED & FILTERED) ---
const allowedFilterFields = {
    'id': 'id',
    'nome': 'nome',
    'email': 'email',
};

const operatorMap = { eq: '=', co: 'ILIKE' };

Administrador.findPaginated = async (page = 1, size = 10, filterString = '') => {
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
    const countQuery = `SELECT COUNT(*) FROM administrador ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const totalElements = parseInt(countResult.rows[0].count, 10);

    let paramIndex = values.length + 1;
    const queryValues = [...values, size, offset];
    const dataQuery = `SELECT id, nome, email, "createdDate", "lastModifiedDate" FROM administrador ${whereClause} ORDER BY nome ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    const { rows } = await db.query(dataQuery, queryValues);
    const totalPages = Math.ceil(totalElements / size);

    return { totalPages, totalElements, contents: rows };
};


// --- UPDATE ---
Administrador.update = async (id, adminData) => {
    const { nome, email, senha } = adminData;
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(senha, salt);

    const { rows } = await db.query(
        'UPDATE administrador SET nome = $1, email = $2, senha = $3, "lastModifiedDate" = NOW() WHERE id = $4 RETURNING *',
        [nome, email, hash, id]
    );

    delete rows[0].senha;
    return rows[0];
};

// --- DELETE ---
Administrador.delete = async (id) => {
    const { rowCount } = await db.query('DELETE FROM administrador WHERE id = $1', [id]);
    return rowCount;
};

module.exports = Administrador;