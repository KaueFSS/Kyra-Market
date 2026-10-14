/**
 * Backend da demonstração (GitHub Pages).
 *
 * Responde às mesmas rotas da API Django, com as mesmas regras de negócio
 * (baixa de estoque, fiado, total das compras, despesa ligada à compra, lucro
 * do mês), usando os dados de src/demo/seed.json. O que a pessoa altera fica
 * guardado só no navegador dela (localStorage) e pode ser restaurado.
 */
import { AxiosError } from "axios";

const CHAVE = "kyra-market-demo-v1";
const POR_PAGINA = 100;

/* ───────── Estrutura das tabelas ───────── */

const RECURSOS = {
  "produtos":     { tabela: "produtos",     pk: "id_produto" },
  "estoques":     { tabela: "estoques",     pk: "id_estoque" },
  "fornecedores": { tabela: "fornecedores", pk: "id_fornecedor" },
  "funcionarios": { tabela: "funcionarios", pk: "id_funcionario" },
  "clientes":     { tabela: "clientes",     pk: "id_cliente" },
  "vendas":       { tabela: "vendas",       pk: "id_venda" },
  "itens-venda":  { tabela: "itens_venda",  pk: "id_item_venda" },
  "compras":      { tabela: "compras",      pk: "id_compra" },
  "itens-compra": { tabela: "itens_compra", pk: "id_item_compra" },
  "despesas":     { tabela: "despesas",     pk: "id_despesa" },
};

const DECIMAIS = {
  produtos: ["preco_custo", "preco"],
  fornecedores: ["avaliacao"],
  funcionarios: ["salario", "horas_semanais"],
  clientes: ["saldo_fiado", "total_valor"],
  itens_venda: ["preco_unitario", "desconto_aplicado", "subtotal"],
  compras: ["valor_total"],
  itens_compra: ["valor_unitario"],
  despesas: ["valor"],
};
const INTEIROS = {
  estoques: ["quantidade_atual", "quantidade_minima"],
  itens_venda: ["quantidade_vendida"],
  itens_compra: ["quantidade"],
};
const DATAS = {
  estoques: ["dt_ultima_saida", "dt_ultima_entrada"],
  clientes: ["data_cadastro", "ultima_compra"],
  vendas: ["data_venda"],
  compras: ["data_compra", "data_entrega"],
  despesas: ["data"],
};
// Campos que o serializer da API não deixa alterar
const SOMENTE_LEITURA = {
  clientes: ["saldo_fiado", "possui_fiado", "total_valor", "ultima_compra"],
  compras: ["valor_total", "itens", "produtos"],
  vendas: ["id_venda", "produtos", "itens", "total"],
  itens_venda: ["subtotal"],
};
const ORDEM = {
  produtos: [["nome", 1]],
  estoques: [["id_estoque", 1]],
  fornecedores: [["razao_social", 1]],
  funcionarios: [["nome", 1]],
  clientes: [["nome", 1]],
  vendas: [["data_venda", -1], ["hora", -1]],
  itens_venda: [["venda", 1], ["produto", 1]],
  compras: [["data_compra", -1]],
  itens_compra: [["compra", 1], ["produto", 1]],
  despesas: [["data", -1]],
};

/* ───────── Estado ───────── */

let db = null;          // { tabelas: { nome: [linhas] } }
let carregando = null;
let indices = null;     // mapas por chave, refeitos depois de cada alteração
let timerSalvar = null;

function expandir(compacto) {
  const tabelas = {};
  for (const [nome, { cols, rows }] of Object.entries(compacto.tabelas)) {
    tabelas[nome] = rows.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]])));
  }
  return { tabelas, colunas: Object.fromEntries(Object.entries(compacto.tabelas).map(([n, t]) => [n, t.cols])) };
}

function compactar() {
  const tabelas = {};
  for (const [nome, linhas] of Object.entries(db.tabelas)) {
    const cols = db.colunas[nome];
    tabelas[nome] = { cols, rows: linhas.map((l) => cols.map((c) => l[c] ?? null)) };
  }
  return { tabelas };
}

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function somarDias(iso, dias) {
  if (!iso) return iso;
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + dias));
  return dt.toISOString().slice(0, 10);
}

function diasEntre(de, ate) {
  const ms = Date.parse(ate + "T00:00:00Z") - Date.parse(de + "T00:00:00Z");
  return Math.round(ms / 86400000);
}

async function carregar() {
  if (db) return db;
  if (carregando) return carregando;
  carregando = (async () => {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) {
        db = expandir(JSON.parse(salvo));
        return db;
      }
    } catch { /* dados salvos inválidos: volta ao início */ }
    const seed = (await import("./seed.json")).default;
    db = expandir(seed);
    // O histórico termina na "âncora"; as datas andam para que ela vire hoje.
    const deslocamento = diasEntre(seed.ancora, hojeISO());
    for (const [tabela, campos] of Object.entries(DATAS)) {
      for (const linha of db.tabelas[tabela]) {
        for (const c of campos) linha[c] = somarDias(linha[c], deslocamento);
      }
    }
    salvar(true);
    return db;
  })();
  return carregando;
}

