const { parseFilter } = require('../../src/utils/queryUtils');

describe('QueryUtils Unit Tests', () => {
  // ---------------------------------------------------------
  // CAMINHOS FELIZES (Sucesso)
  // ---------------------------------------------------------

  it('deve fazer o parse de um filtro de igualdade simples (eq)', () => {
    const input = "status eq 'Confirmada'";
    const resultado = parseFilter(input);

    expect(resultado.clause).toBe('c.status = $1');
    expect(resultado.params).toEqual(['Confirmada']);
  });

  it('deve adicionar curingas (%) para operador contains (co)', () => {
    const input = "nomePaciente co 'Silva'";
    const resultado = parseFilter(input);

    // Verifica se mapeou nomePaciente -> nome_paciente e usou ILIKE
    expect(resultado.clause).toBe('c.nome_paciente ILIKE $1');
    expect(resultado.params).toEqual(['%Silva%']);
  });

  it('deve processar array de múltiplos filtros e incrementar índices', () => {
    const input = [
      "status eq 'Ativo'",
      "medicoId eq '123'", // Teste de mapeamento camelCase -> snake_case
    ];

    // Começando do índice 5 para testar o offset
    const resultado = parseFilter(input, 5);

    expect(resultado.clause).toBe('c.status = $5 AND c.medico_id = $6');
    expect(resultado.params).toEqual(['Ativo', '123']);
  });

  it('deve suportar operadores de comparação (gt, lt)', () => {
    const input = "data gt '2025-01-01'";
    const resultado = parseFilter(input);

    expect(resultado.clause).toBe('c.data > $1');
    expect(resultado.params).toEqual(['2025-01-01']);
  });

  // ---------------------------------------------------------
  // CENÁRIOS DE ERRO (Validações)
  // ---------------------------------------------------------

  it('deve lançar erro se a coluna não for permitida (Segurança)', () => {
    // 'senha' não está na lista validColumns
    const input = "senha eq '123456'";

    expect(() => parseFilter(input)).toThrow('Coluna de filtro inválida: senha');
  });

  it('deve lançar erro se o formato da string estiver incorreto', () => {
    const input = 'status=Confirmada'; // Falta espaço e aspas

    expect(() => parseFilter(input)).toThrow(/Formato de filtro inválido/);
  });

  it('deve lançar erro se o operador não existir', () => {
    // Embora o regex no seu código capture apenas operadores válidos,
    // se a string passar no regex mas falhar no mapa (teoricamente impossivel com seu regex atual,
    // mas bom para garantir robustez caso o regex mude), validamos o formato.
    // Vamos testar algo que quebre o regex propositalmente para cair no 'else'
    const input = "status invalidOp 'valor'";
    expect(() => parseFilter(input)).toThrow(/Formato de filtro inválido/);
  });
});
