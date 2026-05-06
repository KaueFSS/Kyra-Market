import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { cachedGet, isCached, getSync, parseListResponse, invalidateCache } from "../utils/apiCache";
import { showToast } from "../utils/toast";
import { formatarFormaPagamento, formatarMoeda, formatarData } from "../utils/formatadores";
import SearchBar from "../components/SearchBarPage";

const FORMAS = [
  { value: "", label: "Todos" },
  { value: "dinheiro",       label: "Dinheiro" },
  { value: "pix",            label: "PIX" },
  { value: "cartao_debito",  label: "Débito" },
  { value: "cartao_credito", label: "Crédito" },
  { value: "fiado",          label: "Fiado" },
];

function Vendas() {
  const pageUrl = (p) => `/vendas/?page=${p}`;

  const cached1 = getSync(pageUrl(1));
  const parsed1 = parseListResponse(cached1);

  const [vendas, setVendas] = useState(parsed1.data);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(!cached1);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(!!parsed1.next);
  const [temAnterior, setTemAnterior] = useState(!!parsed1.previous);

  //barra de pesquisa de vendas
  const [termoBusca, setTermoBusca] = useState("");

  // filtros
  const [filtroForma, setFiltroForma] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // ordenação
  const [sortCol, setSortCol] = useState("data_venda");
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
        setVendas(data);
        setTemProxima(!!next);
        setTemAnterior(!!previous);
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar as vendas."))
      .finally(() => setCarregando(false));
  }, [pagina]);

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(""), 2200);
    return () => clearTimeout(t);
  }, [highlightId]);

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
    if (selecionados.size === vendasFiltradas.length) setSelecionados(new Set());
    else setSelecionados(new Set(vendasFiltradas.map((v) => v.id_venda)));
  }

  async function excluirSelecionados() {
    if (!window.confirm(`Excluir ${selecionados.size} venda(s) selecionada(s)? Essa ação não pode ser desfeita.`)) return;
    setExcluindo(true);
    try {
      await Promise.all([...selecionados].map((id) => api.delete(`/vendas/${id}/`)));
      invalidateCache(pageUrl(pagina));
      setSelecionados(new Set());
      showToast(`${selecionados.size} venda(s) excluída(s).`, "success");
      const res = await cachedGet(api, pageUrl(pagina));
      const { data, next, previous } = parseListResponse(res);
      setVendas(data);
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
      setVendas(prev => [...prev, ...data]);
      setPaginaMax(nova);
      setTemProxima(!!next);
      setTemAnterior(true);
    } catch { showToast("Erro ao carregar mais.", "error"); }
    finally { setCarregandoMais(false); }
  }

  const opcoesVendas = vendas.map((v) => ({
    value: v.id_venda,
    label: `${v.id_venda} - ${v.nome || "Sem nome"} - ${v.cliente_nome || v.cliente || "Sem cliente"} - ${v.data_venda}`,
  }));

  const vendasFiltradas = sortData(
    vendas.filter((v) => {
      const texto = termoBusca.toLowerCase().trim();
      
      //verificador de se o que esta digitado na barra de pesquisa bate com algum dos campos de alguma venda
      const bateBusca =
        !texto ||
        String(v.id_venda || "").toLowerCase().includes(texto) ||
        String(v.nome || "").toLowerCase().includes(texto) ||
        String(v.cliente_nome || v.cliente || "").toLowerCase().includes(texto) ||
        String(v.funcionario_nome || v.funcionario || "").toLowerCase().includes(texto) ||
        String(v.data_venda || "").toLowerCase().includes(texto) ||
        String(v.forma_pagamento || "").toLowerCase().includes(texto);

      if (!bateBusca) return false;
      if (filtroForma && v.forma_pagamento !== filtroForma) return false;
      if (filtroDataInicio && v.data_venda < filtroDataInicio) return false;
      if (filtroDataFim && v.data_venda > filtroDataFim) return false;
      return true;
    })
  );

  const totalFiltrado = vendasFiltradas.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const totalSelecionado = vendasFiltradas
    .filter((v) => selecionados.has(v.id_venda))
    .reduce((acc, v) => acc + Number(v.total || 0), 0);

  function Th({ col, label }) {
    const active = sortCol === col;
    return (
      <th className="th-sort" onClick={() => toggleSort(col)}>
        {label}{" "}
        {active
          ? <span className={`th-sort-${sortDir}-arrow`}>{sortDir === "asc" ? "↑" : "↓"}</span>
          : <span className="th-sort-icon">↕</span>}
      </th>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Vendas</h1>
        </div>
        <Link to="/vendas/novo" className="btn-add">+ Nova Venda</Link>
      </div>

      {carregando && <p className="loading-text">Carregando vendas...</p>}
      {erro && <div className="alert-msg">⚠️ {erro}</div>}
      {!carregando && !erro && vendas.length === 0 && (
        <p className="empty-state">Nenhuma venda encontrada.</p>
      )}

      {vendas.length > 0 && (
        <>
          <SearchBar
            label="Pesquisar vendas"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Digite nome da venda, cliente, funcionário, ID..."
          />

          {/* Filtros */}
          <div className="filter-bar">
            <div className="filter-item">
              <span className="filter-label">Pagamento</span>
              <select className="filter-select" value={filtroForma} onChange={(e) => { setFiltroForma(e.target.value); setSelecionados(new Set()); }}>
                {FORMAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="filter-item">
              <span className="filter-label">Data início</span>
              <input type="date" className="filter-input" value={filtroDataInicio} onChange={(e) => { setFiltroDataInicio(e.target.value); setSelecionados(new Set()); }} />
            </div>
            <div className="filter-item">
              <span className="filter-label">Data fim</span>
              <input type="date" className="filter-input" value={filtroDataFim} onChange={(e) => { setFiltroDataFim(e.target.value); setSelecionados(new Set()); }} />
            </div>
            {(filtroForma || filtroDataInicio || filtroDataFim) && (
              <button className="filter-reset" onClick={() => { setFiltroForma(""); setFiltroDataInicio(""); setFiltroDataFim(""); setSelecionados(new Set()); }}>
                ✕ Limpar filtros
              </button>
            )}
          </div>

          {/* Totalizador */}
          <div className="totalizador">
            <span><strong>{vendasFiltradas.length}</strong> venda{vendasFiltradas.length !== 1 ? "s" : ""} exibida{vendasFiltradas.length !== 1 ? "s" : ""}</span>
            <span>Total: <span className="totalizador-valor">{formatarMoeda(totalFiltrado)}</span></span>
            {selecionados.size > 0 && (
              <span style={{ color: "var(--accent-blue)" }}>
                {selecionados.size} selecionada{selecionados.size !== 1 ? "s" : ""} — <strong style={{ color: "var(--accent-blue)" }}>{formatarMoeda(totalSelecionado)}</strong>
              </span>
            )}
          </div>

          {/* Bulk bar */}
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
                    <input type="checkbox" checked={selecionados.size === vendasFiltradas.length && vendasFiltradas.length > 0} onChange={toggleTodos} />
                  </th>
                  <Th col="nome" label="Nome" />
                  <Th col="data_venda" label="Data" />
                  <Th col="hora" label="Hora" />
                  <Th col="forma_pagamento" label="Pagamento" />
                  <Th col="funcionario" label="Funcionário" />
                  <Th col="cliente" label="Cliente" />
                  <Th col="total" label="Total" />
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {vendasFiltradas.map((v) => {
                  const fp = formatarFormaPagamento(v.forma_pagamento);
                  const sel = selecionados.has(v.id_venda);
                  return (
                    <tr key={v.id_venda} className={[sel ? "row-selected" : "", v.id_venda === highlightId ? "row-highlight" : ""].filter(Boolean).join(" ")} onDoubleClick={() => navigate(`/vendas/${v.id_venda}/editar`)}>
                      <td className="col-check">
                        <input type="checkbox" checked={sel} onChange={() => toggleSelecionado(v.id_venda)} />
                      </td>
                      <td>
                        <span className="copy-id" onClick={() => copiarId(v.id_venda)} title="Clique para copiar">
                          {v.nome || v.id_venda}
                          {copiado === v.id_venda && <span className="copy-id-tooltip">ID da venda copiado!</span>}
                        </span>
                      </td>
                      <td>{formatarData(v.data_venda)}</td>
                      <td>{v.hora ? v.hora.slice(0, 5) : "—"}</td>
                      <td><span className={`badge ${fp.cls}`}>{fp.icon} {fp.label}</span></td>
                      <td>{v.funcionario_nome || v.funcionario}</td>
                      <td>{v.cliente_nome || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                      <td style={{ fontWeight: 600, color: "var(--accent-green)" }}>{formatarMoeda(v.total || 0)}</td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/vendas/${v.id_venda}`}>Ver detalhes</Link>
                          <Link to={`/vendas/${v.id_venda}/editar`}>Editar</Link>
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

export default Vendas;
