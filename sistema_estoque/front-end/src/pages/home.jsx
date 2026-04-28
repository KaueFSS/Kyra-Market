import { Link } from "react-router-dom";

function Home() {
  const linkStyle = {
    display: "inline-block",
    padding: "10px 16px",
    backgroundColor: "#1f1f2e",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    marginBottom: "10px",
    width: "200px",
    textAlign: "center",
  };

  return (
    <div style={{ color: "white", padding: "30px" }}>
      <h1>Home</h1> 
      <p>Navegação básica do sistema</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
        <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
        <Link to="/produtos" style={linkStyle}>Produtos</Link>
        <Link to="/estoques" style={linkStyle}>Estoques</Link>
        <Link to="/fornecedores" style={linkStyle}>Fornecedores</Link>
        <Link to="/funcionarios" style={linkStyle}>Funcionários</Link>
        <Link to="/compras" style={linkStyle}>Compras</Link>
        <Link to="/itens-compra" style={linkStyle}>Itens de Compra</Link>
        <Link to="/despesas" style={linkStyle}>Despesas</Link>
        <Link to="/clientes" style={linkStyle}>Clientes</Link>
        <Link to="/vendas" style={linkStyle}>Vendas</Link>
        <Link to="/relatorios" style={linkStyle}>Relatórios</Link>
        <Link to="/itens-venda" style={linkStyle}>Itens de Venda</Link>
        <Link to="/clientes/novo" style={linkStyle}>Cadastrar Cliente</Link>
      </div>
    </div>
  );
}

export default Home;