function salvar(agora = false) {
  indices = null;
  clearTimeout(timerSalvar);
  const gravar = () => {
    try { localStorage.setItem(CHAVE, JSON.stringify(compactar())); } catch { /* sem espaço: segue em memória */ }
  };
  if (agora) gravar();
  else timerSalvar = setTimeout(gravar, 250);
}

/** Apaga as alterações feitas na demonstração. */
export function restaurarDemo() {
  try { localStorage.removeItem(CHAVE); } catch { /* ignora */ }
}

/* ───────── Índices e consultas ───────── */

function idx() {
  if (indices) return indices;
  const porPk = {};
  for (const [, { tabela, pk }] of Object.entries(RECURSOS)) {
    porPk[tabela] = new Map(db.tabelas[tabela].map((l) => [String(l[pk]), l]));
  }
  const agrupar = (tabela, campo) => {
    const m = new Map();
    for (const l of db.tabelas[tabela]) {
      const k = String(l[campo]);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(l);
    }
    return m;
  };
  indices = {
    porPk,
    itensPorVenda: agrupar("itens_venda", "venda"),
    itensPorCompra: agrupar("itens_compra", "compra"),
    estoquePorProduto: new Map(db.tabelas.estoques.map((e) => [String(e.produto), e])),
  };
  return indices;
}

const buscar = (tabela, id) => (id == null ? null : idx().porPk[tabela].get(String(id)) || null);
const itensDaVenda = (id) => idx().itensPorVenda.get(String(id)) || [];
const itensDaCompra = (id) => idx().itensPorCompra.get(String(id)) || [];

const num = (v) => Number(v || 0);
const dec = (v) => num(v).toFixed(2);
const cents = (v) => Math.round(num(v) * 100);

function totalVenda(id) {
  return itensDaVenda(id).reduce((s, i) => s + cents(i.subtotal), 0) / 100;
}

function totalCompra(id) {
  return itensDaCompra(id).reduce((s, i) => s + i.quantidade * cents(i.valor_unitario), 0) / 100;
}

/* ───────── Saída no formato dos serializers ───────── */

function saida(tabela, l) {
  switch (tabela) {
    case "produtos":
      return { ...l, fornecedor_nome: buscar("fornecedores", l.fornecedor)?.nome_fantasia ?? null };
    case "estoques":
      return { ...l, produto_nome: buscar("produtos", l.produto)?.nome ?? "" };
    case "itens_venda":
    case "itens_compra":
      return { ...l, produto_nome: buscar("produtos", l.produto)?.nome ?? "" };
    case "despesas":
      return { ...l, funcionario_nome: buscar("funcionarios", l.funcionario)?.nome ?? "" };
    case "compras": {
      const itens = itensDaCompra(l.id_compra);
      return {
        ...l,
        fornecedor_nome: buscar("fornecedores", l.fornecedor)?.razao_social ?? "",
        funcionario_nome: buscar("funcionarios", l.funcionario)?.nome ?? "",
        itens: itens.map((i) => saida("itens_compra", i)),
        produtos: itens.map((i) => i.produto),
      };
    }
    case "vendas": {
      const itens = itensDaVenda(l.id_venda);
      return {
        ...l,
        funcionario_nome: buscar("funcionarios", l.funcionario)?.nome ?? "",
        cliente_nome: buscar("clientes", l.cliente)?.nome ?? null,
        itens_nomes: itens.map((i) => buscar("produtos", i.produto)?.nome ?? ""),
        total: totalVenda(l.id_venda),
        itens: itens.map((i) => saida("itens_venda", i)),
        produtos: itens.map((i) => i.produto),
      };
    }
    default:
      return { ...l };
  }
}

/* ───────── Busca (?search=) como o SearchFilter do DRF ───────── */

function camposBusca(tabela, l) {
  const forn = (id) => buscar("fornecedores", id);
  const func = (id) => buscar("funcionarios", id);
  switch (tabela) {
    case "produtos": return [l.id_produto, l.nome, l.categoria, l.subcategoria, l.marca, l.codigo_barras, l.unidade,
      forn(l.fornecedor)?.razao_social, forn(l.fornecedor)?.nome_fantasia];
    case "estoques": return [l.id_estoque, buscar("produtos", l.produto)?.nome, l.produto];
    case "fornecedores": return [l.id_fornecedor, l.razao_social, l.nome_fantasia, l.cnpj, l.cidade, l.uf, l.email, l.telefone];
    case "funcionarios": return [l.id_funcionario, l.nome, l.cargo, l.turno];
    case "compras": return [l.id_compra, l.nome, l.nota_fiscal, l.status, forn(l.fornecedor)?.razao_social,
      forn(l.fornecedor)?.nome_fantasia, func(l.funcionario)?.nome];
    case "despesas": return [l.id_despesa, l.categoria, l.descricao, func(l.funcionario)?.nome, l.compra];
    case "vendas": return [l.id_venda, l.nome, l.forma_pagamento, buscar("clientes", l.cliente)?.nome, func(l.funcionario)?.nome];
    case "clientes": return [l.id_cliente, l.nome, l.telefone, l.bairro];
    default: return null;
  }
}

