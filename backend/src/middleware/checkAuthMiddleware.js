const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Este middleware verifica se há um token, mas não bloqueia a rota se não houver.
module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');

  // Se não houver token, simplesmente prossiga. req.user ficará undefined.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Adiciona o usuário à requisição se o token for válido
    next();
  } catch {
    // Se o token for inválido, podemos optar por prosseguir sem usuário
    // ou retornar um erro. Vamos prosseguir para não bloquear o auto-cadastro.
    return next();
  }
};
