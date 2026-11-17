# 🌾 Controle de Doações de Alimentos

MVP desenvolvido para a disciplina de **Projeto de Software**: um sistema web simples para que coordenadores de um banco de alimentos comunitário registrem doações recebidas e distribuições realizadas, acompanhem o estoque e sejam alertados sobre alimentos vencidos ou próximos do vencimento.

![CI](https://github.com/lborges7/Controle-de-Doa-es-de-Alimentos/actions/workflows/ci.yml/badge.svg)

## 📌 Problema

Bancos de alimentos comunitários costumam controlar doações em papel ou planilhas soltas. Isso gera:
- doações mal rastreadas (não se sabe o que entrou, o que saiu e quem registrou);
- estoque desatualizado;
- perda de alimentos por vencimento sem que ninguém perceba a tempo.

## 💡 Solução (MVP)

| Funcionalidade | Descrição |
|---|---|
| Login simulado | Acesso com sessão salva no navegador (`admin` / `1234`). |
| Registro de entrada/saída | Tipo, alimento, lote, quantidade, validade e responsável. |
| Validações | Campos obrigatórios, quantidade inteira positiva, validade futura para entradas e bloqueio de saída maior que o saldo. |
| Histórico | Últimas 10 movimentações, com filtro por tipo. |
| Controle de estoque | Saldo calculado automaticamente por alimento + lote. |
| Alertas de validade | 🔴 vencido · 🟡 vence em até 30 dias · 🟢 OK, com alertas destacados no topo e busca por nome. |

## 🛠️ Tecnologias

- HTML5, CSS3 e JavaScript puro (sem frameworks e sem backend)
- `localStorage` do navegador para persistência
- Jest + jsdom para testes automatizados
- GitHub Actions para integração contínua

## ▶️ Como usar

1. Clone o repositório: `git clone https://github.com/lborges7/Controle-de-Doa-es-de-Alimentos.git`
2. Abra o arquivo `index.html` no navegador (não precisa de servidor).
3. Entre com usuário **admin** e senha **1234**.
4. Registre entradas/saídas em **Registrar movimentação** e acompanhe em **Consultar estoque**.

> Os dados ficam salvos apenas no navegador utilizado.

## 🧪 Testes

Requer Node.js 18+.

```bash
npm install
npm test               # executa os testes
npm run test:coverage  # executa com relatório de cobertura
```

- `tests/validacao.test.js` — testes unitários das validações.
- `tests/app.test.js` — testes de integração (cálculo de estoque, classificação de validade, persistência e sessão).

O pipeline `.github/workflows/ci.yml` roda os testes a cada push e pull request.

## 📁 Estrutura de pastas

```
├── index.html            # Login e menu
├── movimentacao.html     # Registro de entradas e saídas
├── estoque.html          # Estoque, busca e alertas de validade
├── css/style.css         # Estilos globais e indicadores de validade
├── js/app.js             # Lógica de negócio (localStorage, estoque, validade, sessão)
├── js/validacao.js       # Funções puras de validação
├── tests/                # Testes Jest
├── docs/prototipo/       # Protótipo estático e screenshots
├── .github/workflows/    # Pipeline de CI
└── package.json
```

## 🚧 Status

**MVP em desenvolvimento.** Próximos passos: backend com banco de dados, múltiplos usuários com perfis, relatórios e cadastro de catálogo de alimentos.
