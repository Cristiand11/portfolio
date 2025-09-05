const Medico = require('../models/medicoModel');

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