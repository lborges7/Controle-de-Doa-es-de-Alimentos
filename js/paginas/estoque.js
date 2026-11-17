/**
 * Tela de estoque: resumo por status, alertas de validade e busca por nome.
 * Depende de js/validacao.js e js/app.js (carregados antes na página).
 */
(function () {
  const ROTULO = { ok: '✔ OK', alerta: '⚠ Próximo do vencimento', vencido: '✖ Vencido' };
  const estoque = calcularEstoque(obterMovimentacoes()).map(function (i) {
    return Object.assign({}, i, { status: classificarValidade(i.validade) });
  });

  // Resumo
  ['ok', 'alerta', 'vencido'].forEach(function (s) {
    document.getElementById('total-' + s).textContent = estoque.filter(function (i) { return i.status === s; }).length;
  });

  // Alertas destacados no topo
  const vencidos = estoque.filter(function (i) { return i.status === 'vencido'; });
  const proximos = estoque.filter(function (i) { return i.status === 'alerta'; });
  let html = '';
  if (vencidos.length) html += '<div class="alerta-box vencido" role="alert"><strong>✖ ' + vencidos.length + ' lote(s) vencido(s):</strong> ' +
    vencidos.map(function (i) { return escaparHtml(i.nome) + ' (lote ' + escaparHtml(i.lote) + ')'; }).join(', ') + '. Retire-os da distribuição.</div>';
  if (proximos.length) html += '<div class="alerta-box alerta" role="alert"><strong>⚠ ' + proximos.length + ' lote(s) vencem em até 30 dias:</strong> ' +
    proximos.map(function (i) { return escaparHtml(i.nome) + ' (' + formatarData(i.validade) + ')'; }).join(', ') + '. Priorize a distribuição.</div>';
  document.getElementById('alertas').innerHTML = html;

  function renderTabela() {
    const termo = document.getElementById('busca').value.trim().toLowerCase();
    const itens = estoque.filter(function (i) { return i.nome.toLowerCase().indexOf(termo) !== -1; });
    const corpo = document.getElementById('corpo-estoque');
    if (!itens.length) {
      corpo.innerHTML = '<tr><td colspan="5" class="vazio">' + (estoque.length ? 'Nenhum item encontrado.' : 'Estoque vazio. Registre uma entrada.') + '</td></tr>';
      return;
    }
    corpo.innerHTML = itens.map(function (i) {
      return '<tr class="' + i.status + '"><td>' + escaparHtml(i.nome) + '</td><td>' + escaparHtml(i.lote) + '</td>' +
        '<td>' + i.quantidade + '</td><td>' + formatarData(i.validade) + '</td>' +
        '<td><span class="status ' + i.status + '">' + ROTULO[i.status] + '</span></td></tr>';
    }).join('');
  }

  document.getElementById('busca').addEventListener('input', renderTabela);
  renderTabela();
})();
