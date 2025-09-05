const Auxiliar = require('../models/auxiliarModel');

exports.createAuxiliar = async (req, res) => {
    try {
        if (!req.body.idMedico) {
            return res.status(400).json({ message: 'O ID do médico (idMedico) é obrigatório.' });
        }
        const novoAuxiliar = await Auxiliar.create(req.body);
        res.status(201).json({
            message: 'Auxiliar cadastrado com sucesso!',
            data: novoAuxiliar
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao cadastrar auxiliar', error: error.message });
    }
};

exports.getAllAuxiliares = async (req, res) => {
    try {
        const { page, size, filter } = req.query;
        const pageNum = parseInt(page || '1', 10);
        const sizeNum = parseInt(size || '10', 10);
        
        let filterString = '';
        if (filter) {
          filterString = Array.isArray(filter) ? filter.join(' AND ') : filter;
        }

        const result = await Auxiliar.findPaginated(pageNum, sizeNum, filterString);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar auxiliares', error: error.message });
    }
};

exports.updateAuxiliar = async (req, res) => {
    try {
        const { id } = req.params;
        const atualizado = await Auxiliar.update(id, req.body);
        if (!atualizado) {
            return res.status(404).json({ message: 'Auxiliar não encontrado' });
        }
        res.status(200).json({ message: 'Auxiliar atualizado com sucesso!', data: atualizado });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar auxiliar', error: error.message });
    }
};

exports.deleteAuxiliar = async (req, res) => {
    try {
        const { id } = req.params;
        const deletado = await Auxiliar.delete(id);
        if (deletado === 0) {
            return res.status(404).json({ message: 'Auxiliar não encontrado' });
        }
        res.status(200).json({ message: 'Auxiliar removido com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover auxiliar', error: error.message });
    }
};