const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Adicione uma chave secreta no seu arquivo .env
// Ex: JWT_SECRET=seu-segredo-super-secreto
const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
    try {
        const { email, senha, perfil } = req.body;
        if (!email || !senha || !perfil) {
            return res.status(400).json({ message: 'Email, senha e perfil são obrigatórios.' });
        }

        const tabelas = {
            medico: 'MEDICO',
            paciente: 'PACIENTE',
            auxiliar: 'AUXILIAR',
            administrador: 'ADMINISTRADOR'
        };

        const tabela = tabelas[perfil.toLowerCase()];
        if (!tabela) {
            return res.status(400).json({ message: 'Perfil inválido.' });
        }

        const userResult = await db.query(`SELECT * FROM ${tabela} WHERE email = $1`, [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(senha, user.senha);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        const payload = {
            id: user.id,
            perfil: perfil.toLowerCase()
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Login bem-sucedido!', token });

    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
};