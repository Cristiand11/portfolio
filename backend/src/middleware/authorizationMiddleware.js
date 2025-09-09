exports.adminAuth = (req, res, next) => {
    if (req.user && req.user.perfil === 'administrador') {
        next(); // Usuário é um admin, pode prosseguir
    } else {
        res.status(403).json({ message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
    }
};

exports.medicoAuth = (req, res, next) => {
    if (req.user && req.user.perfil === 'medico') {
        next(); // Usuário é um médico, pode prosseguir
    } else {
        res.status(403).json({ message: 'Acesso negado. Apenas médicos podem realizar esta ação.' });
    }
};

exports.pacienteAuth = (req, res, next) => {
    if (req.user && req.user.perfil === 'paciente') {
        next(); // Usuário é um paciente, pode prosseguir
    } else {
        res.status(403).json({ message: 'Acesso negado. Apenas pacientes podem realizar esta ação.' });
    }
};