function filtrarBusca(tabela, linhas, termo) {
  const termos = String(termo || "").toLowerCase().split(/[\s,]+/).filter(Boolean);
  if (!termos.length) return linhas;
  return linhas.filter((l) => {
    const campos = camposBusca(tabela, l);
    if (!campos) return true;
    const texto = campos.filter((c) => c != null).map((c) => String(c).toLowerCase());
    return termos.every((t) => texto.some((c) => c.includes(t)));
  });
}

function ordenar(tabela, linhas) {
  const regras = ORDEM[tabela] || [];
  return [...linhas].sort((a, b) => {
    for (const [campo, dir] of regras) {
      const va = a[campo] ?? "";
      const vb = b[campo] ?? "";
      if (va < vb) return -dir;
      if (va > vb) return dir;
    }
    return 0;
  });
}

/* ───────── Erros e normalização ───────── */

class ErroNegocio extends Error {
  constructor(mensagem, status = 400, dados = null) {
    super(mensagem);
    this.status = status;
    this.dados = dados || { erro: mensagem };
  }
}

const naoEncontrado = () => new ErroNegocio("Não encontrado.", 404, { detail: "Não encontrado." });

function normalizar(tabela, dados) {
  const l = { ...dados };
  for (const c of DECIMAIS[tabela] || []) if (c in l && l[c] !== null && l[c] !== "") l[c] = dec(l[c]);
  for (const c of INTEIROS[tabela] || []) if (c in l && l[c] !== null && l[c] !== "") l[c] = parseInt(l[c], 10);
  if (tabela === "vendas" && l.hora && /^\d{2}:\d{2}$/.test(l.hora)) l.hora += ":00";
  for (const c of DATAS[tabela] || []) if (l[c] === "") l[c] = null;
  for (const fk of ["cliente", "fornecedor", "compra"]) if (l[fk] === "") l[fk] = null;
  return l;
}

function novaLinha(tabela, dados) {
  const base = Object.fromEntries(db.colunas[tabela].map((c) => [c, null]));
  return { ...base, ...normalizar(tabela, dados) };
}

function proximoId(tabela, pk) {
  return db.tabelas[tabela].reduce((m, l) => Math.max(m, Number(l[pk]) || 0), 0) + 1;
}

const gerarId = (prefixo) =>
  prefixo + (crypto.randomUUID ? crypto.randomUUID() : String(Math.random())).replace(/[^0-9a-f]/gi, "").slice(0, 7).toUpperCase();

/* ───────── Regras de negócio (espelham mercadinho/services.py) ───────── */

function ajustarEstoque(produtoId, delta, data) {
  if (!delta) return;
  const produto = buscar("produtos", produtoId);
  const estoque = idx().estoquePorProduto.get(String(produtoId));
  if (!estoque) throw new ErroNegocio(`Produto '${produto?.nome ?? produtoId}' não tem estoque cadastrado.`);
  const nova = estoque.quantidade_atual + delta;
  if (nova < 0) {
    throw new ErroNegocio(
      `Estoque insuficiente para '${produto?.nome ?? produtoId}' (disponível: ${estoque.quantidade_atual}, ajuste: ${delta}).`,
    );
  }
  estoque.quantidade_atual = nova;
  if (delta > 0) estoque.dt_ultima_entrada = data || hojeISO();
  else estoque.dt_ultima_saida = data || hojeISO();
}

function subtotalItem(qtd, preco, desconto) {
  const sub = (Number(qtd) * cents(preco) - cents(desconto)) / 100;
  if (sub < 0) throw new ErroNegocio("Desconto maior que o valor do item: subtotal negativo.");
  return sub;
}

function movimentoFiado(clienteId, valor, limitar = false) {
  if (!valor) return;
  const c = buscar("clientes", clienteId);
  const anterior = cents(c.saldo_fiado);
  let atual = anterior + Math.round(valor * 100);
  if (atual < 0) {
    if (!limitar) throw new ErroNegocio(`Movimento de fiado deixaria saldo negativo para '${c.nome}'.`);
    atual = 0;
  }
  c.saldo_fiado = dec(atual / 100);
  c.possui_fiado = atual > 0;
}

function validarFiado(forma, cliente) {
  if (forma === "fiado" && !cliente) throw new ErroNegocio("Forma de pagamento 'fiado' requer um cliente.");
}

function recalcularCliente(clienteId) {
  if (!clienteId) return;
  const c = buscar("clientes", clienteId);
  if (!c) return;
  let total = 0;
  let ultima = null;
  for (const v of db.tabelas.vendas) {
    if (v.cliente !== clienteId) continue;
    total += Math.round(totalVenda(v.id_venda) * 100);
    if (!ultima || v.data_venda > ultima) ultima = v.data_venda;
  }
  c.total_valor = dec(total / 100);
  c.ultima_compra = ultima;
  c.possui_fiado = cents(c.saldo_fiado) > 0;
}

