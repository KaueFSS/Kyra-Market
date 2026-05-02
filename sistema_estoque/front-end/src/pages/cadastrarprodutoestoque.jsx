import { useState, useEffect } from "react";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado, listarDados } from "../services/crudService";

function gerarIdProduto() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const sufixo = Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `PRD${sufixo}`;
}

function CadastrarProdutoEstoque() {
    const hoje = new Date().toISOString().split("T")[0];

    const [produto, setProduto] = useState({
          fornecedor: "",
          nome: "",
          marca: "",
          categoria: "",
          subcategoria: "",
          unidade: "",
          codigo_barras: "",
          preco_custo: "",
          preco: "",
    })

    const [estoque, setEstoque] = useState({
        id_estoque: produto.id_produto,
        quantidade_atual: "",
        quantidade_minima: "",
        dt_ultima_entrada: hoje,
        dt_ultima_saida: "",
    });

    const [fornecedores, setFornecedores] = useState([]);
    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");

    useEffect(() => {
        listarDados("/fornecedores/").then((data) => setFornecedores(data));
    }, []);

    function alterarCampoProduto(event) {
        const { name, value } = event.target;

         setProduto({
            ...produto,
            [name]: value,
         });
    }

    function alterarCampoEstoque(event) {
        const { name, value } = event.target;

         setEstoque({
            ...estoque,
            [name]: value,
         });
    }

    async function salvarProdutoEstoque(event) {
        event.preventDefault();

        const idProdutoGerado = gerarIdProduto();

        const dadosProdutoParaEnviar = {
        ...produto,
        id_produto: idProdutoGerado,
        preco: parseFloat(produto.preco),
        };

        const idEstoqueGerado = `EST${idProdutoGerado.slice(3)}`;

        const dadosEstoqueParaEnviar = {
        ...estoque,
        produto: idProdutoGerado,
        id_estoque: idEstoqueGerado,
        quantidade_atual: parseInt(estoque.quantidade_atual),
        quantidade_minima: parseInt(estoque.quantidade_minima),
        dt_ultima_saida: estoque.dt_ultima_saida || null,
        dt_ultima_entrada: estoque.dt_ultima_entrada || hoje,
        };

        try {
            await criarDado("/produtos/", dadosProdutoParaEnviar);
            await criarDado("/estoques/", dadosEstoqueParaEnviar);

            setMensagem("Produto cadastrado com sucesso!");
            setErro("");

            setProduto({
                fornecedor: "",
                nome: "",
                marca: "",
                categoria: "",
                subcategoria: "",
                unidade: "",
                codigo_barras: "",
                preco_custo: "",
                preco: "",
            });

            setEstoque({
                id_estoque: idEstoqueGerado,
                produto: produto.id_produto,
                quantidade_atual: "",
                quantidade_minima: "",
                dt_ultima_entrada: hoje,
                dt_ultima_saida: "",
            });
        } 
        
        catch (error) {
            console.error(error.response?.data);
            setErro("Erro ao cadastrar produto. Verifique os campos.");
            setMensagem("");
        }
    }

    return (
        <div style={{ color: "white", padding: "30px" }}>
            <h1>Cadastrar Produto</h1>
            <p>Formulário para cadastrar um novo produto pelo front-end.</p>

            <MensagemSucesso mensagem={mensagem} />
            <MensagemErro mensagem={erro} />

            <form onSubmit={salvarProdutoEstoque}>
                <FormInput
                    label="Nome do Produto"
                    name="nome"
                    value={produto.nome}
                    onChange={alterarCampoProduto}
                    required={true}
                    placeholder="Ex: Pepsi Twist 2L"
                />

                <FormSelect
                    label="Fornecedor"
                    name="fornecedor"
                    value={produto.fornecedor}
                    onChange={alterarCampoProduto}
                    options={fornecedores.map((f) => ({
                        value: f.id_fornecedor,
                        label: f.nome_fantasia || f.razao_social,
                    }))}
                />

                <div style={{ marginBottom: "15px" }}>
                    <label>Marca</label>
                    <br />
                    <input
                        list="lista-marcas"
                        name="marca"
                        value={produto.marca}
                        onChange={alterarCampoProduto}
                        required
                        placeholder="Digite ou selecione a marca"
                        style={{
                            padding: "8px",
                            width: "270px",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                            marginTop: "5px",
                        }}
                    />
                    <datalist id="lista-marcas">
                        {fornecedores.map((f) => (
                            <option key={f.id_fornecedor} value={f.nome_fantasia || f.razao_social} />
                        ))}
                    </datalist>
                </div>

                <FormInput
                    label="Categoria"
                    name="categoria"
                    value={produto.categoria}
                    onChange={alterarCampoProduto}
                    placeholder="Ex: Alimentos"
                />

                <FormInput
                    label="Subcategoria"
                    name="subcategoria"
                    value={produto.subcategoria}
                    onChange={alterarCampoProduto}
                    placeholder="Ex: Refrigerantes"
                />

                <FormInput
                    label="Unidade"
                    name="unidade"
                    value={produto.unidade}
                    onChange={alterarCampoProduto}
                    placeholder="Ex: un, kg, cx"
                />

                <FormInput
                    label="Código de Barras"
                    name="codigo_barras"
                    value={produto.codigo_barras}
                    onChange={alterarCampoProduto}
                />

                <FormInput
                    label="Preço"
                    name="preco"
                    type="number"
                    step="0.01"
                    value={produto.preco}
                    onChange={alterarCampoProduto}
                    required={true}
                    placeholder="Ex: 12.50"
                />

                <FormInput
                    label="Preço Custo"
                    name="preco_custo"
                    type="number"
                    step="0.01"
                    value={produto.preco_custo}
                    onChange={alterarCampoProduto}
                    required={true}
                    placeholder="Ex: 6.50"
                />

                <FormInput
                    label="Quantidade Atual"
                    name="quantidade_atual"
                    type="number"
                    value={estoque.quantidade_atual}
                    onChange={alterarCampoEstoque}
                    required={true}
                />

                <FormInput
                    label="Quantidade mínima"
                    name="quantidade_minima"
                    type="number"
                    value={estoque.quantidade_minima}
                    onChange={alterarCampoEstoque}
                    required={true}
                />

                <BotaoSalvar texto="Cadastrar Produto"/>
            </form>
        </div>
    );
}

export default CadastrarProdutoEstoque;

