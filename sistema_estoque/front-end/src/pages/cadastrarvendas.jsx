import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import BotaoSalvar from "../components/BotaoSalvar";
import MensagemErro from "../components/MensagemErro";
import MensagemSucesso from "../components/MensagemSucesso";
import Select from "react-select";
import { useState, useEffect } from "react";
import { criarDado, listarDados, atualizarDado } from "../services/crudService";
import FormSelectSearch from "../components/FormSelectSearch";

function CadastrarVendas() {
    const [vendas, setVendas] = useState({
        id_venda: "",
        data_venda: new Date().toISOString().split("T")[0],
        hora: "",
        forma_pagamento: "",
        funcionario: "",
        cliente: "",
    });

    const [itemAtual, setItemAtual] = useState({
        produto: "",
        quantidade_vendida: "",
        desconto: "0",
    });

    const [itens, setItens] = useState([]);
    
    const [produtos, setProdutos] = useState([]);
      
    const [estoques, setEstoques] = useState([]);

    const [clientes, setClientes] = useState([]);
    
    const [funcionarios, setFuncionarios] = useState([]);

    const [mensagem, setMensagem] = useState("");
    const [erro, setErro] = useState("");

    useEffect(() => {
        async function carregarDados() {
            try {
                const prod = await listarDados("/produtos/");
                const est = await listarDados("/estoques/");
                const cli = await listarDados("/clientes/");
                const func = await listarDados("/funcionarios/");

                setProdutos(prod.results || prod);
                setEstoques(est.results || est);
                setClientes(cli.results || cli);
                setFuncionarios(func.results || func);
            } catch (err) {
                console.error(err);
            }
        }
        carregarDados();
    }, []);

    function alterarCampoVenda(event) {
        const { name, value } = event.target;
        setVendas({ ...vendas, [name]: value });
    }

    function alterarCampoItem(event) {
        const { name, value } = event.target;

        const novoItem = {
            ...itemAtual,
            [name]: value,
        };

        setItemAtual(novoItem);
    }

    function arredondarMoeda(valor) {
        return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
    }

    function adicionarItem() {
        const qtdNum = parseInt(itemAtual.quantidade_vendida, 10) || 0;
        const descNum = arredondarMoeda(itemAtual.desconto) || 0;

        const produtoSelecionado = produtos.find(
            (prod) => prod.id_produto === itemAtual.produto
        );

        if (!itemAtual.produto) {
            setErro("Selecione um produto.");
            return;
        }

        if (!produtoSelecionado) {
            setErro("Produto inválido.");
            return;
        }

        if (qtdNum <= 0) {
            setErro("A quantidade deve ser maior que zero.");
            return;
        }

        const subtotalCalculado = (qtdNum * arredondarMoeda(produtoSelecionado.preco)) - descNum;

        if (subtotalCalculado < 0) {
            setErro("O desconto não pode ser maior que o valor total dos produtos.");
            return;
        }

        const novoItem = {
            ...itemAtual,
            quantidade_vendida: qtdNum,
            desconto: descNum,
            subtotal: subtotalCalculado,
        };

        setItens([...itens, novoItem]);
        setErro("");

        setItemAtual({
            produto: "",
            quantidade_vendida: "",
            desconto: "0",
        });
    }

    async function salvarVendas(event) {
        event.preventDefault();

        if (itens.length === 0) {
            setErro("Adicione pelo menos um item à venda.");
            return;
        }

        try {
            //criação da venda
            await criarDado("/vendas/", vendas);

            //criação de todos os itens e atualização de seus estoques correspondentes
            for (const item of itens) {
                //criação do item
                const dadosItemParaEnviar = {
                    venda: vendas.id_venda,
                    produto: item.produto,
                    quantidade_vendida: item.quantidade_vendida,
                    desconto_aplicado: Number(item.desconto).toFixed(2),
                    subtotal: Number(item.subtotal).toFixed(2),
                };

                await criarDado("/itens-venda/", dadosItemParaEnviar);

                //atualização do estoque
                const estoqueDoProduto = estoques.find(
                    (estoque) => estoque.produto === item.produto
                );

                if (!estoqueDoProduto) {
                    setErro(`Estoque não encontrado para o produto ${item.produto}.`);
                    return;
                }

                const novaQuantidade = estoqueDoProduto.quantidade_atual - item.quantidade_vendida;

                if (novaQuantidade < 0) {
                    setErro(`Estoque insuficiente para o produto ${item.produto}.`);
                    return;
                }

                await atualizarDado("/estoques/", estoqueDoProduto.id_estoque, {
                ...estoqueDoProduto,
                quantidade_atual: novaQuantidade,
                dt_ultima_saida: new Date().toISOString().split("T")[0],
                });

                setEstoques((prevEstoques) => {
                    return prevEstoques.map((estoque) => {
                        if (estoque.id_estoque === estoqueDoProduto.id_estoque) {
                            return {
                                ...estoque,
                                quantidade_atual: novaQuantidade,
                                dt_ultima_saida: new Date().toISOString().split("T")[0],
                            };
                        } else {
                            return estoque;
                        }
                    });
                });
            }

            setMensagem("Venda cadastrada com sucesso!");
            setErro("");

            setVendas({
                id_venda: "",
                data_venda: new Date().toISOString().split("T")[0],
                hora: "",
                forma_pagamento: "",
                funcionario: "",
                cliente: "",
            });

            setItemAtual({
                produto: "",
                quantidade_vendida: "",
                desconto: "0",
            });

            setItens([]);
        } catch (error) {
            console.error(error.response?.data);
            setErro("Erro ao cadastrar venda. Verifique os campos.");
            setMensagem("");
        }
    }

    const opcoesFuncionarios = funcionarios.map((funcionario) => ({
        value: funcionario.id_funcionario,
        label: `${funcionario.id_funcionario} - ${funcionario.nome}`,
    }));

    const opcoesClientes = clientes.map((cliente) => ({
        value: cliente.id_cliente,
        label: `${cliente.id_cliente} - ${cliente.nome}`,
    }));

    const opcoesProdutos = produtos.map((produto) => ({
        value: produto.id_produto,
        label: `${produto.id_produto} - ${produto.nome}`,
    }));

    return (
    <div style={{ color: "white", padding: "30px" }}>
        <h1>Cadastrar Venda</h1>
        <p>Preencha os dados da venda e adicione um ou mais itens.</p>

        <MensagemSucesso mensagem={mensagem} />
        <MensagemErro mensagem={erro} />

        <form onSubmit={salvarVendas}>
        <h2>Dados da Venda</h2>

        <FormInput
            label="ID da Venda"
            name="id_venda"
            value={vendas.id_venda}
            onChange={alterarCampoVenda}
            required={true}
            placeholder="Ex: VEN001"
        />

        <FormInput
            label="Data da Venda"
            name="data_venda"
            type="date"
            value={vendas.data_venda}
            onChange={alterarCampoVenda}
            required={true}
        />

        <FormInput
            label="Hora"
            name="hora"
            type="time"
            value={vendas.hora}
            onChange={alterarCampoVenda}
            required={true}
        />

        <FormSelect
            label="Forma de Pagamento"
            name="forma_pagamento"
            value={vendas.forma_pagamento}
            onChange={alterarCampoVenda}
            options={[
            { value: "", label: "Selecione" },
            { value: "dinheiro", label: "Dinheiro" },
            { value: "pix", label: "Pix" },
            { value: "cartao_debito", label: "Cartão de Débito" },
            { value: "cartao_credito", label: "Cartão de Crédito" },
            { value: "fiado", label: "Fiado" },
            ]}
        />

        <FormSelectSearch
            label="Selecione um funcionário"
            name="funcionario"
            value={vendas.funcionario}
            onChange={alterarCampoVenda}
            options={opcoesFuncionarios}
            placeholder = "Selecione..."
        />

        <FormSelectSearch
            label="Selecione um cliente"
            name="cliente"
            value={vendas.cliente}
            onChange={alterarCampoVenda}
            options={opcoesClientes}
            placeholder = "Selecione..."
            isClearable = {true}
        />

        <hr style={{ margin: "30px 0" }} />

        <h2>Adicionar Item à Venda</h2>

        <FormSelectSearch
            label="Selecione um produto"
            name="produto"
            value={itemAtual.produto}
            onChange={alterarCampoItem}
            options={opcoesProdutos}
            placeholder = "Selecione..."
        />

        <FormInput
            label="Quantidade Vendida"
            name="quantidade_vendida"
            type="number"
            value={itemAtual.quantidade_vendida}
            onChange={alterarCampoItem}
            placeholder="Ex: 2"
        />

        <FormInput
            label="Desconto"
            name="desconto"
            type="number"
            step="0.01"
            value={itemAtual.desconto}
            onChange={alterarCampoItem}
            placeholder="Ex: 0.00"
        />

        <button
            type="button"
            onClick={adicionarItem}
            style={{
                padding: "10px 20px",
                backgroundColor: "#1f6feb",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                marginTop: "10px",
            }}
        >
            Adicionar Item
        </button>

        <hr style={{ margin: "30px 0" }} />

        <h2>Itens da Venda</h2>

        {itens.length === 0 ? (
            <p>Nenhum item adicionado ainda.</p>
        ) : (
            <div>
            {itens.map((item, index) => {
                const produtoSelecionado = produtos.find(
                (prod) => prod.id_produto === item.produto
                );

                return (
                <div
                    key={index}
                    style={{
                    border: "1px solid #555",
                    padding: "15px",
                    marginBottom: "10px",
                    borderRadius: "8px",
                    }}
                >
                    <p><strong>Produto:</strong> {produtoSelecionado ? produtoSelecionado.nome : item.produto}</p>
                    <p><strong>Quantidade:</strong> {item.quantidade_vendida}</p>
                    <p><strong>Desconto:</strong> R$ {item.desconto}</p>
                    <p><strong>Subtotal:</strong> R$ {item.subtotal.toFixed(2)}</p>
                </div>
                );
            })}
            </div>
        )}

        <div style={{marginTop: "30px"}}>
            <BotaoSalvar texto="Cadastrar Venda"/>
        </div>
        </form>
    </div>
    );
}

export default CadastrarVendas;
