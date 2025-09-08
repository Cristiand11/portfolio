const Consulta = require('../models/consultaModel');

// Função para criar uma consulta
exports.createConsulta = async (req, res) => {
    try {
        const { idMedico, idPaciente } = req.body;
        if (!idMedico || !idPaciente) {
            return res.status(400).json({ message: 'Os IDs do médico (idMedico) e do paciente (idPaciente) são obrigatórios.' });
        }
        const novaConsulta = await Consulta.create(req.body);
        res.status(201).json({
            message: 'Consulta agendada com sucesso!',
            data: novaConsulta
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao agendar consulta', error: error.message });
    }
};

// Função para listar todas as consultas
exports.getAllConsultas = async (req, res) => {
    try {
        const { page, size, filter } = req.query;
        const pageNum = parseInt(page || '1', 10);
        const sizeNum = parseInt(size || '10', 10);
        
        let filterString = '';
        if (filter) {
          filterString = Array.isArray(filter) ? filter.join(' AND ') : filter;
        }

        const result = await Consulta.findPaginated(pageNum, sizeNum, filterString);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar consultas', error: error.message });
    }
};

// Função para editar uma consulta
exports.updateConsulta = async (req, res) => {
    try {
        const { id } = req.params;
        const atualizada = await Consulta.update(id, req.body);
        if (!atualizada) {
            return res.status(404).json({ message: 'Consulta não encontrada' });
        }
        res.status(200).json({ message: 'Consulta atualizada com sucesso!', data: atualizada });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar consulta', error: error.message });
    }
};

// Função para excluir uma consulta
exports.deleteConsulta = async (req, res) => {
    try {
        const { id } = req.params;
        const deletada = await Consulta.delete(id);
        if (deletada === 0) {
            return res.status(404).json({ message: 'Consulta não encontrada' });
        }
        res.status(200).json({ message: 'Consulta removida com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover consulta', error: error.message });
    }
};
