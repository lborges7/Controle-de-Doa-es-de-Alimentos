/**
 * @jest-environment node
 *
 * Testes de integração das telas: carregam os arquivos HTML reais em um navegador
 * simulado (jsdom), executam os scripts da página e interagem com o formulário,
 * verificando o fluxo completo: login -> registro de movimentação -> estoque e alertas.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const RAIZ = path.join(__dirname, '..');
const CHAVE_MOV = 'cda_movimentacoes';
const CHAVE_SESSAO = 'cda_sessao';

/** Insere o conteúdo dos scripts locais no HTML para que o jsdom os execute. */
function montarHtml(arquivo) {
  let html = fs.readFileSync(path.join(RAIZ, arquivo), 'utf8');
  html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, src) =>
    '<script>' + fs.readFileSync(path.join(RAIZ, src), 'utf8') + '</script>');
  return html;
}

/** Abre uma tela com o localStorage pré-carregado (sessão e movimentações). */
function abrirTela(arquivo, { logado = true, movimentacoes = [] } = {}) {
  const dom = new JSDOM(montarHtml(arquivo), {
    url: 'http://localhost/' + arquivo,
    runScripts: 'dangerously',
    beforeParse(window) {
      if (logado) window.localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ usuario: 'admin' }));
      window.localStorage.setItem(CHAVE_MOV, JSON.stringify(movimentacoes));
    }
  });
  return dom.window;
}

