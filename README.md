# Mercadinho — Sistema de Gestão

> Projeto desenvolvido pela equipe IBMEC Jr como solução para o desafio proposto: digitalizar e organizar completamente a gestão do **Geraldo**, dono de um mercadinho que controlava tudo à mão — vendas, estoque, fornecedores, fiados — gerando desorganização, erros e perda de informação.

---

## Como rodar

Só isso:

```bash
python INICIAR.py
```

O script cuida de tudo sozinho: instala as dependências Python e Node, sobe o backend, o frontend e o Metabase, e abre o sistema direto no navegador.

**Acesso:** `http://localhost:5173`

| Campo | Valor |
|-------|-------|
| Usuário | `Usuario` |
| Senha | `12345` |

> **Requisitos mínimos:** Python 3.10+, Node.js 18+ e (opcional) Java 11+ para o Metabase.

---

## O problema do Geraldo

O Geraldo anotava tudo à mão: vendas em cadernos, fiados em folhas soltas, estoque de cabeça. Isso gerava:

- Perda de histórico de vendas e clientes
- Impossibilidade de saber o lucro real do mês
- Controle de estoque impreciso, com rupturas e excessos
- Fiados sem rastreamento, gerando inadimplência invisível
- Compras de fornecedores desorganizadas e sem acompanhamento

A solução foi um sistema web completo, rodando localmente, sem necessidade de internet nem de servidor externo.

---

## O que o sistema faz

### Vendas
Registro completo de vendas com múltiplos itens por operação. Suporta todas as formas de pagamento praticadas no mercadinho: dinheiro, PIX, cartão de débito, cartão de crédito e fiado. O estoque é decrementado automaticamente a cada venda confirmada.

### Fiado
Clientes que compram no fiado têm seu saldo registrado e atualizado em tempo real. É possível registrar pagamentos parciais ou totais da dívida direto pelo sistema.

### Estoque
Cada produto tem um registro de estoque com quantidade atual e quantidade mínima configurável. O sistema emite alertas automáticos quando algum produto cai abaixo do mínimo definido.

### Compras de Fornecedores
Pedidos de compra são criados com status "pendente" e, ao marcar como entregue, o estoque é incrementado automaticamente. Cada compra gera uma despesa vinculada no financeiro.

### Clientes
Cadastro completo com histórico de compras, total gasto, data da última compra e controle de fiado. É possível filtrar clientes que estão em débito.

### Fornecedores
Cadastro com CNPJ, prazo de entrega, cidade/UF e avaliação. Cada fornecedor está vinculado aos produtos que ele fornece.

### Funcionários
Controle de equipe com cargo, turno, salário, horas semanais e status ativo/inativo. Todo registro de venda e compra é vinculado ao funcionário responsável.

### Despesas
Registro de despesas operacionais por categoria, com filtro por data e categoria. Despesas de compras são lançadas automaticamente — sem necessidade de duplicar entrada.

### Dashboard e Relatórios
Visão financeira do mês corrente: receita total de vendas, total de despesas, total de compras e lucro líquido calculado automaticamente. O Metabase (opcional) oferece dashboards analíticos avançados com gráficos e filtros interativos.

---

## Arquitetura

```
INICIAR.py              ← ponto de entrada único
sistema_estoque/
  manage.py             ← backend Django
  mercadinho/
    models.py           ← entidades: Produto, Venda, Cliente, Estoque, Fornecedor...
    views.py            ← API REST com lógica de negócio transacional
    serializers.py      ← validação e serialização dos dados
  front-end/
    src/
      pages/            ← uma página por entidade (listagem + cadastro + edição)
      components/       ← componentes reutilizáveis (formulários, tabelas, toast...)
      services/         ← chamadas à API Django
      utils/            ← máscaras, formatadores, cache de requisições
  metabase/             ← metabase.jar + banco de configuração (opcional)
```

**Stack técnica:**
- **Backend:** Django 6 + Django REST Framework — API REST com transações atômicas
- **Frontend:** React + Vite — SPA com roteamento client-side
- **Banco de dados:** SQLite — sem necessidade de configurar banco externo
- **Analytics:** Metabase — conectado automaticamente ao banco Django ao iniciar

---

## Decisões técnicas relevantes

**Transações atômicas em vendas e compras** — cada operação de venda ou entrega de compra usa `transaction.atomic()`, garantindo que o estoque nunca fique inconsistente em caso de erro no meio da operação.

**Despesas vinculadas a compras** — ao registrar ou editar uma compra de fornecedor, uma despesa correspondente é criada/atualizada automaticamente na categoria "Compra de mercadorias", evitando lançamento duplo.

**Alerta de estoque mínimo** — endpoint dedicado `/api/estoque/alerta-minimo/` retorna todos os produtos abaixo do nível configurado, permitindo ao Geraldo agir antes de acabar o produto.

**Fiado com controle de saldo** — o modelo `Cliente` mantém `saldo_fiado` e `possui_fiado` atualizados a cada venda no fiado e a cada pagamento, com validação para impedir pagamento acima do saldo.

**Auto-configuração do Metabase** — ao iniciar, o `INICIAR.py` aguarda o Metabase subir, autentica via API e corrige automaticamente o caminho do banco SQLite, resolvendo o problema de caminhos absolutos que mudam entre máquinas.

**Aliases de forma de pagamento** — o importador de planilhas legadas aceita variações como "Espécie", "Credito", "PIX" (maiúsculo/minúsculo) e normaliza para os valores padrão do sistema, permitindo migrar os dados históricos do Geraldo sem retrabalho manual.
