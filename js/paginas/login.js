/**
 * Tela de acesso: autenticação e exibição do menu principal.
 * Depende de js/validacao.js e js/app.js (carregados antes na página).
 */
(function () {
  const secLogin = document.getElementById('secao-login');
  const secMenu = document.getElementById('secao-menu');
  const msg = document.getElementById('msg-login');

  function render() {
    const sessao = obterSessao();
    secLogin.hidden = !!sessao;
    secMenu.hidden = !sessao;
    if (sessao) document.getElementById('nome-usuario').textContent = sessao.usuario;
  }

  document.getElementById('form-login').addEventListener('submit', function (e) {
    e.preventDefault();
    const dados = { usuario: this.elements.usuario.value.trim(), senha: this.elements.senha.value };
    const req = validarCamposObrigatorios(dados, ['usuario', 'senha']);
    msg.className = 'mensagem erro';
    if (!req.valido) { msg.textContent = 'Preencha usuário e senha.'; return; }
    if (!autenticar(dados.usuario, dados.senha)) { msg.textContent = 'Usuário ou senha inválidos.'; return; }
    msg.textContent = '';
    this.reset();
    render();
  });

  document.getElementById('btn-sair').addEventListener('click', function () { sair(); render(); });
  render();
})();
