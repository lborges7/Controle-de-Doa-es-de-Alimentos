/**
 * Testes unitários das funções de validação.
 */
const { validarCamposObrigatorios, validarQuantidade, validarValidade } = require('../js/validacao');

const HOJE = new Date(2026, 10, 17); // 17/11/2026

describe('validarQuantidade', () => {
  test('rejeita zero', () => expect(validarQuantidade(0)).toBe(false));
  test('rejeita número negativo', () => expect(validarQuantidade(-5)).toBe(false));
  test('rejeita valor vazio ou não numérico', () => {
    expect(validarQuantidade('')).toBe(false);
    expect(validarQuantidade('abc')).toBe(false);
    expect(validarQuantidade(null)).toBe(false);
  });
  test('rejeita número decimal', () => expect(validarQuantidade(2.5)).toBe(false));
  test('aceita número positivo', () => {
    expect(validarQuantidade(10)).toBe(true);
    expect(validarQuantidade('3')).toBe(true);
  });
});

describe('validarValidade', () => {
  test('rejeita data passada', () => expect(validarValidade('2026-11-01', HOJE)).toBe(false));
  test('rejeita a data de hoje', () => expect(validarValidade('2026-11-17', HOJE)).toBe(false));
  test('aceita data futura', () => expect(validarValidade('2026-12-31', HOJE)).toBe(true));
  test('rejeita formato inválido ou data inexistente', () => {
    expect(validarValidade('31/12/2026', HOJE)).toBe(false);
    expect(validarValidade('2027-02-30', HOJE)).toBe(false);
    expect(validarValidade('', HOJE)).toBe(false);
  });
  test('usa a data atual quando nenhuma referência é informada', () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const iso = amanha.getFullYear() + '-' + String(amanha.getMonth() + 1).padStart(2, '0') + '-' + String(amanha.getDate()).padStart(2, '0');
    expect(validarValidade(iso)).toBe(true);
  });
});

describe('validarCamposObrigatorios', () => {
  const campos = ['nome', 'lote', 'quantidade'];

  test('rejeita campos vazios e informa quais faltam', () => {
    const r = validarCamposObrigatorios({ nome: 'Arroz', lote: '   ', quantidade: '' }, campos);
    expect(r.valido).toBe(false);
    expect(r.faltando).toEqual(['lote', 'quantidade']);
  });
  test('rejeita campos ausentes', () => {
    expect(validarCamposObrigatorios({}, campos).faltando).toEqual(campos);
  });
  test('aceita quando todos os campos estão preenchidos', () => {
    const r = validarCamposObrigatorios({ nome: 'Arroz', lote: 'L1', quantidade: 5 }, campos);
    expect(r).toEqual({ valido: true, faltando: [] });
  });
});
