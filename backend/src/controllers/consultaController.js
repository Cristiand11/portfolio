const NotificationService = require('../services/notificationService');

const { formatarDataParaEmail } = require('../utils/dateUtils');

const Consulta = require('../models/consultaModel');
const Medico = require('../models/medicoModel');
const Auxiliar = require('../models/auxiliarModel');
const Paciente = require('../models/pacienteModel');

// Função para criar uma consulta
exports.createConsulta = async (req, res) => {
  try {
    const { id: idUsuarioLogado, perfil } = req.user;
    const { data, hora } = req.body;

    if (!data || !hora) {
      return res.status(400).json({ message: 'O horário da consulta é obrigatório.' });
    }

    let idMedico, idPaciente, statusInicial;
    let medico, paciente;

    // Lógica de negócio baseada no perfil
    if (perfil === 'paciente') {
      idPaciente = idUsuarioLogado;
      idMedico = req.body.idMedico;
      statusInicial = 'Aguardando Confirmação do Médico';
      if (!idMedico)
        return res.status(400).json({ message: 'O ID do médico (idMedico) é obrigatório.' });
    } else if (perfil === 'medico') {
      idMedico = idUsuarioLogado;
      idPaciente = req.body.idPaciente;
      statusInicial = 'Aguardando Confirmação do Paciente';
      if (!idPaciente)
        return res.status(400).json({ message: 'O ID do paciente (idPaciente) é obrigatório.' });
    } else if (perfil === 'auxiliar') {
      const auxiliar = await Auxiliar.findById(idUsuarioLogado);
      if (!auxiliar || !auxiliar.idMedico)
        return res
          .status(403)
          .json({ message: 'Seu perfil de auxiliar não está vinculado a um médico.' });
      idMedico = auxiliar.idMedico;
      idPaciente = req.body.idPaciente;
      statusInicial = 'Aguardando Confirmação do Paciente';
      if (!idPaciente)
        return res.status(400).json({ message: 'O ID do paciente (idPaciente) é obrigatório.' });
    } else {
      return res
        .status(403)
        .json({ message: 'Seu perfil não tem permissão para criar consultas.' });
    }

    medico = await Medico.findById(idMedico);
    if (!medico) {
      return res.status(404).json({ message: 'Médico para agendamento não encontrado.' });
    }
    const duracaoConsulta = medico.duracaoPadraoConsultaMinutos;

    const medicoconflictExists = await Consulta.checkConflict(
      idMedico,
      data,
      hora,
      duracaoConsulta
    );
    if (medicoconflictExists) {
      return res.status(409).json({ message: 'Conflito de agendamento para o médico.' });
    }

    const pacienteConflictExists = await Consulta.checkPatientConflict(
      idPaciente,
      data,
      hora,
      duracaoConsulta
    );
    if (pacienteConflictExists) {
      return res.status(409).json({ message: 'Conflito de agendamento para o paciente.' });
    }

    const dadosConsulta = {
      ...req.body,
      idMedico: idMedico,
      idPaciente: idPaciente,
      status: statusInicial,
      duracaoMinutos: duracaoConsulta,
    };

    const novaConsulta = await Consulta.create(dadosConsulta);
    delete novaConsulta.dataRemarcacaoSugerida;
    delete novaConsulta.horaRemarcacaoSugerida;

    paciente = await Paciente.findById(idPaciente);
    if (perfil === 'paciente') {
      if (medico && paciente) {
        // Monta a mensagem do e-mail
        const assunto = `Nova Solicitação de Consulta: ${paciente.nome}`;
        const dataFormatada = formatarDataParaEmail(novaConsulta.data);
        const mensagemHtml = `
                    <h1>Nova Solicitação de Consulta</h1>
                    <p>Olá, Dr(a). ${medico.nome},</p>
                    <p>O paciente <strong>${paciente.nome}</strong> solicitou uma nova consulta.</p>
                    <ul>
                        <li><strong>Data:</strong> ${dataFormatada}</li>
                        <li><strong>Hora:</strong> ${novaConsulta.hora}</li>
                    </ul>
                    <p>Por favor, acesse o sistema para aprovar ou rejeitar a solicitação.</p>
                `;

        // Envia o e-mail para o médico
        NotificationService.enviarEmail({
          para: medico.email,
          assunto: assunto,
          mensagemHtml: mensagemHtml,
        });
      }
    } else if (perfil === 'medico') {
      if (medico && paciente) {
        // Monta a mensagem do e-mail
        const assunto = `Nova Solicitação de Consulta: ${medico.nome}`;
        const dataFormatada = formatarDataParaEmail(novaConsulta.data);
        const mensagemHtml = `
                    <h1>Nova Solicitação de Consulta</h1>
                    <p>Olá, Sr(a). ${paciente.nome},</p>
                    <p>O Dr(a). <strong>${medico.nome}</strong> solicitou uma nova consulta.</p>
                    <ul>
                        <li><strong>Data:</strong> ${dataFormatada}</li>
                        <li><strong>Hora:</strong> ${novaConsulta.hora}</li>
                    </ul>
                    <p>Por favor, acesse o sistema para aprovar ou rejeitar a solicitação.</p>
                `;

        // Envia o e-mail para o paciente
        NotificationService.enviarEmail({
          para: paciente.email,
          assunto: assunto,
          mensagemHtml: mensagemHtml,
        });
      }
    }

    res.status(201).json({
      message: 'Solicitação de consulta enviada com sucesso! Aguardando aprovação.',
      data: novaConsulta,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao solicitar consulta', error: error.message });
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
        return res.status(403).json({
          message: 'Acesso negado. O seu perfil de auxiliar não está vinculado a nenhum médico.',
        });
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

    if (idMedico && idPaciente && data && hora) {
      const medicoconflictExists = await Consulta.checkConflict(idMedico, data, hora, id);
      if (medicoconflictExists) {
        return res.status(409).json({
          message:
            'Conflito de agendamento. O médico já possui outra consulta marcada para esta data e hora.',
        });
      }
      const pacienteConflictExists = await Consulta.checkPatientConflict(
        idPaciente,
        data,
        hora,
        id
      );
      if (pacienteConflictExists) {
        return res.status(409).json({
          message:
            'Conflito de agendamento. O paciente já possui outra consulta marcada para esta data e hora.',
        });
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
    const { id: idUsuarioLogado, perfil } = req.user;

    const consulta = await Consulta.findById(consultaId);
    if (!consulta) {
      return res.status(404).json({ message: 'Consulta não encontrada.' });
    }

    const agora = new Date();
    const dataHoraConsulta = new Date(`${consulta.data}T${consulta.hora}`);
    if (agora > dataHoraConsulta) {
      return res
        .status(403)
        .json({ message: 'Não é possível cancelar uma consulta que já aconteceu.' });
    }

    const isPacienteDono = perfil === 'paciente' && consulta.paciente_id === idUsuarioLogado;
    const isMedicoDono = perfil === 'medico' && consulta.medico_id === idUsuarioLogado;
    let isAuxiliarDoMedico = false;
    if (perfil === 'auxiliar') {
      const auxiliar = await Auxiliar.findById(idUsuarioLogado);
      if (auxiliar && auxiliar.idMedico === consulta.medico_id) {
        isAuxiliarDoMedico = true;
      }
    }

    if (!isPacienteDono && !isMedicoDono && !isAuxiliarDoMedico) {
      return res
        .status(403)
        .json({ message: 'Acesso negado. Você não tem permissão para cancelar esta consulta.' });
    }

    let novoStatus = '';
    let notificacaoPara = null;
    const medico = await Medico.findById(consulta.medico_id);
    const paciente = await Paciente.findById(consulta.paciente_id);

    if (isPacienteDono) {
      const antecedenciaMinimaHoras = medico.cancelamentoAntecedenciaHoras;
      const agora = new Date();
      const dataConsulta = new Date(`${consulta.data}T${consulta.hora}`);
      const diffEmHoras = (dataConsulta - agora) / (1000 * 60 * 60);

      if (diffEmHoras < antecedenciaMinimaHoras) {
        return res.status(403).json({
          message: `O cancelamento não é permitido. É necessário cancelar com pelo menos ${antecedenciaMinimaHoras} horas de antecedência.`,
        });
      }
      novoStatus = 'Cancelada Pelo Paciente';
      notificacaoPara = 'medico';
    } else if (isMedicoDono || isAuxiliarDoMedico) {
      novoStatus = 'Cancelada Pelo Medico/Auxiliar';
      notificacaoPara = 'paciente';
    }

    const consultaCancelada = await Consulta.cancelar(consultaId, novoStatus);

    if (notificacaoPara === 'medico' && medico && paciente) {
      const assunto = `Consulta Cancelada: ${paciente.nome}`;
      const mensagemHtml = `<p>O paciente <strong>${paciente.nome}</strong> cancelou a consulta do dia ${consulta.data} às ${consulta.hora}.</p>`;
      NotificationService.enviarEmail({ para: medico.email, assunto, mensagemHtml });
    } else if (notificacaoPara === 'paciente' && medico && paciente) {
      const assunto = `Consulta Cancelada pelo Dr(a). ${medico.nome}`;
      const mensagemHtml = `<p>Sua consulta com o Dr(a). <strong>${medico.nome}</strong> do dia ${consulta.data} às ${consulta.hora} foi cancelada.</p>`;
      NotificationService.enviarEmail({ para: paciente.email, assunto, mensagemHtml });
    }

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

    const consulta = await Consulta.findById(consultaId);
    if (!consulta) {
      return res.status(404).json({ message: 'Consulta não encontrada.' });
    }

    const nonCompletableStatuses = [
      'Concluída',
      'Cancelada Pelo Paciente',
      'Cancelada Pelo Medico/Auxiliar',
      'Expirada',
    ];
    if (nonCompletableStatuses.includes(consulta.status)) {
      return res
        .status(409)
        .json({ message: `Não é possível concluir uma consulta com status "${consulta.status}".` });
    }

    if (perfil === 'medico') {
      // Se for médico, verifica se a consulta pertence a ele
      if (consulta.medico_id !== idUsuarioLogado) {
        return res
          .status(403)
          .json({ message: 'Acesso negado. Você só pode concluir suas próprias consultas.' });
      }
    } else if (perfil === 'auxiliar') {
      // Se for auxiliar, verifica se a consulta pertence ao seu médico vinculado
      const auxiliar = await Auxiliar.findById(idUsuarioLogado);
      if (!auxiliar || consulta.medico_id !== auxiliar.idMedico) {
        return res.status(403).json({
          message: 'Acesso negado. Você só pode concluir consultas do seu médico vinculado.',
        });
      }
    }

    const consultaConcluida = await Consulta.marcarComoConcluida(consultaId);
    delete consultaConcluida.dataRemarcacaoSugerida;
    delete consultaConcluida.horaRemarcacaoSugerida;
    res.status(200).json({ message: 'Consulta marcada como concluída!', data: consultaConcluida });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao concluir consulta.', error: error.message });
  }
};

// Função para confirmar uma solicitação de consulta
exports.confirmarConsulta = async (req, res) => {
  try {
    const { id: consultaId } = req.params;
    const { id: idUsuarioLogado, perfil } = req.user;

    const consulta = await Consulta.findById(consultaId);
    if (!consulta) return res.status(404).json({ message: 'Consulta não encontrada.' });

    const agora = new Date();
    const dataParaConfirmar = consulta.dataRemarcacaoSugerida || consulta.data;
    const horaParaConfirmar = consulta.horaRemarcacaoSugerida || consulta.hora;
    const dataHoraConsulta = new Date(`${dataParaConfirmar}T${horaParaConfirmar}`);

    if (
      agora > dataHoraConsulta &&
      (consulta.status.includes('Aguardando') || consulta.status.includes('Remarcação'))
    ) {
      await Consulta.updateStatus(consultaId, 'Expirada');
      return res.status(409).json({
        message:
          'Não é possível confirmar. A data/hora desta solicitação já passou e ela foi expirada.',
      });
    }

    let permissaoConcedida = false;
    let dataFinal = consulta.data;
    let horaFinal = consulta.hora;

    // Cenário 1: Confirmação inicial da consulta
    if (
      consulta.status === 'Aguardando Confirmação do Médico' ||
      consulta.status === 'Aguardando Confirmação do Paciente'
    ) {
      // A lógica de permissão que já tínhamos
      if (
        consulta.status === 'Aguardando Confirmação do Médico' &&
        (perfil === 'medico' || perfil === 'auxiliar')
      ) {
        // (Aqui a lógica completa para verificar se o auxiliar pertence ao médico seria necessária)
        permissaoConcedida = true;
      } else if (
        consulta.status === 'Aguardando Confirmação do Paciente' &&
        perfil === 'paciente' &&
        idUsuarioLogado === consulta.paciente_id
      ) {
        permissaoConcedida = true;
      }
    }
    // Cenário 2: Aceitação de uma remarcação
    else if (
      consulta.status === 'Remarcação Solicitada Pelo Médico' ||
      consulta.status === 'Remarcação Solicitada Pelo Paciente'
    ) {
      // A lógica de permissão que já tínhamos
      if (
        consulta.status === 'Remarcação Solicitada Pelo Médico' &&
        perfil === 'paciente' &&
        idUsuarioLogado === consulta.paciente_id
      ) {
        permissaoConcedida = true;
      } else if (consulta.status === 'Remarcação Solicitada Pelo Paciente' && perfil === 'medico') {
        // Simplificado para médico
        permissaoConcedida = true;
      }
      // Pega a data/hora da sugestão para a confirmação final
      dataFinal = consulta.dataRemarcacaoSugerida;
      horaFinal = consulta.horaRemarcacaoSugerida;
    } else {
      return res.status(409).json({
        message: `Esta consulta não pode ser confirmada, pois seu status é "${consulta.status}".`,
      });
    }

    if (!permissaoConcedida) {
      return res
        .status(403)
        .json({ message: 'Você não tem permissão para confirmar esta consulta.' });
    }

    // Chama a nova função do model com a data/hora correta
    const consultaConfirmada = await Consulta.confirmar(consultaId, dataFinal, horaFinal);
    delete consultaConfirmada.dataRemarcacaoSugerida;
    delete consultaConfirmada.horaRemarcacaoSugerida;
    res.status(200).json({ message: 'Consulta confirmada com sucesso!', data: consultaConfirmada });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao confirmar consulta.', error: error.message });
  }
};

// Função para reprovar uma solicitação de consulta
exports.reprovarConsulta = async (req, res) => {
  try {
    const { id: consultaId } = req.params;
    const { id: idUsuarioLogado, perfil } = req.user;

    const consulta = await Consulta.findById(consultaId);
    if (!consulta) return res.status(404).json({ message: 'Consulta não encontrada.' });

    const agora = new Date();
    const dataHoraProposta = new Date(
      `${consulta.dataRemarcacaoSugerida}T${consulta.horaRemarcacaoSugerida}`
    );

    if (agora > dataHoraProposta) {
      await Consulta.updateStatus(consultaId, 'Expirada');
      return res.status(409).json({
        message: 'Não é possível rejeitar. A data/hora desta proposta de remarcação já passou.',
      });
    }

    // Lógica de permissão para rejeitar
    const isPacienteRejeitando =
      perfil === 'paciente' &&
      consulta.status === 'Remarcação Solicitada Pelo Médico' &&
      idUsuarioLogado === consulta.paciente_id;
    const isMedicoRejeitando =
      perfil === 'medico' &&
      consulta.status === 'Remarcação Solicitada Pelo Paciente' &&
      idUsuarioLogado === consulta.medico_id;

    if (!isPacienteRejeitando && !isMedicoRejeitando) {
      return res
        .status(403)
        .json({ message: 'Você não tem permissão para rejeitar esta remarcação.' });
    }

    const consultaRejeitada = await Consulta.reprovar(consultaId);
    res.status(200).json({
      message: 'Remarcação rejeitada. A consulta voltou ao horário original.',
      data: consultaRejeitada,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao rejeitar remarcação.', error: error.message });
  }
};

// Função para solicitar a remarcação de uma consulta
exports.solicitarRemarcacao = async (req, res) => {
  try {
    const { id: consultaId } = req.params;
    const { id: idUsuarioLogado, perfil } = req.user;
    const { novaData, novaHora } = req.body;

    if (!novaData || !novaHora) {
      return res.status(400).json({ message: 'A nova data e hora são obrigatórias.' });
    }

    const consulta = await Consulta.findById(consultaId);
    if (!consulta) return res.status(404).json({ message: 'Consulta não encontrada.' });

    const agora = new Date();
    const dataHoraConsulta = new Date(`${consulta.data}T${consulta.hora}`);

    if (agora > dataHoraConsulta) {
      return res.status(403).json({
        message: 'Não é possível solicitar a remarcação de uma consulta que já aconteceu.',
      });
    }

    // Validação de permissão: o usuário precisa ser o paciente ou o médico/auxiliar da consulta
    const isOwner = perfil === 'paciente' && idUsuarioLogado === consulta.paciente_id;
    const isProvider = perfil === 'medico' && idUsuarioLogado === consulta.medico_id;
    // (A lógica para auxiliar seria mais complexa aqui, vamos simplificar por enquanto)
    if (!isOwner && !isProvider) {
      return res
        .status(403)
        .json({ message: 'Você não tem permissão para alterar esta consulta.' });
    }

    // Validação de status: só pode remarcar uma consulta confirmada
    if (consulta.status !== 'Confirmada') {
      return res
        .status(409)
        .json({ message: `Não é possível remarcar uma consulta com status "${consulta.status}".` });
    }

    // Validação de conflito para a NOVA data/hora
    const medicoConflict = await Consulta.checkConflict(consulta.medico_id, novaData, novaHora);
    if (medicoConflict)
      return res
        .status(409)
        .json({ message: 'Conflito de agendamento para o médico no novo horário.' });

    const pacienteConflict = await Consulta.checkPatientConflict(
      consulta.paciente_id,
      novaData,
      novaHora
    );
    if (pacienteConflict)
      return res
        .status(409)
        .json({ message: 'Conflito de agendamento para o paciente no novo horário.' });

    // Define o novo status com base em quem solicitou
    const novoStatus =
      perfil === 'paciente'
        ? 'Remarcação Solicitada Pelo Paciente'
        : 'Remarcação Solicitada Pelo Médico';

    const solicitacao = await Consulta.solicitarRemarcacao(
      consultaId,
      novaData,
      novaHora,
      novoStatus
    );

    if (perfil === 'paciente') {
      const medico = await Medico.findById(consulta.medico_id);
      const paciente = await Paciente.findById(idUsuarioLogado);

      if (medico && paciente) {
        // Monta a mensagem do e-mail
        const assunto = `Nova Solicitação de Remarcação de Consulta: ${paciente.nome}`;
        const mensagemHtml = `
                    <h1>Nova Solicitação de Remarcação de Consulta</h1>
                    <p>Olá, Dr(a). ${medico.nome},</p>
                    <p>O paciente <strong>${paciente.nome}</strong> solicitou uma nova data e hora para a consulta.</p>
                    <ul>
                        <li><strong>Data:</strong> ${new Date(novaData).toLocaleDateString()}</li>
                        <li><strong>Hora:</strong> ${novaHora}</li>
                    </ul>
                    <p>Por favor, acesse o sistema para aprovar ou rejeitar a solicitação.</p>
                `;

        // Envia o e-mail para o médico
        NotificationService.enviarEmail({
          para: medico.email,
          assunto: assunto,
          mensagemHtml: mensagemHtml,
        });
      }
    } else if (perfil === 'medico') {
      const medico = await Medico.findById(idUsuarioLogado);
      const paciente = await Paciente.findById(consulta.paciente_id);

      if (medico && paciente) {
        // Monta a mensagem do e-mail
        const assunto = `Nova Solicitação de Remarcação de Consulta: ${medico.nome}`;
        const mensagemHtml = `
                    <h1>Nova Solicitação de Remarcação de Consulta</h1>
                    <p>Olá, Sr(a). ${paciente.nome},</p>
                    <p>O Dr(a). <strong>${medico.nome}</strong> solicitou uma nova data e hora para a consulta.</p>
                    <ul>
                        <li><strong>Data:</strong> ${new Date(novaData).toLocaleDateString()}</li>
                        <li><strong>Hora:</strong> ${novaHora}</li>
                    </ul>
                    <p>Por favor, acesse o sistema para aprovar ou rejeitar a solicitação.</p>
                `;

        // Envia o e-mail para o paciente
        NotificationService.enviarEmail({
          para: paciente.email,
          assunto: assunto,
          mensagemHtml: mensagemHtml,
        });
      }
    }

    res
      .status(200)
      .json({ message: 'Solicitação de remarcação enviada com sucesso!', data: solicitacao });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao solicitar remarcação.', error: error.message });
  }
};
