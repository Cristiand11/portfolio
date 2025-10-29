function parseFilter(filterStringOrArray, startIndex = 1) {
  const filters = Array.isArray(filterStringOrArray) ? filterStringOrArray : [filterStringOrArray];
  let clauseParts = [];
  let params = [];
  let paramIndex = startIndex;

  const operators = {
    eq: '=',
    gt: '>',
    lt: '<',
    gte: '>=',
    lte: '<=',
    co: 'ILIKE',
  };
  const validColumns = ['data', 'status', 'medicoId', 'nomePaciente'];

  for (const filter of filters) {
    const parts = filter.match(/^(\w+)\s+(eq|gt|lt|gte|lte|co)\s+'([^']*)'$/);
    if (parts && parts.length === 4) {
      const key = parts[1];
      const op = parts[2];
      let value = parts[3];

      if (!validColumns.includes(key)) throw new Error(`Coluna de filtro inválida: ${key}`);
      const sqlOp = operators[op];
      if (!sqlOp) throw new Error(`Operador de filtro inválido: ${op}`);

      // Mapeia nome JS para nome coluna DB (se necessário)
      const dbKey =
        key === 'medicoId' ? 'medico_id' : key === 'nomePaciente' ? 'nome_paciente' : key;

      if (op === 'co') {
        clauseParts.push(`c.${dbKey} ${sqlOp} $${paramIndex}`);
        params.push(`%${value}%`); // Adiciona curingas para ILIKE
      } else {
        clauseParts.push(`c.${dbKey} ${sqlOp} $${paramIndex}`);
        params.push(value);
      }
      paramIndex++;
    } else {
      throw new Error(
        `Formato de filtro inválido: ${filter}. Use 'key op value' (ex: status eq 'Confirmada')`
      );
    }
  }
  return { clause: clauseParts.join(' AND '), params };
}
module.exports = { parseFilter };
