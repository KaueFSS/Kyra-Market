import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import Vendas from "./pages/vendas";
import DetalhesVenda from "./pages/detalhesvenda";
import Clientes from "./pages/clientes";
import Produtos from "./pages/produtos";
import Estoques from "./pages/estoques";
import Fornecedores from "./pages/fornecedores";
import Funcionarios from "./pages/funcionarios";
import Compras from "./pages/compras";
import DetalhesCompra from "./pages/detalhescompra";
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
import CadastrarVendas from "./pages/cadastrarvendas";
import CadastrarItemVenda from "./pages/cadastraritemvenda";
import EditarProduto from "./pages/editarproduto";
import EditarEstoque from "./pages/editarestoque";
import EditarFornecedor from "./pages/editarfornecedor";
import EditarCliente from "./pages/editarcliente";
import EditarFuncionario from "./pages/editarfuncionario";
import EditarCompra from "./pages/editarcompra";
import EditarDespesa from "./pages/editardespesa";
import EditarVenda from "./pages/editarvenda";
import EditarItemCompra from "./pages/editaritemcompra";
import EditarItemVenda from "./pages/editaritemvenda";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/vendas/:id" element={<DetalhesVenda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/estoques" element={<Estoques />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/funcionarios" element={<Funcionarios />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/compras/:id" element={<DetalhesCompra />} />
          <Route path="/itens-compra" element={<ItensCompra />} />
          <Route path="/despesas" element={<Despesas />} />
          <Route path="/itens-venda" element={<ItensVenda />} />
          <Route path="/clientes/novo" element={<CadastrarCliente />} />
          <Route path="/funcionarios/novo" element={<CadastrarFuncionario />} />
          <Route path="/despesas/novo" element={<CadastrarDespesa />} />
          <Route path="/fornecedores/novo" element={<CadastrarFornecedor />} />
          <Route path="/compras/novo" element={<CadastrarCompra />} />
          <Route path="/itens-compra/novo" element={<CadastrarItemCompra />} />
          <Route path="/produtos/novo" element={<CadastrarProdutoEstoque />} />
          <Route path="/vendas/novo" element={<CadastrarVendas />} />
          <Route path="/itens-vendas/novo" element={<CadastrarItemVenda />} />
          <Route path="/produtos/:id/editar" element={<EditarProduto />} />
          <Route path="/estoques/:id/editar" element={<EditarEstoque />} />
          <Route path="/fornecedores/:id/editar" element={<EditarFornecedor />} />
          <Route path="/clientes/:id/editar" element={<EditarCliente />} />
          <Route path="/funcionarios/:id/editar" element={<EditarFuncionario />} />
          <Route path="/compras/:id/editar" element={<EditarCompra />} />
          <Route path="/despesas/:id/editar" element={<EditarDespesa />} />
          <Route path="/vendas/:id/editar" element={<EditarVenda />} />
          <Route path="/itens-compra/:id/editar" element={<EditarItemCompra />} />
          <Route path="/itens-venda/:id/editar" element={<EditarItemVenda />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
