const Medico = require('../models/medicoModel');
const db = require('../config/database');
const { getDiasUteis } = require('../utils/dateUtils');

// Função para listar todos os médicos
exports.getAllMedicos = async (req, res) => {
  try {
    const { page, size, filter } = req.query;

    const pageNum = parseInt(page || '1', 10);
    const sizeNum = parseInt(size || '10', 10);
    
    let filterString = '';
    if (filter) {
      // Se 'filter' for um array (múltiplos filtros), junte-os com ' AND '
      // Se for apenas uma string (um filtro), use-a como está.
      filterString = Array.isArray(filter) ? filter.join(' AND ') : filter;
    }

    // Passa a string de filtro (agora sempre uma string) para o model
    const paginatedResult = await Medico.findPaginated(pageNum, sizeNum, filterString);

    res.status(200).json(paginatedResult);
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao buscar médicos',
      error: error.message
    });
  }
};

// Função para criar um médico
exports.createMedico = async (req, res) => {
  try {
    const novoMedico = await Medico.create(req.body);
    res.status(201).json({
      message: 'Médico cadastrado com sucesso!',
      data: novoMedico
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao cadastrar médico',
      error: error.message
    });
  }
};

// Função para atualizar um médico
exports.updateMedico = async (req, res) => {
  try {
    const { id } = req.params;
    const medicoAtualizado = await Medico.update(id, req.body);

    if (!medicoAtualizado) {
      return res.status(404).json({ message: 'Médico não encontrado para atualização.' });
    }

    res.status(200).json({
      message: 'Médico atualizado com sucesso!',
      data: medicoAtualizado
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao atualizar médico',
      error: error.message
    });
  }
};

// Função para deletar um médico
exports.deleteMedico = async (req, res) => {
  try {
    const { id } = req.params;
    const deletado = await Medico.delete(id);

    if (deletado === 0) {
      return res.status(404).json({ message: 'Médico não encontrado para remoção.' });
    }

    res.status(200).json({ message: 'Médico removido com sucesso!' });
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao remover médico',
      error: error.message
    });
  }
};

// Função para um ADMIN solicitar a inativação de um médico
exports.solicitarInativacao = async (req, res) => {
  try {
    const { id } = req.params;

    const medicoExistente = await db.query('SELECT * FROM medico WHERE id = $1', [id]);

    if (medicoExistente.rows.length === 0) {
      return res.status(404).json({ message: 'Médico não encontrado.' });
    };
    if (medicoExistente.rows[0].inativacaoSolicitadaEm) {
      return res.status(409).json({ message: 'Este médico já possui uma solicitação de inativação pendente.' });
    };

    if (medico) {
      delete medico.senha;
    };

    const medico = await Medico.solicitarInativacao(id);
    res.status(200).json({ message: 'Solicitação de inativação registrada. O médico será inativado em 5 dias úteis se a ação não for revertida.', data: medico });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao solicitar inativação.', error: error.message });
  };
};

// Função para um ADMIN reverter uma solicitação de inativação de um médico
exports.reverterInativacao = async (req, res) => {
  try {
    const { id } = req.params;
    const medicoExistenteResult = await db.query('SELECT * FROM medico WHERE id = $1', [id]);
    if (medicoExistenteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Médico não encontrado.' });
    }

    const medicoExistente = medicoExistenteResult.rows[0];
    if (!medicoExistente.inativacaoSolicitadaEm) {
      return res.status(404).json({ message: 'Médico não possui solicitação de inativação pendente.' });
    }

    // Verificação do prazo
    const diasUteisPassados = getDiasUteis(medicoExistente.inativacaoSolicitadaEm);
    if (diasUteisPassados > 5) {
      return res.status(409).json({ message: 'O prazo de 5 dias úteis para reverter esta solicitação já expirou.' });
    }

    // Se passou em todas as verificações, executa a reversão
    const medico = await Medico.reverterInativacao(id);

    if (medico) {
      delete medico.senha;
    };

    res.status(200).json({ message: 'Solicitação de inativação revertida com sucesso.', data: medico });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao reverter solicitação.', error: error.message });
  };
};