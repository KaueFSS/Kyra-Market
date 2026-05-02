import { Link } from "react-router-dom";

const secoes = [
  {
    titulo: "Visão Geral",
    itens: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Relatórios", to: "/relatorios" },
    ],
  },
  {
    titulo: "Vendas",
    itens: [
      { label: "Vendas", to: "/vendas" },
      { label: "Nova Venda", to: "/vendas/novo" },
      { label: "Itens de Venda", to: "/itens-venda" },
      { label: "Novo Item de Venda", to: "/itens-vendas/novo" },
    ],
  },
  {
    titulo: "Compras",
    itens: [
      { label: "Compras", to: "/compras" },
      { label: "Nova Compra", to: "/compras/novo" },
      { label: "Itens de Compra", to: "/itens-compra" },
      { label: "Novo Item de Compra", to: "/itens-compra/novo" },
    ],
  },
  {
    titulo: "Estoque & Produtos",
    itens: [
      { label: "Produtos", to: "/produtos" },
      { label: "Novo Produto", to: "/produtos/novo" },
      { label: "Estoques", to: "/estoques" },
    ],
  },
  {
    titulo: "Pessoas",
    itens: [
      { label: "Clientes", to: "/clientes" },
      { label: "Novo Cliente", to: "/clientes/novo" },
      { label: "Funcionários", to: "/funcionarios" },
      { label: "Novo Funcionário", to: "/funcionarios/novo" },
    ],
  },
  {
    titulo: "Fornecedores & Despesas",
    itens: [
      { label: "Fornecedores", to: "/fornecedores" },
      { label: "Novo Fornecedor", to: "/fornecedores/novo" },
      { label: "Despesas", to: "/despesas" },
      { label: "Nova Despesa", to: "/despesas/novo" },
    ],
  },
];

function Home() {
  return (
    <div style={{ color: "white", padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "30px" }}>Menu</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "30px" }}>
        {secoes.map((secao) => (
          <div key={secao.titulo}>
            <h3 style={{ color: "#aaa", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
              {secao.titulo}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {secao.itens.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    color: "white",
                    textDecoration: "none",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    backgroundColor: "#1f1f2e",
                    fontSize: "0.95rem",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
