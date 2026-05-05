import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import api from "../services/api";
import { cachedGet, prefetch } from "../utils/apiCache";

const links = [
  { label: "Home",          to: "/",             icon: "🏠", end: true,  prefetchUrl: null },
  { label: "Vendas",        to: "/vendas",        icon: "🛒", end: false, prefetchUrl: "/vendas/?page=1" },
  { label: "Compras",       to: "/compras",       icon: "📦", end: false, prefetchUrl: "/compras/?page=1" },
  { label: "Produtos",      to: "/produtos",      icon: "🏷️", end: false, prefetchUrl: "/produtos/?page=1" },
  { label: "Estoques",      to: "/estoques",      icon: "📋", end: false, prefetchUrl: "/estoques/?page=1" },
  { label: "Clientes",      to: "/clientes",      icon: "👥", end: false, prefetchUrl: "/clientes/?page=1" },
  { label: "Funcionários",  to: "/funcionarios",  icon: "👷", end: false, prefetchUrl: "/funcionarios/?page=1" },
  { label: "Fornecedores",  to: "/fornecedores",  icon: "🚚", end: false, prefetchUrl: "/fornecedores/?page=1" },
  { label: "Despesas",      to: "/despesas",      icon: "💸", end: false, prefetchUrl: "/despesas/?page=1" },
];

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
        <div className="nav-brand-icon">
  <img src="/icons/icon-mercado.png" alt="Mercadinho" style={{ width: 45, height: 45, objectFit: "contain", borderRadius: 4 }} />
</div>
        Mercadinho
      </Link>

      <div className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            onMouseEnter={() => link.prefetchUrl && prefetch(link.prefetchUrl)}
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </div>

      {onOpenSearch && (
        <button className="nav-search-btn" onClick={onOpenSearch} title="Busca global (Ctrl+K)">
          🔍 <span className="nav-search-hint">Ctrl+K</span>
        </button>
      )}

      {usuario && (
        <div className="nav-user">
          <div className="nav-user-avatar">👤</div>
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
