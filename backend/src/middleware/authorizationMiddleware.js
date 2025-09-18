const db = require('../config/database');

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

exports.auxiliarAuth = (req, res, next) => {
  if (req.user && req.user.perfil === 'auxiliar') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas auxiliares podem realizar esta ação.' });
  }
};

exports.pacienteAuth = (req, res, next) => {
  if (req.user && req.user.perfil === 'paciente') {
    next(); // Usuário é um paciente, pode prosseguir
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas pacientes podem realizar esta ação.' });
  }
};

exports.adminOuMedicoDonoAuth = (req, res, next) => {
  const { id: idUsuarioLogado, perfil } = req.user;
  const { id: idDoParametro } = req.params;
  if (perfil === 'administrador') {
    return next();
  }
  if (perfil === 'medico' && idUsuarioLogado === idDoParametro) {
    return next();
  }
  return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para realizar esta ação.' });
};

exports.adminOuPacienteAuth = (req, res, next) => {
  const perfil = req.user.perfil;
  if (perfil === 'administrador' || perfil === 'paciente') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Você não tem permissão para visualizar esta lista.' });
  }
};

exports.medicoOuAuxiliarAuth = (req, res, next) => {
  const perfil = req.user.perfil;
  if (perfil === 'medico' || perfil === 'auxiliar') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas médicos ou auxiliares podem realizar esta ação.' });
  }
};

exports.medicoOuSeuAuxiliarAuth = async (req, res, next) => {
  try {
    const { id: idUsuarioLogado, perfil } = req.user;
    const { id: consultaId } = req.params;

    const consultaResult = await db.query('SELECT medico_id FROM consulta WHERE id = $1', [consultaId]);
    if (consultaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Consulta não encontrada.' });
    }
    const idMedicoDaConsulta = consultaResult.rows[0].medico_id;

    if (perfil === 'medico' && idUsuarioLogado === idMedicoDaConsulta) {
      return next();
    }

    if (perfil === 'auxiliar') {
      const auxiliarResult = await db.query('SELECT "idMedico" FROM auxiliar WHERE id = $1', [idUsuarioLogado]);
      if (auxiliarResult.rows.length > 0 && auxiliarResult.rows[0].idMedico === idMedicoDaConsulta) {
        return next();
      }
    }

    return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para gerenciar esta consulta.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro na verificação de permissão.', error: error.message });
  }
};

exports.auxiliarUpdateAuth = async (req, res, next) => {
  try {
    const { id: idUsuarioLogado, perfil } = req.user;
    const { id: idAuxiliarDoParametro } = req.params;

    if (perfil === 'auxiliar' && idUsuarioLogado === idAuxiliarDoParametro) {
      return next();
    }

    if (perfil === 'medico') {
      const auxiliarResult = await db.query('SELECT "idMedico" FROM auxiliar WHERE id = $1', [idAuxiliarDoParametro]);
      if (auxiliarResult.rows.length > 0 && auxiliarResult.rows[0].idMedico === idUsuarioLogado) {
        return next();
      }
    }

    return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para editar este perfil.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro na verificação de permissão.', error: error.message });
  }
};

exports.consultaViewAuth = (req, res, next) => {
  const perfil = req.user.perfil;
  if (perfil === 'medico' || perfil === 'auxiliar' || perfil === 'paciente') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Seu perfil não tem permissão para visualizar consultas.' });
  }
};