import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { cachedGet, isCached, getSync, parseListResponse, invalidateCache } from "../utils/apiCache";
import { showToast } from "../utils/toast";
import FormSelectSearch from "../components/FormSelectSearch";
import { formatarMoeda, formatarData } from "../utils/formatadores";

function Compras() {
  const pageUrl = (p) => `/compras/?page=${p}`;

  const cached1 = getSync(pageUrl(1));
  const parsed1 = parseListResponse(cached1);

  const [compras, setCompras] = useState(parsed1.data);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(!cached1);
  const [compraAtualizando, setCompraAtualizando] = useState("");
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(!!parsed1.next);
  const [temAnterior, setTemAnterior] = useState(!!parsed1.previous);

  // busca
  const [compraSelecionada, setCompraSelecionada] = useState("");

  // filtros
  const [filtroEntregue, setFiltroEntregue] = useState("");

  // ordenação
  const [sortCol, setSortCol] = useState("data_compra");
  const [sortDir, setSortDir] = useState("desc");

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
        setCompras(data);
        setTemProxima(!!next);
        setTemAnterior(!!previous);
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar as compras."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(""), 2200);
    return () => clearTimeout(t);
  }, [highlightId]);

  async function marcarComoEntregue(idCompra) {
    setErro("");
    setCompraAtualizando(idCompra);
    try {
      const response = await api.post(`/compras/${idCompra}/entregar/`);
      invalidateCache();
      setCompras((prev) => prev.map((c) => c.id_compra === idCompra ? response.data : c));
      showToast("Compra marcada como entregue e estoque atualizado!", "success");
    } catch (error) {
      showToast(error.response?.data?.erro || "Não foi possível marcar a compra como entregue.", "error");
    } finally {
      setCompraAtualizando("");
    }
  }

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
    if (selecionados.size === comprasFiltradas.length) setSelecionados(new Set());
    else setSelecionados(new Set(comprasFiltradas.map((c) => c.id_compra)));
  }

  async function excluirSelecionados() {
    if (!window.confirm(`Excluir ${selecionados.size} compra(s)? Essa ação não pode ser desfeita.`)) return;
    setExcluindo(true);
    try {
      await Promise.all([...selecionados].map((id) => api.delete(`/compras/${id}/`)));
      invalidateCache();
      setSelecionados(new Set());
      showToast(`${selecionados.size} compra(s) excluída(s).`, "success");
      const res = await cachedGet(api, pageUrl(pagina));
      const { data, next, previous } = parseListResponse(res);
      setCompras(data);
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
      setCompras(prev => [...prev, ...data]);
      setPaginaMax(nova);
      setTemProxima(!!next);
      setTemAnterior(true);
    } catch { showToast("Erro ao carregar mais.", "error"); }
    finally { setCarregandoMais(false); }
  }

  const opcoesCompras = compras.map((c) => ({
    value: c.id_compra,
    label: `${c.id_compra} - ${c.fornecedor_nome || c.fornecedor} - ${c.data_compra}`,
  }));

  const comprasFiltradas = sortData(
    compras.filter((c) => {
      if (compraSelecionada && c.id_compra !== compraSelecionada) return false;
      if (filtroEntregue === "true" && !c.entregue) return false;
      if (filtroEntregue === "false" && c.entregue) return false;
      return true;
    })
  );

  function Th({ col, label }) {
    const active = sortCol === col;
    return (
      <th className="th-sort" onClick={() => toggleSort(col)}>
        {label}{" "}
        {active
          ? <span>{sortDir === "asc" ? "↑" : "↓"}</span>
          : <span className="th-sort-icon">↕</span>}
      </th>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-row">
        <h1 className="page-title">Compras</h1>
        <Link to="/compras/novo" className="btn-add">+ Nova Compra</Link>
      </div>

      {carregando && <p className="loading-text">Carregando...</p>}
      {erro && <div className="alert-msg">⚠️ {erro}</div>}
      {!carregando && !erro && compras.length === 0 && (
        <p className="empty-state">Nenhuma compra encontrada.</p>
      )}

      {compras.length > 0 && (
        <>
          <FormSelectSearch
            label="Pesquisar compra"
            name="compraSelecionada"
            value={compraSelecionada}
            onChange={(e) => setCompraSelecionada(e.target.value)}
            options={opcoesCompras}
            placeholder="Selecione uma compra..."
            isClearable={true}
          />

          <div className="filter-bar">
            <div className="filter-item">
              <span className="filter-label">Status de entrega</span>
              <select className="filter-select" value={filtroEntregue} onChange={(e) => { setFiltroEntregue(e.target.value); setSelecionados(new Set()); }}>
                <option value="">Todos</option>
                <option value="true">Entregue</option>
                <option value="false">Pendente</option>
              </select>
            </div>
            {filtroEntregue && (
              <button className="filter-reset" onClick={() => { setFiltroEntregue(""); setSelecionados(new Set()); }}>✕ Limpar</button>
            )}
          </div>

          {selecionados.size > 0 && (
            <div className="bulk-bar">
              <span className="bulk-bar-count">{selecionados.size} selecionada{selecionados.size !== 1 ? "s" : ""}</span>
              <button className="bulk-bar-delete" onClick={excluirSelecionados} disabled={excluindo}>
                {excluindo ? "Excluindo..." : "🗑 Excluir selecionadas"}
              </button>
              <button className="bulk-bar-cancel" onClick={() => setSelecionados(new Set())}>Cancelar</button>
            </div>
          )}

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <input type="checkbox" checked={selecionados.size === comprasFiltradas.length && comprasFiltradas.length > 0} onChange={toggleTodos} />
                  </th>
                  <Th col="nome" label="Nome" />
                  <Th col="fornecedor_nome" label="Fornecedor" />
                  <Th col="funcionario_nome" label="Funcionário" />
                  <Th col="data_compra" label="Data" />
                  <Th col="status" label="Status" />
                  <Th col="entregue" label="Entrega" />
                  <Th col="valor_total" label="Valor Total" />
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {comprasFiltradas.map((c) => {
                  const sel = selecionados.has(c.id_compra);
                  return (
                    <tr key={c.id_compra} className={[sel ? "row-selected" : "", c.id_compra === highlightId ? "row-highlight" : ""].filter(Boolean).join(" ")} onDoubleClick={() => navigate(`/compras/${c.id_compra}/editar`)}>
                      <td className="col-check">
                        <input type="checkbox" checked={sel} onChange={() => toggleSelecionado(c.id_compra)} />
                      </td>
                      <td>
                        <span className="copy-id" onClick={() => copiarId(c.id_compra)} title="Clique para copiar">
                          {c.nome || c.id_compra}
                          {copiado === c.id_compra && <span className="copy-id-tooltip">Copiado!</span>}
                        </span>
                      </td>
                      <td>{c.fornecedor_nome || c.fornecedor}</td>
                      <td>{c.funcionario_nome || c.funcionario}</td>
                      <td>{formatarData(c.data_compra)}</td>
                      <td>{c.status || "—"}</td>
                      <td>
                        <span className={`badge ${c.entregue ? "badge-green" : "badge-orange"}`}>
                          {c.entregue ? "✓ Entregue" : "Pendente"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--accent-green)" }}>{formatarMoeda(c.valor_total)}</td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/compras/${c.id_compra}`}>Detalhes</Link>
                          <Link to={`/compras/${c.id_compra}/editar`}>Editar</Link>
                          {!c.entregue && (
                            <button type="button" onClick={() => marcarComoEntregue(c.id_compra)} disabled={compraAtualizando === c.id_compra}>
                              {compraAtualizando === c.id_compra ? "Atualizando..." : "Marcar entregue"}
                            </button>
                          )}
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

export default Compras;
