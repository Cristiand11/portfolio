const { formatInTimeZone } = require('date-fns-tz');

function getDiasUteis(dataInicial) {
  let dias = 0;
  let dataAtual = new Date(dataInicial);
  const hoje = new Date();

  while (dataAtual < hoje) {
    const diaDaSemana = dataAtual.getDay();
    if (diaDaSemana !== 0 && diaDaSemana !== 6) { // 0=Domingo, 6=Sábado
      dias++;
    }
    dataAtual.setDate(dataAtual.getDate() + 1);
  }
  return dias;
}

function formatarData(data) {
  if (!data) return null;
  const timeZone = 'America/Sao_Paulo';
  // Formato: Ano-Mês-Dia Hora:Minuto:Segundo
  return formatInTimeZone(data, timeZone, 'yyyy-MM-dd HH:mm:ss');
}

function formatarApenasData(data) {
  if (!data) return null;
  // Pega o objeto Date e converte para uma string YYYY-MM-DD
  // Adicionamos 'Z' para garantir que a conversão para UTC não mude o dia
  return new Date(data + 'Z').toISOString().slice(0, 10);
}

function formatarDataParaEmail(dataString) {
  if (!dataString || typeof dataString !== 'string') return '';
  // Pega a string 'YYYY-MM-DD' e a divide em um array ['YYYY', 'MM', 'DD']
  const partes = dataString.split('-');
  if (partes.length !== 3) return dataString; // Retorna o original se o formato for inesperado
    
  const [ano, mes, dia] = partes;
  // Remonta o array na ordem 'DD/MM/YYYY'
  return `${dia}/${mes}/${ano}`;
}

module.exports = {
  getDiasUteis,
  formatarData,
  formatarApenasData,
  formatarDataParaEmail
};