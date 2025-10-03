const Auxiliar = require('../models/auxiliarModel');
const db = require('../config/database');

exports.createAuxiliar = async (req, res) => {
  try {
    const idMedicoDoToken = req.user.id;

    const dadosAuxiliar = {
      ...req.body,
      idMedico: idMedicoDoToken,
    };

    const novoAuxiliar = await Auxiliar.create(dadosAuxiliar);
    res.status(201).json({
      message: 'Auxiliar cadastrado com sucesso!',
      data: novoAuxiliar,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao cadastrar auxiliar', error: error.message });
  }
};

exports.getAllAuxiliares = async (req, res) => {
  try {
    const { page, size, filter } = req.query;
    const perfil = 'paciente';

    const pageNum = parseInt(page || '1', 10);
    const sizeNum = parseInt(size || '10', 10);

    let filterString = '';
    if (filter) {
      filterString = Array.isArray(filter) ? filter.join(' AND ') : filter;
    }

    const result = await Auxiliar.findPaginated(pageNum, sizeNum, filterString, { perfil });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar auxiliares', error: error.message });
  }
};

exports.updateAuxiliar = async (req, res) => {
  try {
    const { id } = req.params;

    const auxiliarAtualizado = await Auxiliar.update(id, req.body);

    if (!auxiliarAtualizado) {
      return res.status(404).json({ message: 'Auxiliar não encontrado.' });
    }

    res.status(200).json({
      message: 'Dados do auxiliar atualizados com sucesso!',
      data: auxiliarAtualizado,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao atualizar dados do auxiliar',
      error: error.message,
    });
  }
};

exports.deleteAuxiliar = async (req, res) => {
  try {
    const { id: idAuxiliar } = req.params;
    const idMedicoDoToken = req.user.id;

    const auxiliar = await Auxiliar.findById(idAuxiliar);
    if (!auxiliar) {
      return res.status(404).json({ message: 'Auxiliar não encontrado.' });
    }

    if (auxiliar.idMedico !== idMedicoDoToken) {
      return res
        .status(403)
        .json({ message: 'Acesso negado. Você não tem permissão para remover este auxiliar.' });
    }

    await Auxiliar.delete(idAuxiliar);
    res.status(200).json({ message: 'Auxiliar removido com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover auxiliar', error: error.message });
  }
};

exports.deleteVariosAuxiliares = async (req, res) => {
  try {
    const { ids } = req.body;
    const { id: idMedicoDoToken, perfil } = req.user;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Uma lista de IDs de auxiliares é necessária.' });
    }

    if (perfil === 'medico') {
      const { rows: auxiliares } = await db.query(
        'SELECT "idMedico" FROM auxiliar WHERE id = ANY($1::uuid[])',
        [ids]
      );
      for (const aux of auxiliares) {
        if (aux.idMedico !== idMedicoDoToken) {
          return res
            .status(403)
            .json({ message: 'Acesso negado. Você só pode excluir seus próprios auxiliares.' });
        }
      }
    }

    await Auxiliar.deleteByIds(ids);
    res.status(200).json({ message: `${ids.length} auxiliares foram excluídos com sucesso.` });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover auxiliares.', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const auxiliarId = req.user.id;
    const auxiliar = await Auxiliar.findById(auxiliarId);

    if (!auxiliar) {
      return res.status(404).json({ message: 'Auxiliar não encontrado.' });
    }

    res.status(200).json(auxiliar);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar dados do auxiliar.', error: error.message });
  }
};
