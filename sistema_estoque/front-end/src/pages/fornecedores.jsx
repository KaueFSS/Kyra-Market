import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { cachedGet, isCached, getSync, parseListResponse, invalidateCache } from "../utils/apiCache";
import { showToast } from "../utils/toast";
import { confirmDialog } from "../utils/confirmDialog";
import SearchBar from "../components/SearchBarPage";

function Fornecedores() {
  // barra de pesquisa (busca server-side via ?search=)
  const [termoBusca, setTermoBusca] = useState("");
  const search = termoBusca.trim()
    ? `&search=${encodeURIComponent(termoBusca.trim())}`
    : "";
  const pageUrl = (p) => `/fornecedores/?page=${p}${search}`;

  const cached1 = getSync(pageUrl(1));
  const parsed1 = parseListResponse(cached1);

  const [fornecedores, setFornecedores] = useState(parsed1.data);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(!cached1);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(!!parsed1.next);
  const [temAnterior, setTemAnterior] = useState(!!parsed1.previous);

  // filtros
  const [filtroUF, setFiltroUF] = useState("");

  // ordenação
  const [sortCol, setSortCol] = useState("razao_social");
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
        setFornecedores(data);
        setTemProxima(!!next);
        setTemAnterior(!!previous);
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar os fornecedores."))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, termoBusca]);

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(""), 2200);
    return () => clearTimeout(t);
  }, [highlightId]);

  const ufs = [...new Set(fornecedores.map((f) => f.uf).filter(Boolean))].sort();

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
    if (selecionados.size === fornecedoresFiltrados.length) setSelecionados(new Set());
    else setSelecionados(new Set(fornecedoresFiltrados.map((f) => f.id_fornecedor)));
  }

  async function excluirSelecionados() {
    const ok = await confirmDialog({
      title: `Excluir ${selecionados.size} fornecedor${selecionados.size !== 1 ? "es" : ""}?`,
      message: "Esta ação não pode ser desfeita. Os fornecedores serão removidos permanentemente.",
      confirmText: `Excluir ${selecionados.size}`,
      danger: true,
    });
    if (!ok) return;
    setExcluindo(true);
    try {
      await Promise.all([...selecionados].map((id) => api.delete(`/fornecedores/${id}/`)));
      invalidateCache(pageUrl(pagina));
      setSelecionados(new Set());
      showToast(`${selecionados.size} fornecedor(es) excluído(s).`, "success");
      const res = await cachedGet(api, pageUrl(pagina));
      const { data, next, previous } = parseListResponse(res);
      setFornecedores(data);
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
      setFornecedores(prev => [...prev, ...data]);
      setPaginaMax(nova);
      setTemProxima(!!next);
      setTemAnterior(true);
    } catch { showToast("Erro ao carregar mais.", "error"); }
    finally { setCarregandoMais(false); }
  }

  const opcoesFornecedores = fornecedores.map((f) => ({
    value: f.id_fornecedor,
    label: `${f.id_fornecedor} - ${f.nome_fantasia || f.razao_social}`,
  }));

  const fornecedoresFiltrados = sortData(
    fornecedores.filter((f) => {
      // Busca textual via backend (?search=). Aqui só os filtros adicionais.
      if (filtroUF && f.uf !== filtroUF) return false;
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
        <h1 className="page-title">Fornecedores</h1>
        <Link to="/fornecedores/novo" className="btn-add">+ Novo Fornecedor</Link>
      </div>

      {carregando && <p className="loading-text">Carregando...</p>}
      {erro && <div className="alert-msg">⚠️ {erro}</div>}
      {!carregando && !erro && fornecedores.length === 0 && (
        <p className="empty-state">
          {termoBusca ? `Nenhum fornecedor encontrado para "${termoBusca}".` : "Nenhum fornecedor encontrado."}
        </p>
      )}

      {(fornecedores.length > 0 || termoBusca) && (
        <>
          <SearchBar
            label="Pesquisar fornecedor"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Digite a razão social, nome, cnpj, cidade, uf, telefone..."
          />

          <div className="filter-bar">
            <div className="filter-item">
              <span className="filter-label">Estado (UF)</span>
              <select className="filter-select" value={filtroUF} onChange={(e) => { setFiltroUF(e.target.value); setSelecionados(new Set()); }}>
                <option value="">Todos</option>
                {ufs.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            {filtroUF && (
              <button className="filter-reset" onClick={() => { setFiltroUF(""); setSelecionados(new Set()); }}>✕ Limpar</button>
            )}
            <span style={{ marginLeft: "auto", fontSize: "0.82rem", color: "var(--text-secondary)", alignSelf: "flex-end" }}>
              {fornecedoresFiltrados.length} fornecedor{fornecedoresFiltrados.length !== 1 ? "es" : ""}
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
                    <input type="checkbox" checked={selecionados.size === fornecedoresFiltrados.length && fornecedoresFiltrados.length > 0} onChange={toggleTodos} />
                  </th>
                  <Th col="id_fornecedor" label="ID" />
                  <Th col="razao_social" label="Razão Social" />
                  <Th col="nome_fantasia" label="Nome Fantasia" />
                  <Th col="cnpj" label="CNPJ" />
                  <Th col="cidade" label="Cidade" />
                  <Th col="uf" label="UF" />
                  <Th col="telefone" label="Telefone" />
                  <Th col="avaliacao" label="Avaliação" />
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {fornecedoresFiltrados.map((f) => {
                  const sel = selecionados.has(f.id_fornecedor);
                  return (
                    <tr key={f.id_fornecedor} className={[sel ? "row-selected" : "", f.id_fornecedor === highlightId ? "row-highlight" : ""].filter(Boolean).join(" ")} onDoubleClick={() => navigate(`/fornecedores/${f.id_fornecedor}/editar`)}>
                      <td className="col-check">
                        <input type="checkbox" checked={sel} onChange={() => toggleSelecionado(f.id_fornecedor)} />
                      </td>
                      <td>
                        <span className="copy-id" onClick={() => copiarId(f.id_fornecedor)} title="Clique para copiar">
                          {f.id_fornecedor}
                          {copiado === f.id_fornecedor && <span className="copy-id-tooltip">Copiado!</span>}
                        </span>
                      </td>
                      <td>{f.razao_social}</td>
                      <td>{f.nome_fantasia || "—"}</td>
                      <td>{f.cnpj}</td>
                      <td>{f.cidade}</td>
                      <td>{f.uf}</td>
                      <td>{f.telefone || "—"}</td>
                      <td>
                        <span className="badge badge-blue">⭐ {f.avaliacao}</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/fornecedores/${f.id_fornecedor}/editar`}>Editar</Link>
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

export default Fornecedores;
