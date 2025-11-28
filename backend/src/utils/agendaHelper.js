/**
 * Verifica se há sobreposição de horários em um array de slots de um dia.
 * @param {Array} slotsDoDia - Array de objetos { hora_inicio, hora_fim }
 * @returns {boolean} - true se houver conflito, false caso contrário.
 */
const verificaConflitosNoDia = (slotsDoDia) => {
  if (!slotsDoDia || slotsDoDia.length < 2) {
    return false; // Não há conflito com 0 ou 1 slot
  }

  // Converte HH:MM para minutos desde a meia-noite
  const paraMinutos = (horaStr) => {
     if (!horaStr || typeof horaStr !== 'string') return null;
     // Aceita HH:MM ou HH:MM:SS (ignora segundos)
     const [h, m] = horaStr.split(':').map(Number);
     if (isNaN(h) || isNaN(m)) return null;
     return h * 60 + m;
  };

  const slotsOrdenados = slotsDoDia
     .map(slot => ({
        inicioMin: paraMinutos(slot.hora_inicio),
        fimMin: paraMinutos(slot.hora_fim),
        original: slot
     }))
     // Filtra slots inválidos
     .filter(slot => slot.inicioMin !== null && slot.fimMin !== null && slot.inicioMin < slot.fimMin)
     .sort((a, b) => a.inicioMin - b.inicioMin);

  if (slotsOrdenados.length < 2) return false;

  // Verifica sobreposição
  for (let i = 0; i < slotsOrdenados.length - 1; i++) {
    const slotAtual = slotsOrdenados[i];
    const proximoSlot = slotsOrdenados[i + 1];

    // Conflito se o fim do atual for MAIOR que o início do próximo
    // Ex: Atual 10:00 (600) -> 12:00 (720)
    //     Prox  11:00 (660) -> ...
    //     720 > 660 -> CONFLITO
    if (slotAtual.fimMin > proximoSlot.inicioMin) {
      return true;
    }
  }

  return false;
};

module.exports = { verificaConflitosNoDia };