import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// Página inicial: import normal (precisa ficar instantânea ao abrir)
import Home from "./pages/home";

// Demais páginas: lazy loading (cada uma vira um chunk separado).
// Bundle inicial pequeno, navegação carrega só a página visitada.
const Dashboard               = lazy(() => import("./pages/dashboard"));
const Vendas                  = lazy(() => import("./pages/vendas"));
const DetalhesVenda           = lazy(() => import("./pages/detalhesvenda"));
const Clientes                = lazy(() => import("./pages/clientes"));
const Produtos                = lazy(() => import("./pages/produtos"));
const Estoques                = lazy(() => import("./pages/estoques"));
const Fornecedores            = lazy(() => import("./pages/fornecedores"));
const Funcionarios            = lazy(() => import("./pages/funcionarios"));
const Compras                 = lazy(() => import("./pages/compras"));
const DetalhesCompra          = lazy(() => import("./pages/detalhescompra"));
const ItensCompra             = lazy(() => import("./pages/itensCompra"));
const Despesas                = lazy(() => import("./pages/despesas"));
const ItensVenda              = lazy(() => import("./pages/itensvenda"));
const CadastrarCliente        = lazy(() => import("./pages/cadastrarcliente"));
const CadastrarFuncionario    = lazy(() => import("./pages/cadastrarfuncionario"));
const CadastrarDespesa        = lazy(() => import("./pages/cadastrardespesa"));
const CadastrarFornecedor     = lazy(() => import("./pages/cadastrarfornecedor"));
const CadastrarCompra         = lazy(() => import("./pages/cadastrarcompra"));
const CadastrarItemCompra     = lazy(() => import("./pages/cadastraritemcompra"));
const CadastrarProdutoEstoque = lazy(() => import("./pages/cadastrarprodutoestoque"));
const CadastrarVendas         = lazy(() => import("./pages/cadastrarvendas"));
const CadastrarItemVenda      = lazy(() => import("./pages/cadastraritemvenda"));
const EditarProduto           = lazy(() => import("./pages/editarproduto"));
const EditarEstoque           = lazy(() => import("./pages/editarestoque"));
const EditarFornecedor        = lazy(() => import("./pages/editarfornecedor"));
const EditarCliente           = lazy(() => import("./pages/editarcliente"));
const EditarFuncionario       = lazy(() => import("./pages/editarfuncionario"));
const EditarCompra            = lazy(() => import("./pages/editarcompra"));
const EditarDespesa           = lazy(() => import("./pages/editardespesa"));
const EditarVenda             = lazy(() => import("./pages/editarvenda"));
const EditarItemCompra        = lazy(() => import("./pages/editaritemcompra"));
const EditarItemVenda         = lazy(() => import("./pages/editaritemvenda"));

function PageFallback() {
  return (
    <div className="page-container">
      <p className="loading-text">Carregando...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageFallback />}>
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
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
