import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calcularTempoRestante } from './dateUtils';
import { addBusinessDays } from 'date-fns';

describe('dateUtils - calcularTempoRestante', () => {
  // Como a função usa "new Date()" (hoje), precisamos "congelar" o tempo 
  // para que o teste não quebre dependendo do dia que for rodado.
  
  beforeEach(() => {
    // Fingimos que "hoje" é Segunda-feira, 10 de Outubro de 2023
    vi.useFakeTimers();
    const date = new Date(2023, 9, 10); // Mês 9 é Outubro (0-indexado)
    vi.setSystemTime(date);
  });

  afterEach(() => {
    vi.useRealTimers(); // Volta o relógio ao normal depois de cada teste
  });

  it('Deve retornar "N/A" se a data for inválida ou nula', () => {
    expect(calcularTempoRestante(null)).toEqual({ texto: "N/A", expirado: true });
    expect(calcularTempoRestante("")).toEqual({ texto: "N/A", expirado: true });
  });

  it('Deve calcular corretamente dias restantes dentro do prazo', () => {
    // Se hoje é dia 10 (Segunda), e solicitou dia 10.
    // Prazo = 10 + 5 dias úteis = Segunda dia 17.
    // Diferença de 10 para 17 = 5 dias úteis.
    
    // Simulando solicitação feita HOJE
    const hojeISO = new Date(2023, 9, 10).toISOString();
    const resultado = calcularTempoRestante(hojeISO);
    
    expect(resultado.expirado).toBe(false);
    expect(resultado.texto).toMatch(/5 dias? útil/); // Aceita "dia útil" ou "dias úteis"
  });

  it('Deve retornar "Expira Hoje" quando chegar no dia limite', () => {
    // Vamos avançar o tempo do sistema para o dia limite (Dia 17)
    const diaLimite = new Date(2023, 9, 17);
    vi.setSystemTime(diaLimite);

    // Solicitação feita dia 10
    const dataSolicitacao = new Date(2023, 9, 10).toISOString();
    
    const resultado = calcularTempoRestante(dataSolicitacao);
    expect(resultado.texto).toBe("Expira Hoje");
    expect(resultado.expirado).toBe(false);
  });

  it('Deve retornar "Expirado" quando passar do prazo', () => {
    // Avançamos para dia 18 (Terça), um dia após o limite
    const diaAposLimite = new Date(2023, 9, 18);
    vi.setSystemTime(diaAposLimite);

    const dataSolicitacao = new Date(2023, 9, 10).toISOString();
    
    const resultado = calcularTempoRestante(dataSolicitacao);
    expect(resultado.texto).toBe("Expirado");
    expect(resultado.expirado).toBe(true);
  });
});