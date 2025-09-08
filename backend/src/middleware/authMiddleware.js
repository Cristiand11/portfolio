const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Adiciona o payload do token (id, perfil) à requisição
        next(); // Passa para a próxima etapa (o controller)
    } catch (error) {
        res.status(400).json({ message: 'Token inválido.' });
    }
};