function ajustarFiadoAlteracao(venda, clienteAnt, formaAnt, totalAnt) {
  const totalAtual = totalVenda(venda.id_venda);
  validarFiado(venda.forma_pagamento, venda.cliente);
  const tinha = formaAnt === "fiado" && clienteAnt;
  const tem = venda.forma_pagamento === "fiado" && venda.cliente;
  if (tinha && tem && clienteAnt === venda.cliente) {
    movimentoFiado(venda.cliente, totalAtual - totalAnt, true);
    return;
  }
  if (tinha) movimentoFiado(clienteAnt, -totalAnt, true);
  if (tem) movimentoFiado(venda.cliente, totalAtual);
}

function sincronizarDespesaCompra(compra) {
  let despesa = db.tabelas.despesas.find((d) => d.compra === compra.id_compra && d.categoria === "Compra de mercadorias");
  if (!despesa) {
    despesa = novaLinha("despesas", { id_despesa: gerarId("DSP"), compra: compra.id_compra, categoria: "Compra de mercadorias" });
    db.tabelas.despesas.push(despesa);
  }
  const fornecedor = buscar("fornecedores", compra.fornecedor);
  despesa.funcionario = compra.funcionario;
  despesa.data = compra.data_compra;
  despesa.descricao = `Compra ${compra.id_compra} - ${fornecedor?.razao_social ?? ""}`.slice(0, 100);
  despesa.valor = compra.valor_total;
  despesa.recorrente = false;
}

function atualizarTotalCompra(compra) {
  indices = null;
  compra.valor_total = dec(totalCompra(compra.id_compra));
  sincronizarDespesaCompra(compra);
}

function verificarProtecao(tabela, id) {
  const refs = [];
  const conta = (lista, campo, nome) => {
    const n = lista.filter((l) => String(l[campo]) === String(id)).length;
    if (n) refs.push([n, nome]);
  };
  const t = db.tabelas;
  if (tabela === "produtos") { conta(t.itens_venda, "produto", "item de venda"); conta(t.itens_compra, "produto", "item de compra"); }
  if (tabela === "fornecedores") conta(t.compras, "fornecedor", "compra de fornecedor");
  if (tabela === "funcionarios") { conta(t.vendas, "funcionario", "venda"); conta(t.compras, "funcionario", "compra de fornecedor"); conta(t.despesas, "funcionario", "despesa"); }
  if (tabela === "clientes") conta(t.vendas, "cliente", "venda");
  if (refs.length) {
    const total = refs.reduce((s, [n]) => s + n, 0);
    throw new ErroNegocio(
      `Não é possível excluir este registro porque ele está vinculado a ${total} registro(s): ${refs.map(([, n]) => n).join(", ")}.`,
    );
  }
}

/* ───────── Rotas ───────── */

function listar(tabela, params) {
  let linhas = db.tabelas[tabela];
  if (tabela === "clientes" && params.get("possui_fiado") != null) {
    const quer = String(params.get("possui_fiado")).toLowerCase() === "true";
    linhas = linhas.filter((c) => !!c.possui_fiado === quer);
  }
  linhas = ordenar(tabela, filtrarBusca(tabela, linhas, params.get("search")));
  const pagina = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const paginas = Math.max(1, Math.ceil(linhas.length / POR_PAGINA));
  if (pagina > paginas) throw new ErroNegocio("Página inválida.", 404, { detail: "Página inválida." });
  const link = (p) => {
    const q = new URLSearchParams(params);
    q.set("page", String(p));
    return `/api/${tabela.replace("_", "-")}/?${q}`;
  };
  return {
    count: linhas.length,
    next: pagina < paginas ? link(pagina + 1) : null,
    previous: pagina > 1 ? link(pagina - 1) : null,
    results: linhas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map((l) => saida(tabela, l)),
  };
}

