import { useState, useEffect } from "react";
import FormInput from "../components/FormInput";
import FormSelectSearch from "../components/FormSelectSearch";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";
import { gerarIdSequencial } from "../utils/gerarIdSequencial";

function CadastrarProdutoEstoque() {
  const hoje = new Date().toISOString().split("T")[0];

  const [produto, setProduto] = useState({
    fornecedor: "", nome: "", marca: "", categoria: "", subcategoria: "",
    unidade: "", codigo_barras: "", preco_custo: "", preco: "",
  });

  const [estoque, setEstoque] = useState({
    quantidade_atual: "", quantidade_minima: "", dt_ultima_entrada: hoje, dt_ultima_saida: "",
  });

  const [fornecedores, setFornecedores] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    listarDados("/fornecedores/").then((data) => setFornecedores(data.results || data));
    listarDados("/produtos/").then((data) => setProdutos(data.results || data));
  }, []);

  function alterarCampoProduto(event) {
    const { name, value } = event.target;
    setProduto({ ...produto, [name]: value });
  }

  function alterarCampoEstoque(event) {
    const { name, value } = event.target;
    setEstoque({ ...estoque, [name]: value });
  }

  async function salvarProdutoEstoque(event) {
    event.preventDefault();
    const idProdutoGerado = gerarIdSequencial(produtos, "id_produto", "PRD");
    const idEstoqueGerado = `EST${idProdutoGerado.slice(3)}`;

    try {
      const produtoCriado = await criarDado("/produtos/", {
        ...produto,
        id_produto: idProdutoGerado,
        preco: parseFloat(produto.preco),
      });
      await criarDado("/estoques/", {
        ...estoque,
        produto: idProdutoGerado,
        id_estoque: idEstoqueGerado,
        quantidade_atual: parseInt(estoque.quantidade_atual),
        quantidade_minima: parseInt(estoque.quantidade_minima),
        dt_ultima_saida: estoque.dt_ultima_saida || null,
        dt_ultima_entrada: estoque.dt_ultima_entrada || hoje,
      });
      setProdutos((prev) => [...prev, produtoCriado]);
      setMensagem("Produto cadastrado com sucesso!");
      setErro("");
      setProduto({ fornecedor: "", nome: "", marca: "", categoria: "", subcategoria: "", unidade: "", codigo_barras: "", preco_custo: "", preco: "" });
      setEstoque({ quantidade_atual: "", quantidade_minima: "", dt_ultima_entrada: hoje, dt_ultima_saida: "" });
    } catch (error) {
      setErro("Erro ao cadastrar produto. Verifique os campos.");
      setMensagem("");
    }
  }

  const opcoesFornecedores = fornecedores.map((f) => ({
    value: f.id_fornecedor,
    label: `${f.id_fornecedor} - ${f.nome_fantasia || f.razao_social}`,
  }));

  return (
    <div className="page-container">
      <h1 className="page-title">Cadastrar Produto</h1>
      <p className="page-subtitle">Preencha os dados do produto e do estoque inicial.</p>

      <MensagemSucesso mensagem={mensagem} />
      <MensagemErro mensagem={erro} />

      <form onSubmit={salvarProdutoEstoque} className="form-container">
        <div className="form-section">
          <h3 className="form-section-title">Dados do Produto</h3>
          <FormInput label="Nome do Produto" name="nome" value={produto.nome} onChange={alterarCampoProduto} required placeholder="Ex: Pepsi Twist 2L" />
          <FormSelectSearch label="Fornecedor" name="fornecedor" value={produto.fornecedor} onChange={alterarCampoProduto} options={opcoesFornecedores} placeholder="Selecione um fornecedor..." isClearable />
          <FormInput label="Marca" name="marca" value={produto.marca} onChange={alterarCampoProduto} placeholder="Ex: Nestlé, Unilever" />
          <FormInput label="Categoria" name="categoria" value={produto.categoria} onChange={alterarCampoProduto} placeholder="Ex: Alimentos" />
          <FormInput label="Subcategoria" name="subcategoria" value={produto.subcategoria} onChange={alterarCampoProduto} placeholder="Ex: Refrigerantes" />
          <FormInput label="Unidade" name="unidade" value={produto.unidade} onChange={alterarCampoProduto} placeholder="Ex: un, kg, cx" />
          <FormInput label="Código de Barras" name="codigo_barras" value={produto.codigo_barras} onChange={alterarCampoProduto} />
          <FormInput label="Preço de Venda (R$)" name="preco" type="number" step="0.01" value={produto.preco} onChange={alterarCampoProduto} required placeholder="Ex: 12.50" />
          <FormInput label="Preço de Custo (R$)" name="preco_custo" type="number" step="0.01" value={produto.preco_custo} onChange={alterarCampoProduto} required placeholder="Ex: 6.50" />
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Estoque Inicial</h3>
          <FormInput label="Quantidade Atual" name="quantidade_atual" type="number" value={estoque.quantidade_atual} onChange={alterarCampoEstoque} required />
          <FormInput label="Quantidade Mínima" name="quantidade_minima" type="number" value={estoque.quantidade_minima} onChange={alterarCampoEstoque} required />
        </div>

        <div className="form-actions">
          <BotaoSalvar texto="Cadastrar Produto" />
        </div>
      </form>
    </div>
  );
}

export default CadastrarProdutoEstoque;
