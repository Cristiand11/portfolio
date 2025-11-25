const dateUtils = require('../../src/utils/dateUtils');

describe('DateUtils Unit Tests', () => {
  
  // ---------------------------------------------------------
  // getDiasUteis
  // ---------------------------------------------------------
  describe('getDiasUteis', () => {
    beforeAll(() => {
      // Congela o tempo em uma Sexta-feira, 20 de Outubro de 2023, 12:00 UTC
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-10-20T12:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('deve calcular dias úteis corretamente (passado -> presente)', () => {
      // Data Inicial: Segunda-feira, 16 de Outubro (4 dias antes de sexta)
      // O loop conta: 16(Seg), 17(Ter), 18(Qua), 19(Qui). 
      // Quando chega em 20(Sex), o loop para (dataAtual < hoje).
      const dataInicial = '2023-10-16T12:00:00Z';
      
      const dias = dateUtils.getDiasUteis(dataInicial);
      
      expect(dias).toBe(4);
    });

    it('deve ignorar finais de semana', () => {
      // Data Inicial: Sexta-feira anterior, 13 de Outubro (7 dias cronológicos antes)
      // Contagem:
      // 13 (Sex) -> Conta
      // 14 (Sáb) -> Pula
      // 15 (Dom) -> Pula
      // 16 (Seg) -> Conta
      // 17 (Ter) -> Conta
      // 18 (Qua) -> Conta
      // 19 (Qui) -> Conta
      // Total esperado: 5 dias úteis
      const dataInicial = '2023-10-13T12:00:00Z';
      
      const dias = dateUtils.getDiasUteis(dataInicial);
      
      expect(dias).toBe(5);
    });

    it('deve retornar 0 se data inicial for hoje ou futuro', () => {
      const dataInicial = new Date(); // Hoje
      const dias = dateUtils.getDiasUteis(dataInicial);
      expect(dias).toBe(0);
    });
  });

  // ---------------------------------------------------------
  // formatarData (Timezone America/Sao_Paulo)
  // ---------------------------------------------------------
  describe('formatarData', () => {
    it('deve formatar data ISO para string legível em BRT (UTC-3)', () => {
      // 15:00 UTC deve ser 12:00 em São Paulo (sem horário de verão)
      const dataUTC = new Date('2023-10-20T15:00:00Z');
      
      const resultado = dateUtils.formatarData(dataUTC);
      
      // Verifica formato yyyy-MM-dd HH:mm:ss
      expect(resultado).toBe('2023-10-20 12:00:00');
    });

    it('deve retornar null se input for inválido', () => {
      expect(dateUtils.formatarData(null)).toBeNull();
      expect(dateUtils.formatarData(undefined)).toBeNull();
    });
  });

  // ---------------------------------------------------------
  // formatarApenasData
  // ---------------------------------------------------------
  describe('formatarApenasData', () => {
    it('deve retornar string YYYY-MM-DD sem alteração de dia', () => {
      // A função adiciona 'Z' ao final, forçando UTC.
      // Se entrarmos com '2023-10-20', vira '2023-10-20Z', que é ISO.
      const input = '2023-10-20';
      
      const resultado = dateUtils.formatarApenasData(input);
      
      expect(resultado).toBe('2023-10-20');
    });

    it('deve retornar null se input for vazio', () => {
      expect(dateUtils.formatarApenasData(null)).toBeNull();
    });
  });

  // ---------------------------------------------------------
  // formatarDataParaEmail
  // ---------------------------------------------------------
  describe('formatarDataParaEmail', () => {
    it('deve converter YYYY-MM-DD para DD/MM/YYYY', () => {
      const input = '2023-10-20';
      const resultado = dateUtils.formatarDataParaEmail(input);
      expect(resultado).toBe('20/10/2023');
    });

    it('deve retornar string vazia se input inválido', () => {
      expect(dateUtils.formatarDataParaEmail(null)).toBe('');
      expect(dateUtils.formatarDataParaEmail(123)).toBe('');
    });

    it('deve retornar original se formato for inesperado', () => {
      const input = 'data-invalida';
      const resultado = dateUtils.formatarDataParaEmail(input);
      expect(resultado).toBe('data-invalida');
    });
  });
});