const db = require('../config/database');

const HorarioTrabalho = {};

HorarioTrabalho.definirHorarios = async (idMedico, horarios) => {
  // Usamos uma transação para garantir que ambas as operações funcionem ou falhem juntas
  const client = await db.connect(); // Pega um cliente do pool de conexões
  try {
    await client.query('BEGIN'); // Inicia a transação

    // 1. Apaga todos os horários antigos daquele médico
    await client.query('DELETE FROM HORARIO_TRABALHO WHERE medico_id = $1', [idMedico]);

    // 2. Insere os novos horários
    const insertPromises = horarios.map(horario => {
      const { dia_semana, hora_inicio, hora_fim } = horario;
      return client.query(
        'INSERT INTO HORARIO_TRABALHO (medico_id, dia_semana, hora_inicio, hora_fim) VALUES ($1, $2, $3, $4)',
        [idMedico, dia_semana, hora_inicio, hora_fim]
      );
    });
    await Promise.all(insertPromises);

    await client.query('COMMIT'); // Confirma a transação
  } catch (error) {
    await client.query('ROLLBACK'); // Desfaz a transação em caso de erro
    throw error;
  } finally {
    client.release(); // Libera o cliente de volta para o pool
  }
};

HorarioTrabalho.findByMedicoId = async (idMedico) => {
  const { rows } = await db.query(
    'SELECT dia_semana, hora_inicio, hora_fim FROM HORARIO_TRABALHO WHERE medico_id = $1 ORDER BY dia_semana, hora_inicio ASC',
    [idMedico]
  );
  return rows;
};

module.exports = HorarioTrabalho;
