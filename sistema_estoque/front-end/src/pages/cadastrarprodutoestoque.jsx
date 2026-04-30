import { useState } from "react";
import FormInput from "../components/FormInput";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado } from "../services/crudService";

function CadastrarProdutoEstoque() {
    const hoje = new Date().toISOString().split("T")[0];

    const [produto, setProduto] = useState({
          id_produto: "",
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

    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");

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

        const dadosProdutoParaEnviar = {
        ...produto,
        preco: parseFloat(produto.preco),
        };

        const idEstoqueGerado = produto.id_produto.replace("PROD", "EST");

        const dadosEstoqueParaEnviar = {
        ...estoque,
        produto: produto.id_produto,
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
                id_produto: "",
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
                    label="ID do Produto"
                    name="id_produto"
                    value={produto.id_produto}
                    onChange={alterarCampoProduto}
                    required={true}
                    placeholder="Ex: PROD001"
                />

                <FormInput
                    label="Nome do Produto"
                    name="nome"
                    value={produto.nome}
                    onChange={alterarCampoProduto}
                    required={true}
                    placeholder="Ex: Pepsi Twist 2L"
                />

                <FormInput
                    label="ID do Fornecedor"
                    name="fornecedor"
                    value={produto.fornecedor}
                    onChange={alterarCampoProduto}
                    required={true}
                    placeholder="Ex: FORN001"
                />

                <FormInput
                    label="Marca"
                    name="marca"
                    value={produto.marca}
                    onChange={alterarCampoProduto}
                    required={true}
                    placeholder="Ex: CocaCola"
                />

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

