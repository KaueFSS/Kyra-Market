import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCachedSection } from "../utils/apiCache";

const SECTIONS = [
  {
    url: "/clientes/?page=1",
    tipo: "Cliente",
    idField: "id_cliente",
    busca: (item, q) => [item.nome, item.telefone].some(f => String(f||"").toLowerCase().includes(q)),
    label: (item) => item.nome,
    sub:   (item) => item.telefone || item.bairro || "",
    link:  (item) => `/clientes/${item.id_cliente}/editar`,
  },
  {
    url: "/produtos/?page=1",
    tipo: "Produto",
    idField: "id_produto",
    busca: (item, q) => [item.nome, item.categoria, item.marca].some(f => String(f||"").toLowerCase().includes(q)),
    label: (item) => item.nome,
    sub:   (item) => [item.categoria, item.marca].filter(Boolean).join(" · "),
    link:  (item) => `/produtos/${item.id_produto}/editar`,
  },
  {
    url: "/fornecedores/?page=1",
    tipo: "Fornecedor",
    idField: "id_fornecedor",
    busca: (item, q) => [item.razao_social, item.nome_fantasia, item.cnpj, item.cidade].some(f => String(f||"").toLowerCase().includes(q)),
    label: (item) => item.nome_fantasia || item.razao_social,
    sub:   (item) => item.cnpj || "",
    link:  (item) => `/fornecedores/${item.id_fornecedor}/editar`,
  },
  {
    url: "/funcionarios/?page=1",
    tipo: "Funcionário",
    idField: "id_funcionario",
    busca: (item, q) => [item.nome, item.cargo].some(f => String(f||"").toLowerCase().includes(q)),
    label: (item) => item.nome,
    sub:   (item) => item.cargo || "",
    link:  (item) => `/funcionarios/${item.id_funcionario}/editar`,
  },
  {
    url: "/vendas/?page=1",
    tipo: "Venda",
    idField: "id_venda",
    busca: (item, q) => String(item.id_venda||"").toLowerCase().includes(q),
    label: (item) => `Venda ${item.id_venda}`,
    sub:   (item) => `${item.data_venda || ""} · ${item.forma_pagamento || ""}`,
    link:  (item) => `/vendas/${item.id_venda}`,
  },
  {
    url: "/despesas/?page=1",
    tipo: "Despesa",
    idField: "id_despesa",
    busca: (item, q) => [item.categoria, item.descricao].some(f => String(f||"").toLowerCase().includes(q)),
    label: (item) => item.categoria,
    sub:   (item) => item.descricao || "",
    link:  (item) => `/despesas/${item.id_despesa}/editar`,
  },
];

const TIPO_COR = {
  "Cliente":    "badge-blue",
  "Produto":    "badge-green",
  "Fornecedor": "badge-purple",
  "Funcionário":"badge-orange",
  "Venda":      "badge-green",
  "Despesa":    "badge-red",
};

function GlobalSearch({ onClose }) {
  const [query, setQuery]   = useState("");
  const [selIdx, setSelIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = query.length >= 2
    ? SECTIONS.flatMap(sec => {
        const q = query.toLowerCase();
        return getCachedSection(sec.url)
          .filter(item => sec.busca(item, q))
          .slice(0, 4)
          .map(item => ({
            tipo: sec.tipo,
            label: sec.label(item),
            sub:   sec.sub(item),
            link:  sec.link(item),
          }));
      })
    : [];

  useEffect(() => setSelIdx(0), [query]);

  function ir(link) { navigate(link); onClose(); }

  function handleKey(e) {
    if (e.key === "ArrowDown")  { e.preventDefault(); setSelIdx(i => Math.min(i+1, results.length-1)); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setSelIdx(i => Math.max(i-1, 0)); }
    if (e.key === "Enter" && results[selIdx]) ir(results[selIdx].link);
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="gsearch-overlay" onMouseDown={onClose}>
      <div className="gsearch-modal" onMouseDown={e => e.stopPropagation()}>

        <div className="gsearch-header">
          <span className="gsearch-icon">🔍</span>
          <input
            ref={inputRef}
            className="gsearch-input"
            placeholder="Buscar clientes, produtos, fornecedores, vendas…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          {query && (
            <button className="gsearch-clear" onClick={() => { setQuery(""); inputRef.current?.focus(); }}>✕</button>
          )}
        </div>

        {query.length >= 2 ? (
          <div className="gsearch-results">
            {results.length === 0 ? (
              <div className="gsearch-empty">Nenhum resultado para <strong>"{query}"</strong></div>
            ) : (
              results.map((r, i) => (
                <div
                  key={i}
                  className={`gsearch-result${i === selIdx ? " gsearch-result-sel" : ""}`}
                  onClick={() => ir(r.link)}
                  onMouseEnter={() => setSelIdx(i)}
                >
                  <span className={`badge ${TIPO_COR[r.tipo] || "badge-gray"} gsearch-badge`}>{r.tipo}</span>
                  <div className="gsearch-result-text">
                    <span className="gsearch-result-label">{r.label}</span>
                    {r.sub && <span className="gsearch-result-sub">{r.sub}</span>}
                  </div>
                  <span className="gsearch-result-arrow">→</span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="gsearch-hint">
            Digite 2+ caracteres para buscar &nbsp;·&nbsp;
            <kbd>↑↓</kbd> navegar &nbsp;·&nbsp;
            <kbd>Enter</kbd> abrir &nbsp;·&nbsp;
            <kbd>Esc</kbd> fechar
          </div>
        )}
      </div>
    </div>
  );
}

export default GlobalSearch;