function criar(recurso, dados) {
  const { tabela, pk } = RECURSOS[recurso];
  const linha = novaLinha(tabela, dados);

  if (tabela === "itens_venda") {
    const venda = buscar("vendas", linha.venda);
    if (!venda) throw new ErroNegocio("Venda não encontrada.");
    linha.id_item_venda = proximoId("itens_venda", "id_item_venda");
    linha.desconto_aplicado = linha.desconto_aplicado ?? "0.00";
    linha.subtotal = dec(subtotalItem(linha.quantidade_vendida, linha.preco_unitario, linha.desconto_aplicado));
    const totalAnt = totalVenda(venda.id_venda);
    ajustarEstoque(linha.produto, -linha.quantidade_vendida, hojeISO());
    db.tabelas.itens_venda.push(linha);
    indices = null;
    ajustarFiadoAlteracao(venda, venda.cliente, venda.forma_pagamento, totalAnt);
    recalcularCliente(venda.cliente);
    return saida(tabela, linha);
  }

  if (tabela === "itens_compra") {
    const compra = buscar("compras", linha.compra);
    if (!compra) throw new ErroNegocio("Compra não encontrada.");
    linha.id_item_compra = proximoId("itens_compra", "id_item_compra");
    if (compra.entregue) ajustarEstoque(linha.produto, linha.quantidade, hojeISO());
    db.tabelas.itens_compra.push(linha);
    atualizarTotalCompra(compra);
    return saida(tabela, linha);
  }

  if (linha[pk] == null || linha[pk] === "") throw new ErroNegocio("Identificador obrigatório.", 400, { [pk]: ["Este campo é obrigatório."] });
  if (buscar(tabela, linha[pk])) {
    throw new ErroNegocio("Já existe.", 400, { [pk]: ["Já existe um registro com este identificador."] });
  }
  if (tabela === "estoques" && idx().estoquePorProduto.has(String(linha.produto))) {
    throw new ErroNegocio("Já existe.", 400, { produto: ["Este produto já tem estoque cadastrado."] });
  }
  if (tabela === "clientes") {
    const saldo = num(linha.saldo_fiado);
    linha.saldo_fiado = dec(saldo > 0 ? saldo : 0);
    linha.possui_fiado = saldo > 0;
    linha.total_valor = "0.00";
    linha.ultima_compra = null;
  }
  for (const c of ["ativo", "recorrente", "entregue"]) if (c in linha && linha[c] == null) linha[c] = false;
  db.tabelas[tabela].push(linha);
  return saida(tabela, linha);
}

function atualizar(recurso, id, dados) {
  const { tabela, pk } = RECURSOS[recurso];
  const atual = buscar(tabela, id);
  if (!atual) throw naoEncontrado();
  const novos = normalizar(tabela, dados);
  delete novos[pk];
  for (const c of SOMENTE_LEITURA[tabela] || []) delete novos[c];
  for (const c of Object.keys(novos)) if (!db.colunas[tabela].includes(c)) delete novos[c];

  if (tabela === "vendas") {
    const clienteAnt = atual.cliente;
    const formaAnt = atual.forma_pagamento;
    const totalAnt = totalVenda(atual.id_venda);
    Object.assign(atual, novos);
    validarFiado(atual.forma_pagamento, atual.cliente);
    ajustarFiadoAlteracao(atual, clienteAnt, formaAnt, totalAnt);
    recalcularCliente(clienteAnt);
    if (atual.cliente !== clienteAnt) recalcularCliente(atual.cliente);
  } else if (tabela === "compras") {
    const entregueAnt = !!atual.entregue;
    Object.assign(atual, novos);
    const itens = itensDaCompra(atual.id_compra);
    if (!entregueAnt && atual.entregue) itens.forEach((i) => ajustarEstoque(i.produto, i.quantidade, atual.data_entrega || hojeISO()));
    else if (entregueAnt && !atual.entregue) itens.forEach((i) => ajustarEstoque(i.produto, -i.quantidade, hojeISO()));
    atualizarTotalCompra(atual);
  } else if (tabela === "itens_venda") {
    const venda = buscar("vendas", atual.venda);
    const totalAnt = totalVenda(venda.id_venda);
    const produtoAnt = atual.produto;
    const qtdAnt = atual.quantidade_vendida;
    Object.assign(atual, novos, { venda: venda.id_venda });
    atual.subtotal = dec(subtotalItem(atual.quantidade_vendida, atual.preco_unitario, atual.desconto_aplicado));
    ajustarEstoque(produtoAnt, qtdAnt, hojeISO());
    ajustarEstoque(atual.produto, -atual.quantidade_vendida, hojeISO());
    indices = null;
    ajustarFiadoAlteracao(venda, venda.cliente, venda.forma_pagamento, totalAnt);
    recalcularCliente(venda.cliente);
  } else if (tabela === "itens_compra") {
    const compra = buscar("compras", atual.compra);
    const produtoAnt = atual.produto;
    const qtdAnt = atual.quantidade;
    Object.assign(atual, novos, { compra: compra.id_compra });
    if (compra.entregue) {
      if (produtoAnt === atual.produto) ajustarEstoque(atual.produto, atual.quantidade - qtdAnt, hojeISO());
      else { ajustarEstoque(produtoAnt, -qtdAnt, hojeISO()); ajustarEstoque(atual.produto, atual.quantidade, hojeISO()); }
    }
    atualizarTotalCompra(compra);
  } else {
    Object.assign(atual, novos);
  }
  indices = null;
  return saida(tabela, atual);
}

