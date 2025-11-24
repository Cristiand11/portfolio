const { verificaConflitosNoDia } = require('../../src/utils/agendaHelper');

describe('AgendaHelper - Validação de Conflitos de Horário', () => {

  test('Deve retornar FALSE se houver apenas 1 horário (sem conflito)', () => {
    const slots = [{ hora_inicio: '08:00', hora_fim: '12:00' }];
    expect(verificaConflitosNoDia(slots)).toBe(false);
  });

  test('Deve retornar FALSE para horários sequenciais perfeitos', () => {
    // Um acaba às 12:00, o outro começa às 12:00
    const slots = [
      { hora_inicio: '08:00', hora_fim: '12:00' },
      { hora_inicio: '12:00', hora_fim: '18:00' }
    ];
    expect(verificaConflitosNoDia(slots)).toBe(false);
  });

  test('Deve retornar FALSE para horários distantes', () => {
    const slots = [
      { hora_inicio: '08:00', hora_fim: '10:00' },
      { hora_inicio: '14:00', hora_fim: '18:00' }
    ];
    expect(verificaConflitosNoDia(slots)).toBe(false);
  });

  test('Deve retornar TRUE para sobreposição parcial (fim invade o próximo)', () => {
    const slots = [
      { hora_inicio: '08:00', hora_fim: '10:30' }, // Vai até 10:30
      { hora_inicio: '10:00', hora_fim: '12:00' }  // Começa às 10:00
    ];
    expect(verificaConflitosNoDia(slots)).toBe(true);
  });

  test('Deve retornar TRUE para envelopamento (um horário dentro do outro)', () => {
    const slots = [
      { hora_inicio: '08:00', hora_fim: '18:00' }, // O dia todo
      { hora_inicio: '13:00', hora_fim: '14:00' }  // Almoço no meio
    ];
    expect(verificaConflitosNoDia(slots)).toBe(true);
  });

  test('Deve funcionar independentemente da ordem do array (deve ordenar antes)', () => {
    const slots = [
      { hora_inicio: '14:00', hora_fim: '16:00' }, // Tarde
      { hora_inicio: '08:00', hora_fim: '10:00' }  // Manhã
    ];
    // Mesmo fora de ordem, não deve dar conflito
    expect(verificaConflitosNoDia(slots)).toBe(false);
  });

  test('Deve ignorar horários inválidos ou incompletos', () => {
    const slots = [
      { hora_inicio: '08:00', hora_fim: '12:00' },
      { hora_inicio: '', hora_fim: '' } // Slot vazio
    ];
    expect(verificaConflitosNoDia(slots)).toBe(false);
  });
});