import { differenceInBusinessDays, addBusinessDays, isAfter } from "date-fns";

export const calcularTempoRestante = (dataSolicitacaoISO) => {
  if (!dataSolicitacaoISO) return { texto: "N/A", expirado: true };
  
  try {
    const dataSolicitacao = new Date(dataSolicitacaoISO);
    const dataLimite = addBusinessDays(dataSolicitacao, 5);
    const hoje = new Date();

    // Ajustamos 'hoje' para zerar as horas para comparação de dias cheios, 
    // ou mantemos como está se a precisão de hora importar. 
    // Para dias úteis, geralmente ignoramos a hora exata.

    if (isAfter(hoje, dataLimite)) {
      return { texto: "Expirado", expirado: true };
    } else {
      const diasRestantes = differenceInBusinessDays(dataLimite, hoje);
      
      if (diasRestantes <= 0) {
        return { texto: "Expira Hoje", expirado: false };
      } else {
        const plural = diasRestantes === 1 ? "" : "s";
        return {
          texto: `${diasRestantes} dia${plural} útil${plural}`,
          expirado: false,
        };
      }
    }
  } catch {
    return { texto: "Erro Data", expirado: true };
  }
};