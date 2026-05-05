import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { cachedGet, isCached, getSync, parseListResponse, invalidateCache } from "../utils/apiCache";
import { showToast } from "../utils/toast";
import FormSelectSearch from "../components/FormSelectSearch";
import { formatarMoeda, formatarData } from "../utils/formatadores";

function Despesas() {
  const pageUrl = (p) => `/despesas/?page=${p}`;

  const cached1 = getSync(pageUrl(1));
  const parsed1 = parseListResponse(cached1);

  const [despesas, setDespesas] = useState(parsed1.data);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(!cached1);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(!!parsed1.next);
  const [temAnterior, setTemAnterior] = useState(!!parsed1.previous);

  // busca
  const [despesaSelecionada, setDespesaSelecionada] = useState("");

  // filtros
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroRecorrente, setFiltroRecorrente] = useState("");

  // ordenação
  const [sortCol, setSortCol] = useState("data");
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
        setDespesas(data);
        setTemProxima(!!next);
        setTemAnterior(!!previous);
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar as despesas."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(""), 2200);
    return () => clearTimeout(t);
  }, [highlightId]);

  const categorias = [...new Set(despesas.map((d) => d.categoria).filter(Boolean))].sort();

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
    if (selecionados.size === despesasFiltradas.length) setSelecionados(new Set());
    else setSelecionados(new Set(despesasFiltradas.map((d) => d.id_despesa)));
  }

  async function excluirSelecionados() {
    if (!window.confirm(`Excluir ${selecionados.size} despesa(s)? Essa ação não pode ser desfeita.`)) return;
    setExcluindo(true);
    try {
      await Promise.all([...selecionados].map((id) => api.delete(`/despesas/${id}/`)));
      invalidateCache(pageUrl(pagina));
      setSelecionados(new Set());
      showToast(`${selecionados.size} despesa(s) excluída(s).`, "success");
      const res = await cachedGet(api, pageUrl(pagina));
      const { data, next, previous } = parseListResponse(res);
      setDespesas(data);
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
      setDespesas(prev => [...prev, ...data]);
      setPaginaMax(nova);
      setTemProxima(!!next);
      setTemAnterior(true);
    } catch { showToast("Erro ao carregar mais.", "error"); }
    finally { setCarregandoMais(false); }
  }

  const opcoesDespesas = despesas.map((d) => ({
    value: d.id_despesa,
    label: `${d.id_despesa} - ${d.categoria} - ${d.data}`,
  }));

  const despesasFiltradas = sortData(
    despesas.filter((d) => {
      if (despesaSelecionada && d.id_despesa !== despesaSelecionada) return false;
      if (filtroCategoria && d.categoria !== filtroCategoria) return false;
      if (filtroRecorrente === "true" && !d.recorrente) return false;
      if (filtroRecorrente === "false" && d.recorrente) return false;
      return true;
    })
  );

  const totalFiltrado = despesasFiltradas.reduce((acc, d) => acc + Number(d.valor || 0), 0);

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
        <h1 className="page-title">Despesas</h1>
        <Link to="/despesas/novo" className="btn-add">+ Nova Despesa</Link>
      </div>

      {carregando && <p className="loading-text">Carregando...</p>}
      {erro && <div className="alert-msg">⚠️ {erro}</div>}
      {!carregando && !erro && despesas.length === 0 && (
        <p className="empty-state">Nenhuma despesa encontrada.</p>
      )}

      {despesas.length > 0 && (
        <>
          <FormSelectSearch
            label="Pesquisar despesa"
            name="despesaSelecionada"
            value={despesaSelecionada}
            onChange={(e) => setDespesaSelecionada(e.target.value)}
            options={opcoesDespesas}
            placeholder="Selecione uma despesa..."
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
              <span className="filter-label">Recorrente</span>
              <select className="filter-select" value={filtroRecorrente} onChange={(e) => { setFiltroRecorrente(e.target.value); setSelecionados(new Set()); }}>
                <option value="">Todos</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
            {(filtroCategoria || filtroRecorrente) && (
              <button className="filter-reset" onClick={() => { setFiltroCategoria(""); setFiltroRecorrente(""); setSelecionados(new Set()); }}>✕ Limpar</button>
            )}
            <div className="totalizador" style={{ marginLeft: "auto", padding: "6px 14px", marginBottom: 0 }}>
              <span><strong>{despesasFiltradas.length}</strong> despesa{despesasFiltradas.length !== 1 ? "s" : ""}</span>
              <span>Total: <span className="totalizador-valor" style={{ color: "var(--accent-red)" }}>{formatarMoeda(totalFiltrado)}</span></span>
            </div>
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
                    <input type="checkbox" checked={selecionados.size === despesasFiltradas.length && despesasFiltradas.length > 0} onChange={toggleTodos} />
                  </th>
                  <Th col="data" label="Data" />
                  <Th col="categoria" label="Categoria" />
                  <Th col="descricao" label="Descrição" />
                  <Th col="valor" label="Valor" />
                  <Th col="funcionario_nome" label="Funcionário" />
                  <Th col="recorrente" label="Recorrente" />
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {despesasFiltradas.map((d) => {
                  const sel = selecionados.has(d.id_despesa);
                  return (
                    <tr key={d.id_despesa} className={[sel ? "row-selected" : "", d.id_despesa === highlightId ? "row-highlight" : ""].filter(Boolean).join(" ")} onDoubleClick={() => navigate(`/despesas/${d.id_despesa}/editar`)}>
                      <td className="col-check">
                        <input type="checkbox" checked={sel} onChange={() => toggleSelecionado(d.id_despesa)} />
                      </td>
                      <td>{formatarData(d.data)}</td>
                      <td>
                        <span className="badge badge-orange">{d.categoria}</span>
                      </td>
                      <td>{d.descricao || "—"}</td>
                      <td style={{ fontWeight: 600, color: "var(--accent-red)" }}>{formatarMoeda(d.valor)}</td>
                      <td>{d.funcionario_nome || d.funcionario}</td>
                      <td>
                        <span className={`badge ${d.recorrente ? "badge-blue" : "badge-gray"}`}>
                          {d.recorrente ? "Sim" : "Não"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/despesas/${d.id_despesa}/editar`}>Editar</Link>
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

export default Despesas;
