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

module.exports = {
    getDiasUteis,
    formatarData
};