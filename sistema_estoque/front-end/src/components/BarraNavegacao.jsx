import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import api from "../services/api";
import { cachedGet, prefetch } from "../utils/apiCache";
import {
  IconHome, IconVendas, IconCompras, IconProdutos, IconEstoques,
  IconClientes, IconFuncionarios, IconFornecedores, IconDespesas, IconSearch,
} from "./Icons";

const links = [
  { label: "Home",          to: "/",             Icon: IconHome,         end: true,  prefetchUrl: null,                    chunk: null },
  { label: "Vendas",        to: "/vendas",        Icon: IconVendas,       end: false, prefetchUrl: "/vendas/?page=1",       chunk: () => import("../pages/vendas") },
  { label: "Compras",       to: "/compras",       Icon: IconCompras,      end: false, prefetchUrl: "/compras/?page=1",      chunk: () => import("../pages/compras") },
  { label: "Produtos",      to: "/produtos",      Icon: IconProdutos,     end: false, prefetchUrl: "/produtos/?page=1",     chunk: () => import("../pages/produtos") },
  { label: "Estoques",      to: "/estoques",      Icon: IconEstoques,     end: false, prefetchUrl: "/estoques/?page=1",     chunk: () => import("../pages/estoques") },
  { label: "Clientes",      to: "/clientes",      Icon: IconClientes,     end: false, prefetchUrl: "/clientes/?page=1",     chunk: () => import("../pages/clientes") },
  { label: "Funcionários",  to: "/funcionarios",  Icon: IconFuncionarios, end: false, prefetchUrl: "/funcionarios/?page=1", chunk: () => import("../pages/funcionarios") },
  { label: "Fornecedores",  to: "/fornecedores",  Icon: IconFornecedores, end: false, prefetchUrl: "/fornecedores/?page=1", chunk: () => import("../pages/fornecedores") },
  { label: "Despesas",      to: "/despesas",      Icon: IconDespesas,     end: false, prefetchUrl: "/despesas/?page=1",     chunk: () => import("../pages/despesas") },
];

const prefetched = new Set();
function prefetchChunk(loader) {
  if (!loader || prefetched.has(loader)) return;
  prefetched.add(loader);
  loader().catch(() => prefetched.delete(loader));
}

function BarraNavegacao({ onOpenSearch }) {
  const [usuario, setUsuario] = useState(null);
  useEffect(() => {
    cachedGet(api, "/funcionarios/FUNC004/")
      .then((res) => setUsuario(res.data))
      .catch(() => {});
  }, []);

  return (
    <nav className="nav-bar">
      <Link to="/" className="nav-brand">
        <img src="/icons/icon-mercado.png" alt="Mercadinho" className="nav-brand-img" />
        <span className="nav-brand-text">Mercadinho</span>
      </Link>

      <div className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            onMouseEnter={() => {
              if (link.prefetchUrl) prefetch(link.prefetchUrl);
              prefetchChunk(link.chunk);
            }}
            title={link.label}
          >
            <span className="nav-link-icon"><link.Icon /></span>
            <span className="nav-link-label">{link.label}</span>
          </NavLink>
        ))}
      </div>

      {onOpenSearch && (
        <button className="nav-search-btn" onClick={onOpenSearch} title="Busca global (Ctrl+K)">
          <IconSearch width="16" height="16" />
          <span className="nav-search-hint">Ctrl K</span>
        </button>
      )}

      {usuario && (
        <div className="nav-user">
          <div className="nav-user-avatar">
            {usuario.nome.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase()}
          </div>
          <div className="nav-user-info">
            <span className="nav-user-greeting">
              Olá, <strong>{usuario.nome.split(" ")[0]}</strong>
            </span>
            <span className="nav-user-role">{usuario.cargo || "Admin"}</span>
          </div>
        </div>
      )}
    </nav>
  );
}

export default BarraNavegacao;
