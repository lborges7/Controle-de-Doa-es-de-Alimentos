/**
 * Lógica de negócio do MVP: persistência no localStorage, cálculo de estoque e classificação de validade.
 */

const CHAVE_MOVIMENTACOES = 'cda_movimentacoes';
const CHAVE_SESSAO = 'cda_sessao';
const DIAS_ALERTA = 30;

/* ---------- Persistência ---------- */

function obterMovimentacoes() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_MOVIMENTACOES));
    return Array.isArray(dados) ? dados : [];
  } catch (e) {
    return [];
  }
}

function salvarMovimentacao(mov) {
  const lista = obterMovimentacoes();
  const registro = Object.assign({}, mov, {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    quantidade: Number(mov.quantidade),
    dataRegistro: new Date().toISOString()
  });
  lista.push(registro);
  localStorage.setItem(CHAVE_MOVIMENTACOES, JSON.stringify(lista));
  return registro;
}

function limparMovimentacoes() {
  localStorage.removeItem(CHAVE_MOVIMENTACOES);
}

/* ---------- Regras de estoque ---------- */

function chaveItem(nome, lote) {
  return String(nome).trim().toLowerCase() + '|' + String(lote).trim().toLowerCase();
}

/**
 * Calcula o saldo atual por alimento + lote a partir das movimentações.
 * Itens com saldo zero são omitidos.
 * @param {Array} movimentacoes
 * @returns {Array<{nome, lote, quantidade, validade}>}
 */
function calcularEstoque(movimentacoes) {
  const mapa = {};
  (movimentacoes || []).forEach(function (m) {
    const k = chaveItem(m.nome, m.lote);
    if (!mapa[k]) mapa[k] = { nome: String(m.nome).trim(), lote: String(m.lote).trim(), quantidade: 0, validade: m.validade || '' };
    const qtd = Number(m.quantidade) || 0;
    if (m.tipo === 'entrada') {
      mapa[k].quantidade += qtd;
      if (m.validade) mapa[k].validade = m.validade;
    } else if (m.tipo === 'saida') {
      mapa[k].quantidade -= qtd;
    }
  });
  return Object.keys(mapa)
    .map(function (k) { return mapa[k]; })
    .filter(function (i) { return i.quantidade > 0; })
    .sort(function (a, b) { return String(a.validade).localeCompare(String(b.validade)); });
}

/** Saldo disponível de um item específico (usado para impedir saída maior que o estoque). */
function saldoDisponivel(movimentacoes, nome, lote) {
  const item = calcularEstoque(movimentacoes).find(function (i) { return chaveItem(i.nome, i.lote) === chaveItem(nome, lote); });
  return item ? item.quantidade : 0;
}

/**
 * Classifica a validade: 'vencido' (antes de hoje), 'alerta' (até 30 dias) ou 'ok'.
 * @param {string} validade - AAAA-MM-DD
 * @param {Date} [hoje]
 */
function classificarValidade(validade, hoje) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(validade || ''));
  if (!m) return 'vencido';
  const data = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const h = hoje || new Date();
  const ref = new Date(h.getFullYear(), h.getMonth(), h.getDate());
  const dias = Math.round((data - ref) / 86400000);
  if (dias < 0) return 'vencido';
  if (dias <= DIAS_ALERTA) return 'alerta';
  return 'ok';
}

/** Formata AAAA-MM-DD como DD/MM/AAAA. */
function formatarData(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '-';
}

/* ---------- Sessão simulada ---------- */

function autenticar(usuario, senha) {
  if (usuario === 'admin' && senha === '1234') {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ usuario: usuario, inicio: new Date().toISOString() }));
    return true;
  }
  return false;
}

function obterSessao() {
  try { return JSON.parse(localStorage.getItem(CHAVE_SESSAO)); } catch (e) { return null; }
}

function sair() {
  localStorage.removeItem(CHAVE_SESSAO);
}

/** Redireciona para o login caso não haja sessão ativa. */
function exigirSessao() {
  if (!obterSessao()) window.location.href = 'index.html';
}

/** Escapa HTML para evitar injeção ao renderizar dados do usuário. */
function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    obterMovimentacoes, salvarMovimentacao, limparMovimentacoes,
    calcularEstoque, saldoDisponivel, classificarValidade, formatarData,
    autenticar, obterSessao, sair, escaparHtml, DIAS_ALERTA
  };
}
