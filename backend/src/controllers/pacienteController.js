const Paciente = require('../models/pacienteModel');
const axios = require('axios'); // Importa o axios
const { cpf } = require('cpf-cnpj-validator');

const handlePacienteData = async (data) => {
    // Validação e Limpeza do CPF
    if (!data.cpf || !cpf.isValid(data.cpf)) {
        throw new Error('CPF inválido ou não fornecido.');
    }
    // Remove a máscara do CPF para salvar apenas os números
    data.cpf = cpf.strip(data.cpf);

    // Lógica do CEP
    if (data.cepCodigo) {
        try {
            const cepResponse = await axios.get(`https://viacep.com.br/ws/${data.cepCodigo}/json/`);
            const cepData = cepResponse.data;

            if (cepData.erro) {
                throw new Error('CEP não encontrado.');
            }

            // Sobrescreve os dados de endereço com os dados do ViaCEP
            data.endereco = cepData.logradouro;
            data.cidade = cepData.localidade;
            data.bairro = cepData.bairro;
            data.estado = cepData.uf;
        } catch (error) {
            throw new Error('Erro ao consultar o CEP.');
        }
    }
    return data;
};

// POST /pacientes
exports.createPaciente = async (req, res) => {
    try {
        const processedData = await handlePacienteData(req.body);
        const novoPaciente = await Paciente.create(processedData);
        res.status(201).json({
            message: 'Paciente cadastrado com sucesso!',
            data: novoPaciente
        });
    } catch (error) {
        res.status(400).json({ message: 'Erro ao cadastrar paciente', error: error.message });
    }
};

// GET /pacientes
exports.getAllPacientes = async (req, res) => {
    try {
        const { page, size, filter } = req.query;
        const pageNum = parseInt(page || '1', 10);
        const sizeNum = parseInt(size || '10', 10);
        
        let filterString = '';
        if (filter) {
          filterString = Array.isArray(filter) ? filter.join(' AND ') : filter;
        }

        const result = await Paciente.findPaginated(pageNum, sizeNum, filterString);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar pacientes', error: error.message });
    }
};

// PUT /pacientes/:id
exports.updatePaciente = async (req, res) => {
    try {
        const idPacienteDoParametro = req.params.id;
        const idPacienteDoToken = req.user.id;

        if (idPacienteDoParametro !== idPacienteDoToken) {
            return res.status(403).json({ message: 'Acesso negado. Você só pode editar seus próprios dados.' });
        };
        
        const processedData = await handlePacienteData(req.body);

        const atualizado = await Paciente.update(idPacienteDoParametro, processedData);

        if (!atualizado) {
            return res.status(404).json({ message: 'Paciente não encontrado' });
        }
        res.status(200).json({ message: 'Dados atualizados com sucesso!', data: atualizado });
    } catch (error) {
        res.status(400).json({ message: 'Erro ao atualizar paciente', error: error.message });
    }
};

// DELETE /pacientes/:id
exports.deletePaciente = async (req, res) => {
    try {
        const { id } = req.params;
        const deletado = await Paciente.delete(id);
        if (deletado === 0) {
            return res.status(404).json({ message: 'Paciente não encontrado' });
        }
        res.status(200).json({ message: 'Paciente removido com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover paciente', error: error.message });
    }
};
