import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { cachedGet, isCached, getSync, parseListResponse, invalidateCache } from "../utils/apiCache";
import { showToast } from "../utils/toast";
import { confirmDialog } from "../utils/confirmDialog";
import SearchBar from "../components/SearchBarPage";

function Estoques() {
  // barra de pesquisa (busca server-side via ?search=)
  const [termoBusca, setTermoBusca] = useState("");
  const search = termoBusca.trim()
    ? `&search=${encodeURIComponent(termoBusca.trim())}`
    : "";
  const pageUrl = (p) => `/estoques/?page=${p}${search}`;

  const cached1 = getSync(pageUrl(1));
  const parsed1 = parseListResponse(cached1);

  const [estoques, setEstoques] = useState(parsed1.data);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(!cached1);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(!!parsed1.next);
  const [temAnterior, setTemAnterior] = useState(!!parsed1.previous);

  // filtros
  const [filtroStatus, setFiltroStatus] = useState("");

  // ordenação
  const [sortCol, setSortCol] = useState("produto_nome");
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

  useEffect(() => { setPagina(1); /* eslint-disable-next-line */ }, [termoBusca]);

  useEffect(() => {
    const url = pageUrl(pagina);
    if (!isCached(url)) setCarregando(true);
    setSelecionados(new Set());

    cachedGet(api, url)
      .then((response) => {
        const { data, next, previous } = parseListResponse(response);
        setEstoques(data);
        setTemProxima(!!next);
        setTemAnterior(!!previous);
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar os estoques."))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, termoBusca]);

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(""), 2200);
    return () => clearTimeout(t);
  }, [highlightId]);

  function getStatus(e) {
    const atual = Number(e.quantidade_atual);
    const minimo = Number(e.quantidade_minima);
    if (atual === 0) return "sem";
    if (atual < minimo) return "baixo";
    return "ok";
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
    if (selecionados.size === estoquesFiltrados.length) setSelecionados(new Set());
    else setSelecionados(new Set(estoquesFiltrados.map((e) => e.id_estoque)));
  }

  async function excluirSelecionados() {
    const ok = await confirmDialog({
      title: `Excluir ${selecionados.size} registro${selecionados.size !== 1 ? "s" : ""} de estoque?`,
      message: "Esta ação não pode ser desfeita. Os registros serão removidos permanentemente.",
      confirmText: `Excluir ${selecionados.size}`,
      cancelText: "Cancelar",
      danger: true,
    });
    if (!ok) return;
    setExcluindo(true);
    try {
      await Promise.all([...selecionados].map((id) => api.delete(`/estoques/${id}/`)));
      invalidateCache(pageUrl(pagina));
      setSelecionados(new Set());
      showToast(`${selecionados.size} registro(s) excluído(s).`, "success");
      const res = await cachedGet(api, pageUrl(pagina));
      const { data, next, previous } = parseListResponse(res);
      setEstoques(data);
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
      setEstoques(prev => [...prev, ...data]);
      setPaginaMax(nova);
      setTemProxima(!!next);
      setTemAnterior(true);
    } catch { showToast("Erro ao carregar mais.", "error"); }
    finally { setCarregandoMais(false); }
  }

  const opcoesEstoques = estoques.map((e) => ({
    value: e.id_estoque,
    label: `${e.id_estoque} - ${e.produto_nome || e.produto}`,
  }));

  const estoquesFiltrados = sortData(
    estoques.filter((e) => {
      // Busca textual via backend (?search=). Aqui só os filtros adicionais.
      if (filtroStatus && getStatus(e) !== filtroStatus) return false;
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
      <h1 className="page-title">Estoques</h1>

      {carregando && <p className="loading-text">Carregando...</p>}
      {erro && <div className="alert-msg">⚠️ {erro}</div>}
      {!carregando && !erro && estoques.length === 0 && (
        <p className="empty-state">
          {termoBusca ? `Nenhum estoque encontrado para "${termoBusca}".` : "Nenhum estoque encontrado."}
        </p>
      )}

      {(estoques.length > 0 || termoBusca) && (
        <>
          <SearchBar
            label="Pesquisar estoque"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Digite o nome do produto, quantidade, data..."
          />

          <div className="filter-bar" style={{ marginTop: 8 }}>
            <div className="filter-item">
              <span className="filter-label">Status</span>
              <select className="filter-select" value={filtroStatus} onChange={(e) => { setFiltroStatus(e.target.value); setSelecionados(new Set()); }}>
                <option value="">Todos</option>
                <option value="ok">✓ OK</option>
                <option value="baixo">⚠ Baixo</option>
                <option value="sem">🔴 Sem estoque</option>
              </select>
            </div>
            {filtroStatus && (
              <button className="filter-reset" onClick={() => { setFiltroStatus(""); setSelecionados(new Set()); }}>✕ Limpar</button>
            )}
            <span style={{ marginLeft: "auto", fontSize: "0.82rem", color: "var(--text-secondary)", alignSelf: "flex-end" }}>
              {estoquesFiltrados.length} item{estoquesFiltrados.length !== 1 ? "s" : ""}
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
                    <input type="checkbox" checked={selecionados.size === estoquesFiltrados.length && estoquesFiltrados.length > 0} onChange={toggleTodos} />
                  </th>
                  <Th col="produto_nome" label="Produto" />
                  <Th col="quantidade_atual" label="Qtd. Atual" />
                  <Th col="quantidade_minima" label="Qtd. Mínima" />
                  <Th col="dt_ultima_entrada" label="Última Entrada" />
                  <Th col="dt_ultima_saida" label="Última Saída" />
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {estoquesFiltrados.map((e) => {
                  const status = getStatus(e);
                  const sel = selecionados.has(e.id_estoque);
                  const cor = status === "sem" ? "var(--accent-red)" : status === "baixo" ? "var(--accent-orange)" : "var(--accent-green)";
                  return (
                    <tr key={e.id_estoque} className={[sel ? "row-selected" : "", e.id_estoque === highlightId ? "row-highlight" : ""].filter(Boolean).join(" ")} onDoubleClick={() => navigate(`/estoques/${e.id_estoque}/editar`)}>
                      <td className="col-check">
                        <input type="checkbox" checked={sel} onChange={() => toggleSelecionado(e.id_estoque)} />
                      </td>
                      <td>
                        <span className="copy-id" onClick={() => copiarId(e.id_estoque)} title="Clique para copiar">
                          {e.produto_nome || e.produto}
                          {copiado === e.id_estoque && <span className="copy-id-tooltip">Copiado!</span>}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: cor }}>{e.quantidade_atual}</td>
                      <td>{e.quantidade_minima}</td>
                      <td>{e.dt_ultima_entrada || "—"}</td>
                      <td>{e.dt_ultima_saida || "—"}</td>
                      <td>
                        <span className={`badge ${status === "sem" ? "badge-red" : status === "baixo" ? "badge-orange" : "badge-green"}`}>
                          {status === "sem" ? "🔴 Sem estoque" : status === "baixo" ? "⚠ Baixo" : "✓ OK"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/estoques/${e.id_estoque}/editar`}>Editar</Link>
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

export default Estoques;
