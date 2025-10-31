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
    if (error.code === '23505' && error.constraint === 'auxiliar_email_key') {
      return res.status(409).json({
        message: 'Este e-mail já está em uso por outro auxiliar.',
      });
    }
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
    const { id: auxiliarId } = req.params;
    const { id: idUsuarioLogado, perfil } = req.user;

    if (perfil !== 'auxiliar' || auxiliarId !== idUsuarioLogado) {
      return res
        .status(403)
        .json({ message: 'Você não tem permissão para atualizar este perfil.' });
    }

    const { nome, email, telefone, dataNascimento, senha } = req.body;

    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    if (nome) {
      fieldsToUpdate.push(`nome = $${paramIndex++}`);
      values.push(nome);
    }
    if (email) {
      fieldsToUpdate.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (telefone !== undefined) {
      fieldsToUpdate.push(`telefone = $${paramIndex++}`);
      values.push(telefone);
    }
    if (dataNascimento !== undefined) {
      fieldsToUpdate.push(`"dataNascimento" = $${paramIndex++}`);
      values.push(dataNascimento);
    }

    if (senha && senha.length > 0) {
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(senha, salt);
      fieldsToUpdate.push(`senha = $${paramIndex++}`);
      values.push(senhaHash);
    }

    fieldsToUpdate.push(`"lastModifiedDate" = NOW()`);

    if (fieldsToUpdate.length <= 1) {
      return res
        .status(400)
        .json({ message: 'Nenhum dado válido para atualização foi fornecido.' });
    }

    values.push(auxiliarId);
    const whereCondition = `WHERE id = $${paramIndex}`;

    const query = `
      UPDATE AUXILIAR
      SET ${fieldsToUpdate.join(', ')}
      ${whereCondition}
      RETURNING id, nome, email, telefone, "dataNascimento", "createdDate", "lastModifiedDate"
    `;

    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Auxiliar não encontrado.' });
    }

    res.status(200).json({ message: 'Perfil atualizado com sucesso!', data: rows[0] });
  } catch (error) {
    if (error.code === '23505' && error.constraint === 'auxiliar_email_key') {
      return res.status(409).json({ message: 'Este e-mail já está em uso por outro usuário.' });
    }
    console.error('Erro ao atualizar auxiliar:', error);
    res.status(500).json({ message: 'Erro ao atualizar dados do auxiliar', error: error.message });
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

exports.getMeuMedicoVinculado = async (req, res) => {
  try {
    const auxiliarId = req.user.id;

    const auxResult = await db.query('SELECT "idMedico" FROM AUXILIAR WHERE id = $1', [auxiliarId]);

    if (auxResult.rows.length === 0 || !auxResult.rows[0].idMedico) {
      return res.status(404).json({ message: 'Auxiliar sem médico vinculado ou não encontrado.' });
    }
    const medicoId = auxResult.rows[0].idMedico;

    const medicoResult = await db.query(
      'SELECT id, nome, crm, email, telefone, especialidade FROM MEDICO WHERE id = $1',
      [medicoId]
    );

    if (medicoResult.rows.length === 0) {
      return res.status(404).json({ message: 'Médico vinculado não encontrado.' });
    }

    res.status(200).json(medicoResult.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};
