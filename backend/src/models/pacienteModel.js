const db = require('../config/database');
const bcrypt = require('bcryptjs');

const Paciente = {};

// Função para criar um paciente
Paciente.create = async (pacienteData) => {
    const { nome, cpf, dataNascimento, email, telefone, endereco, senha, cepCodigo, enderecoNumero, cidade, bairro, estado } = pacienteData;
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(senha, salt);
    
    const { rows } = await db.query(
        'INSERT INTO paciente (nome, cpf, "dataNascimento", email, telefone, endereco, senha, "cepCodigo", "enderecoNumero", cidade, bairro, estado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
        [nome, cpf, dataNascimento, email, telefone, endereco, hash, cepCodigo, enderecoNumero, cidade, bairro, estado]
    );

    delete rows[0].senha;
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

// Função para buscar um único paciente
Paciente.findById = async (id) => {
    const { rows } = await db.query('SELECT * FROM paciente WHERE id = $1', [id]);
    // Remove a senha da resposta
    if (rows[0]) {
        delete rows[0].senha;
    }
    return rows[0];
};

// Função para editar um paciente
Paciente.update = async (id, pacienteData) => {
    const { senha, ...dadosSemSenha } = pacienteData;
    let querySetParts = [];
    const values = [];
    let paramIndex = 1;

    // Adiciona os outros campos à query dinamicamente
    for (const key in dadosSemSenha) {
        if (dadosSemSenha[key] !== undefined) {
            // Usa aspas duplas para nomes de coluna em camelCase
            const columnName = key === 'dataNascimento' || key === 'cepCodigo' || key === 'enderecoNumero' ? `"${key}"` : key;
            querySetParts.push(`${columnName} = $${paramIndex++}`);
            values.push(dadosSemSenha[key]);
        }
    }

    // Se uma nova senha foi fornecida, criptografa e adiciona à query
    if (senha) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(senha, salt);
        querySetParts.push(`senha = $${paramIndex++}`);
        values.push(hash);
    }
    
    // Se não houver nada para atualizar, retorna (evita erro de query vazia)
    if (querySetParts.length === 0) {
        return Paciente.findById(id);
    }

    // Adiciona o lastModifiedDate e o WHERE
    querySetParts.push(`"lastModifiedDate" = NOW()`);
    values.push(id);
    
    const query = `UPDATE paciente SET ${querySetParts.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const { rows } = await db.query(query, values);

    if (rows[0]) {
        delete rows[0].senha;
    };
    
    return rows[0];
};

// Função para excluir um paciente
Paciente.delete = async (id) => {
    const { rowCount } = await db.query('DELETE FROM paciente WHERE id = $1', [id]);
    return rowCount;
};

module.exports = Paciente;