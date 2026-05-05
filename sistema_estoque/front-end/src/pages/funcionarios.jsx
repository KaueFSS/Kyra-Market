import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { cachedGet, getSync, parseListResponse, invalidateCache } from "../utils/apiCache";
import { showToast } from "../utils/toast";
import FormSelectSearch from "../components/FormSelectSearch";
import { formatarMoeda, formatarData } from "../utils/formatadores";

const POR_PAGINA = 15;

function Funcionarios() {
  const pageUrl = (p) => `/funcionarios/?page=${p}`;

  const cached1 = getSync(pageUrl(1));
  const parsed1 = parseListResponse(cached1);

  const [funcionarios, setFuncionarios] = useState(parsed1.data);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [erro, setErro] = useState("");

  // busca
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");

  // filtros
  const [filtroAtivo, setFiltroAtivo] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("");

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
  const [temProxima, setTemProxima] = useState(false);

  useEffect(() => {
    const url = pageUrl(pagina);
    setSelecionados(new Set());

    cachedGet(api, url)
      .then((response) => {
        setErro("");
        const data = response.data;
        if (Array.isArray(data)) {
          setFuncionarios(data);
          setTemProxima(false);
        } else {
          setFuncionarios(data.results ?? []);
          if (data.count) setTotalPaginas(Math.ceil(data.count / POR_PAGINA));
          setTemProxima(!!data.next);
        }
      })
      .catch(() => setErro("Não foi possível carregar os funcionários."));
  }, [pagina]);

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(""), 2200);
    return () => clearTimeout(t);
  }, [highlightId]);

  const cargos = [...new Set(funcionarios.map((f) => f.cargo).filter(Boolean))].sort();

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
    if (selecionados.size === funcionariosFiltrados.length) setSelecionados(new Set());
    else setSelecionados(new Set(funcionariosFiltrados.map((f) => f.id_funcionario)));
  }

  async function excluirSelecionados() {
    if (!window.confirm(`Excluir ${selecionados.size} funcionário(s)? Essa ação não pode ser desfeita.`)) return;
    setExcluindo(true);
    try {
      await Promise.all([...selecionados].map((id) => api.delete(`/funcionarios/${id}/`)));
      invalidateCache(pageUrl(pagina));
      setSelecionados(new Set());
      showToast(`${selecionados.size} funcionário(s) excluído(s).`, "success");
      const res = await cachedGet(api, pageUrl(pagina));
      const data = res.data;
      setFuncionarios(Array.isArray(data) ? data : (data.results ?? []));
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
      setFuncionarios(prev => [...prev, ...data]);
      setPaginaMax(nova);
      setTemProxima(!!next);
    } catch { showToast("Erro ao carregar mais.", "error"); }
    finally { setCarregandoMais(false); }
  }

  const opcoesFuncionarios = funcionarios.map((f) => ({
    value: f.id_funcionario,
    label: `${f.id_funcionario} - ${f.nome}`,
  }));

  const funcionariosFiltrados = sortData(
    funcionarios.filter((f) => {
      if (funcionarioSelecionado && f.id_funcionario !== funcionarioSelecionado) return false;
      if (filtroAtivo === "true" && !f.ativo) return false;
      if (filtroAtivo === "false" && f.ativo) return false;
      if (filtroCargo && f.cargo !== filtroCargo) return false;
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
        <h1 className="page-title">Funcionários</h1>
        <Link to="/funcionarios/novo" className="btn-add">+ Novo Funcionário</Link>
      </div>

      {erro && <div className="alert-msg">⚠️ {erro}</div>}
      {funcionarios.length === 0 && !erro && (
        <p className="empty-state">Nenhum funcionário encontrado.</p>
      )}

      {funcionarios.length > 0 && (
        <>
          <FormSelectSearch
            label="Pesquisar funcionário"
            name="funcionarioSelecionado"
            value={funcionarioSelecionado}
            onChange={(e) => setFuncionarioSelecionado(e.target.value)}
            options={opcoesFuncionarios}
            placeholder="Selecione um funcionário..."
            isClearable={true}
          />

          <div className="filter-bar">
            <div className="filter-item">
              <span className="filter-label">Status</span>
              <select className="filter-select" value={filtroAtivo} onChange={(e) => { setFiltroAtivo(e.target.value); setSelecionados(new Set()); }}>
                <option value="">Todos</option>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div className="filter-item">
              <span className="filter-label">Cargo</span>
              <select className="filter-select" value={filtroCargo} onChange={(e) => { setFiltroCargo(e.target.value); setSelecionados(new Set()); }}>
                <option value="">Todos</option>
                {cargos.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {(filtroAtivo || filtroCargo) && (
              <button className="filter-reset" onClick={() => { setFiltroAtivo(""); setFiltroCargo(""); setSelecionados(new Set()); }}>✕ Limpar</button>
            )}
            <span style={{ marginLeft: "auto", fontSize: "0.82rem", color: "var(--text-secondary)", alignSelf: "flex-end" }}>
              {funcionariosFiltrados.length} funcionário{funcionariosFiltrados.length !== 1 ? "s" : ""}
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
                    <input type="checkbox" checked={selecionados.size === funcionariosFiltrados.length && funcionariosFiltrados.length > 0} onChange={toggleTodos} />
                  </th>
                  <Th col="id_funcionario" label="ID" />
                  <Th col="nome" label="Nome" />
                  <Th col="cargo" label="Cargo" />
                  <Th col="turno" label="Turno" />
                  <Th col="salario" label="Salário" />
                  <Th col="horas_semanais" label="Horas/sem" />
                  <Th col="data_admissao" label="Admissão" />
                  <Th col="ativo" label="Ativo" />
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {funcionariosFiltrados.map((f) => {
                  const sel = selecionados.has(f.id_funcionario);
                  return (
                    <tr key={f.id_funcionario} className={[sel ? "row-selected" : "", f.id_funcionario === highlightId ? "row-highlight" : ""].filter(Boolean).join(" ")} onDoubleClick={() => navigate(`/funcionarios/${f.id_funcionario}/editar`)}>
                      <td className="col-check">
                        <input type="checkbox" checked={sel} onChange={() => toggleSelecionado(f.id_funcionario)} />
                      </td>
                      <td>
                        <span className="copy-id" onClick={() => copiarId(f.id_funcionario)} title="Clique para copiar">
                          {f.id_funcionario}
                          {copiado === f.id_funcionario && <span className="copy-id-tooltip">Copiado!</span>}
                        </span>
                      </td>
                      <td>{f.nome}</td>
                      <td>{f.cargo}</td>
                      <td>{f.turno}</td>
                      <td style={{ color: "var(--accent-green)" }}>{formatarMoeda(f.salario)}</td>
                      <td>{f.horas_semanais}h</td>
                      <td>{formatarData(f.data_admissao)}</td>
                      <td>
                        <span className={`badge ${f.ativo ? "badge-green" : "badge-gray"}`}>
                          {f.ativo ? "✓ Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/funcionarios/${f.id_funcionario}/editar`}>Editar</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button className="pagination-btn" onClick={() => setPagina(pagina - 1)} disabled={pagina <= 1}>← Anterior</button>
            <span className="pagination-info">Página {pagina} de {totalPaginas}</span>
            <button className="pagination-btn" onClick={() => setPagina(pagina + 1)} disabled={pagina >= totalPaginas}>Próxima →</button>
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

export default Funcionarios;
