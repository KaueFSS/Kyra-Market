import { NavLink } from "react-router-dom";

const links = [
  { label: "Home", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Vendas", to: "/vendas" },
  { label: "Nova Venda", to: "/vendas/novo" },
  { label: "Compras", to: "/compras" },
  { label: "Nova Compra", to: "/compras/novo" },
  { label: "Produtos", to: "/produtos" },
  { label: "Novo Produto", to: "/produtos/novo" },
  { label: "Estoques", to: "/estoques" },
  { label: "Clientes", to: "/clientes" },
  { label: "Novo Cliente", to: "/clientes/novo" },
  { label: "Funcionarios", to: "/funcionarios" },
  { label: "Novo Funcionario", to: "/funcionarios/novo" },
  { label: "Fornecedores", to: "/fornecedores" },
  { label: "Novo Fornecedor", to: "/fornecedores/novo" },
  { label: "Despesas", to: "/despesas" },
  { label: "Nova Despesa", to: "/despesas/novo" },
];

function BarraNavegacao() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 18px",
        backgroundColor: "#111827",
        borderBottom: "1px solid #2a2a3e",
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
      }}
    >
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end
          style={({ isActive }) => ({
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "34px",
            padding: "7px 12px",
            borderRadius: "8px",
            border: isActive ? "1px solid #60a5fa" : "1px solid #374151",
            backgroundColor: isActive ? "#1f6feb" : "#1f2937",
            color: "white",
            fontSize: "14px",
            lineHeight: "1",
            textDecoration: "none",
            whiteSpace: "nowrap",
          })}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default BarraNavegacao;
