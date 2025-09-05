const db = require('../config/database');

const Paciente = {};

// Função para criar um paciente
Paciente.create = async (pacienteData) => {
    const { nome, cpf, dataNascimento, email, telefone, endereco, senha, cepCodigo, enderecoNumero, cidade, bairro, estado } = pacienteData;
    const { rows } = await db.query(
        'INSERT INTO paciente (nome, cpf, "dataNascimento", email, telefone, endereco, senha, "cepCodigo", "enderecoNumero", cidade, bairro, estado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
        [nome, cpf, dataNascimento, email, telefone, endereco, senha, cepCodigo, enderecoNumero, cidade, bairro, estado]
    );
    return rows[0];
};

// Função para buscar pacientes
const allowedFilterFields = {
    'id': 'id',
    'nome': 'nome',
    'cpf': 'cpf',
    'email': 'email',
    'telefone': 'telefone',
    'cepCodigo': '"cepCodigo"',
    'cidade': 'cidade',
    'bairro': 'bairro',
    'estado': 'estado'
};

const operatorMap = {
    eq: '=',
    co: 'ILIKE',
};

Paciente.findPaginated = async (page = 1, size = 10, filterString = '') => {
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
    const countQuery = `SELECT COUNT(*) FROM paciente ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const totalElements = parseInt(countResult.rows[0].count, 10);

    let paramIndex = values.length + 1;
    const queryValues = [...values, size, offset];
    const dataQuery = `SELECT * FROM paciente ${whereClause} ORDER BY nome ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    const { rows } = await db.query(dataQuery, queryValues);
    const totalPages = Math.ceil(totalElements / size);

    return { totalPages, totalElements, contents: rows };
};


// Função para editar um paciente
Paciente.update = async (id, pacienteData) => {
    const { nome, cpf, dataNascimento, email, telefone, endereco, senha, cepCodigo, enderecoNumero, cidade, bairro, estado } = pacienteData;
    const { rows } = await db.query(
        'UPDATE paciente SET nome = $1, cpf = $2, "dataNascimento" = $3, email = $4, telefone = $5, endereco = $6, senha = $7, "cepCodigo" = $8, "enderecoNumero" = $9, cidade = $10, bairro = $11, estado = $12, "lastModifiedDate" = NOW() WHERE id = $13 RETURNING *',
        [nome, cpf, dataNascimento, email, telefone, endereco, senha, cepCodigo, enderecoNumero, cidade, bairro, estado, id]
    );
    return rows[0];
};

// Função para excluir um paciente
Paciente.delete = async (id) => {
    const { rowCount } = await db.query('DELETE FROM paciente WHERE id = $1', [id]);
    return rowCount;
};

module.exports = Paciente;