/**
 * Tela de movimentação: validação do formulário, registro de entradas/saídas e listagem com filtro.
 * Depende de js/validacao.js e js/app.js (carregados antes na página).
 */
(function () {
  const form = document.getElementById('form-mov');
  const campos = form.elements; // acesso padrão DOM aos campos do formulário
  const msg = document.getElementById('msg');
  const filtro = document.getElementById('filtro-tipo');
  const CAMPOS = ['tipo', 'nome', 'lote', 'quantidade', 'validade', 'responsavel'];
  const ROTULOS = { tipo: 'Tipo', nome: 'Nome do alimento', lote: 'Lote', quantidade: 'Quantidade', validade: 'Validade', responsavel: 'Responsável' };

  function mostrar(texto, tipo) { msg.className = 'mensagem ' + tipo; msg.textContent = texto; }

  function renderLista() {
    let lista = obterMovimentacoes().slice().reverse();
    if (filtro.value) lista = lista.filter(function (m) { return m.tipo === filtro.value; });
    lista = lista.slice(0, 10);
    const corpo = document.getElementById('corpo-lista');
    if (!lista.length) { corpo.innerHTML = '<tr><td colspan="7" class="vazio">Nenhuma movimentação registrada.</td></tr>'; return; }
    corpo.innerHTML = lista.map(function (m) {
      return '<tr><td>' + new Date(m.dataRegistro).toLocaleString('pt-BR') + '</td>' +
        '<td><span class="tag ' + m.tipo + '">' + (m.tipo === 'entrada' ? 'Entrada' : 'Saída') + '</span></td>' +
        '<td>' + escaparHtml(m.nome) + '</td><td>' + escaparHtml(m.lote) + '</td><td>' + m.quantidade + '</td>' +
        '<td>' + formatarData(m.validade) + '</td><td>' + escaparHtml(m.responsavel) + '</td></tr>';
    }).join('');
    // Sugestões de alimentos já cadastrados
    const nomes = Array.from(new Set(obterMovimentacoes().map(function (m) { return m.nome; })));
    document.getElementById('lista-alimentos').innerHTML = nomes.map(function (n) { return '<option value="' + escaparHtml(n) + '">'; }).join('');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const dados = {};
    CAMPOS.forEach(function (c) { dados[c] = campos[c].value.trim(); campos[c].classList.remove('invalido'); });

    const req = validarCamposObrigatorios(dados, CAMPOS);
    if (!req.valido) {
      req.faltando.forEach(function (c) { campos[c].classList.add('invalido'); });
      campos[req.faltando[0]].focus();
      return mostrar('Preencha os campos obrigatórios: ' + req.faltando.map(function (c) { return ROTULOS[c]; }).join(', ') + '.', 'erro');
    }
    if (!validarQuantidade(dados.quantidade)) {
      campos.quantidade.classList.add('invalido');
      return mostrar('A quantidade deve ser um número inteiro maior que zero.', 'erro');
    }
    if (dados.tipo === 'entrada' && !validarValidade(dados.validade)) {
      campos.validade.classList.add('invalido');
      return mostrar('Para entradas, a validade deve ser uma data futura.', 'erro');
    }
    if (dados.tipo === 'saida') {
      const saldo = saldoDisponivel(obterMovimentacoes(), dados.nome, dados.lote);
      if (Number(dados.quantidade) > saldo) {
        campos.quantidade.classList.add('invalido');
        return mostrar('Saldo insuficiente para este alimento/lote. Disponível: ' + saldo + '.', 'erro');
      }
    }

    salvarMovimentacao(dados);
    mostrar('Movimentação registrada com sucesso!', 'sucesso');
    const responsavel = dados.responsavel;
    form.reset();
    campos.responsavel.value = responsavel;
    renderLista();
  });

  filtro.addEventListener('change', renderLista);
  renderLista();
})();
