import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { cachedGet, isCached, getSync, parseListResponse, invalidateCache } from "../utils/apiCache";
import { showToast } from "../utils/toast";
import FormSelectSearch from "../components/FormSelectSearch";
import { formatarMoeda } from "../utils/formatadores";

function Produtos() {
  const pageUrl = (p) => `/produtos/?page=${p}`;

  const cached1 = getSync(pageUrl(1));
  const parsed1 = parseListResponse(cached1);

  const [produtos, setProdutos] = useState(parsed1.data);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(!cached1);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(!!parsed1.next);
  const [temAnterior, setTemAnterior] = useState(!!parsed1.previous);

  // busca
  const [produtoSelecionado, setProdutoSelecionado] = useState("");

  // filtros
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");

  // ordenação
  const [sortCol, setSortCol] = useState("nome");
  const [sortDir, setSortDir] = useState("asc");

  // seleção
  const [selecionados, setSelecionados] = useState(new Set());
  const [excluindo, setExcluindo] = useState(false);

  // copy id
  const [copiado, setCopiado] = useState("");

  // navigate + highlight + carregar mais
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [highlightId, setHighlightId] = useState(() => searchParams.get("highlight") || "");
  const [paginaMax, setPaginaMax] = useState(1);
  const [carregandoMais, setCarregandoMais] = useState(false);

  useEffect(() => {
    const url = pageUrl(pagina);
    if (!isCached(url)) setCarregando(true);
    setSelecionados(new Set());

    cachedGet(api, url)
      .then((response) => {
        const { data, next, previous } = parseListResponse(response);
        setProdutos(data);
        setTemProxima(!!next);
        setTemAnterior(!!previous);
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar os produtos."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(""), 2200);
    return () => clearTimeout(t);
  }, [highlightId]);

  const categorias = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))].sort();
  const marcas = [...new Set(produtos.map((p) => p.marca).filter(Boolean))].sort();

  function toggleSort(col) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  }

  function sortData(data) {
    return [...data].sort((a, b) => {
      const va = a[sortCol] ?? "";
      const vb = b[sortCol] ?? "";
      const cmp = String(va).localeCompare(String(vb), "pt-BR", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  function copiarId(id) {
    navigator.clipboard.writeText(id);
    setCopiado(id);
    setTimeout(() => setCopiado(""), 1500);
  }

  function toggleSelecionado(id) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    if (selecionados.size === produtosFiltrados.length) setSelecionados(new Set());
    else setSelecionados(new Set(produtosFiltrados.map((p) => p.id_produto)));
  }

  async function excluirSelecionados() {
    if (!window.confirm(`Excluir ${selecionados.size} produto(s)? Essa ação não pode ser desfeita.`)) return;
    setExcluindo(true);
    try {
      await Promise.all([...selecionados].map((id) => api.delete(`/produtos/${id}/`)));
      invalidateCache(pageUrl(pagina));
      setSelecionados(new Set());
      showToast(`${selecionados.size} produto(s) excluído(s).`, "success");
      const res = await cachedGet(api, pageUrl(pagina));
      const { data, next, previous } = parseListResponse(res);
      setProdutos(data);
      setTemProxima(!!next);
      setTemAnterior(!!previous);
    } catch {
      showToast("Erro ao excluir. Tente novamente.", "error");
    } finally {
      setExcluindo(false);
    }
  }

  async function carregarMais() {
    if (carregandoMais || !temProxima) return;
    const nova = paginaMax + 1;
    setCarregandoMais(true);
    try {
      const res = await cachedGet(api, pageUrl(nova));
      const { data, next } = parseListResponse(res);
      setProdutos(prev => [...prev, ...data]);
      setPaginaMax(nova);
      setTemProxima(!!next);
      setTemAnterior(true);
    } catch { showToast("Erro ao carregar mais.", "error"); }
    finally { setCarregandoMais(false); }
  }

  const opcoesProdutos = produtos.map((p) => ({
    value: p.id_produto,
    label: `${p.id_produto} - ${p.nome}`,
  }));

  const produtosFiltrados = sortData(
    produtos.filter((p) => {
      if (produtoSelecionado && p.id_produto !== produtoSelecionado) return false;
      if (filtroCategoria && p.categoria !== filtroCategoria) return false;
      if (filtroMarca && p.marca !== filtroMarca) return false;
      return true;
    })
  );

  function Th({ col, label }) {
    const active = sortCol === col;
    return (
      <th className="th-sort" onClick={() => toggleSort(col)}>
        {label}{" "}
        {active ? <span>{sortDir === "asc" ? "↑" : "↓"}</span> : <span className="th-sort-icon">↕</span>}
      </th>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-row">
        <h1 className="page-title">Produtos</h1>
        <Link to="/produtos/novo" className="btn-add">+ Novo Produto</Link>
      </div>

      {carregando && <p className="loading-text">Carregando...</p>}
      {erro && <div className="alert-msg">⚠️ {erro}</div>}
      {!carregando && !erro && produtos.length === 0 && (
        <p className="empty-state">Nenhum produto encontrado.</p>
      )}

      {produtos.length > 0 && (
        <>
          <FormSelectSearch
            label="Pesquisar produto"
            name="produtoSelecionado"
            value={produtoSelecionado}
            onChange={(e) => setProdutoSelecionado(e.target.value)}
            options={opcoesProdutos}
            placeholder="Selecione um produto..."
            isClearable={true}
          />

          <div className="filter-bar">
            <div className="filter-item">
              <span className="filter-label">Categoria</span>
              <select className="filter-select" value={filtroCategoria} onChange={(e) => { setFiltroCategoria(e.target.value); setSelecionados(new Set()); }}>
                <option value="">Todas</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="filter-item">
              <span className="filter-label">Marca</span>
              <select className="filter-select" value={filtroMarca} onChange={(e) => { setFiltroMarca(e.target.value); setSelecionados(new Set()); }}>
                <option value="">Todas</option>
                {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {(filtroCategoria || filtroMarca) && (
              <button className="filter-reset" onClick={() => { setFiltroCategoria(""); setFiltroMarca(""); setSelecionados(new Set()); }}>✕ Limpar</button>
            )}
            <span style={{ marginLeft: "auto", fontSize: "0.82rem", color: "var(--text-secondary)", alignSelf: "flex-end" }}>
              {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? "s" : ""}
            </span>
          </div>

          {selecionados.size > 0 && (
            <div className="bulk-bar">
              <span className="bulk-bar-count">{selecionados.size} selecionado{selecionados.size !== 1 ? "s" : ""}</span>
              <button className="bulk-bar-delete" onClick={excluirSelecionados} disabled={excluindo}>
                {excluindo ? "Excluindo..." : "🗑 Excluir selecionados"}
              </button>
              <button className="bulk-bar-cancel" onClick={() => setSelecionados(new Set())}>Cancelar</button>
            </div>
          )}

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <input type="checkbox" checked={selecionados.size === produtosFiltrados.length && produtosFiltrados.length > 0} onChange={toggleTodos} />
                  </th>
                  <Th col="id_produto" label="ID" />
                  <Th col="fornecedor_nome" label="Fornecedor" />
                  <Th col="nome" label="Nome" />
                  <Th col="categoria" label="Categoria" />
                  <Th col="marca" label="Marca" />
                  <Th col="unidade" label="Unidade" />
                  <Th col="preco_custo" label="Preço Custo" />
                  <Th col="preco" label="Preço Venda" />
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((p) => {
                  const sel = selecionados.has(p.id_produto);
                  return (
                    <tr key={p.id_produto} className={[sel ? "row-selected" : "", p.id_produto === highlightId ? "row-highlight" : ""].filter(Boolean).join(" ")} onDoubleClick={() => navigate(`/produtos/${p.id_produto}/editar`)}>
                      <td className="col-check">
                        <input type="checkbox" checked={sel} onChange={() => toggleSelecionado(p.id_produto)} />
                      </td>
                      <td>
                        <span className="copy-id" onClick={() => copiarId(p.id_produto)} title="Clique para copiar">
                          {p.id_produto}
                          {copiado === p.id_produto && <span className="copy-id-tooltip">Copiado!</span>}
                        </span>
                      </td>
                      <td>{p.fornecedor_nome || p.fornecedor || "—"}</td>
                      <td>{p.nome}</td>
                      <td>{p.categoria || "—"}</td>
                      <td>{p.marca || "—"}</td>
                      <td>{p.unidade || "—"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{formatarMoeda(p.preco_custo)}</td>
                      <td style={{ fontWeight: 600, color: "var(--accent-green)" }}>{formatarMoeda(p.preco)}</td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/produtos/${p.id_produto}/editar`}>Editar</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button className="pagination-btn" onClick={() => setPagina(pagina - 1)} disabled={!temAnterior}>← Anterior</button>
            <span className="pagination-info">Página {pagina}</span>
            <button className="pagination-btn" onClick={() => setPagina(pagina + 1)} disabled={!temProxima}>Próxima →</button>
          </div>
          {temProxima && (
            <button className="btn-carregar-mais" onClick={carregarMais} disabled={carregandoMais}>
              {carregandoMais ? "Carregando…" : "⬇ Carregar mais"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default Produtos;
