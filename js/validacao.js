/**
 * Funções puras de validação de formulários.
 * Funcionam no navegador (escopo global) e no Node.js (module.exports) para os testes com Jest.
 */

/**
 * Verifica se todos os campos obrigatórios estão preenchidos.
 * @param {Object} dados - objeto com os valores do formulário
 * @param {string[]} campos - nomes dos campos obrigatórios
 * @returns {{valido: boolean, faltando: string[]}}
 */
function validarCamposObrigatorios(dados, campos) {
  const faltando = (campos || []).filter(function (campo) {
    const valor = dados ? dados[campo] : undefined;
    return valor === undefined || valor === null || String(valor).trim() === '';
  });
  return { valido: faltando.length === 0, faltando: faltando };
}

/**
 * Verifica se a quantidade é um número inteiro positivo.
 * @param {number|string} quantidade
 * @returns {boolean}
 */
function validarQuantidade(quantidade) {
  if (quantidade === null || quantidade === undefined || String(quantidade).trim() === '') return false;
  const n = Number(quantidade);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0;
}

/**
 * Converte "AAAA-MM-DD" em Date local (meia-noite), evitando problemas de fuso horário.
 * @param {string|Date} valor
 * @returns {Date|null}
 */
function paraData(valor) {
  if (valor instanceof Date) return isNaN(valor.getTime()) ? null : new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  if (typeof valor !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getMonth() !== Number(m[2]) - 1) return null; // data inexistente (ex.: 2026-02-30)
  return d;
}

/**
 * Verifica se a validade é uma data futura (posterior a hoje).
 * @param {string} validade - data no formato AAAA-MM-DD
 * @param {Date} [hoje] - data de referência (útil para testes)
 * @returns {boolean}
 */
function validarValidade(validade, hoje) {
  const data = paraData(validade);
  if (!data) return false;
  const ref = paraData(hoje || new Date());
  return data.getTime() > ref.getTime();
}

if (typeof module !== 'undefined') {
  module.exports = { validarCamposObrigatorios, validarQuantidade, validarValidade, paraData };
}