function remover(recurso, id) {
  const { tabela, pk } = RECURSOS[recurso];
  const atual = buscar(tabela, id);
  if (!atual) throw naoEncontrado();
  const tirar = (t, pred) => { db.tabelas[t] = db.tabelas[t].filter((l) => !pred(l)); indices = null; };

  if (tabela === "vendas") {
    const total = totalVenda(atual.id_venda);
    if (atual.forma_pagamento === "fiado" && atual.cliente) movimentoFiado(atual.cliente, -total, true);
    itensDaVenda(atual.id_venda).forEach((i) => ajustarEstoque(i.produto, i.quantidade_vendida, hojeISO()));
    tirar("itens_venda", (i) => i.venda === atual.id_venda);
    tirar("vendas", (v) => v.id_venda === atual.id_venda);
    recalcularCliente(atual.cliente);
  } else if (tabela === "compras") {
    if (atual.entregue) itensDaCompra(atual.id_compra).forEach((i) => ajustarEstoque(i.produto, -i.quantidade, hojeISO()));
    tirar("despesas", (d) => d.compra === atual.id_compra && d.categoria === "Compra de mercadorias");
    if (db.tabelas.despesas.some((d) => d.compra === atual.id_compra)) {
      throw new ErroNegocio("Não é possível excluir esta compra porque há despesas vinculadas a ela.");
    }
    tirar("itens_compra", (i) => i.compra === atual.id_compra);
    tirar("compras", (c) => c.id_compra === atual.id_compra);
  } else if (tabela === "itens_venda") {
    const venda = buscar("vendas", atual.venda);
    const totalAnt = totalVenda(venda.id_venda);
    ajustarEstoque(atual.produto, atual.quantidade_vendida, hojeISO());
    tirar("itens_venda", (i) => i.id_item_venda === atual.id_item_venda);
    ajustarFiadoAlteracao(venda, venda.cliente, venda.forma_pagamento, totalAnt);
    recalcularCliente(venda.cliente);
  } else if (tabela === "itens_compra") {
    const compra = buscar("compras", atual.compra);
    if (compra.entregue) ajustarEstoque(atual.produto, -atual.quantidade, hojeISO());
    tirar("itens_compra", (i) => i.id_item_compra === atual.id_item_compra);
    atualizarTotalCompra(compra);
  } else {
    verificarProtecao(tabela, id);
    if (tabela === "produtos") tirar("estoques", (e) => e.produto === atual.id_produto);
    if (tabela === "fornecedores") db.tabelas.produtos.forEach((p) => { if (p.fornecedor === atual.id_fornecedor) p.fornecedor = null; });
    tirar(tabela, (l) => String(l[pk]) === String(id));
  }
  return null;
}

function registrarVenda(d) {
  if (!d.funcionario) throw new ErroNegocio("Funcionário obrigatório.", 400, { funcionario: ["Este campo é obrigatório."] });
  if (d.forma_pagamento === "fiado" && !d.cliente) throw new ErroNegocio("Forma de pagamento 'fiado' requer um cliente.", 400, { non_field_errors: ["Forma de pagamento 'fiado' requer um cliente."] });
  if (!d.itens?.length) throw new ErroNegocio("A venda deve ter ao menos um item.", 400, { non_field_errors: ["A venda deve ter ao menos um item."] });
  if (!buscar("funcionarios", d.funcionario)) throw new ErroNegocio("Funcionário não encontrado.", 404);
  const cliente = d.cliente || null;
  if (cliente && !buscar("clientes", cliente)) throw new ErroNegocio("Cliente não encontrado.", 404);
  validarFiado(d.forma_pagamento, cliente);

  const venda = novaLinha("vendas", {
    id_venda: gerarId("VND"), nome: d.nome || "", data_venda: d.data_venda, hora: d.hora,
    forma_pagamento: d.forma_pagamento, funcionario: d.funcionario, cliente,
  });
  db.tabelas.vendas.push(venda);
  let proximo = proximoId("itens_venda", "id_item_venda");
  for (const item of d.itens) {
    if (!buscar("produtos", item.produto)) throw new ErroNegocio("Produto não encontrado.", 404);
    const qtd = parseInt(item.quantidade_vendida, 10);
    const linha = novaLinha("itens_venda", {
      id_item_venda: proximo++, venda: venda.id_venda, produto: item.produto, quantidade_vendida: qtd,
      preco_unitario: item.preco_unitario, desconto_aplicado: item.desconto_aplicado || 0,
      subtotal: subtotalItem(qtd, item.preco_unitario, item.desconto_aplicado || 0),
    });
    db.tabelas.itens_venda.push(linha);
    ajustarEstoque(item.produto, -qtd, venda.data_venda);
  }
  indices = null;
  if (cliente) {
    if (venda.forma_pagamento === "fiado") movimentoFiado(cliente, totalVenda(venda.id_venda));
    recalcularCliente(cliente);
  }
  return saida("vendas", venda);
}

