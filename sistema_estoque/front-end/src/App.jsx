import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import Vendas from "./pages/vendas";
import Clientes from "./pages/clientes";
import Relatorios from "./pages/relatorio";
import Produtos from "./pages/produtos";
import Estoques from "./pages/estoques";
import Fornecedores from "./pages/fornecedores";
import Funcionarios from "./pages/funcionarios";
import Compras from "./pages/compras";
import ItensCompra from "./pages/itensCompra";
import Despesas from "./pages/despesas";
import ItensVenda from "./pages/itensvenda";
import CadastrarCliente from "./pages/cadastrarcliente";
import CadastrarFuncionario from "./pages/cadastrarfuncionario";
import CadastrarDespesa from "./pages/cadastrardespesa";
import CadastrarFornecedor from "./pages/cadastrarfornecedor";
import CadastrarCompra from "./pages/cadastrarcompra";
import CadastrarItemCompra from "./pages/cadastraritemcompra";
import CadastrarProdutoEstoque from "./pages/cadastrarprodutoestoque";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vendas" element={<Vendas />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/estoques" element={<Estoques />} />
        <Route path="/fornecedores" element={<Fornecedores />} />
        <Route path="/funcionarios" element={<Funcionarios />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/itens-compra" element={<ItensCompra />} />
        <Route path="/despesas" element={<Despesas />} />
        <Route path="/itens-venda" element={<ItensVenda />} />
        <Route path="/clientes/novo" element={<CadastrarCliente/>} />
        <Route path="/funcionarios/novo" element={<CadastrarFuncionario/>} />
        <Route path="/despesas/novo" element={<CadastrarDespesa/>} />
        <Route path="/fornecedores/novo" element={<CadastrarFornecedor/>} />
        <Route path ="/compras/novo" element={<CadastrarCompra/>} />
        <Route path ="/itens-compra/novo" element={<CadastrarItemCompra/>} />
        <Route path ="/produtos/novo" element={<CadastrarProdutoEstoque/>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;