function dataRelativa(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function preencher(win, dados) {
  const form = win.document.getElementById('form-mov');
  Object.entries(dados).forEach(([campo, valor]) => { win.document.getElementById(campo).value = valor; });
  form.dispatchEvent(new win.Event('submit', { cancelable: true }));
  return win.document.getElementById('msg');
}

function lerMovimentacoes(win) {
  return JSON.parse(win.localStorage.getItem(CHAVE_MOV));
}

describe('Tela de login (index.html)', () => {
  test('rejeita credenciais erradas e libera o menu com credenciais corretas', () => {
    const win = abrirTela('index.html', { logado: false });
    const doc = win.document;
    const form = doc.querySelector('form');
    const usuario = doc.querySelector('input[type="text"], input#usuario');
    const senha = doc.querySelector('input[type="password"]');

    usuario.value = 'admin';
    senha.value = 'errada';
    form.dispatchEvent(new win.Event('submit', { cancelable: true }));
    expect(win.localStorage.getItem(CHAVE_SESSAO)).toBeNull();

    senha.value = '1234';
    form.dispatchEvent(new win.Event('submit', { cancelable: true }));
    expect(JSON.parse(win.localStorage.getItem(CHAVE_SESSAO)).usuario).toBe('admin');
    expect(doc.getElementById('secao-menu').hidden).toBe(false);
    expect(doc.querySelector('a[href="movimentacao.html"]')).not.toBeNull();
    expect(doc.querySelector('a[href="estoque.html"]')).not.toBeNull();
  });
});

describe('Tela de movimentação (movimentacao.html)', () => {
  const ENTRADA = {
    tipo: 'entrada', nome: 'Arroz 5kg', lote: 'ARR-001', quantidade: '20',
    validade: dataRelativa(120), responsavel: 'Ana'
  };

  test('registra uma entrada válida, salva no armazenamento e lista na tabela', () => {
    const win = abrirTela('movimentacao.html');
    const msg = preencher(win, ENTRADA);

    expect(msg.textContent).toBe('Movimentação registrada com sucesso!');
    expect(msg.className).toContain('sucesso');
    const movs = lerMovimentacoes(win);
    expect(movs).toHaveLength(1);
    expect(movs[0]).toMatchObject({ tipo: 'entrada', nome: 'Arroz 5kg', lote: 'ARR-001', quantidade: 20 });
    expect(win.document.getElementById('corpo-lista').textContent).toContain('ARR-001');
  });

  test('bloqueia envio com campos obrigatórios vazios e informa quais faltam', () => {
    const win = abrirTela('movimentacao.html');
    const msg = preencher(win, { tipo: 'entrada', nome: '', lote: '', quantidade: '', validade: '', responsavel: '' });

    expect(msg.className).toContain('erro');
    expect(msg.textContent).toContain('Nome do alimento');
    expect(win.document.getElementById('nome').classList.contains('invalido')).toBe(true);
    expect(lerMovimentacoes(win)).toHaveLength(0);
  });

  test('rejeita quantidade zero e entrada com validade vencida', () => {
    const win = abrirTela('movimentacao.html');
    expect(preencher(win, { ...ENTRADA, quantidade: '0' }).textContent).toContain('maior que zero');
    expect(preencher(win, { ...ENTRADA, validade: dataRelativa(-1) }).textContent).toContain('data futura');
    expect(lerMovimentacoes(win)).toHaveLength(0);
  });

  test('impede saída maior que o saldo e aceita saída dentro do saldo', () => {
    const win = abrirTela('movimentacao.html', {
      movimentacoes: [{ ...ENTRADA, quantidade: 20, id: '1', dataRegistro: new Date().toISOString() }]
    });
    const saida = { ...ENTRADA, tipo: 'saida', quantidade: '25' };

    expect(preencher(win, saida).textContent).toContain('Saldo insuficiente');
    expect(lerMovimentacoes(win)).toHaveLength(1);

    expect(preencher(win, { ...saida, quantidade: '5' }).textContent).toBe('Movimentação registrada com sucesso!');
    expect(lerMovimentacoes(win)).toHaveLength(2);
  });

  test('filtra a lista por tipo de movimentação', () => {
    const agora = new Date().toISOString();
    const win = abrirTela('movimentacao.html', {
      movimentacoes: [
        { ...ENTRADA, quantidade: 20, id: '1', dataRegistro: agora },
        { ...ENTRADA, tipo: 'saida', quantidade: 5, id: '2', dataRegistro: agora }
      ]
    });
    const filtro = win.document.getElementById('filtro-tipo');
    filtro.value = 'saida';
    filtro.dispatchEvent(new win.Event('change'));
    const linhas = win.document.querySelectorAll('#corpo-lista tr');
    expect(linhas).toHaveLength(1);
    expect(linhas[0].textContent).toContain('Saída');
  });
});

describe('Tela de estoque (estoque.html)', () => {
  const agora = new Date().toISOString();
  const MOVS = [
    { tipo: 'entrada', nome: 'Arroz 5kg', lote: 'ARR-001', quantidade: 20, validade: dataRelativa(120), id: '1', dataRegistro: agora },
    { tipo: 'saida', nome: 'Arroz 5kg', lote: 'ARR-001', quantidade: 5, validade: dataRelativa(120), id: '2', dataRegistro: agora },
    { tipo: 'entrada', nome: 'Leite integral', lote: 'LEI-001', quantidade: 12, validade: dataRelativa(10), id: '3', dataRegistro: agora },
    { tipo: 'entrada', nome: 'Feijão 1kg', lote: 'FEI-001', quantidade: 8, validade: dataRelativa(-3), id: '4', dataRegistro: agora }
  ];

  test('calcula saldos, resume status e destaca alertas com texto e símbolo', () => {
    const doc = abrirTela('estoque.html', { movimentacoes: MOVS }).document;

    expect(doc.getElementById('total-ok').textContent).toBe('1');
    expect(doc.getElementById('total-alerta').textContent).toBe('1');
    expect(doc.getElementById('total-vencido').textContent).toBe('1');

    const alertas = doc.getElementById('alertas').textContent;
    expect(alertas).toContain('✖ 1 lote(s) vencido(s)');
    expect(alertas).toContain('Feijão 1kg');
    expect(alertas).toContain('⚠ 1 lote(s) vencem em até 30 dias');

    const linhaArroz = Array.from(doc.querySelectorAll('#corpo-estoque tr')).find(tr => tr.textContent.includes('ARR-001'));
    expect(linhaArroz.textContent).toContain('15');
    expect(linhaArroz.textContent).toContain('✔ OK');
  });

  test('filtra itens pela busca por nome e mostra mensagem quando não encontra', () => {
    const win = abrirTela('estoque.html', { movimentacoes: MOVS });
    const busca = win.document.getElementById('busca');

    busca.value = 'leite';
    busca.dispatchEvent(new win.Event('input'));
    expect(win.document.querySelectorAll('#corpo-estoque tr')).toHaveLength(1);

    busca.value = 'macarrão';
    busca.dispatchEvent(new win.Event('input'));
    expect(win.document.getElementById('corpo-estoque').textContent).toContain('Nenhum item encontrado.');
  });

  test('exibe orientação quando o estoque está vazio', () => {
    const doc = abrirTela('estoque.html').document;
    expect(doc.getElementById('corpo-estoque').textContent).toContain('Estoque vazio');
    expect(doc.getElementById('alertas').textContent).toBe('');
  });
});