function registrarCompra(d) {
  if (!d.itens?.length) throw new ErroNegocio("A compra deve ter ao menos um item.", 400, { non_field_errors: ["A compra deve ter ao menos um item."] });
  if (!buscar("fornecedores", d.fornecedor)) throw new ErroNegocio("Fornecedor não encontrado.", 404);
  if (!buscar("funcionarios", d.funcionario)) throw new ErroNegocio("Funcionário não encontrado.", 404);
  const entregue = !!d.entregue;
  const compra = novaLinha("compras", {
    id_compra: gerarId("CMP"), nome: d.nome || "", fornecedor: d.fornecedor, funcionario: d.funcionario,
    data_compra: d.data_compra, status: d.status || "", entregue, data_entrega: d.data_entrega || null,
    nota_fiscal: d.nota_fiscal || "", valor_total: 0,
  });
  db.tabelas.compras.push(compra);
  let proximo = proximoId("itens_compra", "id_item_compra");
  for (const item of d.itens) {
    if (!buscar("produtos", item.produto)) throw new ErroNegocio("Produto não encontrado.", 404);
    const qtd = parseInt(item.quantidade, 10);
    db.tabelas.itens_compra.push(novaLinha("itens_compra", {
      id_item_compra: proximo++, compra: compra.id_compra, produto: item.produto, quantidade: qtd, valor_unitario: item.valor_unitario,
    }));
    if (entregue) ajustarEstoque(item.produto, qtd, d.data_entrega || d.data_compra);
  }
  atualizarTotalCompra(compra);
  return saida("compras", compra);
}

function pagarFiado(d) {
  const c = buscar("clientes", d.cliente);
  if (!c) throw new ErroNegocio("Cliente não encontrado.", 404);
  const valor = num(d.valor);
  if (!(valor >= 0.01)) throw new ErroNegocio("Valor inválido.", 400, { valor: ["Certifique-se de que este valor seja maior ou igual a 0.01."] });
  if (cents(valor) > cents(c.saldo_fiado)) {
    throw new ErroNegocio(`Valor R$${dec(valor)} supera o saldo de R$${c.saldo_fiado}.`);
  }
  movimentoFiado(c.id_cliente, -valor);
  return saida("clientes", c);
}

function lucroMensal() {
  const hoje = hojeISO();
  const mes = hoje.slice(0, 7);
  let receita = 0;
  for (const v of db.tabelas.vendas) if (v.data_venda?.startsWith(mes)) receita += Math.round(totalVenda(v.id_venda) * 100);
  const despesas = db.tabelas.despesas
    .filter((d) => d.compra == null && d.data?.startsWith(mes))
    .reduce((s, d) => s + cents(d.valor), 0);
  const compras = db.tabelas.compras
    .filter((c) => c.entregue && ((c.data_entrega && c.data_entrega.startsWith(mes)) || (!c.data_entrega && c.data_compra?.startsWith(mes))))
    .reduce((s, c) => s + cents(c.valor_total), 0);
  return {
    receita: receita / 100, despesas: despesas / 100, compras: compras / 100,
    lucro: (receita - despesas - compras) / 100, mes: `${hoje.slice(5, 7)}/${hoje.slice(0, 4)}`,
  };
}

/** Números para a tela de análises da demonstração. */
function analises() {
  const hoje = hojeISO();
  const dias = [];
  for (let i = 29; i >= 0; i--) dias.push(somarDias(hoje, -i));
  const porDia = Object.fromEntries(dias.map((d) => [d, 0]));
  const porForma = {};
  const porProduto = {};
  let receita30 = 0;
  let vendas30 = 0;
  for (const v of db.tabelas.vendas) {
    if (!(v.data_venda in porDia)) continue;
    const t = Math.round(totalVenda(v.id_venda) * 100);
    porDia[v.data_venda] += t;
    porForma[v.forma_pagamento] = (porForma[v.forma_pagamento] || 0) + t;
    receita30 += t;
    vendas30 += 1;
    for (const i of itensDaVenda(v.id_venda)) porProduto[i.produto] = (porProduto[i.produto] || 0) + cents(i.subtotal);
  }
  const topProdutos = Object.entries(porProduto)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([id, t]) => ({ produto: buscar("produtos", id)?.nome ?? id, total: t / 100 }));
  return {
    dias: dias.map((d) => ({ data: d, total: porDia[d] / 100 })),
    formas: Object.entries(porForma).sort((a, b) => b[1] - a[1]).map(([forma, t]) => ({ forma, total: t / 100 })),
    topProdutos,
    receita30: receita30 / 100,
    vendas30,
    ticketMedio: vendas30 ? receita30 / vendas30 / 100 : 0,
    lucroMes: lucroMensal(),
  };
}

