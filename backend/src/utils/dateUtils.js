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

module.exports = {
    getDiasUteis
};