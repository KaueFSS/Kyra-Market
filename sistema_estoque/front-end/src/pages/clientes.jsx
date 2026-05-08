import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { cachedGet, isCached, getSync, parseListResponse, invalidateCache } from "../utils/apiCache";
import { showToast } from "../utils/toast";
import { confirmDialog } from "../utils/confirmDialog";
import { excluirEmLote, mensagemFalhasExclusao } from "../utils/exclusao";
import SearchBar from "../components/SearchBarPage";
import { formatarMoeda, formatarData } from "../utils/formatadores";

function Clientes() {
  // barra de pesquisa (busca server-side via ?search=)
  const [termoBusca, setTermoBusca] = useState("");
  const search = termoBusca.trim()
    ? `&search=${encodeURIComponent(termoBusca.trim())}`
    : "";
  const pageUrl = (p) => `/clientes/?page=${p}${search}`;

  const cached1 = getSync(pageUrl(1));
  const parsed1 = parseListResponse(cached1);

  const [clientes, setClientes] = useState(parsed1.data);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(!cached1);
  const [pagina, setPagina] = useState(1);
  const [temProxima, setTemProxima] = useState(!!parsed1.next);
  const [temAnterior, setTemAnterior] = useState(!!parsed1.previous);

  // filtros
  const [filtroFiado, setFiltroFiado] = useState("");

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

  useEffect(() => { setPagina(1); /* eslint-disable-next-line */ }, [termoBusca]);

  useEffect(() => {
    const url = pageUrl(pagina);
    if (!isCached(url)) setCarregando(true);
    setSelecionados(new Set());

    cachedGet(api, url)
      .then((response) => {
        const { data, next, previous } = parseListResponse(response);
        setClientes(data);
        setTemProxima(!!next);
        setTemAnterior(!!previous);
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar os clientes."))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, termoBusca]);

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
    if (selecionados.size === clientesFiltrados.length) setSelecionados(new Set());
    else setSelecionados(new Set(clientesFiltrados.map((c) => c.id_cliente)));
  }

  async function excluirSelecionados() {
    const ok = await confirmDialog({
      title: `Excluir ${selecionados.size} cliente${selecionados.size !== 1 ? "s" : ""}?`,
      message: "Esta ação não pode ser desfeita. Os clientes serão removidos permanentemente.",
      confirmText: `Excluir ${selecionados.size}`,
      danger: true,
    });
    if (!ok) return;
    setExcluindo(true);
    try {
      const ids = [...selecionados];
      const { excluidos, falhas } = await excluirEmLote(api, "/clientes", ids);
      invalidateCache(pageUrl(pagina));
      setSelecionados(new Set(falhas.map((falha) => falha.id)));
      if (excluidos.length) showToast(`${excluidos.length} cliente(s) excluido(s).`, "success");
      if (falhas.length) showToast(mensagemFalhasExclusao(falhas), "error");
      const res = await cachedGet(api, pageUrl(pagina));
      const { data, next, previous } = parseListResponse(res);
      setClientes(data);
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
      setClientes(prev => [...prev, ...data]);
      setPaginaMax(nova);
      setTemProxima(!!next);
      setTemAnterior(true);
    } catch { showToast("Erro ao carregar mais.", "error"); }
    finally { setCarregandoMais(false); }
  }

  const opcoesClientes = clientes.map((c) => ({
    value: c.id_cliente,
    label: `${c.id_cliente} - ${c.nome}`,
  }));

  const clientesFiltrados = sortData(
    clientes.filter((c) => {
      // Busca textual via backend (?search=). Aqui só os filtros adicionais.
      if (filtroFiado === "true" && !c.possui_fiado) return false;
      if (filtroFiado === "false" && c.possui_fiado) return false;
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
        <div>
          <h1 className="page-title">Clientes</h1>
        </div>
        <Link to="/clientes/novo" className="btn-add">+ Novo Cliente</Link>
      </div>

      {carregando && <p className="loading-text">Carregando clientes...</p>}
      {erro && <div className="alert-msg">⚠️ {erro}</div>}
      {!carregando && !erro && clientes.length === 0 && (
        <p className="empty-state">
          {termoBusca ? `Nenhum cliente encontrado para "${termoBusca}".` : "Nenhum cliente encontrado."}
        </p>
      )}

      {(clientes.length > 0 || termoBusca) && (
        <>
          <SearchBar
            label="Pesquisar cliente"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Digite o nome, telefone, bairro, data..."
          />

          <div className="filter-bar">
            <div className="filter-item">
              <span className="filter-label">Fiado</span>
              <select className="filter-select" value={filtroFiado} onChange={(e) => { setFiltroFiado(e.target.value); setSelecionados(new Set()); }}>
                <option value="">Todos</option>
                <option value="true">Com fiado</option>
                <option value="false">Sem fiado</option>
              </select>
            </div>
            {filtroFiado && (
              <button className="filter-reset" onClick={() => { setFiltroFiado(""); setSelecionados(new Set()); }}>✕ Limpar</button>
            )}
            <span style={{ marginLeft: "auto", fontSize: "0.82rem", color: "var(--text-secondary)", alignSelf: "flex-end" }}>
              {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? "s" : ""}
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
                    <input type="checkbox" checked={selecionados.size === clientesFiltrados.length && clientesFiltrados.length > 0} onChange={toggleTodos} />
                  </th>
                  <Th col="id_cliente" label="ID" />
                  <Th col="nome" label="Nome" />
                  <Th col="telefone" label="Telefone" />
                  <Th col="bairro" label="Bairro" />
                  <Th col="data_cadastro" label="Cadastro" />
                  <Th col="possui_fiado" label="Fiado" />
                  <Th col="saldo_fiado" label="Saldo Fiado" />
                  <Th col="total_valor" label="Total Compras" />
                  <Th col="ultima_compra" label="Última Compra" />
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((c) => {
                  const sel = selecionados.has(c.id_cliente);
                  return (
                    <tr key={c.id_cliente} className={[sel ? "row-selected" : "", c.id_cliente === highlightId ? "row-highlight" : ""].filter(Boolean).join(" ")} onDoubleClick={() => navigate(`/clientes/${c.id_cliente}/editar`)}>
                      <td className="col-check">
                        <input type="checkbox" checked={sel} onChange={() => toggleSelecionado(c.id_cliente)} />
                      </td>
                      <td>
                        <span className="copy-id" onClick={() => copiarId(c.id_cliente)} title="Clique para copiar">
                          {c.id_cliente}
                          {copiado === c.id_cliente && <span className="copy-id-tooltip">Copiado!</span>}
                        </span>
                      </td>
                      <td>{c.nome}</td>
                      <td>{c.telefone || "—"}</td>
                      <td>{c.bairro || "—"}</td>
                      <td>{formatarData(c.data_cadastro)}</td>
                      <td>
                        <span className={`badge ${c.possui_fiado ? "badge-purple" : "badge-gray"}`}>
                          {c.possui_fiado ? "Sim" : "Não"}
                        </span>
                      </td>
                      <td style={{ color: c.saldo_fiado > 0 ? "var(--accent-purple)" : "var(--text-secondary)" }}>
                        {formatarMoeda(c.saldo_fiado)}
                      </td>
                      <td style={{ color: "var(--accent-green)" }}>{formatarMoeda(c.total_valor)}</td>
                      <td>{formatarData(c.ultima_compra)}</td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/clientes/${c.id_cliente}/editar`}>Editar</Link>
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

export default Clientes;
