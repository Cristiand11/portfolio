const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDiasUteis } = require('../utils/dateUtils');

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
    try {
        const { email, senha, perfil } = req.body;
        if (!email || !senha || !perfil) {
            return res.status(400).json({ message: 'Email, senha e perfil são obrigatórios.' });
        }

        if (perfil.toLowerCase() === 'medico') {
            const medicoResult = await db.query('SELECT * FROM MEDICO WHERE email = $1', [email]);
            if (medicoResult.rows.length > 0) {
                const medico = medicoResult.rows[0];

                // Se existe uma solicitação de inativação pendente
                if (medico.inativacaoSolicitadaEm) {
                    const diasUteisPassados = getDiasUteis(medico.inativacaoSolicitadaEm);

                    if (diasUteisPassados > 5) {
                        // Inativa o médico permanentemente e nega o login
                        await db.query('UPDATE medico SET ativo = false, "inativacaoSolicitadaEm" = NULL WHERE id = $1', [medico.id]);
                        return res.status(403).json({ message: 'Acesso bloqueado. Sua conta foi inativada permanentemente.' });
                    }
                }
            }
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
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(senha, user.senha);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
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