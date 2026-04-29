import { useState } from "react";
import FormInput from "../components/FormInput";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import { criarDado } from "../services/crudService";

function CadastrarProduto() {
    const [produto, setProduto] = useState({
          id_produto: "",
          fornecedor: "",
          nome: "",
          marca: "",
          categoria: "",
          subcategoria: "",
          unidade: "",
          ncm: "",
          cst: "",
          codigo_barras: "",
          preco: "",
    })

    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");

    function alterarCampo(event) {
        const { name, value } = event.target;

         setProduto({
            ...produto,
            [name]: value,
         });
    }

    async function salvarProduto(event) {
        event.preventDefault();

        const dadosParaEnviar = {
        ...produto,
        preco: parseFloat(produto.preco),
        };

        try {
            await criarDado("/produtos/", dadosParaEnviar);

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
                ncm: "",
                cst: "",
                codigo_barras: "",
                preco: "",
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

            <form onSubmit={salvarProduto}>
                <FormInput
                    label="ID do Produto"
                    name="id_produto"
                    value={produto.id_produto}
                    onChange={alterarCampo}
                    required={true}
                    placeholder="Ex: PROD001"
                />

                <FormInput
                    label="Nome do Produto"
                    name="nome"
                    value={produto.nome}
                    onChange={alterarCampo}
                    required={true}
                    placeholder="Ex: Pepsi Twist 2L"
                />

                <FormInput
                    label="ID do Fornecedor"
                    name="fornecedor"
                    value={produto.fornecedor}
                    onChange={alterarCampo}
                    required={true}
                    placeholder="Ex: FORN001"
                />

                <FormInput
                    label="Marca"
                    name="marca"
                    value={produto.marca}
                    onChange={alterarCampo}
                    required={true}
                    placeholder="Ex: CocaCola"
                />

                <FormInput
                    label="Categoria"
                    name="categoria"
                    value={produto.categoria}
                    onChange={alterarCampo}
                    placeholder="Ex: Alimentos"
                />

                <FormInput
                    label="Subcategoria"
                    name="subcategoria"
                    value={produto.subcategoria}
                    onChange={alterarCampo}
                    placeholder="Ex: Refrigerantes"
                />

                <FormInput
                    label="Unidade"
                    name="unidade"
                    value={produto.unidade}
                    onChange={alterarCampo}
                    placeholder="Ex: un, kg, cx"
                />

                <FormInput
                    label="NCM"
                    name="ncm"
                    value={produto.ncm}
                    onChange={alterarCampo}
                />

                <FormInput
                    label="CST"
                    name="cst"
                    value={produto.cst}
                    onChange={alterarCampo}
                />

                <FormInput
                    label="Código de Barras"
                    name="codigo_barras"
                    value={produto.codigo_barras}
                    onChange={alterarCampo}
                />

                <FormInput
                    label="Preço"
                    name="preco"
                    type="number"
                    step="0.01"
                    value={produto.preco}
                    onChange={alterarCampo}
                    required={true}
                    placeholder="Ex: 12.50"
                />

                <BotaoSalvar texto="Cadastrar Produto"/>
            </form>
        </div>
    );
}

export default CadastrarProduto;

