const Auxiliar = require('../models/auxiliarModel');

exports.createAuxiliar = async (req, res) => {
    try {
        const idMedicoDoToken = req.user.id;

        const dadosAuxiliar = {
            ...req.body,
            idMedico: idMedicoDoToken
        };
        
        const novoAuxiliar = await Auxiliar.create(dadosAuxiliar);
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

        const idMedicoDoToken = req.user.id;
        const filterString = `idMedico eq '${idMedicoDoToken}'`;

        const result = await Auxiliar.findPaginated(pageNum, sizeNum, filterString);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar auxiliares', error: error.message });
    }
};

exports.updateAuxiliar = async (req, res) => {
    try {
        const { id: idAuxiliar } = req.params;
        const idMedicoDoToken = req.user.id; 

        // 1. Busca o auxiliar no banco
        const auxiliar = await Auxiliar.findById(idAuxiliar);

        if (!auxiliar) {
            return res.status(404).json({ message: 'Auxiliar não encontrado.' });
        }

        // 2. VERIFICA A PROPRIEDADE
        if (auxiliar.idMedico !== idMedicoDoToken) {
            return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para editar este auxiliar.' });
        }

        // 3. Se passou na verificação, pode atualizar
        const dadosParaAtualizar = { ...req.body, idMedico: idMedicoDoToken };
        const atualizado = await Auxiliar.update(idAuxiliar, dadosParaAtualizar);
        
        res.status(200).json({ message: 'Auxiliar atualizado com sucesso!', data: atualizado });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar auxiliar', error: error.message });
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
            return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para remover este auxiliar.' });
        }
        
        await Auxiliar.delete(idAuxiliar);
        res.status(200).json({ message: 'Auxiliar removido com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover auxiliar', error: error.message });
    }
};