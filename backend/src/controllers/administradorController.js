const Administrador = require('../models/administradorModel');
const Medico = require('../models/medicoModel');

exports.createAdministrador = async (req, res) => {
  try {
    const novoAdmin = await Administrador.create(req.body);
    res.status(201).json({
      message: 'Administrador cadastrado com sucesso!',
      data: novoAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao cadastrar administrador', error: error.message });
  }
};

exports.getAllAdministradores = async (req, res) => {
  try {
    const { page, size, filter } = req.query;
    const pageNum = parseInt(page || '1', 10);
    const sizeNum = parseInt(size || '10', 10);

    let filterString = '';
    if (filter) {
      filterString = Array.isArray(filter) ? filter.join(' AND ') : filter;
    }

    const result = await Administrador.findPaginated(pageNum, sizeNum, filterString);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar administradores', error: error.message });
  }
};

exports.updateAdministrador = async (req, res) => {
  try {
    const { id } = req.params;
    const atualizado = await Administrador.update(id, req.body);
    if (!atualizado) {
      return res.status(404).json({ message: 'Administrador não encontrado' });
    }
    res.status(200).json({ message: 'Administrador atualizado com sucesso!', data: atualizado });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar administrador', error: error.message });
  }
};

exports.deleteAdministrador = async (req, res) => {
  try {
    const { id } = req.params;
    const deletado = await Administrador.delete(id);
    if (deletado === 0) {
      return res.status(404).json({ message: 'Administrador não encontrado' });
    }
    res.status(200).json({ message: 'Administrador removido com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover administrador', error: error.message });
  }
};

// Função para calcular a data de X dias úteis atrás
function getStartDateDiasUteis(diasUteis) {
  let data = new Date();
  let diasContados = 0;
  while (diasContados < diasUteis) {
    data.setDate(data.getDate() - 1);
    const diaDaSemana = data.getDay();
    if (diaDaSemana !== 0 && diaDaSemana !== 6) {
      // Ignora Domingo (0) e Sábado (6)
      diasContados++;
    }
  }
  return data;
}

exports.getDashboardStats = async (req, res) => {
  try {
    const totalMedicosAtivos = await Medico.countAtivos();

    const dataInicio = getStartDateDiasUteis(5);
    const solicitacoesRecentes = await Medico.countSolicitacoesInativacaoRecentes(dataInicio);

    res.status(200).json({
      totalMedicosAtivos,
      solicitacoesRecentes,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Erro ao buscar estatísticas do dashboard.', error: error.message });
  }
};
