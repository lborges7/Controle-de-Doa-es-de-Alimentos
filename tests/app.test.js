/**
 * Testes de integração da lógica de estoque (executados com jsdom, que fornece localStorage).
 */
const {
  calcularEstoque, classificarValidade, salvarMovimentacao, obterMovimentacoes,
  limparMovimentacoes, saldoDisponivel, autenticar, obterSessao, sair, formatarData, escaparHtml
} = require('../js/app');

const HOJE = new Date(2026, 10, 17); // 17/11/2026

describe('calcularEstoque', () => {
  test('retorna saldo correto com entradas e saídas', () => {
    const movs = [
      { tipo: 'entrada', nome: 'Arroz', lote: 'L1', quantidade: 10, validade: '2027-01-10' },
      { tipo: 'entrada', nome: 'Arroz', lote: 'L1', quantidade: 5, validade: '2027-01-10' },
      { tipo: 'saida', nome: 'arroz', lote: 'l1', quantidade: 4, validade: '2027-01-10' },
      { tipo: 'entrada', nome: 'Feijão', lote: 'F1', quantidade: 8, validade: '2026-12-01' }
    ];
    const estoque = calcularEstoque(movs);
    expect(estoque).toHaveLength(2);
    expect(estoque.find(i => i.nome === 'Arroz').quantidade).toBe(11);
    expect(estoque.find(i => i.nome === 'Feijão').quantidade).toBe(8);
  });

  test('separa lotes diferentes do mesmo alimento', () => {
    const estoque = calcularEstoque([
      { tipo: 'entrada', nome: 'Leite', lote: 'A', quantidade: 3, validade: '2027-01-01' },
      { tipo: 'entrada', nome: 'Leite', lote: 'B', quantidade: 2, validade: '2027-02-01' }
    ]);
    expect(estoque.map(i => i.lote)).toEqual(['A', 'B']);
  });

  test('omite itens com saldo zerado e lida com lista vazia', () => {
    expect(calcularEstoque([
      { tipo: 'entrada', nome: 'Óleo', lote: 'O1', quantidade: 2, validade: '2027-01-01' },
      { tipo: 'saida', nome: 'Óleo', lote: 'O1', quantidade: 2 }
    ])).toEqual([]);
    expect(calcularEstoque([])).toEqual([]);
    expect(calcularEstoque(undefined)).toEqual([]);
  });

  test('ordena pela validade mais próxima', () => {
    const estoque = calcularEstoque([
      { tipo: 'entrada', nome: 'B', lote: '1', quantidade: 1, validade: '2027-05-01' },
      { tipo: 'entrada', nome: 'A', lote: '1', quantidade: 1, validade: '2026-12-01' }
    ]);
    expect(estoque[0].nome).toBe('A');
  });
});

describe('classificarValidade', () => {
  test('classifica data passada como vencido', () => expect(classificarValidade('2026-11-16', HOJE)).toBe('vencido'));
  test('classifica hoje como alerta', () => expect(classificarValidade('2026-11-17', HOJE)).toBe('alerta'));
  test('classifica até 30 dias como alerta', () => expect(classificarValidade('2026-12-17', HOJE)).toBe('alerta'));
  test('classifica mais de 30 dias como ok', () => expect(classificarValidade('2026-12-18', HOJE)).toBe('ok'));
  test('trata validade inválida como vencido', () => expect(classificarValidade('', HOJE)).toBe('vencido'));
});

describe('persistência no localStorage', () => {
  beforeEach(() => localStorage.clear());

  test('salva e recupera movimentações e calcula saldo disponível', () => {
    salvarMovimentacao({ tipo: 'entrada', nome: 'Arroz', lote: 'L1', quantidade: '10', validade: '2027-01-10', responsavel: 'Ana' });
    salvarMovimentacao({ tipo: 'saida', nome: 'Arroz', lote: 'L1', quantidade: '3', validade: '2027-01-10', responsavel: 'Ana' });
    const movs = obterMovimentacoes();
    expect(movs).toHaveLength(2);
    expect(movs[0].quantidade).toBe(10);
    expect(movs[0].id).toBeDefined();
    expect(saldoDisponivel(movs, 'Arroz', 'L1')).toBe(7);
    expect(saldoDisponivel(movs, 'Feijão', 'X')).toBe(0);
  });

  test('retorna lista vazia quando o armazenamento está corrompido ou limpo', () => {
    localStorage.setItem('cda_movimentacoes', '{invalido');
    expect(obterMovimentacoes()).toEqual([]);
    limparMovimentacoes();
    expect(obterMovimentacoes()).toEqual([]);
  });
});

describe('sessão e utilitários', () => {
  beforeEach(() => localStorage.clear());

  test('autentica apenas com credenciais corretas', () => {
    expect(autenticar('admin', 'errada')).toBe(false);
    expect(obterSessao()).toBeNull();
    expect(autenticar('admin', '1234')).toBe(true);
    expect(obterSessao().usuario).toBe('admin');
    sair();
    expect(obterSessao()).toBeNull();
  });

  test('formata datas e escapa HTML', () => {
    expect(formatarData('2026-11-17')).toBe('17/11/2026');
    expect(formatarData('')).toBe('-');
    expect(escaparHtml('<b>"x"</b>')).toBe('&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
  });
});
