const Consulta = require('../models/consultaModel');
const Medico = require('../models/medicoModel');
const Auxiliar = require('../models/auxiliarModel');

// Função para criar uma consulta
exports.createConsulta = async (req, res) => {
    try {
        const { idMedico, idPaciente, data, hora } = req.body;
        if (!idMedico || !idPaciente) {
            return res.status(400).json({ message: 'Os IDs do médico (idMedico) e do paciente (idPaciente) são obrigatórios.' });
        }

        const medicoconflictExists = await Consulta.checkConflict(idMedico, data, hora);
        if (medicoconflictExists) {
            return res.status(409).json({ message: 'Conflito de agendamento. O médico já possui uma consulta marcada para esta data e hora.' });
        }

        const pacienteConflictExists = await Consulta.checkPatientConflict(idPaciente, data, hora);
        if (pacienteConflictExists) {
            return res.status(409).json({ message: 'Conflito de agendamento. O paciente já possui uma consulta marcada para esta data e hora.' });
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
        const { id: idUsuarioLogado, perfil } = req.user;

        const pageNum = parseInt(page || '1', 10);
        const sizeNum = parseInt(size || '10', 10);

        let securityFilter = '';

        if (perfil === 'paciente') {
            securityFilter = `idPaciente eq '${idUsuarioLogado}'`;
        } else if (perfil === 'medico') {
            securityFilter = `idMedico eq '${idUsuarioLogado}'`;
        } else if (perfil === 'auxiliar') {
            const auxiliar = await Auxiliar.findById(idUsuarioLogado);
            if (!auxiliar || !auxiliar.idMedico) {
                return res.status(403).json({ message: 'Acesso negado. O seu perfil de auxiliar não está vinculado a nenhum médico.' });
            }
            securityFilter = `idMedico eq '${auxiliar.idMedico}'`;
        }
        
        // Combina o filtro de segurança com os filtros opcionais do usuário
        let finalFilterString = securityFilter;
        if (filter) {
            const userFilter = Array.isArray(filter) ? filter.join(' AND ') : filter;
            finalFilterString = `${securityFilter} AND ${userFilter}`;
        }

        const result = await Consulta.findPaginated(pageNum, sizeNum, finalFilterString);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar consultas', error: error.message });
    }
};

// Função para editar uma consulta
exports.updateConsulta = async (req, res) => {
    try {
        const { id } = req.params;
        const { idMedico, idPaciente, data, hora } = req.body;

        // Se o usuário está tentando alterar a data ou a hora, precisamos validar
        if (idMedico && idPaciente && data && hora) {
            const medicoconflictExists = await Consulta.checkConflict(idMedico, data, hora, id);
            if (medicoconflictExists) {
                return res.status(409).json({ message: 'Conflito de agendamento. O médico já possui outra consulta marcada para esta data e hora.' });
            }
            const pacienteConflictExists = await Consulta.checkPatientConflict(idPaciente, data, hora, id);
            if (pacienteConflictExists) {
                return res.status(409).json({ message: 'Conflito de agendamento. O paciente já possui outra consulta marcada para esta data e hora.' });
            }
        }

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

// Função para cancelar uma consulta
exports.cancelarConsulta = async (req, res) => {
    try {
        const { id: consultaId } = req.params;
        const idPacienteDoToken = req.user.id;

        const consulta = await Consulta.findById(consultaId);
        if (!consulta || consulta.paciente_id !== idPacienteDoToken) {
            return res.status(404).json({ message: 'Consulta não encontrada.' });
        }

        if (consulta.status !== 'Agendada' && consulta.status !== 'Confirmada') {
            return res.status(409).json({ message: `Não é possível cancelar uma consulta com status "${consulta.status}".` });
        }

        const medico = await Medico.findById(consulta.medico_id);
        if (!medico) {
            return res.status(404).json({ message: 'Médico associado à consulta não encontrado.' });
        }
        const antecedenciaMinimaHoras = medico.cancelamentoAntecedenciaHoras;

        const agora = new Date();
        const dataConsulta = new Date(`${consulta.data.toISOString().slice(0, 10)}T${consulta.hora}`);
        const diffEmHoras = (dataConsulta - agora) / (1000 * 60 * 60);

        if (diffEmHoras < antecedenciaMinimaHoras) {
            return res.status(403).json({ message: `O cancelamento não é permitido. É necessário cancelar com pelo menos ${antecedenciaMinimaHoras} horas de antecedência.` });
        }

        // 7. Se todas as regras passaram, cancela a consulta
        const consultaCancelada = await Consulta.cancelar(consultaId);
        res.status(200).json({ message: 'Consulta cancelada com sucesso!', data: consultaCancelada });

    } catch (error) {
        res.status(500).json({ message: 'Erro ao cancelar consulta.', error: error.message });
    }
};

// Função para concluir uma consulta
exports.concluirConsulta = async (req, res) => {
    try {
        const { id: consultaId } = req.params;
        const { id: idUsuarioLogado, perfil } = req.user;

        // 1. Busca a consulta
        const consulta = await Consulta.findById(consultaId);
        if (!consulta) {
            return res.status(404).json({ message: 'Consulta não encontrada.' });
        }

        // 2. Verifica se a consulta está em um status que permite a conclusão
        if (consulta.status !== 'Agendada' && consulta.status !== 'Confirmada') {
            return res.status(409).json({ message: `Não é possível concluir uma consulta com status "${consulta.status}".` });
        }

        // 3. LÓGICA DE AUTORIZAÇÃO
        if (perfil === 'medico') {
            // Se for médico, verifica se a consulta pertence a ele
            if (consulta.medico_id !== idUsuarioLogado) {
                return res.status(403).json({ message: 'Acesso negado. Você só pode concluir suas próprias consultas.' });
            }
        } else if (perfil === 'auxiliar') {
            // Se for auxiliar, verifica se a consulta pertence ao seu médico vinculado
            const auxiliar = await Auxiliar.findById(idUsuarioLogado);
            if (!auxiliar || consulta.medico_id !== auxiliar.idMedico) {
                return res.status(403).json({ message: 'Acesso negado. Você só pode concluir consultas do seu médico vinculado.' });
            }
        }

        // 4. Se todas as validações passaram, conclui a consulta
        const consultaConcluida = await Consulta.marcarComoConcluida(consultaId);
        res.status(200).json({ message: 'Consulta marcada como concluída!', data: consultaConcluida });

    } catch (error) {
        res.status(500).json({ message: 'Erro ao concluir consulta.', error: error.message });
    }
};