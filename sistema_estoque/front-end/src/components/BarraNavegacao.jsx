import { useEffect, useState } from "react";
import { asset, MODO_DEMO } from "../demo/modo";
import { confirmDialog } from "../utils/confirmDialog";
import { Link, NavLink } from "react-router-dom";
import api from "../services/api";
import { cachedGet, prefetch } from "../utils/apiCache";
import {
  IconHome, IconVendas, IconCompras, IconProdutos, IconEstoques, IconGrafico,
  IconClientes, IconFuncionarios, IconFornecedores, IconDespesas, IconSearch,
} from "./Icons";

// Menu lateral agrupado por área do negócio
const grupos = [
  {
    titulo: null,
    links: [
      { label: "Início",       to: "/",             Icon: IconHome,         end: true,  prefetchUrl: null,                    chunk: null },
      { label: "Análises",     to: "/dashboard",    Icon: IconGrafico,      end: false, prefetchUrl: null,                    chunk: () => import("../pages/dashboard") },
    ],
  },
  {
    titulo: "Operação",
    links: [
      { label: "Vendas",       to: "/vendas",       Icon: IconVendas,       end: false, prefetchUrl: "/vendas/?page=1",       chunk: () => import("../pages/vendas") },
      { label: "Compras",      to: "/compras",      Icon: IconCompras,      end: false, prefetchUrl: "/compras/?page=1",      chunk: () => import("../pages/compras") },
    ],
  },
  {
    titulo: "Catálogo",
    links: [
      { label: "Produtos",     to: "/produtos",     Icon: IconProdutos,     end: false, prefetchUrl: "/produtos/?page=1",     chunk: () => import("../pages/produtos") },
      { label: "Estoque",      to: "/estoques",     Icon: IconEstoques,     end: false, prefetchUrl: "/estoques/?page=1",     chunk: () => import("../pages/estoques") },
    ],
  },
  {
    titulo: "Pessoas",
    links: [
      { label: "Clientes",     to: "/clientes",     Icon: IconClientes,     end: false, prefetchUrl: "/clientes/?page=1",     chunk: () => import("../pages/clientes") },
      { label: "Fornecedores", to: "/fornecedores", Icon: IconFornecedores, end: false, prefetchUrl: "/fornecedores/?page=1", chunk: () => import("../pages/fornecedores") },
      { label: "Funcionários", to: "/funcionarios", Icon: IconFuncionarios, end: false, prefetchUrl: "/funcionarios/?page=1", chunk: () => import("../pages/funcionarios") },
    ],
  },
  {
    titulo: "Financeiro",
    links: [
      { label: "Despesas",     to: "/despesas",     Icon: IconDespesas,     end: false, prefetchUrl: "/despesas/?page=1",     chunk: () => import("../pages/despesas") },
    ],
  },
];

const prefetched = new Set();
function prefetchChunk(loader) {
  if (!loader || prefetched.has(loader)) return;
  prefetched.add(loader);
  loader().catch(() => prefetched.delete(loader));
}

async function restaurarDemo() {
  const ok = await confirmDialog({
    title: "Restaurar os dados da demonstração?",
    message: "Vendas, cadastros e alterações feitas aqui serão descartados e os dados de exemplo voltam ao estado inicial.",
    confirmText: "Restaurar",
    danger: true,
  });
  if (!ok) return;
  if (import.meta.env.VITE_DEMO === "1") (await import("../demo/backend")).restaurarDemo();
  window.location.reload();
}

function BarraNavegacao({ onOpenSearch }) {
  const [usuario, setUsuario] = useState(null);
  useEffect(() => {
    cachedGet(api, "/funcionarios/FUNC004/")
      .then((res) => setUsuario(res.data))
      .catch(() => {});
  }, []);

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-brand">
        <img src={asset("kyra-market.svg")} alt="" className="sidebar-brand-img" />
        <span className="sidebar-brand-text">Kyra Market</span>
      </Link>

      {onOpenSearch && (
        <button className="sidebar-search" onClick={onOpenSearch} title="Busca global (Ctrl+K)">
          <IconSearch width="16" height="16" />
          <span className="sidebar-search-text">Buscar</span>
          <kbd className="sidebar-search-hint">Ctrl K</kbd>
        </button>
      )}

      <nav className="sidebar-nav">
        {grupos.map((grupo, i) => (
          <div key={grupo.titulo || i} className="sidebar-group">
            {grupo.titulo && <span className="sidebar-group-title">{grupo.titulo}</span>}
            {grupo.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                onMouseEnter={() => {
                  if (link.prefetchUrl) prefetch(link.prefetchUrl);
                  prefetchChunk(link.chunk);
                }}
                title={link.label}
              >
                <link.Icon width={18} height={18} />
                <span className="sidebar-link-label">{link.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {MODO_DEMO && (
        <div className="sidebar-demo">
          <span className="sidebar-demo-title">Demonstração</span>
          <span className="sidebar-demo-text">Pode testar à vontade: os dados ficam só neste navegador.</span>
          <button type="button" className="sidebar-demo-reset" onClick={restaurarDemo}>Restaurar dados</button>
        </div>
      )}

      {usuario && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {usuario.nome.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{usuario.nome}</span>
            <span className="sidebar-user-role">{usuario.cargo || "Admin"}</span>
          </div>
        </div>
      )}
    </aside>
  );
}

export default BarraNavegacao;