function rotear(metodo, partes, params, dados) {
  const [primeiro, segundo, terceiro] = partes;
  if (metodo === "post" && primeiro === "registrar-venda") return [201, registrarVenda(dados)];
  if (metodo === "post" && primeiro === "registrar-compra") return [201, registrarCompra(dados)];
  if (metodo === "post" && primeiro === "pagar-fiado") return [200, pagarFiado(dados)];
  if (metodo === "get" && primeiro === "lucro-mensal") return [200, lucroMensal()];
  if (metodo === "get" && primeiro === "demo-analises") return [200, analises()];

  const recurso = RECURSOS[primeiro];
  if (!recurso) throw naoEncontrado();
  const { tabela } = recurso;

  if (metodo === "get" && partes.length === 2) {
    if (primeiro === "estoques" && segundo === "alerta-minimo") {
      const r = ordenar("estoques", db.tabelas.estoques.filter((e) => e.quantidade_atual < e.quantidade_minima));
      return [200, { total: r.length, resultados: r.map((e) => saida("estoques", e)) }];
    }
    if (primeiro === "vendas" && segundo === "hoje") {
      const hoje = db.tabelas.vendas.filter((v) => v.data_venda === hojeISO());
      return [200, { count: hoje.length, total: hoje.reduce((s, v) => s + Math.round(totalVenda(v.id_venda) * 100), 0) / 100 }];
    }
    if (primeiro === "clientes" && segundo === "resumo") {
      const fiado = db.tabelas.clientes.filter((c) => c.possui_fiado);
      return [200, {
        total_clientes: db.tabelas.clientes.length,
        count_fiado: fiado.length,
        total_fiado: fiado.reduce((s, c) => s + cents(c.saldo_fiado), 0) / 100,
      }];
    }
    if (primeiro === "compras" && segundo === "pendentes") {
      const r = ordenar("compras", db.tabelas.compras.filter((c) => !c.entregue));
      return [200, { total: r.length, resultados: r.map((c) => saida("compras", c)) }];
    }
    if (primeiro === "despesas" && segundo === "por-categoria") {
      let r = db.tabelas.despesas;
      const cat = params.get("categoria");
      if (cat) r = r.filter((d) => (d.categoria || "").toLowerCase().includes(cat.toLowerCase()));
      if (params.get("data_inicio")) r = r.filter((d) => d.data >= params.get("data_inicio"));
      if (params.get("data_fim")) r = r.filter((d) => d.data <= params.get("data_fim"));
      r = ordenar("despesas", r);
      return [200, { total: r.length, resultados: r.map((d) => saida("despesas", d)) }];
    }
  }

  if (partes.length === 1) {
    if (metodo === "get") return [200, listar(tabela, params)];
    if (metodo === "post") return [201, criar(primeiro, dados)];
  }

  if (partes.length === 2) {
    if (metodo === "get") {
      const l = buscar(tabela, segundo);
      if (!l) throw naoEncontrado();
      return [200, saida(tabela, l)];
    }
    if (metodo === "patch" || metodo === "put") return [200, atualizar(primeiro, segundo, dados)];
    if (metodo === "delete") return [204, remover(primeiro, segundo)];
  }

  if (partes.length === 3) {
    if (primeiro === "compras" && terceiro === "entregar" && metodo === "post") {
      const c = buscar("compras", segundo);
      if (!c) throw naoEncontrado();
      if (c.entregue) throw new ErroNegocio("Esta compra já foi marcada como entregue.");
      itensDaCompra(c.id_compra).forEach((i) => ajustarEstoque(i.produto, i.quantidade, hojeISO()));
      c.entregue = true;
      c.data_entrega = hojeISO();
      atualizarTotalCompra(c);
      return [200, saida("compras", c)];
    }
    if (primeiro === "clientes" && metodo === "get") {
      if (!buscar("clientes", segundo)) throw naoEncontrado();
      if (terceiro === "historico") {
        let r = db.tabelas.vendas.filter((v) => v.cliente === segundo);
        if (params.get("data_inicio")) r = r.filter((v) => v.data_venda >= params.get("data_inicio"));
        if (params.get("data_fim")) r = r.filter((v) => v.data_venda <= params.get("data_fim"));
        return [200, ordenar("vendas", r).map((v) => saida("vendas", v))];
      }
      if (terceiro === "movimentos-fiado") return [200, []];
    }
  }
  throw naoEncontrado();
}

/* ───────── Adaptador do Axios ───────── */

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function adaptadorDemo(config) {
  await carregar();
  await espera(60 + Math.random() * 90);

  const url = new URL((config.url || "").replace(/^\/?/, "/"), "http://demo.local");
  const params = new URLSearchParams(url.search);
  for (const [k, v] of Object.entries(config.params || {})) if (v != null) params.set(k, v);
  const partes = url.pathname.replace(/^\/api/, "").split("/").filter(Boolean);
  const metodo = (config.method || "get").toLowerCase();
  let dados = config.data;
  if (typeof dados === "string") {
    try { dados = JSON.parse(dados); } catch { dados = {}; }
  }
  dados = dados || {};

  const mutacao = metodo !== "get";
  const copia = mutacao ? structuredClone(db.tabelas) : null;
  let status;
  let corpo;
  try {
    [status, corpo] = rotear(metodo, partes, params, dados);
    if (mutacao) salvar();
  } catch (falha) {
    if (copia) { db.tabelas = copia; indices = null; }
    let erro = falha;
    if (!(erro instanceof ErroNegocio)) {
      console.error("[demo]", falha);
      erro = new ErroNegocio("Erro inesperado na demonstração.", 500);
    }
    status = erro.status;
    corpo = erro.dados;
  }

  const resposta = {
    data: corpo, status, statusText: String(status), headers: { "content-type": "application/json" }, config, request: {},
  };
  if (status >= 200 && status < 300) return resposta;
  throw new AxiosError(
    `Request failed with status code ${status}`,
    status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config, resposta.request, resposta,
  );
}
